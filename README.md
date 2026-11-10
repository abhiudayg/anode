<div align="center">

# Anode

### Deploy unmodified Go backends to any Linux VPS without Dockerfiles, Kubernetes, or proprietary SDKs.

[![Go Version](https://img.shields.io/badge/go-1.22+-00ADD8.svg?style=flat&logo=go)](https://golang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Verification: agstack](https://img.shields.io/badge/verified-agstack%20passed-success.svg)](#verification--quality-guarantees)
[![Architecture: Proof--of--Topology](https://img.shields.io/badge/architecture-4--Pillar%20Topology-purple.svg)](docs/architecture.md)

<p align="center">
  <a href="#the-problem">The Problem</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#the-anodelockjson-contract">The Lockfile</a> •
  <a href="#cli-reference">CLI Reference</a> •
  <a href="docs/architecture.md">Architecture Deep-Dive</a> •
  <a href="docs/tradeoffs.md">Tradeoffs & Limits</a>
</p>

</div>

---

## The Problem: You Write Your Architecture Twice

Every time you build a Go backend, you declare your architecture twice:

1. **In Go:** You call `sql.Open("postgres", cfg.DBURL)`, listen on `cfg.Port`, and make calls to internal microservices.
2. **In YAML / Docker:** You write a multi-stage `Dockerfile`, a 50-line `docker-compose.yml`, mount volumes, map host ports (and pray `5432` isn't taken by another project), and manually wire environment variables.

When you add a service or refactor an env var, your code and your configuration immediately drift.

Previous "Infrastructure-from-Code" tools attempted to solve this, but made one of two fatal mistakes:
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
                    │ • Schema Migration Jobs       │                                 │ • Zero-downtime port swap     │
                    │ • Sub-second reload loop      │                                 │ • Automated Caddy HTTPS       │
                    └───────────────────────────────┘                                 └───────────────────────────────┘
```

---

## The 4 Pillars of Determinism

1. **Migration-Driven Database Provenance:** Anode provisions a stateful database *only* when verifiable schema migration assets (`migrations/*.sql`, Goose, etc.) exist alongside the service. If no migrations exist, Anode treats the database as an external unmanaged service—zero guessing.
2. **Typed Interface Linking:** Microservice RPC connections are matched 1:1 using generated Protobuf service descriptors (`payment.v1.PaymentService`) and router route tables (`POST /v1/orders`), with zero naming heuristics.
3. **The Commit-Backed `anode.lock.json`:** Every run of `anode inspect` emits a human-readable lockfile committed to Git. Platform engineers review the exact topology in pull requests, and `anode dev` / `anode deploy` treat it as an immutable contract.
4. **Actionable Build-Time Diagnostics:** If an outbound target or dynamic DSN cannot be mathematically resolved, Anode reports a precise compiler warning with `file:line` provenance and a concrete fix—never failing silently at runtime.

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
anode inspect ./testdata/sample-shop
```

Anode inspects the call graph, prunes dead code, and writes the topology to `anode.lock.json`:

```json
{
  "schema_version": "1.0",
  "resources": {
    "db-orders": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/orders/main.go:40",
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
      "bindings": [{ "resource_ref": "db-orders", "inject_env": "DATABASE_URL" }]
    }
  }
}
```

### 3. Run Locally with Zero Port Collisions

```bash
anode dev ./testdata/sample-shop
```

Anode assigns ephemeral loopback ports, injects unified (`DATABASE_URL`) and decomposed (`DB_HOST`, `DB_PORT`) credentials, runs migrations, and links microservices automatically.

### 4. Deploy to Bare-Metal Linux VPS

```bash
anode deploy root@my-hetzner-box ./testdata/sample-shop
```

In under 30 seconds:
* Cross-compiles static Linux binaries (`CGO_ENABLED=0 GOOS=linux`).
* Provisions persistent systemd units with cgroups v2 resource quotas.
* Configures Caddy with automated Let's Encrypt TLS certificates.
* Performs a health-checked zero-downtime port swap.

---

## CLI Reference

| Command | Description |
| :--- | :--- |
| `anode inspect [dir]` | Compiles workspace SSA, executes VTA reachability, and writes `anode.lock.json`. |
| `anode dev [dir]` | Allocates free ports, injects database credentials, and runs local service instances. |
| `anode deploy <user@host> [dir]` | Cross-compiles Linux binaries and deploys to remote server via SSH and systemd. |
| `anode cluster` | Inspects multi-node cluster pool, bin-packs services, and emits zero-trust `nftables` rules. |

---

## Documentation

* 📖 **[Architecture Deep-Dive](docs/architecture.md)** — Whole-program SSA, Variable Type Analysis (VTA), backward taint tracking, and stdlib choke points.
* ⚖️ **[Tradeoffs & Known Limits](docs/tradeoffs.md)** — What Anode does, what it intentionally refuses to do, and comparison with Kubernetes/Encore.
* 🔒 **[The Lockfile Specification](docs/architecture.md#the-anodelockjson-specification)** — Full schema reference for `anode.lock.json`.

---

## Verification & Quality Guarantees

Anode is engineered under strict **`agstack`** verification policies:
* **Harness:** Run `.verify/run.sh` or `agent-brain verify run`.
* **Zero AI Comment Slop:** Self-documenting code with zero narration comments.
* **Hermetic Isolation:** All runtime test artifacts, compiled test binaries, and extracted lockfiles are strictly isolated under `.verify/`.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
