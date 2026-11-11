<div align="center">

<a href="https://anode.abhiudayg.dev">
  <img src=".github/assets/anode-social-preview.png" alt="Anode — Proof-of-Topology Bare-Metal Orchestrator" width="100%">
</a>

# Anode

### Deploy unmodified Go backends to any Linux VPS without Dockerfiles, Kubernetes, or proprietary SDKs.

[![Website: anode.abhiudayg.dev](https://img.shields.io/badge/website-anode.abhiudayg.dev-00ADD8.svg?style=flat&logo=safari)](https://anode.abhiudayg.dev)
[![Go Version](https://img.shields.io/badge/go-1.22+-00ADD8.svg?style=flat&logo=go)](https://golang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Verification: agstack](https://img.shields.io/badge/verified-agstack%20passed-success.svg)](#verification--quality-guarantees)
[![Architecture: Proof--of--Topology](https://img.shields.io/badge/architecture-4--Pillar%20Topology-purple.svg)](https://anode.abhiudayg.dev/docs#overview)

<p align="center">
  <a href="https://anode.abhiudayg.dev">Live Website</a> •
  <a href="#the-problem">The Problem</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#pluggable-infrastructure-catalog">Stateful Catalog</a> •
  <a href="#least-privilege-security-boundary">Security Model</a> •
  <a href="#cli-reference">CLI Reference</a> •
  <a href="https://anode.abhiudayg.dev/docs">Documentation</a> •
  <a href="examples/README.md">Benchmark Suites</a>
</p>

</div>

---

## The Problem: You Write Your Architecture Twice

Every time you build a Go backend, you declare your architecture twice:

1. **In Go:** You call `sql.Open("postgres", cfg.DBURL)`, listen on `cfg.Port`, and make calls to internal microservices.
2. **In YAML / Docker:** You write a multi-stage `Dockerfile`, a 50-line `docker-compose.yml`, mount volumes, map host ports (and pray `5432` isn't taken by another project), and manually wire environment variables.

When you add a service or refactor an env var, your code and your configuration immediately drift.

Previous "Infrastructure-from-Code" tools attempted to solve this, but made fatal mistakes:
* **The SDK Lock-In Trap (Encore, Winglang, Nitric):** They forced you to import non-standard SDKs or rewrite code in a new DSL.
* **The Regex Guessing Trap (Klotho):** They used syntax pattern-matching that broke on real-world config structs and dynamic wrappers.

---

## The Solution: Graph-Driven Orchestration

**Anode** takes a different bet: **The 4-Pillar Proof-of-Topology Engine.**

Instead of guessing or forcing an SDK, Anode analyzes your Go source code using compiler-backed **Static Single Assignment (SSA)** and **Variable Type Analysis (VTA)** call graphs rooted at `func main()`.

It extracts an immutable, human-readable **`anode.lock.json`** directly from your code, stands up local dependencies with zero port collisions, and deploys directly to Linux VPS boxes using bare-metal primitives: **`systemd`**, **cgroups v2**, **loopback proxies**, and **automated Let's Encrypt TLS**.

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────┐
│  Unmodified Go  │ ────> │  Anode SSA / VTA Core  │ ────> │  anode.lock.json   │
│   Source Code   │       │ (Choke-Point Analyzer) │       │ (Reviewable Proof) │
└─────────────────┘       └────────────────────────┘       └─────────┬──────────┘
                                                                     │
                                    ┌────────────────────────────────┴────────────────────────────────┐
                                    ▼                                                                 ▼
                    ┌───────────────────────────────┐                                 ┌───────────────────────────────┐
                    │     Local Dev (`anode dev`)   │                                 │   Production (`anode deploy`) │
                    │ • Dynamic Ephemeral Ports     │                                 │ • Cross-compiled Linux binary │
                    │ • Decomposed Env Injection    │                                 │ • Hardened systemd + cgroups  │
                    │ • Native Goose Migrations     │                                 │ • Zero-downtime Blue/Green    │
                    │ • Sub-second 300ms reload     │                                 │ • Automated Caddy HTTPS       │
                    └───────────────────────────────┘                                 └───────────────────────────────┘
```

---

## Quick Start

### 1. Install Anode

```bash
# Clone and build single static binary
git clone https://github.com/abhiudayg/anode.git
cd anode
go build -o /usr/local/bin/anode ./cmd/anode
```

### 2. Inspect Any Go Repository

Point Anode at any Go multi-service repo or monorepo:

```bash
anode inspect ./examples/complex_ecommerce
```

Anode inspects the call graph, prunes dead code, decomposes composite DSNs, and writes the verified architecture to `anode.lock.json`:

```json
{
  "schema_version": "1.0",
  "resources": {
    "db-orders": {
      "kind": "postgres",
      "engine_version": "16",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/orders/main.go:42",
      "migrations": {
        "tool": "goose",
        "path": "migrations/orders",
        "execution": "pre_traffic_job"
      }
    }
  },
  "services": {
    "orders": {
      "name": "orders",
      "entrypoint": "./services/orders",
      "ingress": [{ "protocol": "http", "port_env": "PORT", "routes": ["POST /v1/orders"] }],
      "bindings": [
        {
          "resource_ref": "db-orders",
          "protocol": "postgres",
          "expanded_env": ["ORDERS_DB_USER", "ORDERS_DB_HOST", "ORDERS_DB_PORT", "ORDERS_DB_NAME"]
        }
      ]
    }
  },
  "egress_rules": [
    {
      "source_service": "orders",
      "target_host": "https://api.stripe.com/v1/charges",
      "port": 443,
      "protocol": "https",
      "is_external": true
    }
  ]
}
```

### 3. Run Locally with Zero Port Collisions

```bash
anode dev ./examples/complex_ecommerce
```

Anode assigns ephemeral loopback ports, auto-provisions isolated Postgres containers (moving to dynamic ports if `5432` is occupied), applies Goose migrations, and streams color-coded service logs with sub-second hot-reloading.

### 4. Deploy Live to Any Linux VPS

```bash
anode deploy root@my-box.com ./examples/complex_ecommerce
```

In under 30 seconds:
* **Architecture Detection**: Queries `uname -m` over SSH and cross-compiles matching Linux binaries (`arm64` or `amd64`).
* **Unprivileged Bootstrapping**: Initializes the dedicated system user `anode` and secures persistent directories at `/var/lib/anode/`.
* **Stateful Resolution**: Auto-provisions required stateful databases using the built-in driver catalog.
* **Pre-Traffic Migrations**: Executes database schema migrations *before* traffic hits new service instances.
* **Systemd Cgroups v2 Hardening**: Generates service units with `CPUQuota=200%`, `MemoryMax=1G`, and process isolation.
* **Edge Routing**: Reloads Caddy with automated Let's Encrypt TLS and path-based reverse proxying.

---

## Pluggable Infrastructure Catalog

Anode decouples stateful provisioning from core orchestrator code using a **Pluggable Declarative Driver Catalog** (`internal/catalog/`):

* **25+ Built-in Pre-Audited Drivers**:
  * **Relational Databases**: PostgreSQL (14, 15, 16, 17), MySQL (8.0, 8.4), MariaDB, CockroachDB, TimescaleDB.
  * **In-Memory & Caches**: Redis (6, 7, 7.2), Valkey, KeyDB, Dragonfly, Memcached.
  * **Event Streaming & Queues**: Kafka (Redpanda engine), RabbitMQ, NATS.
  * **Document & Analytics**: ClickHouse, MongoDB, ScyllaDB, Cassandra.
  * **Search Engines**: Elasticsearch, OpenSearch, Meilisearch.
  * **Vector Databases**: Qdrant, Chroma, Milvus, Weaviate.
  * **Object Storage & Workflow**: MinIO, Temporal.
* **Extensible via YAML (`.anode/catalog/`)**: Add kind #101 or internal company stores with **zero Go code changes** by placing an `anode.catalog.yaml` in your repository.
* **Granular Version Pinning**: Versioning is handled across 4 tiers (Lockfile `engine_version` contract $\rightarrow$ Driver image map $\rightarrow$ Dynamic semver templating $\rightarrow$ Audited LTS fallback).

---

## Least-Privilege Security Boundary

Anode enforces strict defense-in-depth isolation across all targets:

| Hardening Layer | Implementation | Security Benefit |
| :--- | :--- | :--- |
| **POSIX Boundary** | `install -d -m 0700 -o <uid> -g <gid>` | Stateful database directories (`/var/lib/anode/data/`) are isolated to container engine UIDs. |
| **Non-Root Execution** | `User=anode` (`useradd -r -s /bin/false`) | Microservices never run as root on the target host. |
| **Privilege Escalation** | `NoNewPrivileges=true`, `--security-opt no-new-privileges` | Blocks `setuid` binaries from gaining elevated root credentials. |
| **Systemd Sandboxing** | `ProtectSystem=strict`, `ProtectHome=true`, `PrivateTmp=true` | Restricts microservices from reading/writing system files or user directories. |
| **Kernel OOM Score** | `--oom-score-adj=-900` (DBs), `+500` (Apps) | Protects databases from being killed during application memory spikes. |
| **Network Isolation** | Bind exclusively to `127.0.0.1` | Stateful ports (`5432`, `6379`, `9092`) are never exposed to public internet interfaces. |

---

## Automated VM Setup & Infrastructure as Code

Anode provides automated provisioning scripts for spinning up and configuring test/production environments:

* **One-Click Local VM Setup:**
  ```bash
  ./scripts/setup-test-vm.sh [vm-name]
  ```
  Automatically initializes an Ubuntu VM in OrbStack, installs OpenSSH, configures public keys, and tests live deployments.
* **Ansible Automation (`infra/ansible/`):**
  ```bash
  ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml
  ```
* **Terraform Cloud-Init (`infra/terraform/`):**
  Prepares cloud VPS instances (AWS, Hetzner, DigitalOcean) with Caddy, Docker, cgroups v2, and the `anode` user.

---

## CLI Reference

| Command | Description |
| :--- | :--- |
| `anode inspect [PATH]` | Compiles workspace SSA, executes reachability pruning, and writes `anode.lock.json`. |
| `anode dev [PATH]` | Allocates free loopback ports, provisions local DBs, runs migrations, and supervises processes. |
| `anode deploy TARGET [PATH]` | Cross-compiles Linux binaries and deploys to remote server via SSH and systemd. |
| `anode run TARGET [PATH]` | Drop-in alias for `anode deploy` (Docker CLI parity). |
| `anode catalog [PATH]` | Inspects 28+ built-in stateful drivers and merges repo-level overrides (`anode.catalog.yaml`). |
| `anode cluster` | Inspects multi-node cluster pool, bin-packs services, and emits zero-trust `nftables` rules. |
| `anode version` | Displays the current Anode release version. |

---

## Enterprise Test Benchmarks

Real-world architectures used to stress-test Anode are maintained in [`examples/`](examples/):

* [**`examples/sample-shop`**](examples/sample-shop/README.md) — 2-tier baseline microservice architecture with Go 1.22+ routing and Postgres.
* [**`examples/complex_ecommerce`**](examples/complex_ecommerce/README.md) — 3 services with composite DSN unpacking, pre-traffic migrations, and Stripe/SendGrid egress.
* [**`examples/benchmark_app`**](examples/benchmark_app/README.md) — Rapid Type Analysis (RTA) dead-code reachability pruning and sub-150ms throughput.
* [**`examples/hyper_mesh_12`**](examples/hyper_mesh_12/README.md) — **12-microservice flagship stress test** with mixed REST, gRPC stubs, Redis caching, and 3-hop struct pointer indirections.
* [**`examples/fintech_core_20`**](examples/fintech_core_20/README.md) — **20-microservice neo-banking & trading engine** with modular package separation (`config` -> `repo` -> `handler`), Kafka order book matching, TimescaleDB double-entry ledger, and ScyllaDB payments.
* [**`examples/health_mesh_25`**](examples/health_mesh_25/README.md) — **25-microservice HIPAA hospital & telehealth ecosystem** with FHIR document stores, WebRTC signaling, gRPC, and medical billing claims.
* [**`examples/omni_mesh_32`**](examples/omni_mesh_32/README.md) — **32-microservice hyper-scale enterprise benchmark** combining 14 infrastructure backing stores (`postgres`, `clickhouse`, `scylladb`, `mongodb`, `mariadb`, `timescaledb`, `cockroachdb`, `rabbitmq`, `kafka`, `minio`, `temporal`, `qdrant`, `valkey`, `memcached`), gRPC contracts, and zero-trust egress policies.
* [**`examples/realworld_benchmarks`**](examples/realworld_benchmarks/README.md) — **10 Open-Source Go Backend Applications**: Real-world evaluation across `croc`, `glance`, `1Panel`, `restic`, `filebrowser`, `ntfy`, `netbird`, `wttr.in`, `cloudreve`, and `navidrome`. Demonstrates zero-code-change architecture discovery, multi-dialect DB mapping, and automated deployment synthesis.

---

## Compiler Performance & Benchmark Timings

Anode compiles architecture directly from source without heuristics or runtime instrumentation. The static analysis is divided into two phases:
1. **Toolchain Ingestion (`packages.Load` & `ssautil.AllPackages`)**: Go's AST parser and SSA IR constructor read packages and dependencies from disk.
2. **Anode SSA Reachability & Topology Sweep**: Variable Type Analysis (VTA) computes whole-program reachability in $O(N)$ linear time, extracts HTTP/gRPC ingress routes, resolves backing databases/queues, and performs backward taint tracking on environment variables.

### Measured Empirical Scaling Profile

Below are the empirically measured timings across synthetic enterprise topologies and 10 production open-source Go backend applications:

| Benchmark Target | Services | DBs / Stores | `go list` AST Load | SSA Build | VTA CallGraph | **Anode SSA Sweep** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| [**`sample-shop`**](examples/sample-shop/) *(Baseline)* | 2 | 2 | 460 ms | 182 ms | 367 ms | **62.2 ms** |
| [**`hyper_mesh_12`**](examples/hyper_mesh_12/) | 12 | 7 | 615 ms | 200 ms | 825 ms | **268.8 ms** |
| [**`fintech_core_20`**](examples/fintech_core_20/) | 20 | 22 | 615 ms | 213 ms | 820 ms | **548.8 ms** |
| [**`health_mesh_25`**](examples/health_mesh_25/) | 25 | 26 | 680 ms | 249 ms | 804 ms | **642.6 ms** |
| [**`omni_mesh_32`**](examples/omni_mesh_32/) | 32 | 35 | 653 ms | 205 ms | 795 ms | **799.0 ms** |
| [**`glance`**](https://github.com/glanceapp/glance) | 1 | 0 | 1,041 ms | 410 ms | 1,017 ms | **40.4 ms** |
| [**`filebrowser`**](https://github.com/filebrowser/filebrowser) | 1 | 1 | 1,103 ms | 540 ms | 1,412 ms | **66.7 ms** |
| [**`wttr.in`**](https://github.com/chubin/wttr.in) | 1 | 1 | 881 ms | 290 ms | 814 ms | **78.7 ms** |
| [**`navidrome`**](https://github.com/navidrome/navidrome) | 1 | 1 | 1,837 ms | 633 ms | 2,306 ms | **125.1 ms** |
| [**`croc`**](https://github.com/schollz/croc) | 4 | 0 | 1,011 ms | 412 ms | 1,293 ms | **140.6 ms** |
| [**`cloudreve`**](https://github.com/cloudreve/cloudreve) | 1 | 1 | 2,473 ms | 1,233 ms | 3,745 ms | **152.5 ms** |
| [**`restic`**](https://github.com/restic/restic) | 3 | 0 | 1,583 ms | 624 ms | 6,210 ms | **134.1 ms** |
| [**`ntfy`**](https://github.com/binwiederhier/ntfy) | 7 | 2 | 1,531 ms | 520 ms | 6,638 ms | **346.1 ms** |
| [**`netbird`**](https://github.com/netbirdio/netbird) | 14 | 5 | 3,210 ms | 1,842 ms | 13,840 ms | **649.4 ms** |

> **Key Takeaway:** Anode's actual topology sweep executes in **sub-100ms** on standard backends and under **800ms** on large 32-service enterprise monorepos.

---

## Documentation

* 📖 **[Architecture Deep-Dive](docs/architecture.md)** — Whole-program SSA, Variable Type Analysis (VTA), and backward taint tracking.
* ⚖️ **[Tradeoffs & Known Limits](docs/tradeoffs.md)** — Architectural principles, intentional non-goals, and comparison with Kubernetes/Encore.
* 🛡️ **[Security Architecture](docs/security.md)** — Cgroups v2 isolation, systemd sandboxing, and POSIX permissions.

---

## Verification & Quality Guarantees

Anode is engineered under strict **`agstack`** verification policies:
* **Harness:** Run `.verify/run.sh` or `agent-brain verify run`.
* **Zero AI Comment Slop:** Self-documenting code with zero narration comments.
* **Hermetic Isolation:** All runtime test artifacts, compiled test binaries, and extracted lockfiles are strictly isolated under `.verify/`.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
