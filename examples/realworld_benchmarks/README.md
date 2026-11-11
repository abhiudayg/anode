# Real-World Open-Source Go Backend Benchmarks

This benchmark suite demonstrates **Anode's** capability to analyze, lock, and plan production deployments for **10 unmodified, world-class Go backend applications**.

Without modifying a single line of business logic or creating manual Dockerfiles / Helm charts, Anode's SSA compiler automatically extracts full service topologies, backing stateful primitives, ingress HTTP/gRPC interfaces, environment secrets, and egress boundaries.

---

## 📊 Comparative Benchmark Matrix

| # | Project | Domain | Detected Backing Primitives | Ingress Protocols | External Egress / Third-Party APIs | Architecture & Deployment Analysis |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | [**croc**](./croc) | P2P Encrypted File Relay | None (Stateless PAKE relay) | HTTP, TCP, WebSocket | Bootstrap DNS, DERP latency probes | [croc Deployment Analysis](./croc/DEPLOYMENT_ANALYSIS.md) |
| **2** | [**glance**](./glance) | Dashboard & Feed Aggregator | None (Stateless YAML engine) | HTTP (`PORT`) | Twitch GQL, Reddit API, Open-Meteo | [glance Deployment Analysis](./glance/DEPLOYMENT_ANALYSIS.md) |
| **3** | [**1Panel**](./1Panel) | Linux Server Management Panel | SQLite / PostgreSQL | HTTP (`PORT`), Gin | 1Panel App Hub (`1panel.cn`) | [1Panel Deployment Analysis](./1Panel/DEPLOYMENT_ANALYSIS.md) |
| **4** | [**restic**](./restic) | Encrypted Backup Engine | Azure Blob, AWS S3, MinIO | HTTP (`PORT`) | Azure Identity, Google Cloud Monitoring | [restic Deployment Analysis](./restic/DEPLOYMENT_ANALYSIS.md) |
| **5** | [**filebrowser**](./filebrowser) | Web File Manager & Streaming | Redis (Upload cache) | HTTP (`PORT`) | None (Self-contained) | [filebrowser Deployment Analysis](./filebrowser/DEPLOYMENT_ANALYSIS.md) |
| **6** | [**ntfy**](./ntfy) | HTTP Pub-Sub Push Notifications | SQLite (Cache & webpush store) | HTTP, WebSockets | Firebase Cloud Messaging, GCE Metadata | [ntfy Deployment Analysis](./ntfy/DEPLOYMENT_ANALYSIS.md) |
| **7** | [**netbird**](./netbird) | WireGuard Zero-Trust Mesh | PostgreSQL, Redis, SQLite | HTTP, gRPC, QUIC | AWS Route53, STUN, OIDC IdP Providers | [netbird Deployment Analysis](./netbird/DEPLOYMENT_ANALYSIS.md) |
| **8** | [**wttr.in**](./wttr.in) | Weather Forecast Server Backend | SQLite / PostgreSQL (GeoIP cache) | HTTP (`PORT`) | Upstream meteorological feeds | [wttr.in Deployment Analysis](./wttr.in/DEPLOYMENT_ANALYSIS.md) |
| **9** | [**cloudreve**](./cloudreve) | Multi-Cloud Storage & File Sharing | MySQL / PostgreSQL (Atlas Ent ORM) | HTTP (`PORT`) | AWS S3, Aliyun OSS, OneDrive | [cloudreve Deployment Analysis](./cloudreve/DEPLOYMENT_ANALYSIS.md) |
| **10** | [**navidrome**](./navidrome) | Music Streaming & Subsonic API | SQLite / PostgreSQL | HTTP (`PORT`), Chi | Deezer, Last.fm, ListenBrainz | [navidrome Deployment Analysis](./navidrome/DEPLOYMENT_ANALYSIS.md) |

---

## 🛠️ What Anode Proves on Real-World Codebases

### 1. Universal Routing & Mux Detection
Real-world Go applications use disparate routing patterns. Anode handles them all:
- **Go 1.22+ Standard Mux**: Exact path patterns with path parameters (`GET /api/pages/{page}/content/{$}`) in **Glance**.
- **Gin Framework**: Route tree extraction and grouping in **1Panel** and **Cloudreve**.
- **Chi Router**: Subsonic REST hierarchy in **Navidrome**.
- **Custom TCP & WebSocket Multiplexers**: Raw binary and packet streams in **Croc** and **ntfy**.

### 2. Multi-Engine Stateful Infrastructure Discovery
Anode inspects database connection constructors and resolves them to the declarative catalog ([`docs/catalog.md`](../../docs/catalog.md)):
- **Embedded Storage**: Discovered and isolated local SQLite databases for **ntfy**, **Navidrome**, and **1Panel**.
- **Distributed Caches**: Discovered Redis upload and session caching in **FileBrowser**, **TruffleHog**, and **NetBird**.
- **Relational Databases**: Discovered MySQL and PostgreSQL database drivers across **Cloudreve**, **Navidrome**, and **NetBird**.

### 3. Deep SSA Taint Analysis & Cycle Protection
Real-world codebases feature complex recursive control-flow graphs (Phi nodes in loops, interface wrappers, closure variables). Anode features:
- **Cycle-Protected Backward Taint Tracing**: Recursion depth limiting and visited-set tracking to handle deeply nested ASTs without stack overflows.
- **Transitive Callgraph Reachability**: Connects `os.Getenv` sources through application layers (`config` ➔ `store` ➔ `handler` ➔ `mux.HandleFunc`).

### 4. Zero-Downtime Systemd & Caddy Synthesis
Each benchmark includes a comprehensive deployment specification detailing:
- Conflict-free high-port allocations (`21040+`).
- Localhost loopback isolation (`127.0.0.1`).
- Least-privilege systemd units (`ProtectSystem=strict`, `NoNewPrivileges=true`, `User=anode`).
- Zero-downtime reverse-proxy cutovers via Caddy.

---

## 🚀 Running Verification on Any Benchmark

To re-run Anode's compiler inspection and regenerate lockfiles for any benchmark:

```bash
# Example: Inspect Navidrome
anode inspect ./examples/realworld_benchmarks/navidrome

# Example: Inspect NetBird
anode inspect ./examples/realworld_benchmarks/netbird

# Example: Inspect FileBrowser
anode inspect ./examples/realworld_benchmarks/filebrowser
```
