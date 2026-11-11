# Real-World Deployment Analysis: 1Panel

- **Repository**: [`1Panel-dev/1Panel`](https://github.com/1Panel-dev/1Panel)
- **GitHub Stars**: ~37,400 ⭐
- **Domain**: Modern Linux Server & App Management Control Plane Backend
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static compiler inspection analyzed the 1Panel core server daemon, extracting internal service bindings, database drivers, and update endpoints into [`1Panel/core/anode.lock.json`](./core/anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `server` | Management Control Plane | `./cmd/server` | Gin & GORM server administration engine |
| **Ingress** | HTTP | `PORT` | `server/server.go` | Web administration UI & API |
| **Resource** | `db-server` | `postgres` / `sqlite` | `glebarez/sqlite` | Core configuration, users, container policies |
| **Egress** | 1Panel App Hub | External HTTPS | `utils/req_helper` | `https://1panel.cn/` (App repository & updates) |

---

## 2. Production Deployment Plan (`docs/deployment.md`)

Deploying the 1Panel control plane using Anode:

### Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - 1panel-core
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/1panel-core
Restart=always
RestartSec=3
Environment=PORT=21040
Environment=PANEL_DATA_DIR=/var/lib/anode/data/1panel

# Linux Sandboxing
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
ReadWritePaths=/var/lib/anode/data/1panel

[Install]
WantedBy=multi-user.target
```

### Edge Reverse Proxy Configuration (Caddy)
```caddy
panel.server.example.com {
    reverse_proxy 127.0.0.1:21040 {
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## 3. Autonomous Catalog & Least-Privilege Isolation
- **Data Encapsulation**: 1Panel state files are isolated inside `/var/lib/anode/data/1panel` with `0700` POSIX permissions.
- **Controlled Egress**: In accordance with `anode.lock.json`, outbound access is strictly constrained to the official App Store endpoint (`https://1panel.cn/`).
