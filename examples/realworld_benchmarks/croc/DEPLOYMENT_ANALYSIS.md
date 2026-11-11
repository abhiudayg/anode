# Real-World Deployment Analysis: croc

- **Repository**: [`schollz/croc`](https://github.com/schollz/croc)
- **GitHub Stars**: ~40,900 ⭐
- **Domain**: P2P Encrypted File Transfer Relay & Rendezvous Server
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static analysis processed `croc`, uncovering relay daemons, web UI endpoints, cryptographic handshake parameters, and environment secret references in [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `croc` | Core Relay Daemon | `./.` | TCP/TLS PAK-authenticated relay server |
| **Service** | `croc-web` | Web Transfer Interface | `./cmd/croc-web` | Browser-based file transfer client |
| **Service** | `croc-update`| Self-Update Subservice | `./cmd/croc-update` | Binary release updater |
| **Secret** | `CROC_SECRET` | Passphrase Secret | `src/cli/cli.go` | PAKE shared encryption password |
| **Secret** | `CROC_STORE_TOKEN`| Auth Token | `src/cli/cli.go` | Relay persistence authorization |

### Discovered Routes (`croc-web`)
- `/healthz`: Liveness and readiness probe
- `/ws`: WebSocket upgrade for bidirectional file streaming
- `/config.js`: Dynamic client relay configuration

---

## 2. Production Relay Deployment Plan (`docs/deployment.md`)

Deploying a dedicated croc relay server with Anode on a VPS:

### Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - croc relay
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/croc relay --ports 9009,9010,9011,9012,9013
Restart=always
RestartSec=2
Environment=CROC_SECRET=""

# Hardening
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

### Edge Configuration (Caddy Reverse Proxy)
For the companion `croc-web` service:
```caddy
croc.example.com {
    reverse_proxy 127.0.0.1:21040 {
        header_up Upgrade {http.request.header.Upgrade}
        header_up Connection "Upgrade"
    }
}
```

---

## 3. High-Throughput Networking Optimization
- **File Descriptors**: Anode configures `LimitNOFILE=65535` for the relay service to accommodate concurrent peer-to-peer data transfers.
- **Port Allocation**: TCP relay ports `9009:9013` are exposed on public interfaces while the management/web endpoints remain safely proxied behind Caddy.
