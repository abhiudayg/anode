# Real-World Deployment Analysis: wttr.in

- **Repository**: [`chubin/wttr.in`](https://github.com/chubin/wttr.in)
- **GitHub Stars**: ~30,700 ⭐
- **Domain**: Terminal & HTTP Weather Forecast Server Backend
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static compiler inspection analyzed the `wttr.in` Go server daemon, extracting HTTP route patterns, gRPC bindings, and caching drivers in [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `wttr.in` | Weather Forecast Server | `./.` / `main.go` | Terminal ANSI & HTTP weather server |
| **Ingress** | HTTP | `PORT` | `main.go` | Ingress entrypoint for curl / browser queries |
| **Resource** | `db-wttr.in` | `sqlite` / `postgres` | `internal/location/cache.go` & `samonzeweb/godb` | GeoIP lookup and weather cache |
| **Diagnostics** | `RegisterWeatherServer` | gRPC Client | `main.go:159` | Upstream weather data service link |
| **Diagnostics** | `RegisterCachedWeatherServer`| gRPC Client | `main.go:161` | Cached forecast provider link |

### Ingress Routes Extracted
- `/` (Root terminal / browser forecast)
- `/favicon.ico` (Browser asset)
- `/files/` (Static visual files & emoji maps)

---

## 2. Production Deployment Plan (`docs/deployment.md`)

Deploying `wttr.in` as an autonomous weather service using Anode:

### Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - wttr.in
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/wttr.in
Restart=always
RestartSec=3
Environment=PORT=21040
Environment=WTTR_GEOIP_CACHE=/var/lib/anode/data/wttr/geoip.db

# Hardening
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
ReadWritePaths=/var/lib/anode/data/wttr

[Install]
WantedBy=multi-user.target
```

### Edge Reverse Proxy Configuration (Caddy)
```caddy
weather.example.com {
    reverse_proxy 127.0.0.1:21040 {
        header_up X-Forwarded-Proto {scheme}
    }
}
```

---

## 3. High-Traffic Caching & Performance
- **Local SQLite / PostgreSQL Cache**: Discovered in `internal/location/cache.go`, caching geocoded coordinates to prevent rate-limiting against upstream meteorological providers.
- **Microsecond Terminal Responses**: Fast C-string and ANSI formatting served through low-latency loopback systemd sockets.
