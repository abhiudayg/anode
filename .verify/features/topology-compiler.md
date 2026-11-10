# Topology Compiler

The Topology Compiler analyzes plain Go AST/SSA structures across monorepos without requiring SDK imports, extracting microservice entrypoints, network ingress, stateful database and cache bindings, typed gRPC links, and external zero-trust egress rules into a deterministic lockfile (`anode.lock.json`).

## Sub-features

- `ssa-sink-extraction`: Identifies choke-point library calls for databases, caches, HTTP routers, and gRPC servers.
  - Intent: Extract infrastructure and network requirements directly from application source code.
  - Behaviour: Scans SSA call instructions against ecosystem sinks (`database/sql`, `pgxpool`, `redis.NewClient`, `net/http`, `net.Listen`).
  - Outcome: Produces raw resource declarations and service bindings in the internal architecture graph.
- `composite-taint-tracking`: Traces configuration variables backwards through closures, struct field hops, and format builders.
  - Intent: Recover dynamic environment variables and composite DSNs without executing code.
  - Behaviour: Recursively navigates SSA value graphs, evaluating string concatenations, parameter values, and closure free variables.
  - Outcome: Populates `expanded_env` slices enabling runtime dev injection.
- `grpc-contract-linking`: Matches client interface stubs against server registration functions across services.
  - Intent: Autonomously connect inter-service RPC topologies without explicit service mesh manifests.
  - Behaviour: Cross-references client stub invocations (`New<X>Client`) with server registrations (`Register<X>Server`).
  - Outcome: Assigns typed `service_ref` connections between consumer and provider services.
- `dead-code-pruning`: Mathematical pruning of unreachable functions and unreferenced infrastructure.
  - Intent: Prevent provisioning unused infrastructure and dead code paths.
  - Behaviour: Builds Variable Type Analysis (VTA) call graphs rooted at `main()` and prunes unvisited blocks.
  - Outcome: Excludes dead helpers and unreferenced drivers from the generated lockfile.

## How to get to it (user POV)

- CLI: `anode inspect ./testdata/sample-shop`
- CLI: `anode inspect ./testdata/hyper_mesh_12`

## Verification Suites (Targeted Test Commands)

- **Unit Tests:** `go test -v ./internal/analyzer/... ./internal/iag/...`
- **Functional tests:** `.verify/output/anode inspect ./testdata/sample-shop`
- **Allowlisted Verification:** `.verify/run.sh`
- **Preconditions:** Go 1.22+ toolchain installed and target workspace contains valid `go.mod`.

1. **baseline-shop-inspection** (entries 1–1) — verifies extraction of 2-service baseline ecommerce shop.
   - Request: `CMD anode inspect ./testdata/sample-shop`
   - Why: Proves basic HTTP routing, service-to-service HTTP linking, and Postgres migration extraction.
   - Expected: Output contains `orders` and `payments` services with `db-orders` Postgres resource and exit code `0`.
   - Impact: Confirms baseline lockfile generation functions without syntax errors.

2. **hypermesh-complex-inspection** (entries 2–2) — verifies 12-microservice mesh topology extraction under extreme indirection.
   - Request: `CMD anode inspect ./testdata/hyper_mesh_12`
   - Why: Proves nested struct configs, closure free variable tracing, typed gRPC contracts, and zero-trust egress rules.
   - Expected: Output locks 12 services, 7 stateful resources, gRPC link to `ledger`, and 2 external egress rules with exit code `0`.
   - Impact: Establishes enterprise-grade compiler correctness against complex microservice architectures.

## Gotchas

- Standard library package prefix isolation must be strictly maintained to prevent monorepo call-graph bleed.
- Closures capturing variables declared outside the route handler allocate heap pointers that must be dereferenced through `*ssa.Alloc`.
- Directories under `migrations/` must be checked for actual `.sql` files before assigning Goose migration specs.

## Code

- `internal/analyzer/loader.go`
- `internal/analyzer/sinks.go`
- `internal/analyzer/taint.go`
- `internal/iag/schema.go`
