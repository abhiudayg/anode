# Real-World Deployment Analysis: Glance

- **Repository**: [`glanceapp/glance`](https://github.com/glanceapp/glance)
- **GitHub Stars**: ~38,100 ⭐
- **Domain**: Self-Hosted Dashboard, RSS, Weather & API Feed Aggregator
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static analysis parsed the Glance backend, automatically extracting route paths, web handlers, and external third-party API dependencies into [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `glance` | Web Dashboard Server | `./.` / `main.go` | Dashboard UI and API server |
| **Ingress** | HTTP | `PORT` | `server/server.go` | Ingress entrypoint |
| **Egress** | Open-Meteo | External HTTPS | `internal/widgets/weather` | `https://api.open-meteo.com/v1/forecast` |
| **Egress** | Twitch GraphQL | External HTTPS | `internal/widgets/twitch` | `https://gql.twitch.tv/gql` |
| **Egress** | Reddit API | External HTTPS | `internal/widgets/reddit` | `https://www.reddit.com/api/v1/access_token` |

### Route Matrix Extracted
Anode discovered all registered Go 1.22+ pattern routes:
- `GET /api/healthz` (Automated readiness probe target)
- `GET /{$}` & `GET /{page}` (Dashboard pages)
- `GET /api/pages/{page}/content/{$}` (Widget state)
- `POST /api/set-theme/{key}` (Theme switcher)
- `/api/widgets/{widget}/{path...}` (Widget dynamic dispatch)
- `POST /api/authenticate` & `GET /login`, `GET /logout`

---

## 2. Production Deployment Plan (`docs/deployment.md`)

### Stage 1: Zero-State Autonomous Provisioning
Because Glance is a stateless aggregator relying on user-provided YAML configuration (`glance.yml`), no persistent database container is needed:
- Configuration Mount: `/var/lib/anode/releases/current/glance.yml`
- Ingress: Loopback port `21040`
- User: `anode:anode`

### Stage 2: Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - glance
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/glance --config /var/lib/anode/releases/current/glance.yml
Restart=always
RestartSec=3
Environment=PORT=21040

# Sandboxing & Hardening
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
PrivateDevices=true
MemoryMax=256M
CPUQuota=100%

[Install]
WantedBy=multi-user.target
```

### Stage 3: Edge Reverse Proxy & Health Probing
Caddy leverages the exact health endpoint discovered by Anode:
```caddy
dash.example.com {
    reverse_proxy 127.0.0.1:21040 {
        health_uri /api/healthz
        health_interval 5s
        health_timeout 2s
    }
}
```

---

## 3. Security & Perimeter Defense
- **Explicit Outbound Allowlisting**: Egress taint analysis detected requests to Reddit, Twitch, and Open-Meteo. On hardened networks, iptables/eBPF egress filtering restricts outbound HTTPS connections strictly to these verified domains.
- **Micro-Footprint**: Requires less than 64MB of RAM at runtime under standard aggregation intervals.
