# Security Architecture & Hardening

Anode deploys to a single Linux host using systemd, cgroups v2, and Caddy. This document describes what the generated configuration does. For the audit findings and their status, see [`security-audit.md`](security-audit.md). For the limits of the supported profile, see [`supported-profile.md`](supported-profile.md).

---

## 1. Threat Model & Design Principles

| Threat Vector | Traditional Container Orchestrator Risk | Anode Defense |
| :--- | :--- | :--- |
| **Root Escalation** | Containers run with root daemon sockets (`/var/run/docker.sock`). | Services run as systemd `DynamicUser=yes`; `NoNewPrivileges=true`; no container daemon. |
| **Filesystem Tampering** | A compromised service modifies `/etc` or reads other services. | `ProtectSystem=strict`, `ProtectHome=true`, `PrivateTmp=true`. |
| **Stateful DB Destruction** | A memory leak in a service triggers the Linux OOM killer against the database. | `oom_score_adj` of `-900` on databases, `-500` to `-400` on caches and brokers. Application services set no OOM score. |
| **Public Database Exposure** | Ports 5432 or 6379 mapped to `0.0.0.0`. | Redis and catalog containers bind to `127.0.0.1`. An iptables rule drops external traffic to application ports `21040`–`21999`. |
| **Plaintext Edge Traffic** | Unencrypted HTTP to a public address. | Caddy issues a Let's Encrypt certificate when `--domain` is set. An IP target is refused unless `--plain-http` is passed. |

---

## 2. Hardening Layers

### Layer 1: Service Identity
Each service unit runs as a transient unprivileged user allocated by systemd:
```systemd
DynamicUser=yes
StateDirectory=<service>
WorkingDirectory=/var/lib/<service>
```
Bootstrap also creates a system user for Anode's own directories:
```bash
id -u anode &>/dev/null || useradd -r -s /bin/false anode
```

### Layer 2: Data Directory Permissions
Catalog data directories are created with the mode and the UID/GID that the driver requires:
```bash
install -d -m 0700 -o <uid> -g <gid> /var/lib/anode/data/<resource>
```

### Layer 3: Systemd Sandboxing
Every service unit includes these directives, from `internal/deployer/systemd.go`:
```systemd
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
CapabilityBoundingSet=
```

### Layer 4: Resource Limits
```systemd
CPUQuota=200%
MemoryMax=1G
```

### Layer 5: OOM Score Tiering
The kernel uses `oom_score_adj` to choose which process to kill under memory pressure. Catalog drivers set these values (`internal/catalog/defaults.yaml`):

- **Relational databases** (PostgreSQL, MySQL, MariaDB, CockroachDB, TimescaleDB): `-900`.
- **Search, document, and wide-column stores**: `-600` to `-800`.
- **Caches and brokers** (Redis, Valkey, KeyDB, Dragonfly, Kafka, RabbitMQ, NATS): `-500`. Memcached: `-400`.
- **Application services**: no OOM score is set. The kernel's default applies.

### Layer 6: Loopback Binding and Edge
- Redis, when a service uses it, runs under systemd bound to `127.0.0.1`.
- Catalog containers bind to `127.0.0.1` by default.
- Application ports are blocked from external interfaces by an iptables rule installed on the host and saved with `netfilter-persistent`.
- Caddy reverse-proxies to `127.0.0.1` ports and validates its configuration before reload. With `--domain`, it obtains a Let's Encrypt certificate.

---

## 3. Secrets

- Values come from `.env`, which must be mode `600`. Deploys refuse a `.env` readable by other users.
- Secret values are written to `/etc/anode/env/<release>.<service>` with mode `0600` and loaded with `EnvironmentFile=`. They are not written into unit files.
- Anode does not filter application output. Applications that print secrets to their logs expose them through `anode logs`.
