# Real-World Go Projects as Analysis Inputs

These are 10 unmodified open-source Go projects used as inputs for Anode's inspection. Their results are not recorded in this folder, so run `anode inspect` to see what Anode finds today.

Anode reads the code and reports what it can resolve, and reports what it cannot.

---

## Real-world example projects

These are third-party Go projects copied here as analysis inputs. This folder does not record their analysis results, because those results change as the analyzer changes. To see what Anode finds in a project today, run `anode inspect` on it:

```bash
anode inspect ./examples/realworld_benchmarks/<project>
```

| # | Project | Domain |
|---|---|---|
| 1 | [croc](./croc) | P2P encrypted file relay |
| 2 | [glance](./glance) | Dashboard and feed aggregator |
| 3 | [1Panel](./1Panel) | Linux server management panel |
| 4 | [restic](./restic) | Encrypted backup engine |
| 5 | [filebrowser](./filebrowser) | Web file manager |
| 6 | [ntfy](./ntfy) | HTTP pub-sub push notifications |
| 7 | [netbird](./netbird) | WireGuard zero-trust mesh |
| 8 | [wttr.in](./wttr.in) | Weather forecast server backend |
| 9 | [cloudreve](./cloudreve) | Multi-cloud storage and file sharing |
| 10 | [navidrome](./navidrome) | Music streaming and Subsonic API |

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

### 4. Systemd and Caddy Synthesis
A deploy generates, for each service:
- Ports from `21040` upward, recorded per host so services do not collide.
- Localhost loopback isolation (`127.0.0.1`).
- A systemd unit with `DynamicUser=yes`, `ProtectSystem=strict`, and `NoNewPrivileges=true`.
- A Caddy reverse-proxy route to the service.

---

## 🚀 Running Verification on Any Project

To re-run Anode's compiler inspection and regenerate lockfiles for any project:

```bash
# Example: Inspect Navidrome
anode inspect ./examples/realworld_benchmarks/navidrome

# Example: Inspect NetBird
anode inspect ./examples/realworld_benchmarks/netbird

# Example: Inspect FileBrowser
anode inspect ./examples/realworld_benchmarks/filebrowser
```
