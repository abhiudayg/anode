# Sample Shop Test Fixture

`sample-shop` is a 2-tier microservice architecture designed to validate Anode's core static analysis, service graph discovery, database binding inference, and cross-service HTTP egress resolution.

---

## 1. Architecture Overview

```
                      +-------------------+
                      |   Public Ingress  |
                      +---------+---------+
                                |
                                v
               [POST /v1/orders]|
                                v
                     +--------------------+
                     |   Orders Service   |
                     |  (Port: env PORT)  |
                     +----+----------+----+
                          |          |
         ORDERS_DB_URL    |          | HTTP POST /v1/charges
   (Postgres, auto_prov)  |          | (PAYMENT_SERVICE_URL)
                          v          v
                 +------------+   +--------------------+
                 | db-orders  |   |  Payments Service  |
                 | (Postgres) |   | (Port: env PORT)   |
                 +------------+   +---------+----------+
                                            |
                             PAYMENTS_DB_URL|
                                            v
                                   +------------------+
                                   |  db-payments-db  |
                                   |    (Postgres)    |
                                   +------------------+
```

### Microservices
1. **`orders`** (`orders/main.go`):
   - Exposes public HTTP endpoint: `POST /v1/orders`.
   - Reads environment configuration via `loadConfig()`:
     - `PORT` (default `8080`)
     - `ORDERS_DB_URL` (`sql.Open("postgres", cfg.DatabaseURL)`)
     - `PAYMENT_SERVICE_URL` (`http.NewRequestWithContext(..., cfg.PaymentService+"/v1/charges", ...)`)
     - `STRIPE_SECRET_KEY` (secret token)
   - Contains an uncalled dead function `uncalledDeadRedis()` reading `DEAD_REDIS_URL` to test SSA reachability pruning.

2. **`payments`** (`payments/main.go`):
   - Exposes internal HTTP endpoint: `POST /v1/charges`.
   - Reads environment configuration:
     - `PORT` (default `8081`)
     - `PAYMENTS_DB_URL` (`sql.Open("postgres", cfg.DatabaseURL)`)

---

## 2. Anode Analysis Results

### Tool Execution
```bash
anode inspect ./testdata/sample-shop
```

### Outcome: **SUCCESS (100% Precision)**
Anode analyzed the Go source code via Go SSA (Static Single Assignment) form and successfully produced `anode.lock.json` with zero manual configuration files.

#### Key Verifications:
1. **Dead Code Pruning**: `uncalledDeadRedis` was accurately identified as dead code and excluded from the topology. `DEAD_REDIS_URL` was never included in required environment variables or resources.
2. **Database Binding Detection**:
   - `db-orders`: Detected as Postgres from `sql.Open("postgres", ...)` in `orders/main.go:40`.
   - `db-payments-db`: Detected as Postgres from `sql.Open("postgres", ...)` in `payments/main.go:31`.
3. **Secret Isolation**: `STRIPE_SECRET_KEY` was accurately marked as a secret (never treated as plain config or injected with default dummy credentials).
4. **Ingress Route Mapping**: Extracted Go 1.22+ `http.NewServeMux` routing patterns (`POST /v1/orders`, `POST /v1/charges`).

---

## 3. Verified Topology Lockfile

```json
{
  "schema_version": "1.0",
  "resources": {
    "db-orders": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": false,
      "provenance": "orders/main.go:40"
    },
    "db-payments-db": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": false,
      "provenance": "payments/main.go:31"
    }
  },
  "services": {
    "orders": {
      "name": "orders",
      "entrypoint": "./orders",
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
          "resource_ref": "db-orders",
          "protocol": "postgres",
          "inject_env": "",
          "provenance": "orders/main.go:40"
        }
      ],
      "secrets": [
        {
          "env_var": "STRIPE_SECRET_KEY",
          "provenance": "orders/main.go:27"
        }
      ]
    },
    "payments": {
      "name": "payments",
      "entrypoint": "./payments",
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
          "resource_ref": "db-payments-db",
          "protocol": "postgres",
          "inject_env": "PAYMENTS_DB_URL",
          "expanded_env": [
            "PAYMENTS_DB_URL"
          ],
          "provenance": "payments/main.go:31"
        }
      ],
      "secrets": []
    }
  }
}
```
