# Changelog

All notable changes to the **Anode** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-10

### 🚀 Added
- **4-Pillar Proof of Topology Engine**:
  - **Pillar 1 (Database Provenance)**: Migration-driven stateful provisioning. Databases (`postgres`, `redis`) are provisioned only when verifiable migration assets (`migrations/*.sql` or Goose) exist. Unverified sinks are treated as unmanaged external dependencies.
  - **Pillar 2 (Typed Interface Linking)**: 1:1 matching between generated Protobuf gRPC client stubs (`New<X>Client`) and server registrations (`Register<X>Server`), plus standard library HTTP router route table extraction (`chi`, `gin`, `echo`, Go 1.22+ `http.ServeMux`).
  - **Pillar 3 (Commit-Backed Lockfile)**: Cryptographically deterministic `anode.lock.json` committed to Git for pull request reviews and architectural audibility.
  - **Pillar 4 (Actionable Diagnostics)**: Ambiguous dynamic connection strings emit compiler warnings with exact `file:line` provenance and actionable remediation suggestions.
- **Compiler Pipeline (`internal/analyzer`)**:
  - Whole-program Static Single Assignment (SSA) intermediate representation using `golang.org/x/tools/go/ssa`.
  - Variable Type Analysis (VTA) call graph rooted strictly at `func main()`, mathematically pruning dead code and mock test drivers.
  - Standard library choke point detection on `database/sql.Open`, `github.com/jackc/pgx/v5/pgxpool.New`, `net.Listen`, and `net/http.ListenAndServe`.
  - Recursive backward taint tracking through structs, `ssa.Store`, `ssa.FieldAddr`, and `fmt.Sprintf` varargs slices (`internal/analyzer/taint.go`).
- **Local Dev Orchestrator (`anode dev`)**:
  - Ephemeral kernel socket allocation via `net.ListenTCP("tcp", "127.0.0.1:0")` to guarantee 0% host port collisions (e.g. Postgres on 54329, Redis on 63792).
  - Dual environment variable injection: both unified DSN (`DATABASE_URL`) and decomposed credentials (`DB_HOST`, `DB_PORT`, `DB_USER`).
  - Automated migration execution prior to application process boot.
  - Sub-second hot-reloading supervisor.
- **Bare-Metal VPS Deployer (`anode deploy`)**:
  - Cross-compilation to self-contained Linux static binaries (`CGO_ENABLED=0 GOOS=linux`).
  - Hardened systemd unit file generator with Linux `cgroups v2` resource quotas (`CPUQuota=200%`, `MemoryMax=1G`).
  - Zero-downtime blue/green port swaps using ephemeral loopbacks.
  - Automated Caddy reverse proxy synthesis with Let's Encrypt TLS.
- **Cluster & Security Engine (`internal/cluster`)**:
  - Multi-node greedy least-loaded bin-packer for distributing services across registered VPS instances.
  - Compiler-synthesized Linux kernel `nftables` zero-trust firewall policy: blocks all undeclared lateral container traffic, permitting only declared egress.
- **Distribution & Installation**:
  - Official Homebrew formula and tap repository (`abhiudayg/tap/anode`).
  - One-line curl installation script (`install.sh`).
  - GitHub Actions CI/CD workflows for multi-OS testing and automated multi-arch releases (`darwin/amd64`, `darwin/arm64`, `linux/amd64`, `linux/arm64`).
- **Marketing & Documentation**:
  - Fluid, high-end Next.js 15 product landing page with interactive CLI emulator.
  - In-depth interactive documentation (`/docs`) with full CLI reference, compiler guides, and benchmark analysis.
  - Deep-dive technical journal (`/blog`) covering Proof of Topology, VTA vs CHA, and bare-metal systemd benchmarks.

### 🛡 Security & Reliability
- Soft-Orphan Volume Protection: Anode marks removed stateful resources as `lifecycle: orphaned` and refuses to drop persistent database volumes automatically without explicit `--confirm` flag.
- Default drop firewall policy generated at compile-time to prevent lateral container pivot attacks.
