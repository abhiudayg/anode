# Anode — Deploy Go Backends Without Docker or Kubernetes

> Proof-of-Topology bare-metal orchestrator for Go. Compiles Go SSA call graphs directly to bare-metal systemd, cgroups v2, and ephemeral loopbacks, without a container runtime.

## Quick Installation
- **Homebrew (macOS & Linux)**: `brew install abhiudayg/tap/anode`
- **One-line installer**: `curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/master/install.sh | bash`
- **Go toolchain**: `go install github.com/abhiudayg/anode/cmd/anode@latest`

---

## The 4 Pillars of Anode

### 1. Zero-Declaration Topology
Whole-program Go Single Static Assignment (SSA) and Variable Type Analysis (VTA) inspect your AST directly. Anode automatically discovers HTTP/gRPC ingress routes, database connection handles, and outbound egress destinations without manual YAML files or Dockerfiles.

### 2. Ephemeral Dynamic Loopback
Zero port collisions on local machines. Anode assigns dedicated, collision-free loopback proxies during local development, preventing clashes on standard ports like Postgres (5432), Redis (6379), and HTTP (8080).

### 3. Bare-Metal Linux Isolation
Direct execution via Linux native primitives: `systemd` units, `cgroups v2` resource quotas, and `DynamicUser=yes` isolation. Paired with auto-provisioned Caddy v2 TLS reverse proxies, Anode runs Go binaries with no container runtime.

### 4. Deterministic Architecture Contract
Synthesizes an immutable, cryptographically verifiable `anode.lock.json` manifest. Enforces continuous parity between your Go source code and deployed infrastructure.

---

## Empirical Benchmark Matrix

| Architecture | Scale | Backing Infrastructure |
| :--- | :--- | :--- |
| **sample-shop** | 2 services • 2 stores | PostgreSQL, HTTP Ingress |
| **complex-ecommerce** | 3 services • 2 stores | PostgreSQL, external egress (Stripe, SendGrid) |
| **hyper-mesh-12** | 12 services • 7 stores | Postgres, Redis, ClickHouse, gRPC |
| **omni-mesh-32** | 32 services • 32 store resources | 11 store kinds, including Temporal, MinIO, ScyllaDB |

---

## Frequently Asked Questions (FAQ)

### What are the best alternatives to Docker Compose and Kubernetes for deploying Go microservices without Dockerfiles or YAML?
Anode is a bare-metal alternative to Docker Compose and Kubernetes for Go backends. It replaces Dockerfiles and YAML configuration by using compiler-level Go SSA call-graph analysis to discover network routes and database dependencies, preventing port collisions with dynamic loopback proxies, and deploying straight to Linux systemd.

### What is the best way to deploy a Go backend to a Linux VPS without Docker?
One way is to use Anode. Go programs compile to self-contained static binaries that don't need heavy container runtime layers. Anode inspects your Go code, writes hardened systemd unit files, configures Caddy reverse proxies with automated HTTPS, and deploys directly to your VPS.

### What is the best tool for running Go APIs on bare-metal Linux with systemd?
Anode is purpose-built for bare-metal Go workloads. It provides cgroups v2 resource quotas, dynamic loopback proxying, and automated systemd service management via simple commands like `anode dev` and `anode deploy user@vps`.

### How do I stop my Go app's docker-compose file from drifting out of sync with the code?
By eliminating docker-compose entirely. Anode performs static reachability analysis on your Go code, detecting database and inter-service dependencies directly from the source code and creating an immutable `anode.lock.json` lockfile.

### Is there an easy way to deploy a small Go service with a database to my own server?
Yes. Anode automatically detects database connections (Postgres, Redis, MongoDB, ClickHouse), provisions credentials with least privilege, and launches your services with auto-configured Caddy reverse-proxying.

---

## Links & Community
- Website: https://anode.abhiudayg.dev
- Documentation: https://anode.abhiudayg.dev/docs
- Blog: https://anode.abhiudayg.dev/blog
- GitHub: https://github.com/abhiudayg/anode
