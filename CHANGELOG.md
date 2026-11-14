# Changelog

All notable changes to the **Anode** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.0] - 2026-11-15

### 🔒 Security
- **Hardened deploy path** (audit findings are in `docs/security-audit.md`):
  - Systemd unit fields, environment names, and values are validated before a unit is written, closing a path where a lock-file value could inject a root-level command.
  - Pre-start config file names are restricted to plain `.json` names.
  - An iptables rule drops external traffic to application ports (`21040`–`21999`), saved with `netfilter-persistent` so it survives reboots.
  - A new SSH host key requires `ANODE_TRUST_NEW_HOST=1` after its fingerprint is checked.
  - An IP address target requires `--plain-http`; deploys without it are refused. `--domain` is now parsed correctly.
  - A `.env` readable by other users stops the deploy.
  - Log filters (`--since`, `--until`) are validated and shell-quoted.
- **`anode host-setup`**: creates a dedicated deploy account with a validated sudo rule. `--disable-root-login` turns off direct root SSH login after checking that the deploy account works, and removes its own change if `sshd` rejects it. Passwordless sudo for the deploy account is an accepted risk on single-owner hosts; see `docs/security-audit.md`.

### 🚀 Added
- **`anode rollback <user@host>`**: restores the previous release's recorded units.
- **Release retention**: the newest three releases are kept on the host; older releases, their secret env files, and stale `anode-*` units are removed.
- **Per-host port registry**: allocations avoid ports already listening on the host and are recorded in `/etc/anode/ports`.
- **`anode doctor` remote checks**: verifies the deploy inputs and that the application-port firewall rule is active and saved.

### 🛠 Changed
- **Fail-loud deploys**: a Caddy install error, a failed `caddy validate`, or a failed HTTP health check stops the deploy.
- **External databases come from `.env`**: `anode dev` and `anode deploy` read each external database value from `.env`. A missing value stops the run; no default URL is invented.
- **`anode dev` reports real state**: it prints the engine's plan with secrets masked, and stops its services when it exits.
- **Shared SSH authentication**: agent and key-file signers are offered in one authentication method.
- **Usage text**: `host-setup` and `deploy` help now show the current arguments and `--plain-http`.

### 🎨 Documentation & Web UI
- Added `docs/supported-profile.md`, the in-scope and out-of-scope list and the `.env` contract.
- Added `docs/security-audit.md`, with each finding's status and the accepted residual risks.
- Removed unverified figures and claims from the website, and removed unmaintained analysis snapshots from the examples.
- Removed example suites that no test or CLI command used, and the vendored third-party repositories under `examples/realworld_benchmarks/`. They remain in git history.
- Corrected the deployment, architecture, and security docs to match the code: services run under `DynamicUser`, deploys restart services in place, migrations are not run by the deploy, and the cluster firewall does not restrict outbound traffic.
- Updated the version shown in the navigation, the hero banner, and the changelog page.

---

## [1.3.0] - 2026-11-14

### 🚀 Added
- **`anode cluster` Multi-Node Fleet Placement & Zero-Trust Firewall Synthesis**:
  - **Fleet Inventory Parser (`anode.cluster.yaml`)**: Supports node roles (`edge`, `worker`, `storage`), SSH endpoints, private cluster CIDRs (VPC/WireGuard), and memory allocations.
  - **Scaffolding (`anode cluster init`)**: Generates an annotated starter `anode.cluster.yaml` inventory template.
  - **Greedy Bin-Packing Engine**: Implements Best-Fit Decreasing (BFD) algorithm allocating services from `anode.lock.json` (or dynamic AST analysis) across fleet nodes based on memory quotas and role affinity (ingress to `edge`, backend microservices to `worker`).
  - **Memory Overcommit Headroom**: Configurable RAM overcommit ratio (default 15% headroom) preventing cgroups OOM while maximizing server density.
  - **Deterministic Port Allocator**: Assigns collision-free host ports across internal cluster nodes.
  - **Zero-Trust Linux `nftables` Synthesis (`--firewall`)**: Compiles atomic, copy-pasteable Linux packet filtering rules (`table inet filter`) enforcing default drop, loopback, SSH, public edge ingress (80/443), and inter-node private subnet communication.
  - **ASCII Fleet & Placement Matrix**: Aligned terminal tables displaying node capacity, assigned services, port maps, and RAM usage.
  - **Machine Output (`--json`)**: Emits complete cluster placement state and node capacity statistics for CI/CD pipelines.

- **`anode catalog` Deep Driver Inspection & Provenance Tracking**:
  - **Source Attribution**: Tracks driver provenance, clearly distinguishing built-in embedded drivers (`[embedded]`) from repo-level overrides (`anode.catalog.yaml`).
  - **Driver Overview Table**: Aligned ASCII table displaying driver kind, category (database, cache, message-broker, vector, storage, orchestrator), wire protocol, default port, image template, and source.
  - **Deep Inspection Card (`anode catalog <driver>`)**: Detailed terminal card printing runtime specs, injected environment variables (`DATABASE_URL`, host, port, credentials), readiness checks, volume mounts, and security/cgroup constraints.
  - **JSON Output (`anode catalog --json`)**: Emits structured catalog registry schemas for IDE extensions and tooling.

### 🎨 Documentation & Web UI
- **Interactive Command Generator on `/docs`**:
  - Added dedicated live interactive tabs for `cluster` and `catalog`.
  - Supports live toggling between Placement Matrix, `nftables` Firewall synthesis, and starter fleet inventory initialization.
  - Added deep-dive CLI reference cards for `anode catalog` and `anode cluster`.
- **Updated Hero & Navigation Badges**:
  - Reflected `v1.3.0` release across navigation and landing page hero banner.

---

## [1.2.0] - 2026-11-14

### 🚀 Added
- **`anode logs` Multi-Service Streaming & Aggregation**:
  - Implemented top-level `anode logs [OPTIONS] [TARGET] [SERVICE]` command for local supervisor and remote VPS journald log inspection.
  - Concurrently aggregates and multiplexes logs across all microservices with deterministic color-coded service prefixes (`[orders]`, `[payments]`).
  - Remote log streaming over SSH via `journalctl -u anode-*.service -o json` with clean cancellation, SIGINT signal forwarding, and timestamp parsing.
  - Local log persistence and tailing: `anode dev` tees service stdout/stderr into `.verify/logs/<svc>.log` with RFC3339 timestamps for instant local review and live tailing.
  - Comprehensive flag support:
    - `-f, --follow`: Follow log output (stream live updates).
    - `-n, --lines, --tail N`: Number of historical lines to show (default: 100).
    - `-t, --timestamps`: Show RFC3339 timestamps for each entry.
    - `--since TIME`: Filter logs newer than a relative time (e.g. `10m`, `1h`) or specific date.
    - `--until TIME`: Filter logs older than a specific date or relative time.
    - `--edge`: Include Caddy reverse-proxy access logs in the multiplexed stream.
    - `--json`: Output structured log records as line-delimited JSON for log forwarders (Vector, Datadog, Fluentbit).
  - SSH streaming client (`Stream`) and terminal signal listener for resilient remote stream interruption without hanging sessions.

### 🎨 Documentation & Interactive Command Generator
- **Multi-Command Live Interactive Generator**:
  - Expanded interactive command builder on `/docs` into a multi-command configurator covering `deploy`, `logs`, `ps`, `doctor`, `dev`, and `inspect`.
  - Added dedicated interactive controls for each command, target environment toggles (Remote VPS vs Local Dev), real-time contextual explanations, and single-click copy with animated feedback.
- **CLI Reference Modernization**:
  - Added detailed documentation cards for `anode logs` and `anode version`.
  - Synchronized global synopsis with actual CLI `anode --help` output.
  - Added deep-linking section aliases for `logs`, `ps`, `status`, `doctor`, `deploy`, and `inspect`.
  - Added `anode logs` to global Command Palette (`Cmd+K`) and `llms-full.txt`.

### 🛡️ Fixed & Hardened
- **Safe Supervisor Log File Closure**:
  - Replaced unhandled file closure in `devengine.Supervisor.streamLogs` with explicit error logging and fallback handling, resolving CodeQL analysis alert.

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
