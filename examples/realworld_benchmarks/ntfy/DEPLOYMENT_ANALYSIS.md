# Real-World Deployment Analysis: ntfy

- **Repository**: [`binwiederhier/ntfy`](https://github.com/binwiederhier/ntfy)
- **GitHub Stars**: ~35,500 ⭐
- **Domain**: HTTP-based Pub-Sub Push Notification Service & WebSocket Relay
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Static SSA taint inspection on `ntfy` identified a multi-binary toolchain and pub-sub messaging topology, saved in [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `ntfy` | Primary Server Daemon | `./.` / `cmd/run.go` | HTTP/WebSocket pub-sub push notification server |
| **Service** | `fbsend` | Firebase Cloud Messaging Proxy | `./tools/fbsend` | Sends FCM push notifications |
| **Service** | `pgimport` | Migration Utility | `./tools/pgimport` | SQLite to PostgreSQL database migrator |
| **Service** | `s3cli` | Attachment Storage CLI | `./tools/s3cli` | Object storage attachment manager |
| **Resource** | `db-ntfy` | `sqlite` | `webpush/store_sqlite.go:75` | User accounts, topics, message cache |
| **Resource** | `db-pgimport`| `sqlite` | `tools/pgimport/main.go:468` | Source database for import tool |

### Ingress Routes Extracted
Anode extracted the REST and cluster routing matrix from `ntfy`:
- `POST /v1/cluster/message`: Cluster inter-node message publishing
- `POST /v1/cluster/state`: Cluster node state synchronization
- `GET /v1/cluster/members`: Cluster membership list
- `GET /v1/cluster/health`: Cluster node health check
- `GET /v1/cluster/status`: Cluster routing status
- `/debug/pprof/*`: Go runtime diagnostics

---

## 2. Production Deployment Plan (`docs/deployment.md`)

### Stage 1: Host Directory Layout
- Binary: `/var/lib/anode/releases/<release-id>/ntfy`
- SQLite Database: `/var/lib/anode/data/ntfy/cache.db`
- Attachments Directory: `/var/lib/anode/data/ntfy/attachments/`
- User: `anode:anode`

### Stage 2: Systemd Service Unit Synthesized
```ini
[Unit]
Description=Anode Service - ntfy
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/ntfy serve --config /var/lib/anode/releases/current/server.yml
Restart=always
RestartSec=2
Environment=PORT=21040
Environment=NTFY_CACHE_FILE=/var/lib/anode/data/ntfy/cache.db
Environment=NTFY_ATTACHMENT_CACHE_DIR=/var/lib/anode/data/ntfy/attachments

# Linux Sandboxing
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
ReadWritePaths=/var/lib/anode/data/ntfy

[Install]
WantedBy=multi-user.target
```

### Stage 3: Edge Reverse Proxy Configuration (Caddy)
WebSockets and HTTP long-polling require streaming connection handling:
```caddy
push.example.com {
    reverse_proxy 127.0.0.1:21040 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
        transport http {
            read_buffer 4096
            keepalive 120s
        }
    }
}
```

---

## 3. High-Availability & Cluster Scheduling (`docs/catalog.md`)
- **Scaling Horizon**: When multiple `ntfy` instances are deployed across nodes, Anode discovers the cluster routes (`/v1/cluster/*`) and binds inter-node gossip endpoints on private interfaces.
- **SQLite Concurrency**: Enforces WAL mode (`PRAGMA journal_mode=WAL`) and `busy_timeout=5000` to prevent database locks during burst notification delivery.
