# Anode Architecture & Technical Deep-Dive

## 1. Why Static Program Analysis for Infrastructure?

Traditional "Infrastructure-from-Code" (IfC) systems frequently fail because of two extremes:
1. **The SDK Trap (Encore, Winglang, Nitric):** They force developers to import non-standard proprietary SDKs or use custom programming languages. Once a team wants to use an unsupported library, they hit a dead end.
2. **The Syntax Regex Trap (Klotho, Tree-sitter regexes):** Parsing code purely with syntax trees fails on dynamic real-world Go patterns (e.g., config structs, pointer dereferences, multi-file helper packages).

`anode` solves this by using the **Go Compiler Frontend (`golang.org/x/tools/go/packages` + `go/ssa`)** combined with **Variable Type Analysis (VTA)**.

---

## 2. The Analysis Pipeline

### Step 1: Whole-Program SSA Construction
Using `go/ssa` and `ssautil.AllPackages`, `anode` constructs a Static Single Assignment (SSA) intermediate representation for the entire Go workspace. In SSA form, every variable is assigned exactly once, and data dependencies are explicit value references.

### Step 2: VTA Call Graph Rooted at `func main()`
Rather than using naive Class Hierarchy Analysis (CHA) which over-approximates and marks uncalled library types as reachable, `anode` executes **Variable Type Analysis (`vta.CallGraph`)**:
* Propagation is constrained to types flowing through actual assignments.
* Functions unreachable from `func main()` (e.g., test helpers, dead database connectors) are pruned before infrastructure generation.

### Step 3: Backward Taint Analysis & Struct Tracing
When a sink (e.g. `database/sql.Open` or `http.ListenAndServe`) is encountered, the argument is traced backward through:
1. Direct `os.Getenv("NAME")` calls.
2. Struct field memory stores (`ssa.Store` into `ssa.FieldAddr` allocated by constructor functions like `loadConfig()`).
3. Binary string concatenations (e.g. `":" + cfg.Port` or `cfg.PaymentURL + "/v1/charges"`).

### Step 4: Topological Linker
The linker resolves outbound network calls to inbound route handlers across services:
* Matches HTTP route definitions (e.g. `POST /v1/charges`) to callers.
* Binds typed gRPC interface stubs (`service.v1.ServiceServer`) between client packages and server packages.
* Generates zero-trust egress/ingress policies automatically.

---

## 3. The Intermediate Application Graph (IAG) Specification

The IAG contract lives in `internal/iag/schema.go`:

* **`resources`**: Stateful infrastructure primitives (`postgres`, `redis`) with lifecycle guarantees (`stateful_retain`) and migration runners.
* **`services`**: Independent deployable binaries with ingress protocols (`http`, `grpc`), dynamically assigned ports, and required bindings.
* **`bindings`**: Declarative links connecting services to either a stateful resource or another service, along with the injected environment variable name.
* **`secrets`**: Statically detected environment variables containing sensitive keys/tokens.
* **`provenance`**: High-precision source tracking (`filename:line`) for developer auditing.
