# Retail Platform

A twelve-service retail fixture with HTTP and gRPC calls, Redis and PostgreSQL, a ClickHouse audit store, and external payment and email APIs. It is the analyzer's main test fixture for call-graph reachability and config indirection.

## Services

| Service | Routes | Stores and calls |
| :--- | :--- | :--- |
| `apigateway` | `GET /api/v1/auth/verify`, `POST /api/v1/orders` | HTTP to `auth` and `orders` |
| `auth` | `GET /v1/auth/token` | Redis `cache-redis`; secret `JWT_SIGNING_SECRET_KEY` |
| `orders` | `POST /v1/orders` | PostgreSQL `db-orders`; HTTP to `payments`; gRPC to `ledger` |
| `payments` | `POST /v1/payments/charge` | Stripe, `https://api.stripe.com/v1/charges` |
| `ledger` | gRPC server | none |
| `inventory` | `POST /v1/inventory/reserve` | Redis `cache-redis` (shared) |
| `fulfillment` | `POST /v1/fulfillment/dispatch` | PostgreSQL `db-fulfillment`; HTTP to `notifications` |
| `notifications` | `POST /v1/notify/shipment` | SendGrid, `https://api.sendgrid.com/v3/mail/send` |
| `catalog` | `GET /v1/catalog/items` | PostgreSQL `db-external-catalog-db`, resolved from config indirection |
| `userprofile` | `GET /v1/users/profile` | PostgreSQL `db-userprofile` |
| `auditlog` | `POST /v1/audit/log` | ClickHouse `db-clickhouse-audit` |
| `analytics` | `GET /v1/analytics/summary` | none |

## What `anode inspect` records

Run `anode inspect ./examples/retail-platform`. The checked-in `anode.lock.json` is its output for this code.

- 12 services, 7 store resources (PostgreSQL 4, Redis 2, ClickHouse 1), 2 external egress rules, 0 diagnostics.
- Calls between services are linked by route or by gRPC interface: `apigateway` to `orders` and `auth`, `orders` to `payments` and `ledger`, and `fulfillment` to `notifications`.
- `analytics` contains a helper, `deadAnalyticsHelper`, that nothing calls. Its `UNUSED_SQLITE_PATH` variable does not appear in the lockfile, so the analysis skips unreachable code.
- The lockfile records a secret named `_DB_PASSWORD` with no service prefix. It comes from a dynamic environment name and is a known analyzer gap.

## Try it

```bash
anode inspect ./examples/retail-platform
go test ./internal/analyzer
```

`auth` and `inventory` share one Redis resource, `cache-redis`, through `CACHE_REDIS_ADDR`, because the supported profile allows one native Redis per project.

## Limits

This is a fixture for Anode's analysis, not a retail system. Its services contain no business logic.

A live deploy also needs what the dry-run does not check: the four PostgreSQL connection strings and the ClickHouse connection string in `.env`, the Stripe, SendGrid, and JWT secrets, and the PostgreSQL containers in `anode.toml` (`runtime = "docker"`), which need Docker on the host. The Docker store path has not been tested end to end. See [`docs/supported-profile.md`](../../docs/supported-profile.md) for what Anode supports.
