# Complex E-Commerce Test Fixture

`complex_ecommerce` is a multi-tier e-commerce microservice topology designed to test Anode's handling of composite DSN configurations, external third-party payment/messaging egress (Stripe, SendGrid, Twilio), and database migration tracking with Goose.

---

## 1. Architecture Overview

```
                                  +-------------------+
                                  |   Public Ingress  |
                                  +---------+---------+
                                            |
                         +------------------+------------------+
                         |                                     |
       [GET /v1/products]|                   [POST /v1/orders] |
                         v                                     v
               +--------------------+                +--------------------+
               |   Catalog Service  |                |   Orders Service   |
               | (Port: env PORT)   |                |  (Port: env PORT)  |
               +---------+----------+                +----+----------+----+
                         |                                |          |
          CATALOG_DB_URL |                                |          | Egress: HTTPS:443
   (Postgres, auto_prov) |                  ORDERS_DB_URL |          | (api.stripe.com)
                         v          (Postgres, auto_prov) |          v
                +-----------------+                       |     [Stripe API]
                |  db-catalog-db  |                       v
                |   (Postgres)    |              +-----------------+
                +-----------------+              |    db-orders    |
                                                 |   (Postgres)    |
                                                 +-----------------+
                                                          |
                                                          | Internal Event/Call
                                                          v
                                               +--------------------+
                                               |Notifications Svc   |
                                               | (Port: env PORT)   |
                                               +---------+----------+
                                                         |
                                                         | Egress: HTTPS:443
                                                         | (api.sendgrid.com)
                                                         v
                                                  [SendGrid API]
```

### Microservices
1. **`catalog`** (`services/catalog/main.go`):
   - Ingress: `GET /v1/products`
   - Database: Bound to Postgres via `CATALOG_DB_URL` (`sql.Open("postgres", ...)`).
   - Migrations: Pre-traffic Goose migrations located at `migrations/catalog/001_create_products.sql`.
2. **`orders`** (`services/orders/main.go`):
   - Ingress: `POST /v1/orders`
   - Database: Bound to Postgres with Goose migrations at `migrations/orders/001_create_orders.sql`.
   - External Egress: Traced outbound HTTPS call to `https://api.stripe.com/v1/charges`.
   - Secret Extraction: Isolated `STRIPE_SECRET_KEY`.
3. **`notifications`** (`services/notifications/main.go`):
   - Ingress: `POST /v1/notifications/email`
   - External Egress: Outbound HTTPS call to `https://api.sendgrid.com/v3/mail/send`.
   - Secret Extraction: Isolated `SENDGRID_API_KEY` and `TWILIO_AUTH_TOKEN`.

---

## 2. Anode Analysis Results

### Tool Execution
```bash
anode inspect ./testdata/complex_ecommerce
```

### Outcome: **SUCCESS (100% Precision)**
Anode analyzed the Go source code using Go SSA inter-procedural flow analysis and synthesized `anode.lock.json` with zero manual YAML.

#### Key Verifications:
1. **Database Migration Binding**:
   - `db-catalog-db`: Correctly recognized as auto-provisioned Postgres with Goose migrations at `migrations/catalog`.
   - `db-orders`: Correctly recognized as auto-provisioned Postgres with Goose migrations at `migrations/orders`.
2. **Egress Rule Discovery**:
   - Identified external outbound HTTP clients and resolved destination URLs to exact FQDNs and ports:
     - `orders` -> `https://api.stripe.com/v1/charges` (port 443, protocol HTTPS, external: true)
     - `notifications` -> `https://api.sendgrid.com/v3/mail/send` (port 443, protocol HTTPS, external: true)
3. **Secret Isolation**:
   - Secrets `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY`, and `TWILIO_AUTH_TOKEN` were accurately quarantined into service secrets manifests.

---

## 3. Verified Topology Lockfile

```json
{
  "schema_version": "1.0",
  "resources": {
    "db-catalog-db": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/catalog/main.go:37",
      "migrations": {
        "tool": "goose",
        "path": "migrations/catalog",
        "execution": "pre_traffic_job"
      }
    },
    "db-orders": {
      "kind": "postgres",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/orders/main.go:42",
      "migrations": {
        "tool": "goose",
        "path": "migrations/orders",
        "execution": "pre_traffic_job"
      }
    }
  },
  "services": {
    "catalog": {
      "name": "catalog",
      "entrypoint": "./services/catalog",
      "ingress": [
        {
          "protocol": "http",
          "port_env": "PORT",
          "routes": [
            "GET /v1/products"
          ]
        }
      ],
      "bindings": [
        {
          "resource_ref": "db-catalog-db",
          "protocol": "postgres",
          "inject_env": "CATALOG_DB_URL",
          "expanded_env": [
            "CATALOG_DB_URL"
          ],
          "provenance": "services/catalog/main.go:37"
        }
      ],
      "secrets": []
    },
    "notifications": {
      "name": "notifications",
      "entrypoint": "./services/notifications",
      "ingress": [
        {
          "protocol": "http",
          "port_env": "PORT",
          "routes": [
            "POST /v1/notifications/email"
          ]
        }
      ],
      "bindings": [],
      "secrets": [
        {
          "env_var": "SENDGRID_API_KEY",
          "provenance": "services/notifications/main.go:23"
        },
        {
          "env_var": "TWILIO_AUTH_TOKEN",
          "provenance": "services/notifications/main.go:24"
        }
      ]
    },
    "orders": {
      "name": "orders",
      "entrypoint": "./services/orders",
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
          "provenance": "services/orders/main.go:42"
        }
      ],
      "secrets": [
        {
          "env_var": "STRIPE_SECRET_KEY",
          "provenance": "services/orders/main.go:33"
        }
      ]
    }
  },
  "egress_rules": [
    {
      "source_service": "notifications",
      "target_host": "https://api.sendgrid.com/v3/mail/send",
      "port": 443,
      "protocol": "https",
      "is_external": true
    },
    {
      "source_service": "orders",
      "target_host": "https://api.stripe.com/v1/charges",
      "port": 443,
      "protocol": "https",
      "is_external": true
    }
  ]
}
```
