# AGENTS.md — Developer & AI Agent Architecture Guide

Welcome to **Anode** (`github.com/abhiudayg/anode`). This document provides autonomous agents, AI coding assistants, and human contributors with an authoritative mental model, architectural navigation map, coding patterns, and verification procedures for this codebase.

---

## 1. Core Philosophy & Invariant Rules

Anode is a **Proof-of-Topology bare-metal orchestrator for unmodified Go backends**. It eliminates Docker, Kubernetes, and manual YAML orchestration by treating raw Go source code as the single source of infrastructure truth.

### The 4 Non-Negotiable Invariants

1. **Zero-SDK Import Rule**:
   - User Go backends **NEVER** import an `anode` package or SDK.
   - All infrastructure deduction (database drivers, listening ports, secret keys, migration paths) MUST happen via static analysis (Go SSA + Variable Type Analysis) of standard library calls (`database/sql`, `net/http`, `os.Getenv`) and popular routers (`chi`, `gin`, `fiber`, `echo`).
   - If a proposed feature requires modifying the user's Go imports, **it is rejected**.

2. **Deterministic Topology Contract (`anode.lock.json`)**:
   - Every topology pass must produce a deterministic, reproducible `anode.lock.json`.
   - The contract hash is computed as `SHA-256(canonical_json)`. If identical Go source is evaluated twice, the hash must be bit-for-bit identical.

3. **Zero Port Collisions via Dynamic Loopbacks (`127.0.0.0/8`)**:
   - In local dev (`anode dev`), services and ephemeral containers MUST NOT bind to static host ports (like `:5432` or `:8080`).
   - All ephemeral resources bind to kernel-assigned loopback addresses within the `127.0.0.0/8` subnet (e.g., `127.0.0.1:54329`) with dynamic reverse proxying.

4. **Least-Privilege Linux Sandboxing**:
   - Production systemd units MUST declare `DynamicUser=yes`, `ProtectSystem=strict`, `NoNewPrivileges=true`, and kernel cgroups v2 resource ceilings (`MemoryMax`, `CPUQuota`).
   - Anode never executes user applications as root.

---

## 2. Codebase Navigation Map

```
anode/
├── cmd/anode/
│   └── main.go                 # CLI entrypoint (inspect, dev, deploy, catalog, cluster, status)
├── internal/
│   ├── analyzer/               # Go SSA & Variable Type Analysis (VTA) compiler core
│   │   ├── loader.go           # golang.org/x/tools/go/packages loader & AST traversal
│   │   ├── sinks.go            # Detection of sql.Open, redis, mongo, and HTTP routers
│   │   └── taint.go            # Backward taint analysis for os.Getenv & credentials
│   ├── catalog/                # Pluggable stateful database drivers & migration specs
│   │   ├── defaults.yaml       # Built-in driver templates (postgres, redis, mysql, etc.)
│   │   └── registry.go         # Driver resolution and project-level catalog overrides
│   ├── deployer/               # Bare-metal Linux production orchestrator
│   │   ├── bootstrap.go        # Remote VPS prerequisite provisioning & user creation
│   │   ├── coordinator.go      # Zero-downtime blue/green deployment & symlink switching
│   │   ├── ssh.go              # Hardened SSH client with known_hosts verification
│   │   └── systemd.go          # Linux systemd unit & Caddy reverse-proxy synthesis
│   ├── devengine/              # Local zero-collision orchestrator
│   │   ├── container.go        # Ephemeral Docker/Podman backing store provisioner
│   │   ├── engine.go           # Dynamic port allocation & environment decomposer
│   │   ├── migrator.go         # Automated pre-traffic Goose/Golang-Migrate execution
│   │   ├── supervisor.go       # Process pool manager with graceful SIGINT/SIGTERM
│   │   └── watcher.go          # Sub-second Go source file hot-reloader
│   ├── cluster/                # Multi-host placement pools & zero-trust bin-packing
│   └── iag/                    # Infrastructure-as-Graph data models & lockfile schema
├── web/                        # Next.js 16 (App Router) + Tailwind CSS documentation & tools
│   ├── src/app/                # Routes (docs, blog, tools/ssa-visualizer, vs/docker-compose)
│   ├── src/components/         # Interactive UI widgets (Cmd+K palette, savings calculator)
│   └── src/data/blogPosts.ts   # Engineering essays & deep-dive technical benchmarks
├── examples/                   # Stress-test benchmarks (12, 20, 25, 32 microservices)
└── .github/
    ├── workflows/              # CI test suite, CodeQL analysis, release workflows
    └── codeql/                 # CodeQL path filters (excludes third-party benchmarks)
```

---

## 3. Standard Agent Workflow & Patterns

When assigned an issue, enhancement, or bugfix in this repository, follow this execution sequence:

### Step 1: Context & Invariant Verification
1. Read the relevant files in `cmd/` or `internal/`.
2. Ensure any new CLI flags or commands align with Docker parity (e.g., `anode ps`, `anode logs`, `anode rollback`).
3. Verify that changes do NOT break the 4 Proof-of-Topology pillars.

### Step 2: Implementation & Tests
1. **Go Code**:
   - Write idiomatic Go (Go 1.27+). Always handle errors explicitly.
   - When modifying analyzers or deployers, add unit tests in the same directory (`*_test.go`).
   - Run tests locally:
     ```bash
     go test -v ./...
     ```
2. **Web / UI Code**:
   - If adding a developer tool or updating documentation, use React client components with strict TypeScript types (`no-explicit-any`).
   - Escape HTML entities in JSX (`&apos;`, `&quot;`).
   - Verify linting and production build:
     ```bash
     cd web && bun run lint && bun run build
     ```

### Step 3: Security & Code Scanning Compliance
1. CodeQL runs automatically on PRs. Ensure no direct calls to insecure primitives (e.g. `ssh.InsecureIgnoreHostKey` without fallback).
2. Third-party benchmark targets in `examples/` are excluded via `.github/codeql/codeql-config.yml`. Never add vendored third-party code to `internal/` or `cmd/`.

### Step 4: Documentation & Feature Map Updates
1. When a new binary command or CLI flag is added, update:
   - `cmd/anode/main.go` help text (`printUsage()`, `printCommandUsage()`).
   - `web/src/app/docs/page.tsx` CLI reference chapter.
   - `README.md` command overview table.

### Step 5: Commits & Pull Requests
1. Use **Conventional Commits**:
   - `feat(analyzer): add support for Fiber v3 route grouping`
   - `fix(deployer): prevent race condition during systemd reload`
   - `docs(benchmarks): publish 32-service cold-boot latency analysis`
2. Sign all commits with GPG (`git commit -S`).
3. Fill out the full `.github/pull_request_template.md` checklist when opening PRs.
