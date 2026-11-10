# Production Deployer

The Production Deployer connects to remote bare-metal Linux servers or virtual machines via native SSH/SCP, provisions system users and directories, installs cgroups v2-hardened systemd service units, coordinates zero-downtime blue/green rollouts, and synthesizes TLS reverse-proxy configurations.

## Sub-features

- `native-ssh-transport`: Communicates directly with target hosts over encrypted SSH sessions.
  - Intent: Remove reliance on external deployment agents, orchestrator daemons, or Kubernetes runtimes.
  - Behaviour: Connects using standard SSH keys or ssh-agent, executing commands and streaming binary payloads over SCP.
  - Outcome: Secure, agentless control of target Linux servers.
- `systemd-unit-generation`: Synthesizes production-grade systemd units with resource limits.
  - Intent: Provide process supervision and system resource isolation via OS-native primitives.
  - Behaviour: Generates unit files configuring cgroups v2 CPU/Memory quotas, security sandboxing, and auto-restart policies.
  - Outcome: Produces `/etc/systemd/system/anode-<svc>.service` definitions.
- `blue-green-coordination`: Orchestrates zero-downtime service upgrades with healthcheck verification.
  - Intent: Prevent downtime and service disruption during application rollouts.
  - Behaviour: Deploys new binary versions alongside active versions, performs loopback health audits, and cuts over traffic.
  - Outcome: Seamless, zero-downtime deployment rollouts.
- `caddy-ingress-synthesis`: Automatically generates edge reverse-proxy configuration with automated TLS certificates.
  - Intent: Expose microservices securely to public networks.
  - Behaviour: Compiles service route tables into an edge Caddyfile with Let's Encrypt TLS and internal proxy targets.
  - Outcome: Generates valid edge Caddy configuration matching lockfile ingress rules.

## How to get to it (user POV)

- CLI: `anode deploy root@<target-host> ./testdata/hyper_mesh_12 --dry-run`

## Verification Suites (Targeted Test Commands)

- **Unit Tests:** `go test -v ./internal/deployer/...`
- **Functional tests:** `.verify/output/anode deploy root@192.168.1.100 ./testdata/hyper_mesh_12 --dry-run`
- **Allowlisted Verification:** `.verify/run.sh`
- **Preconditions:** Target lockfile exists and OpenSSH client available.

1. **deploy-dryrun-synthesis** (entries 1–1) — validates dry-run deployment synthesis for 12 microservices.
   - Request: `CMD anode deploy root@192.168.1.100 ./testdata/hyper_mesh_12 --dry-run`
   - Why: Proves generation of systemd units and edge TLS Caddyfile without initiating network connections.
   - Expected: Output logs 12 synthesized systemd units, Caddyfile generation, and exit code `0`.
   - Impact: Confirms deployment engine compiles valid production manifests for multi-service architectures.

## Gotchas

- Remote deployments requiring real SSH authentication must not be executed during unauthenticated automated test passes; use `--dry-run` for headless verification.
- Systemd service units require unique port allocations across blue and green deployment slots.

## Code

- `internal/deployer/ssh.go`
- `internal/deployer/bootstrap.go`
- `internal/deployer/systemd.go`
- `internal/deployer/caddy.go`
- `internal/deployer/coordinator.go`
