# Anode Architecture & Technical Deep-Dive

This document provides a comprehensive technical breakdown of Anode's internals, compiler pipeline, data structures, and runtime orchestration engine.

---

## Table of Contents

1. [The 4-Pillar Proof-of-Topology Architecture](#1-the-4-pillar-proof-of-topology-architecture)
2. [Compiler & SSA Analysis Pipeline](#2-compiler--ssa-analysis-pipeline)
   - [Phase 1: Whole-Program SSA Construction](#phase-1-whole-program-ssa-construction)
   - [Phase 2: Variable Type Analysis (VTA) Call Graph](#phase-2-variable-type-analysis-vta-call-graph)
   - [Phase 3: Standard Library Choke Points](#phase-3-standard-library-choke-points)
   - [Phase 4: Recursive Composite Backward Taint Tracking](#phase-4-recursive-composite-backward-taint-tracking)
   - [Phase 5: Cross-Service Contract Linker](#phase-5-cross-service-contract-linker)
3. [The `anode.lock.json` Specification](#3-the-anodelockjson-specification)
4. [Runtime Orchestration Architecture](#4-runtime-orchestration-architecture)
   - [Local Engine (`anode dev`)](#local-engine-anode-dev)
   - [Production VPS Deployer (`anode deploy`)](#production-vps-deployer-anode-deploy)
   - [Multi-Node Bin-Packing & Zero-Trust Firewall (`anode cluster`)](#multi-node-bin-packing--zero-trust-firewall-anode-cluster)
5. [Stateful Lifecycle & Soft-Orphan Protection](#5-stateful-lifecycle--soft-orphan-protection)

---

## 1. The 4-Pillar Proof-of-Topology Architecture

Previous attempts at "Infrastructure-from-Code" failed because they attempted to solve the Halting Problem on arbitrary syntax or forced proprietary SDKs upon developers. Anode avoids this trap by enforcing 4 foundational pillars:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Pillar 1: Migration-Driven Database Provenance                         │
│ • Sinks (sql.Open, pgxpool.New) do NOT automatically create databases. │
│ • A database is marked `auto_provision: true` ONLY when verified       │
│   migration assets (migrations/<service>/*.sql or Goose) exist.        │
│ • If no migrations exist, it is classified as an external unmanaged    │
│   dependency. Zero heuristic guessing.                                │
├────────────────────────────────────────────────────────────────────────┤
│ Pillar 2: Typed Interface Linking (gRPC & HTTP Route Tables)           │
│ • Protobuf client constructors (New<X>Client) match server             │
│   registrations (Register<X>Server) 1:1 using interface descriptors.   │
│ • HTTP client calls match router route patterns (POST /v1/orders).     │
├────────────────────────────────────────────────────────────────────────┤
│ Pillar 3: Commit-Backed `anode.lock.json`                              │
│ • `anode inspect` compiles source code and writes an immutable lockfile│
│ • `anode dev` and `anode deploy` execute strictly against this lockfile│
│ • Engineers review infrastructure diffs directly in pull requests.     │
├────────────────────────────────────────────────────────────────────────┤
│ Pillar 4: Actionable Build-Time Diagnostics                            │
│ • Ambiguous connection strings or unmatched service calls do NOT fail  │
│   silently at runtime.                                                 │
│ • Anode emits build-time diagnostics with exact file:line provenance.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Compiler & SSA Analysis Pipeline

The static extraction pipeline lives in `internal/analyzer/` and consists of 5 deterministic passes:

```
[Go Source Code] 
       │
       ▼ (Pass 1: go/packages + go/ssa)
[SSA Intermediate Representation]
       │
       ▼ (Pass 2: vta.CallGraph rooted at main())
[Reachable Call Graph (Dead Code Pruned)]
       │
       ▼ (Pass 3: SinkInspector on Stdlib Choke Points)
[Choke Point Detection: net.Listen, sql.Open, pgxpool, redis]
       │
       ▼ (Pass 4: Recursive Backward Taint Tracer)
[Resolved Configs & Composite Envs (DB_HOST, DB_PORT)]
       │
       ▼ (Pass 5: Topological Linker)
[Final anode.lock.json]
```

### Phase 1: Whole-Program SSA Construction
Using `golang.org/x/tools/go/packages` and `go/ssa/ssautil`, Anode loads all workspace packages under the mode flags `ssa.SanityCheckFunctions | ssa.InstantiateGenerics`. 

In SSA form, complex expressions, nested function calls, and control-flow branches are broken down into explicit static instructions (`ssa.Call`, `ssa.Alloc`, `ssa.FieldAddr`, `ssa.Store`, `ssa.BinOp`).

### Phase 2: Variable Type Analysis (VTA) Call Graph
Traditional Class Hierarchy Analysis (CHA) is unsound for dead code pruning because it assumes any struct implementing an interface could be called at any call site. This causes third-party database drivers (like SQLite test helpers) to be incorrectly pulled into the topology.

Anode uses **Variable Type Analysis (`golang.org/x/tools/go/callgraph/vta`)**:
* Computes type propagation strictly through assignments.
* Roots the reachability traversal strictly at `func main()`.
* Any function or helper unreachable from `main()` is mathematically excluded before infrastructure is emitted.

### Phase 3: Standard Library Choke Points
Instead of maintaining a database of 500 third-party libraries, Anode checks **Standard Library & Foundation Choke Points**:
* **Network Ingress:** Calls to `net/http.ListenAndServe` or `net.Listen`.
* **Database Drivers:** Calls to `database/sql.Open` or `github.com/jackc/pgx/v5/pgxpool.New`.
* **Caches:** Calls to `github.com/redis/go-redis/v9.NewClient`.
* **Typed RPCs:** Calls to `Register<X>Server` and `New<X>Client`.

### Phase 4: Recursive Composite Backward Taint Tracking
Real-world microservices rarely pass a clean `os.Getenv("DATABASE_URL")` literal. They build connection strings using `fmt.Sprintf` or configuration structs.

In `internal/analyzer/taint.go`, `TraceCompositeEnvVars()` recursively traverses:
1. Direct calls to `os.Getenv` and `os.LookupEnv`.
2. Struct field memory stores (`ssa.Store` into `ssa.FieldAddr` allocated by constructor functions like `loadConfig()`).
3. Binary string concatenations (`+`).
4. Varargs argument slices passed into `fmt.Sprintf` or `strings.Join`.

If an application requests `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, the taint engine extracts all 4 variables and records them under `expanded_env`.

### Phase 5: Cross-Service Contract Linker
In `internal/analyzer/loader.go`, the linker resolves outbound network calls:
* **gRPC Stubs:** Normalizes `RegisterPaymentServiceServer` and `NewPaymentServiceClient` to `payment.PaymentService`. If Service A invokes `NewPaymentServiceClient` and Service B registers `RegisterPaymentServiceServer`, Anode establishes an internal binding: `Service A -> Service B`.
* **HTTP Routes:** Matches outbound URL paths (e.g. `cfg.PaymentURL + "/v1/charges"`) against all service route tables (`POST /v1/charges`).
* **External APIs:** Classifies calls to external domains (`https://api.stripe.com`) as `EgressRule` entries rather than confusing them with internal services.

---

## 3. The `anode.lock.json` Specification

The lockfile lives in `internal/iag/schema.go`:

```json
{
  "schema_version": "1.0",
  "commit_sha": "b48bf5c",
  "resources": {
    "db-orders": {
      "kind": "postgres",
      "engine_version": "16",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/orders/main.go:40",
      "migrations": {
        "tool": "goose",
        "path": "migrations/orders",
        "execution": "pre_traffic_job"
      }
    }
  },
  "services": {
    "orders": {
      "name": "orders",
      "entrypoint": "./services/orders",
      "ingress": [
        {
          "protocol": "http",
          "port_env": "PORT",
          "routes": ["POST /v1/orders"]
        }
      ],
      "bindings": [
        {
          "resource_ref": "db-orders",
          "protocol": "postgres",
          "inject_env": "DATABASE_URL",
          "expanded_env": ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"],
          "provenance": "services/orders/main.go:40"
        },
        {
          "service_ref": "payments",
          "protocol": "grpc",
          "interface": "payment.PaymentService",
          "inject_env": "PAYMENTS_ADDR",
          "provenance": "services/orders/main.go:52"
        }
      ],
      "secrets": [
        {
          "env_var": "STRIPE_SECRET_KEY",
          "provenance": "services/orders/main.go:27"
        }
      ]
    }
  },
  "egress_rules": [
    {
      "source_service": "orders",
      "target_host": "https://api.stripe.com/v1/charges",
      "port": 443,
      "protocol": "https",
      "is_external": true
    }
  ],
  "diagnostics": []
}
```

---

## 4. Runtime Orchestration Architecture

### Local Engine (`anode dev`)
Implemented in `internal/devengine/engine.go`:
* **Zero Port Collisions:** Calls `net.ListenTCP("tcp", "127.0.0.1:0")` to allocate guaranteed free ephemeral loopback ports for each service.
* **Dual Credential Injection:** Injects both unified DSNs (`DATABASE_URL=postgres://...`) and decomposed components (`DB_HOST=127.0.0.1`, `DB_PORT=5432`) based on the service's `expanded_env` requirements.
* **Service Interconnection:** Injects the dynamically assigned loopback URL of Service B directly into Service A's binding environment variable.

### Production VPS Deployer (`anode deploy`)
Implemented in `internal/deployer/systemd.go`:
* **Static Binary Compilation:** Runs `CGO_ENABLED=0 GOOS=linux go build` to create self-contained Linux executables.
* **Hardened Systemd Units:** Generates `/etc/systemd/system/anode-<svc>.service` with:
  - `Restart=always` and `RestartSec=3`
  - Linux **cgroups v2** quotas: `CPUQuota=200%`, `MemoryMax=1G`
  - Dedicated unprivileged system user (`anode`)
* **Edge Proxy Synthesis:** Synthesizes a Caddy reverse proxy configuration mapping external domain routes directly to internal service loopback ports with automatic Let's Encrypt TLS.
* **Zero-Downtime Swaps:** Boots version 2 on an alternate loopback port, verifies health, flips the Caddy proxy route, and gracefully stops version 1.

### Multi-Node Bin-Packing & Zero-Trust Firewall (`anode cluster`)
Implemented in `internal/cluster/pool.go`:
* **Greedy Least-Loaded Bin-Packer:** Assigns services across registered cluster nodes according to allocated load and memory limits.
* **Compiler-Generated `nftables` Rules:** Emits Linux kernel firewall tables with a default drop policy:
  - Permits loopback (`lo`) and DNS (`udp dport 53`).
  - Permits outbound external HTTPS (`tcp dport 443`) for declared `EgressRule` entries.
  - Drops all undeclared east-west lateral container traffic.

---

## 5. Stateful Lifecycle & Soft-Orphan Protection

One of the fatal flaws of traditional declarative infrastructure is that deleting a resource from code causes the orchestrator to issue a `DROP DATABASE` or delete persistent volumes.

Anode strictly enforces **Soft-Orphan Protection**:
* Stateful resources (`postgres`, `redis`, persistent storage) are tagged with `lifecycle: stateful_retain`.
* If a service removes a database connection in a feature branch, Anode marks the resource as `lifecycle: orphaned`.
* The service's network binding is severed, but **the underlying database volume is never deleted**.
* Data can only be permanently destroyed through an explicit, manual CLI invocation: `anode prune --confirm`.
