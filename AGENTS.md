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
    ├── codeql/                 # CodeQL path filters (excludes third-party benchmarks)
    ├── ISSUE_TEMPLATE/         # Bug reports, topology failures, and feature requests
    └── pull_request_template.md # Mandatory PR submission checklist
```

---

## 3. Deep Technical Specification: CLI Binary Roadmap

To provide complete Docker parity without container daemons, the following 4 core binary commands are defined with explicit edge cases and failure modes:

### A. `anode ps` / `anode status <user@host>` (Process & Cgroup Monitoring)
* **Purpose**: Inspect running Go processes, cgroups v2 resource ceilings, systemd service states, and port listeners over SSH (or locally).
* **Use Cases**:
  1. Instant post-deploy verification of microservice topology.
  2. Memory pressure & leak diagnostics (monitoring Proportional Set Size / PSS vs RSS).
  3. Caddy edge routing verification (checking TLS certificates and proxy pass status).
* **Edge Cases & Failure Recovery**:
  - *Edge Case 1: Missing cgroups v2 (`/sys/fs/cgroup/memory.current` not readable)*:
    - *Fallback*: Read `/proc/[pid]/smaps_rollup` (PSS/RSS) or `/proc/[pid]/statm`. Warn if cgroups v1 is active.
  - *Edge Case 2: Multi-process services or worker forks*:
    - *Handling*: `systemctl show -p MainPID` only reports the root. Inspect `systemd-cgls` or `systemctl show -p TasksCurrent` to report total process/thread count and aggregate memory footprint.
  - *Edge Case 3: Flapping/Crashing services (`CrashLoopBackOff`)*:
    - *Handling*: Detect `SubState=auto-restart` or `ActiveState=failed`. Extract exit code, restart count (`NRestarts`), and time since last restart instead of printing a blank uptime.
  - *Edge Case 4: Non-root SSH user*:
    - *Handling*: Check both system systemd (`/etc/systemd/system`) and user units (`systemctl --user`).

### B. `anode logs <user@host> [SERVICE] [FLAGS]` (Journald Streaming Tail)
* **Purpose**: Stream live systemd journal logs to the developer's local terminal with Docker CLI parity (`docker logs -f`).
* **Use Cases**:
  1. Live debugging: Tail production service stdout/stderr (`anode logs root@vps api -f`).
  2. Crash post-mortem: Inspect previous invocation crash logs (`--previous` or `--since="1h"`).
  3. Topology multi-tail: Tail all services simultaneously with color-coded prefix tags (`[orders]`, `[payments]`).
* **Edge Cases & Failure Recovery**:
  - *Edge Case 1: Journald binary rate-limiting*:
    - *Handling*: If systemd rate-limiting suppresses lines (`Suppressed N messages`), parse and notify the user with instructions to adjust `RateLimitBurst`.
  - *Edge Case 2: Clean SSH disconnect on SIGINT*:
    - *Handling*: When the developer presses `Ctrl+C` locally, transmit a remote `SIGTERM` to the spawned `journalctl` process over SSH to prevent orphaned tail processes on the server.
  - *Edge Case 3: Log rotation & disk bounds*:
    - *Handling*: If journald rotated or truncated logs, report `No entries found` cleanly without error exit.

### C. `anode rollback <user@host> [PATH]` (Sub-Second Zero-Downtime Rollback)
* **Purpose**: Revert production release to the immediately preceding version in `<50ms` with zero recompilation.
* **Use Cases**:
  1. Immediate rollback on production HTTP 500 error spikes or boot panics.
  2. Automated canary rollback if post-deployment smoke tests fail.
* **Edge Cases & Failure Recovery**:
  - *Edge Case 1: Breaking database migrations*:
    - *Handling*: Inspect `anode.lock.json` migration records. If release B ran a non-backward-compatible migration, warn the developer before proceeding (`Down migration or schema compatibility required`).
  - *Edge Case 2: Single-release VPS (no prior release)*:
    - *Handling*: If `/var/lib/anode/releases/` contains only 1 release, abort with exit code 1: `No previous release found`.
  - *Edge Case 3: Dynamic port misalignment in Caddy*:
    - *Handling*: Rolling back binaries without updating Caddy will proxy traffic to dead ports. The rollback coordinator must atomically flip BOTH the `/var/lib/anode/releases/latest` symlink AND the `/etc/caddy/Caddyfile` associated with that release, then execute `systemctl reload caddy`.

### D. `anode doctor [PATH]` (Pre-Flight & Topology Sanity Linter)
* **Purpose**: Pre-flight verification of developer toolchain, Go compiler, local container engines, and SSH remote connectivity.
* **Use Cases**:
  1. CI pre-flight gate before running `anode deploy`.
  2. Onboarding diagnostic for new engineers or fresh Go repositories.
* **Edge Cases & Failure Recovery**:
  - *Edge Case 1: GOTOOLCHAIN and Go version mismatches*:
    - *Handling*: Verify local Go compiler against `go.mod` requirement (`go >= 1.27.3`). Check `CGO_ENABLED=0` capability.
  - *Edge Case 2: Remote VPS unreachable or firewalled*:
    - *Handling*: Timeout after 3s instead of hanging. Differentiate between DNS failure, port 22 closed, and rejected public key.
  - *Edge Case 3: Missing local Docker/Podman for `anode dev`*:
    - *Handling*: Warn that `anode dev` can run in mock/headless mode, but ephemeral DBs will require manual connection strings.

---

## 4. GitHub Linguist & Language Breakdown Enforcment

GitHub determines the repository language breakdown using the open-source **Linguist** library.
To ensure that Anode is accurately indexed as **Go (95%+)** rather than TypeScript:

1. Root `.gitattributes` MUST maintain:
   - `web/** linguist-documentation` and `web/** linguist-detectable=false` (Next.js docs and tools are documentation).
   - `examples/** linguist-vendored` and `examples/** linguist-detectable=false` (test benchmarks).
   - `*.lock.json linguist-generated=true` (generated contracts).
   - `cmd/**`, `internal/**`, `pkg/**` marked `linguist-detectable=true`.
2. Never commit compiled JS/TS bundles (`dist/`, `build/`, `out/`, `.next/`) to git.

---

## 5. Standard Agent Workflow & Patterns

When assigned an issue, enhancement, or bugfix in this repository, follow this execution sequence:

### Step 1: Context & Invariant Verification
1. Read the relevant files in `cmd/` or `internal/`.
2. Ensure any new CLI flags or commands align with Docker parity (e.g., `anode ps`, `anode logs`, `anode rollback`, `anode doctor`).
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
