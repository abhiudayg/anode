# Examples & Architecture Benchmarks

This directory contains real-world, production Go microservice architectures used to benchmark, verify, and stress-test the limits of **Anode's** compiler extraction, runtime reconciliation, and deployment engine.

---

## 1. Benchmark Suites

| Suite | Services | Complexity Vectors | Primary Verification Goal | Anode Analysis |
| :--- | :---: | :--- | :--- | :---: |
| [**`sample-shop/`**](sample-shop/README.md) | 2 | Clean Go stdlib, HTTP routes, direct env vars. | Baseline regression suite & live VM deployment. | **100% Pass** |
| [**`complex_ecommerce/`**](complex_ecommerce/README.md) | 3 | Composite DSN formatting, external API egress (Stripe, SendGrid), multi-database migrations. | Composite env unpacking (`DB_HOST`, `DB_PORT`) & external egress classification. | **100% Pass** |
| [**`benchmark_app/`**](benchmark_app/README.md) | 2 | Dead-code pruning, differential Goose migration tracking. | Rapid Type Analysis (RTA) pruning & sub-150ms compiler throughput. | **100% Pass** |
| [**`hyper_mesh_12/`**](hyper_mesh_12/README.md) | **12** | Deep 3-hop struct pointers, closure heap captures, mixed gRPC + REST, shared vs isolated DBs, dead code traps. | Distributed mesh with high variable indirection. | **100% Pass** |
| [**`fintech_core_20/`**](fintech_core_20/README.md) | **20** | Multi-package modular Go architecture (`config` -> `repo` -> `handler`), double-entry ledger, Kafka order book matching, TimescaleDB, ScyllaDB, CoinGecko/Stripe/Persona egresses. | Enterprise banking, trading desk, and cross-package backward taint analysis. | **100% Pass** |
| [**`health_mesh_25/`**](health_mesh_25/README.md) | **25** | HIPAA-compliant healthcare & telehealth ecosystem, FHIR stubs, gRPC, e-prescriptions, ChangeHealthcare/Availity/OpenAI/Twilio egresses. | Healthcare telemetry, EHR document stores, and clinical scheduling. | **100% Pass** |
| [**`omni_mesh_32/`**](omni_mesh_32/README.md) | **32** | 14 distinct backing stores (`postgres`, `clickhouse`, `scylladb`, `mongodb`, `mariadb`, `timescaledb`, `cockroachdb`, `rabbitmq`, `kafka`, `minio`, `temporal`, `qdrant`, `valkey`, `memcached`), gRPC + REST, Goose migrations, external egresses. | **The Ultimate Hyper-Scale Stress Test:** Tests compiler scale, least-privilege driver extraction, and cross-service linking across 32 services. | **100% Pass** |

---

## 2. Blueprint: The 12-Microservice "Hyper-Mesh" (`hyper_mesh_12/`)

To rigorously test Anode's limits, the `hyper_mesh_12` suite models an end-to-end distributed banking and commerce platform containing 12 distinct Go microservices:

```
                                    ┌───────────────────────┐
                                    │    1. api-gateway     │ (Public Entrypoint, Chi / Gorilla)
                                    └───────────┬───────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌────────────────────┐         ┌────────────────────┐         ┌────────────────────┐
      │   2. auth-service  │         │   3. user-profile  │         │  4. catalog-query  │
      │ (Redis + JWT Keys) │         │ (Postgres schema)  │         │  (Postgres Read)   │
      └──────────┬─────────┘         └────────────────────┘         └──────────┬─────────┘
                 │                                                             │
                 ▼                                                             ▼
      ┌────────────────────┐                                        ┌────────────────────┐
      │  5. ledger-service │ <───────────────────────────────────── │  6. order-manager  │
      │   (Strict gRPC)    │                                        │ (Shared DB schema) │
      └──────────┬─────────┘                                        └──────────┬─────────┘
                 │                                                             │
                 ▼                                                             ▼
      ┌────────────────────┐                                        ┌────────────────────┐
      │ 7. payment-gateway │                                        │ 8. inventory-alloc │
      │ (External Stripe)  │                                        │  (Redis lock-mgr)  │
      └────────────────────┘                                        └──────────┬─────────┘
                                                                               │
                 ┌─────────────────────────────────────────────────────────────┘
                 ▼
      ┌────────────────────┐         ┌────────────────────┐         ┌────────────────────┐
      │  9. fulfillment    │ ------> │  10. notification  │ ------> │   11. audit-log    │
      │ (Postgres + Queue) │         │ (External SendGrid)│         │ (Append-only Click)│
      └────────────────────┘         └────────────────────┘         └────────────────────┘
                                                                               │
                                                                               ▼
                                                                    ┌────────────────────┐
                                                                    │ 12. analytics-agg  │
                                                                    │ (Dead code traps)  │
                                                                    └────────────────────┘
```

---

## 3. The 6 Hardening Traps Modeled in `hyper_mesh_12`

Each microservice is intentionally constructed with anti-patterns and complex layers of variables to test Anode's limits:

1. **Trap 1: Three-Layer Config Indirection (`internal/config/loader.go`)**
   - Config is not loaded in `main()`. It is loaded via nested structs across 3 packages (`app -> server -> config`), verifying that Anode's backward taint analysis resolves field stores through multiple pointer hops.
2. **Trap 2: Composite DSN & Dynamic String Construction**
   - `order-manager` constructs its connection string using `fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", user, pass, host, port, db)`. Tests whether Anode extracts all 5 individual environment variables into `expanded_env`.
3. **Trap 3: Shared vs. Isolated Database Cardinality**
   - `order-manager` and `inventory-alloc` share a single database cluster (`db-shared-commerce`), but use distinct migration directories. Verifies whether Anode correctly unifies or isolates them according to contract rules.
4. **Trap 4: Mixed Protocol Linking (Typed gRPC + REST Routes)**
   - `order-manager` invokes `ledger-service` via typed Protobuf stubs (`ledger.v1.LedgerServiceClient`), while invoking `payment-gateway` via HTTP `POST /v1/charges`. Verifies cross-protocol topology resolution.
5. **Trap 5: External Egress vs. Internal Routing**
   - `payment-gateway` calls `https://api.stripe.com/v1/refunds` and `notification` calls `https://api.sendgrid.com/v3/mail/send`. Verifies that Anode generates `is_external: true` firewall rules and doesn't confuse external APIs with internal microservices.
6. **Trap 6: Dead Code & Uncalled Driver Traps**
   - `analytics-agg` includes an unused, deprecated SQLite helper and an uncalled Mongo driver import. Verifies that Anode's Variable Type Analysis (VTA) mathematically prunes them from `anode.lock.json`.

---

## 4. Verification Workflow

To run verification against these test benchmarks:

```bash
# 1. Run static extraction and verify lockfile generation
anode inspect ./examples/sample-shop
anode inspect ./examples/complex_ecommerce

# 2. Verify dry-run production deployment synthesis
anode deploy root@127.0.0.1 ./examples/complex_ecommerce --dry-run

# 3. Execute agstack automated verification suite
agent-brain verify run
```
