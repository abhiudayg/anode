# Real-World Deployment Analysis: Cloudreve

- **Repository**: [`cloudreve/cloudreve`](https://github.com/cloudreve/cloudreve)
- **GitHub Stars**: ~28,900 ⭐
- **Domain**: Self-Hosted Cloud Storage, Multi-Cloud Drive & File Sharing System
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static SSA inspection analyzed Cloudreve's Ent ORM, multi-provider cloud storage interfaces, and multi-dialect database engine in [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `cloudreve` | Web Server & File Engine | `./.` / `main.go` | Full-featured drive server |
| **Ingress** | HTTP | `PORT` | `bootstrap/server.go` | Drive web portal and API |
| **Resource** | `db-cloudreve` | `mysql` / `postgres` | `ariga.io/atlas` & GORM | Database for user quotas, shares, metadata |
| **Cloud Binding** | AWS S3 / Aliyun OSS | Object Storage SDK | `pkg/serializer` | Multi-cloud storage adapters |

---

## 2. Production Deployment Plan (`docs/deployment.md`)

Deploying Cloudreve alongside an autonomous MySQL or PostgreSQL backend:

### Stage 1: Database Provisioning (`docs/catalog.md`)
Anode provisions `db-cloudreve` from `internal/catalog/defaults.yaml`:
- **Image**: `mariadb:10.11-alpine` or `postgres:16-alpine`
- **Port**: `127.0.0.1:21040`
- **Persistent Data**: `/var/lib/anode/data/db-cloudreve`

### Stage 2: Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - cloudreve
After=network.target anode-db-cloudreve.service

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/cloudreve -c /var/lib/anode/releases/current/conf.ini
Restart=always
RestartSec=3
Environment=PORT=21041
Environment=DATABASE_URL=postgres://postgres:postgres@127.0.0.1:21040/cloudreve?sslmode=disable

# Sandboxing
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
ReadWritePaths=/var/lib/anode/data/cloudreve-uploads

[Install]
WantedBy=multi-user.target
```

### Stage 3: Edge Reverse Proxy Configuration (Caddy)
```caddy
drive.example.com {
    reverse_proxy 127.0.0.1:21041 {
        header_up X-Forwarded-Proto {scheme}
        request_body {
            max_size 10GB
        }
    }
}
```

---

## 3. Storage & Scalability Architecture
- **Chunked File Uploads**: Request body limits in Caddy and systemd file descriptors (`LimitNOFILE=65535`) are configured to support parallel multi-gigabyte file transfers.
- **Data Protection**: Uploads directory `/var/lib/anode/data/cloudreve-uploads` is mounted strictly with `noexec` flags to prevent arbitrary binary execution of uploaded files.
