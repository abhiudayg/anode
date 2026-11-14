# Changelog

All notable changes to the **Anode** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.2] - 2026-11-14

### 🚀 Changed & Fixed
- **`anode ps` Kernel Specification Alignment**:
  - Re-labeled anonymous memory from "Non-reclaimable heap" to **“Anonymous mappings”**, strictly matching Linux cgroup v2 kernel specifications (`cgroup-v2.rst` / `memory.stat`).
  - Formatted file-backed memory as **“File-backed (Page Cache)”** with optional `(shmem: ...)` tracking when shared memory or tmpfs is allocated.
  - Formatted kernel memory as **“Kernel allocations”** with dynamic `(slab: ..., sock: ...)` accounting.
  - Dynamically query and parse systemd `MemoryMax`, `MemoryLimit`, and `CPUQuotaPerSecUSec` properties rather than assuming static template defaults, displaying accurate percentages for custom limits or unlimited services.
  - Added fallback total memory calculation when `status.MemoryBytes == 0` but breakdown metrics exist.
  - Made local process tests sandbox-safe under macOS security restrictions and container environments.

---

## [1.1.1] - 2026-11-14

### 🚀 Added
- **`anode ps` Memory Breakdown (`memory.stat` anon/file/kernel breakdown)**:
  - Extracted Linux cgroups v2 `memory.stat` metrics directly from `/sys/fs/cgroup$CG/memory.stat` in a unified query over SSH alongside systemd properties.
  - Exposes `anon` (process heap, goroutines, anonymous mmap), `file` (page cache, shared libraries, binary text), and `kernel` (slab allocator, TCP/UDP sockets), as well as `slab`, `sock`, and `shmem`.
  - Enables direct workload comparison between bare-metal systemd and containerized setups to determine how much of the memory footprint is disk cache versus active process heap.
  - Fallback support for kernels without unified cgroups v2 or local inspection via `/proc/<pid>/smaps_rollup` (`Pss_Anon`, `Pss_File`) and `/proc/<pid>/status`.
  - Formatted inline in the standard process table `MEMORY` column: `40.0 MB / 100.0 MB (40%) [anon:28.0 MB file:10.0 MB k:2.0 MB]`.
  - Dynamic table column auto-sizing ensures clean column alignment regardless of breakdown length.
  - Dedicated verbose memory tree (`-v` / `--verbose`) under `[MEMORY BREAKDOWN — PROCESS HEAP VS KERNEL PAGE CACHE]` displaying percentage share and reclaimability details ("Non-reclaimable" heap vs "Evictable under pressure" page cache).
  - Machine-readable serialization under `"memory_breakdown"` in `--json` mode.

### 🎨 Website & UX Enhancements
- **Hero & Navbar Collision Fix**:
  - Resolved vertical header collision where terminal inspection card overlapped the top navigation bar.
  - Bumped version badges across Hero and Navbar to `v1.1.1`.

---

## [1.1.0] - 2026-11-13

### 🚀 Added
- **Bare-Metal Process Inspection (`anode ps` / `anode status`)**:
  - Direct bare-metal systemd process inspection over SSH or locally with zero container daemon dependencies.
  - Linux `cgroups v2` resource accounting measuring real-time `memory.current` against `MemoryMax=1G` limit with percentage utilization.
  - Graceful fallback memory accounting reading `/proc/<pid>/smaps_rollup` (Proportional Set Size / PSS and RSS) or `/proc/<pid>/statm`.
  - Accurate `TasksCurrent` metrics capturing multi-process worker forks and Go runtime OS threads.
  - Flapping and crashloop detection: identifies `SubState=auto-restart` and `ActiveState=failed`, extracting exit codes, total restart counts (`NRestarts`), and time since last restart.
  - Caddy edge reverse-proxy status: verifies Caddy active state and maps upstream loopback ports (e.g. `127.0.0.1:8080`) to public domain routes (e.g. `https://api.example.com`).
  - Dual output modes: colorized human-readable ANSI table and machine-readable `--json` format.
- **Decoupled Pre-Flight Diagnostics (`anode doctor`)**:
  - Sub-100ms sanity check prior to deployment.
  - Phase 1 (Raw TCP Dial): Strict 3-second deadline to catch firewalls, closed port 22, or bad DNS before auth attempts.
  - Phase 2 (SSH Handshake): Verifies public key authentication and TOFU host key fingerprints, accurately isolating auth rejections from network drops.
  - Compiler toolchain verification: ensures Go compiler produces pure static binaries (`CGO_ENABLED=0`).
  - Local loopback range validation: confirms `127.0.0.0/8` subnet binding capability with 0% collisions.
  - Container runtime verification: checks Docker / Podman availability for dev-time ephemeral datastores.
- **Website Changelog & System Evolution (`/changelog`)**:
  - Dedicated interactive release timeline page detailing architectural evolutions.
  - Category filters (`All`, `CLI`, `Security`, `Runtime`, `Networking`), copyable release anchors, and terminal execution output snippets.
  - Integrated into sitemap (`/sitemap.xml`), Footer, and Command Palette (`⌘K`).

### 🛡 Security & Hardening
- **Anti-Jailbreak Systemd Confinement**:
  - Enforced `DynamicUser=yes` for transient unprivileged UIDs.
  - Restricted kernel process visibility with `ProtectProc=invisible` and `ProcSubset=pid` to conceal neighboring processes.
  - Hardened kernel isolation with `LockPersonality=true`, `MemoryDenyWriteExecute=true`, and `RestrictNamespaces=true`.
- **In-Memory Streaming SCP (`StreamBytes`)**:
  - Eliminated temporary world-writable `/tmp` staging writes during remote binary deployment.
  - Direct encrypted in-memory byte streaming prevents disk probing, symlink traversal attacks, and multi-tenant race conditions.

---

## [1.0.0] - 2026-11-11

### 🚀 Added
- **4-Pillar Proof of Topology Engine**:
  - **Pillar 1 (Database Provenance)**: Migration-driven stateful provisioning. Databases (`postgres`, `redis`, etc.) are provisioned only when verifiable migration assets (`migrations/*.sql` or Goose) exist. Unverified sinks are treated as unmanaged external dependencies.
  - **Pillar 2 (Typed Interface Linking)**: 1:1 matching between generated Protobuf gRPC client stubs (`New<X>Client`) and server registrations (`Register<X>Server`), plus standard library HTTP router route table extraction (`chi`, `gin`, `echo`, Go 1.22+ `http.ServeMux`).
  - **Pillar 3 (Commit-Backed Lockfile)**: Cryptographically deterministic `anode.lock.json` committed to Git for pull request reviews and architectural audibility.
  - **Pillar 4 (Actionable Diagnostics)**: Ambiguous dynamic connection strings emit compiler warnings with exact `file:line` provenance and actionable remediation suggestions.
- **Compiler Pipeline (`internal/analyzer`)**:
  - Whole-program Static Single Assignment (SSA) intermediate representation using `golang.org/x/tools/go/ssa`.
  - Variable Type Analysis (VTA) call graph rooted strictly at `func main()`, mathematically pruning dead code and mock test drivers.
  - Standard library choke point detection on `database/sql.Open`, `github.com/jackc/pgx/v5/pgxpool.New`, `net.Listen`, and `net/http.ListenAndServe`.
  - Recursive backward taint tracking through structs, `ssa.Store`, `ssa.FieldAddr`, and `fmt.Sprintf` varargs slices (`internal/analyzer/taint.go`) with cycle-safe Phi node traversal guards.
  - Generic instantiation (`ssa.InstantiateGenerics`) supporting complex third-party crypto and AST libraries.
- **Docker-Style CLI Experience (`cmd/anode`)**:
  - Docker-style synopsis: `Usage: anode [OPTIONS] COMMAND [ARG...]`.
  - Added `anode run` drop-in alias for `deploy`.
  - Added `anode catalog` management command to inspect stateful infrastructure drivers and local project overrides.
  - Added `anode cluster` for placement inspect and firewall synthesis.
  - Context-aware `--help` / `-h` screens across all subcommands.
- **Local Dev Orchestrator (`anode dev`)**:
  - Ephemeral kernel socket allocation via `net.ListenTCP("tcp", "127.0.0.1:0")` to guarantee 0% host port collisions.
  - Dual environment variable injection: both unified DSN (`DATABASE_URL`) and decomposed credentials (`DB_HOST`, `DB_PORT`, `DB_USER`).
  - Automated migration execution prior to application process boot.
  - Sub-second hot-reloading supervisor.
- **Enterprise Benchmark Suites (`examples/`)**:
  - **OmniMesh-32 (`examples/omni_mesh_32`)**: Hyper-scale stress-test benchmark modeling 32 distinct Go microservices across 14 infrastructure drivers (PostgreSQL, MariaDB, TimescaleDB, CockroachDB, ScyllaDB, ClickHouse, MongoDB, Redis, Valkey, Memcached, RabbitMQ, Kafka, MinIO, Temporal, Qdrant).
  - **HealthMesh-25 (`examples/health_mesh_25`)**: HIPAA-compliant hospital & telehealth system modeling 25 microservices with FHIR document stores, typed WebRTC gRPC stubs, e-prescriptions, and medical billing claims.
  - **Fintech Core 20 (`examples/fintech_core_20`)**: Modular neo-banking and trading engine with layered package separation (`config` -> `repo` -> `handler`), Kafka order books, TimescaleDB double-entry ledger, and ScyllaDB payments.
  - **Real-World Open-Source Benchmarks (`examples/realworld_benchmarks/`)**: Evaluated Anode against 10 famous, unmodified production Go backend codebases: `croc`, `glance`, `1Panel`, `restic`, `filebrowser`, `ntfy`, `netbird`, `wttr.in`, `cloudreve`, and `navidrome`. Verified multi-dialect DB driver resolution, Gin/Chi/Mux routing discovery, and automated systemd + Caddy deployment synthesis.
  - **Harmonized SSA Sweep Profiles**: Sub-100ms on single-service backends scaling to 799ms on a 32-service enterprise monorepo with direct repository links and streamlined metrics.
- **Pluggable Infrastructure Catalog & Security Matrix (`internal/catalog`)**:
  - Declarative service catalog (`defaults.yaml`) with 28 out-of-the-box drivers (PostgreSQL, MySQL, MariaDB, CockroachDB, TimescaleDB, Redis, Valkey, KeyDB, Dragonfly, Memcached, Kafka/Redpanda, RabbitMQ, NATS, ClickHouse, MongoDB, ScyllaDB, Cassandra, Elasticsearch, OpenSearch, Meilisearch, Qdrant, Chroma, Milvus, Weaviate, MinIO, Temporal).
  - Version matrix pinning (e.g. Postgres 14/15/16/17, MySQL 8.0/8.4, Redis 6/7) with intelligent fallback resolution.
  - Multi-tier catalog override hierarchy: embedded defaults < repo-level (`.anode/catalog/`) < user-level (`~/.anode/catalog/`).
  - Strict least-privilege security container configurations: non-root UIDs, `0700` POSIX directory isolation, `no-new-privileges:true`, `--oom-score-adj=-900` database kernel protection, and loopback `127.0.0.1` binding.
- **Bare-Metal VPS Deployer (`anode deploy`)**:
  - Cross-compilation with automatic target architecture detection (`uname -m` -> `arm64`/`amd64`).
  - Hardened systemd unit sandboxing (`NoNewPrivileges=true`, `ProtectSystem=strict`, `ProtectHome=true`, `PrivateTmp=true`, `PrivateDevices=true`, `ProtectKernelTunables=true`, `ProtectControlGroups=true`, `RestrictSUIDSGID=true`).
  - Linux `cgroups v2` resource quotas (`CPUQuota=200%`, `MemoryMax=1G`).
  - Zero-downtime blue/green port swaps using ephemeral loopbacks.
  - Automated Caddy reverse proxy synthesis with Let's Encrypt TLS.
- **Infrastructure as Code & Automated Provisioning (`infra/`)**:
  - Production-ready Ansible automation (`infra/ansible/`) for zero-touch VPS bootstrapping.
  - Terraform configurations (`infra/terraform/`) with cloud-init for bare-metal and cloud VMs.
  - VM provisioning automation scripts (`scripts/setup-test-vm.sh`).
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
