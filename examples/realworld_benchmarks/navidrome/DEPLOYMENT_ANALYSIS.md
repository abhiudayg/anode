# Real-World Deployment Analysis: Navidrome

- **Repository**: [`navidrome/navidrome`](https://github.com/navidrome/navidrome)
- **GitHub Stars**: ~24,600 ⭐
- **Domain**: Modern Music Server & Audio Streaming Service (Subsonic / OpenAPI)
- **Primary Language**: Go 1.24+

---

## 1. Compiler Extraction & Architecture Breakdown

Anode static analysis parsed Navidrome's Chi-based routing hierarchy, multi-dialect database persistence, and external audio metadata integrations in [`anode.lock.json`](./anode.lock.json).

### Discovered Topology
| Primitive | Identifier | Type / Kind | Provenance | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Service** | `navidrome` | Music Streaming Server | `./.` / `main.go` | Audio transcoding and Subsonic API engine |
| **Ingress** | HTTP | `PORT` | `server/server.go` | Subsonic & REST API ingress |
| **Resource** | `db-navidrome` | `postgres` / `sqlite` | `db/db.go:61` | Track library, playlists, user scrobble history |
| **Egress** | ListenBrainz | External HTTPS | `adapters/listenbrainz` | `https://api.listenbrainz.org/1/` |
| **Egress** | Last.fm | External HTTPS | `adapters/lastfm` | `https://ws.audioscrobbler.com/2.0/` |
| **Egress** | Deezer | External HTTPS | `adapters/deezer` | `https://api.deezer.com/search/artist` |

### Discovered Routes
- `GET /system/ping` & `POST /system/ping` (API liveness)
- `GET /system/info/public` (Server capability handshake)
- `GET /quickconnect/enabled` (QuickConnect client discovery)
- `GET /openapi.json` & `GET /openapi.yaml` (API documentation)

---

## 2. Production Deployment Plan (`docs/deployment.md`)

### Stage 1: Stateful Storage Layout (`docs/catalog.md`)
Navidrome requires persistent mounts for its SQLite library index and audio transcoding cache:
- Music Library Path: `/var/lib/anode/data/music` (read-only for security)
- Data Mount: `/var/lib/anode/data/navidrome` (SQLite database & artwork cache)

### Stage 2: Systemd Unit Configuration
```ini
[Unit]
Description=Anode Service - navidrome
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/var/lib/anode/releases/current
ExecStart=/var/lib/anode/releases/current/navidrome
Restart=always
RestartSec=3
Environment=PORT=21040
Environment=ND_DATAFOLDER=/var/lib/anode/data/navidrome
Environment=ND_MUSICFOLDER=/var/lib/anode/data/music
Environment=ND_SCANINTERVAL=1h
Environment=ND_TRANSCODINGCACHESIZE=2G

# Hardening
ProtectSystem=strict
ProtectHome=true
NoNewPrivileges=true
ReadOnlyPaths=/var/lib/anode/data/music
ReadWritePaths=/var/lib/anode/data/navidrome

[Install]
WantedBy=multi-user.target
```

### Stage 3: Edge Reverse Proxy (Caddy)
```caddy
music.example.com {
    reverse_proxy 127.0.0.1:21040 {
        header_up X-Forwarded-Proto {scheme}
        transport http {
            read_buffer 8192
            response_header_timeout 60s
        }
    }
}
```

---

## 3. Security Highlights
- **Media Isolation**: Audio directory is mounted with `ReadOnlyPaths`, ensuring rogue transcoding exploits cannot tamper with the source audio collection.
- **Strict Outbound Network Rules**: Egress to Last.fm and ListenBrainz scrobbling endpoints is audited in the lockfile and locked into security policies.
