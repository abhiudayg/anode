# Real-World Deployment Analysis: Restic

- **Repository**: [`restic/restic`](https://github.com/restic/restic)
- **GitHub Stars**: ~37,100 ⭐
- **Domain**: Cryptographically Secure Backup Server & Repository Backend
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static compiler inspection analyzed the Restic backend engine and repository storage layer, recording the verified topology in [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `restic` | Backup Engine & REST Server | `./cmd/restic` | Core deduplicating backup engine |
| **Service** | `build-release-binaries` | CI Tool | `./helpers/build-release-binaries` | Release automation tool |
| **Service** | `prepare-release` | CI Tool | `./helpers/prepare-release` | Packaging validator |
| **Storage Binding** | `RegisterBlobServer` | Azure Blob Client | `internal/backend/azure` | Cloud storage backend |
| **Storage Binding** | MinIO / S3 Client | S3 Protocol | `internal/backend/s3` | Object storage repository backend |
| **Secret** | `RESTIC_PASSWORD` | Master Key | `internal/options` | Repository encryption passphrase |
| **Secret** | `AWS_SECRET_ACCESS_KEY` | Cloud Secret | `internal/backend/s3` | S3 credentials |
| **Secret** | `MINIO_ACCESS_KEY` | Cloud Secret | `internal/backend/s3` | MinIO credentials |

---

## 2. Production REST-Server Deployment Plan (`docs/deployment.md`)

Deploying Restic in server/REST-backend mode using Anode:

### Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - restic-rest-server
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/restic-rest-server --path /var/lib/anode/data/restic-repos --listen 127.0.0.1:21040
Restart=always
RestartSec=3
Environment=RESTIC_PASSWORD_FILE=/var/lib/anode/secrets/restic.key

# Hardening
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
ReadWritePaths=/var/lib/anode/data/restic-repos

[Install]
WantedBy=multi-user.target
```

### Caddy Reverse Proxy & TLS Termination
```caddy
backup.internal.example.com {
    basicauth {
        restic-backup $2a$14$encryptedHash
    }
    reverse_proxy 127.0.0.1:21040 {
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## 3. Storage & Security Architecture
- **Immutable Storage Policies**: Anode data directory `/var/lib/anode/data/restic-repos` utilizes Linux file append-only attributes (`chattr +a`) or S3 Object Lock to prevent ransomware deletion.
- **Client-Side Encryption**: All repository packfiles and tree indices are pre-encrypted with Poly1305/AES-256 before disk writes.
