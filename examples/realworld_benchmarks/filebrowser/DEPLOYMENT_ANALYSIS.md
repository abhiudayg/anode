# Real-World Deployment Analysis: FileBrowser

- **Repository**: [`filebrowser/filebrowser`](https://github.com/filebrowser/filebrowser)
- **GitHub Stars**: ~35,900 ⭐
- **Domain**: Self-Hosted File Management & Media Streaming Web Backend
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode inspected the `filebrowser` codebase using whole-program SSA taint analysis and static call-graph reachability, producing [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `filebrowser` | HTTP Web Service | `main.go` / `./.` | Serves file management UI and REST APIs |
| **Ingress** | HTTP | `PORT` | `http/server.go` | Bound dynamically via Anode port allocator |
| **Resource** | `redis-filebrowser` | `redis` | `http/upload_cache_redis.go:28` | Upload session cache & token rate limiter (`stateful_retain`) |

### Ingress & Protocol Detection
- **Protocol**: HTTP/1.1 & HTTP/2
- **Port Variable**: Injected via standard `PORT` environment variable.
- **Session Cache**: Automatically identified Redis client binding originating in `http/upload_cache_redis.go:28`.

---

## 2. Production Deployment Plan (`docs/deployment.md`)

According to the Anode 6-stage autonomous provisioning lifecycle:

### Stage 1: Host Discovery & Bootstrap
- Target system user: `anode` (UID: 10001, GID: 10001).
- Target directory tree:
  - Binaries: `/var/lib/anode/releases/<release-id>/filebrowser`
  - Data mount: `/var/lib/anode/data/redis-filebrowser`
  - Proxy configuration: `/etc/caddy/Caddyfile`

### Stage 2: Stateful Infrastructure Provisioning (`docs/catalog.md`)
Anode resolves `redis-filebrowser` against the declarative driver catalog (`internal/catalog/defaults.yaml`):
- **Image**: `redis:7-alpine`
- **Security Context**: Drop capabilities `["ALL"]`, set `no_new_privileges: true`, non-root execution.
- **Bound Interface**: `127.0.0.1:21040` (ephemeral conflict-free loopback port).
- **Resource Constraints**:
  - `memory_max`: `512M`
  - `cpu_quota`: `100%`

### Stage 3: Static Linux Cross-Compilation & Streaming
```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o filebrowser .
```
The static binary is streamed over native encrypted SSH into `/var/lib/anode/releases/<release-id>/filebrowser`.

### Stage 4: Blue/Green Systemd Unit Activation
Anode synthesizes `/etc/systemd/system/anode-filebrowser.service`:
```ini
[Unit]
Description=Anode Service - filebrowser
After=network.target anode-redis-filebrowser.service

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/filebrowser
Restart=always
RestartSec=3
Environment=PORT=21041
Environment=REDIS_URL=redis://127.0.0.1:21040

# Sandboxing
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### Stage 5: Zero-Downtime Edge Proxy Cutover
Caddy maps incoming edge traffic (e.g. `files.example.com`) to loopback port `21041`:
```caddy
files.example.com {
    reverse_proxy 127.0.0.1:21041 {
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## 3. Security Posture
- **Attack Surface Minimization**: Redis is bound exclusively to `127.0.0.1`, completely unexposed to the WAN.
- **Rootless Execution**: Both Redis and FileBrowser execute under unprivileged UIDs.
- **Filesystem Lockdown**: `ProtectSystem=strict` ensures FileBrowser cannot mutate root or system directories outside its dedicated data mount.
