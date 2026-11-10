# Cluster Scheduler

The Cluster Scheduler manages multi-host node pools, scheduling microservices onto physical or virtual machines using resource-aware bin-packing and generating zero-trust nftables firewall rules that enforce strict network isolation across the cluster.

## Sub-features

- `resource-bin-packing`: Optimally schedules services across available cluster nodes based on capacity constraints.
  - Intent: Maximize server utilization and prevent host overloading.
  - Behaviour: Applies greedy first-fit decreasing algorithms matching service CPU/memory demands against node resources.
  - Outcome: Produces an optimal node placement map for cluster deployments.
- `zero-trust-firewall`: Compiles inter-service communication graphs into low-level Linux nftables rules.
  - Intent: Enforce zero-trust security policies without overlay network performance overhead.
  - Behaviour: Reads service-to-service and egress lockfile bindings and generates ingress/egress firewall allow rules.
  - Outcome: Produces `/etc/nftables.conf` scripts dropping all unverified cross-service packets.

## How to get to it (user POV)

- CLI: `anode cluster ./testdata/hyper_mesh_12`

## Verification Suites (Targeted Test Commands)

- **Unit Tests:** `go test -v ./internal/cluster/...`
- **Functional tests:** `.verify/output/anode cluster ./testdata/hyper_mesh_12`
- **Allowlisted Verification:** `.verify/run.sh`
- **Preconditions:** Valid architecture lockfile in target directory.

1. **multi-host-scheduling** (entries 1–1) — verifies bin-packing and firewall synthesis for cluster nodes.
   - Request: `CMD anode cluster ./testdata/hyper_mesh_12`
   - Why: Proves automated multi-node placement and zero-trust firewall generation.
   - Expected: Output registers cluster nodes, applies placement, and generates firewall rules with exit code `0`.
   - Impact: Confirms cluster scheduler computes valid multi-host topologies.

## Gotchas

- Network nftables policies drop all unmatched traffic by default; all necessary inter-service edges must be captured in the lockfile.
- Bin-packing returns errors if the cumulative demand of services exceeds the capacity of the registered host pool.

## Code

- `internal/cluster/binpack.go`
- `internal/cluster/nftables.go`
