# Real-World Deployment Analysis: NetBird

- **Repository**: [`netbirdio/netbird`](https://github.com/netbirdio/netbird)
- **GitHub Stars**: ~30,800 ⭐
- **Domain**: Zero-Trust WireGuard Mesh Network Management & Signaling Infrastructure
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static SSA inspection performed a multi-service extraction across NetBird's control-plane architecture, identifying management controllers, signaling relays, STUN servers, and database persistence in [`anode.lock.json`](./anode.lock.json).

### Discovered Microservices & Daemons
| Service | Entrypoint | Ingress Protocols | Role |
| :--- | :--- | :--- | :--- |
| **`management`** | `./management` | HTTP & gRPC | Mesh control plane, peer policy engine, Web API |
| **`signal`** | `./signal` | gRPC | ICE/WebRTC peer connection exchange |
| **`relay`** | `./relay` | QUIC / WebSocket / TLS | Encrypted WireGuard fallback relay |
| **`proxy`** | `./proxy` | HTTP & TLS | Ingress reverse proxy & ACME certificate manager |
| **`stun`** | `./stun` | UDP | NAT traversal candidate discovery |
| **`combined`** | `./management/cmd` | HTTP & gRPC | Monolithic all-in-one runner |
| **`idp-migrate`** | `./tools/idp-migrate` | CLI | OIDC / IdP identity migration tool |

### Backing Infrastructure Discovered
- **PostgreSQL (`db-management`, `db-combined`)**: Stores network map topology, peer keys, access policies.
- **Redis (`redis-management`, `redis-combined`)**: Real-time peer presence cache and grant lookup engine (`auto_provision: true`).

---

## 2. Production Multi-Service Deployment Plan (`docs/deployment.md`)

Deploying the complete NetBird zero-trust stack using Anode:

```
                  ┌──────────────────────┐
                  │ Caddy Edge Gateway   │
                  └──────────┬───────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼ (21040)             ▼ (21041)             ▼ (21042)
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  management  │◄────►│    signal    │◄────►│    relay     │
└──────┬───────┘      └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│  (127.0.0.1) │      │  (127.0.0.1) │
└──────────────┘      └──────────────┘
```

### Systemd Units & Port Allocation
1. `anode-db-management` (PostgreSQL 16): `127.0.0.1:21043`
2. `anode-redis-management` (Redis 7): `127.0.0.1:21044`
3. `anode-management` (Control Plane): `127.0.0.1:21040`
4. `anode-signal` (Signaling Server): `127.0.0.1:21041`
5. `anode-relay` (Fallback Data Relay): `127.0.0.1:21042`

### Systemd Unit Example (`anode-management.service`)
```ini
[Unit]
Description=Anode Service - netbird-management
After=network.target anode-db-management.service anode-redis-management.service

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/management management --port 21040
Restart=always
RestartSec=3
Environment=PORT=21040
Environment=NETBIRD_STORE_ENGINE_POSTGRES_DSN=postgres://postgres:postgres@127.0.0.1:21043/netbird?sslmode=disable
Environment=REDIS_URL=redis://127.0.0.1:21044

# Hardening
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

---

## 3. High-Security Zero-Trust Enclave
- **Least-Privilege Isolation**: All control-plane databases are isolated strictly to loopback interfaces.
- **Micro-Segmentation**: Communication between the management daemon and signaling node is verified and pinned via gRPC contract bindings.
