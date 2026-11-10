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
- **Enterprise Benchmark Suites (`examples/`)**:
  - **OmniMesh-32 (`examples/omni_mesh_32`)**: Hyper-scale stress-test benchmark modeling 32 distinct Go microservices across 14 infrastructure drivers (PostgreSQL, MariaDB, TimescaleDB, CockroachDB, ScyllaDB, ClickHouse, MongoDB, Redis, Valkey, Memcached, RabbitMQ, Kafka, MinIO, Temporal, Qdrant).
  - **HealthMesh-25 (`examples/health_mesh_25`)**: HIPAA-compliant hospital & telehealth system modeling 25 microservices with FHIR document stores, typed WebRTC gRPC stubs, e-prescriptions, and medical billing claims.
  - **Fintech Core 20 (`examples/fintech_core_20`)**: Modular neo-banking and trading engine with layered package separation (`config` -> `repo` -> `handler`), Kafka order books, TimescaleDB double-entry ledger, and ScyllaDB payments.
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
