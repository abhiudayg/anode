# Benchmark App Test Fixture

`benchmark_app` provides a standardized microservice benchmark designed to quantify Anode's compiler performance, dead-code reachability pruning, and differential stateful migration tracking.

---

## 1. Architecture Overview

```
                      +-------------------+
                      |   Public Ingress  |
                      +---------+---------+
                                |
               [POST /v1/orders]|
                                v
                     +--------------------+
                     |    Order Service   |
                     |  (Port: env PORT)  |
                     +----+----------+----+
                          |          |
             ORDER_DB_URL |          | HTTP POST /v1/charges
   (Postgres, auto_prov)  |          | (PAYMENT_SERVICE_URL)
   (Goose: migrations/)   |          v
                          v   +--------------------+
                 +------------+   |  Payment Service   |
                 |  db-order  |   | (Port: env PORT)   |
                 | (Postgres) |   +---------+----------+
                 +------------+             |
                             PAYMENT_DB_URL |
                         (External unmanaged)
                                            v
                                   +------------------+
                                   |  db-payment-db   |
                                   |    (Postgres)    |
                                   +------------------+
```

### Microservices
1. **`order`** (`services/order/main.go`):
   - Ingress: `POST /v1/orders`
   - Database: `db-order` (Postgres, auto-provisioned via Goose migrations in `migrations/order`).
   - Dead Code Verification: Contains `deadHelperThatShouldBePruned()` which calls `sql.Open("postgres", os.Getenv("UNUSED_DEAD_DB_URL"))`. Must be completely pruned by Rapid Type Analysis (RTA) / call-graph reachability.
   - Secret Extraction: Isolated `STRIPE_SECRET_KEY`.
2. **`payment`** (`services/payment/main.go`):
   - Ingress: `POST /v1/charges`
   - Database: `db-payment-db` (Postgres, unmanaged external database with no local migrations directory).

---

## 2. Anode Analysis Results

### Tool Execution
```bash
anode inspect ./testdata/benchmark_app
```

### Outcome: **SUCCESS (100% Precision)**

#### Key Verifications:
1. **Dead Code Elimination**:
   - `UNUSED_DEAD_DB_URL` and `deadHelperThatShouldBePruned` were completely omitted from `anode.lock.json`. Zero false-positive resources were synthesized.
2. **Managed vs Unmanaged Distinction**:
   - `db-order`: Identified as `auto_provision: true` because pre-traffic Goose migrations were discovered at `migrations/order`.
   - `db-payment-db`: Identified as `auto_provision: false` (external unmanaged) because no SQL migrations directory existed for it.
3. **High Compiler Throughput**:
   - Compiles Go SSA and outputs the verified lockfile in **< 150ms**.

---

## 3. Verified Topology Lockfile

```json
{
  "schema_version": "1.0",
  "resources": {
    "db-order": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/order/main.go:40",
      "migrations": {
        "tool": "goose",
        "path": "migrations/order",
        "execution": "pre_traffic_job"
      }
    },
    "db-payment-db": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": false,
      "provenance": "services/payment/main.go:31"
    }
  },
  "services": {
    "order": {
      "name": "order",
      "entrypoint": "./services/order",
      "ingress": [
        {
          "protocol": "http",
          "port_env": "PORT",
          "routes": [
            "POST /v1/orders"
          ]
        }
      ],
      "bindings": [
        {
          "resource_ref": "db-order",
          "protocol": "postgres",
          "inject_env": "",
          "provenance": "services/order/main.go:40"
        }
      ],
      "secrets": [
        {
          "env_var": "STRIPE_SECRET_KEY",
          "provenance": "services/order/main.go:27"
        }
      ]
    },
    "payment": {
      "name": "payment",
      "entrypoint": "./services/payment",
      "ingress": [
        {
          "protocol": "http",
          "port_env": "PORT",
          "routes": [
            "POST /v1/charges"
          ]
        }
      ],
      "bindings": [
        {
          "resource_ref": "db-payment-db",
          "protocol": "postgres",
          "inject_env": "PAYMENT_DB_URL",
          "expanded_env": [
            "PAYMENT_DB_URL"
          ],
          "provenance": "services/payment/main.go:31"
        }
      ],
      "secrets": []
    }
  }
}
```
