# Dev Orchestrator

The Dev Orchestrator starts and supervises local microservice meshes, dynamically allocating conflict-free ports, provisioning ephemeral database containers, executing embedded migration scripts, and streaming multiplexed colored logs with file-watching auto-reload.

## Sub-features

- `dynamic-port-allocation`: Allocates ephemeral localhost TCP ports on demand.
  - Intent: Prevent port collision when running multiple services locally.
  - Behaviour: Binds ephemeral TCP sockets (`127.0.0.1:0`), reads the assigned port, and immediately closes the socket for assignment.
  - Outcome: Provides unique runtime ports injected into service process environments.
- `container-provisioning`: Auto-provisions isolated database containers based on proven stateful dependencies.
  - Intent: Eliminate manual Docker Compose setups and configuration drift.
  - Behaviour: Interacts with local Docker or Podman daemons to launch ephemeral PostgreSQL instances.
  - Outcome: Ensures operational stateful backends match lockfile specifications.
- `migration-runner`: Executes database schema migrations prior to service boot.
  - Intent: Ensure relational schemas match current codebase definitions.
  - Behaviour: Detects migration folders and invokes migration runners (Goose) against auto-provisioned databases.
  - Outcome: Executes pre-traffic migration jobs cleanly before booting dependent services.
- `multiplexed-supervisor`: Manages service processes and streams colored logs with change-detection reloading.
  - Intent: Provide a unified developer console experience across multiple concurrent services.
  - Behaviour: Spawns binaries, pipes stdout/stderr through ANSI color filters, and restarts services on file modification.
  - Outcome: Delivers unified developer console output with instant live reloads.

## How to get to it (user POV)

- CLI: `anode dev ./testdata/sample-shop`

## Verification Suites (Targeted Test Commands)

- **Unit Tests:** `go test -v ./internal/devengine/...`
- **Functional tests:** `.verify/output/anode dev ./testdata/sample-shop`
- **Allowlisted Verification:** `.verify/run.sh`
- **Preconditions:** Go compiler in PATH and target directory containing services and lockfile.

1. **local-dev-planning** (entries 1–1) — verifies dynamic port allocation and dev environment planning.
   - Request: `CMD anode dev ./testdata/sample-shop --dry-run`
   - Why: Proves environment variable synthesis, dependency wiring, and supervisor startup readiness.
   - Expected: Output displays allocated ports, stateful infrastructure status, and exits cleanly.
   - Impact: Confirms developer environment orchestrator prepares and wires services correctly.

## Gotchas

- If the Docker daemon is unreachable or unauthorized in restricted sandboxes, container provisioning logs a notice and falls back gracefully.
- Incremental builds must specify absolute output binary directories to prevent relative path nesting in sub-packages.

## Code

- `internal/devengine/ports.go`
- `internal/devengine/container.go`
- `internal/devengine/migrations.go`
- `internal/devengine/supervisor.go`
