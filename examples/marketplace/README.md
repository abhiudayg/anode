# Marketplace

A 32-service Go fixture for a marketplace: catalog, orders, payments, warehouse shipping, customer data, search, analytics, and workflows. Each service uses the official client library for its store, reads its connection settings from environment variables, and serves `GET /healthz`. Services call each other over HTTP, and some run Temporal workers.

It is the largest analyzer fixture in this repository. It is not a system to deploy, and it is outside the supported profile in [`docs/supported-profile.md`](../../docs/supported-profile.md).

## Stores

| Store | Count | Services |
| :--- | :---: | :--- |
| PostgreSQL (includes TimescaleDB and CockroachDB) | 7 | accounting, cms, coupons, loyalty, orders, subscriptions, users |
| MongoDB | 3 | catalog, reviews, documents |
| MinIO | 3 | cms, documents, media |
| ClickHouse | 3 | analytics, auditlog, metrics |
| Redis | 5 | auth, inventory, livechat, loyalty, recommendations |
| RabbitMQ | 4 | webhooks, warehouse, email, notifications |
| Temporal | 2 | disputes, workflows |
| ScyllaDB | 2 | fraud, payments |
| Valkey | 1 | pricing |
| MariaDB | 1 | inventory |
| Memcached | 1 | coupons |
| Kafka | 1 | shipping |
| Qdrant | 2 | search, recommendations |

Total: 35 store resources across 13 kinds.

## What `anode inspect` records

Run `anode inspect ./examples/marketplace`. The checked-in `anode.lock.json` is its output for this code.

- 32 services and 35 store resources, all bound to a service.
- 5 external egress rules: Stripe, SendGrid, Salesforce, EasyPost, and Avalara. Each base URL comes from an environment variable (`STRIPE_API_URL`, `SENDGRID_API_URL`, and so on), and the lockfile records the production default.
- 0 diagnostics.
- Kafka is bound through the broker list in `SHIPPING_KAFKA_BROKERS`, which the analyzer reads from the `kafka.Writer` literal. Qdrant is bound through the `*_QDRANT_URL` variables.

## Limits of the analysis

- Only the `kafka.Writer` literal is read. A writer built with `kafka.NewWriter` or a reader is not yet recognized.
- Qdrant is recognized by its env var name. A store reached through a variable with a different name is not detected.

## Running the tests

```bash
cd examples/marketplace
go test ./...
```

The live tests start real stores and run the services against them. They also need Docker:

```bash
./infra/live-test.sh
```

`infra/compose.yaml` starts the stores, including Kafka and ScyllaDB, and the script stops them when it exits. The provider APIs are local stubs, so no provider accounts are needed. MinIO is replaced by SeaweedFS, which speaks the same S3 API.

## Layout

- `services/<name>/main.go`: one service per directory
- `migrations/<service>/`: SQL for PostgreSQL, MariaDB, ClickHouse, and TimescaleDB, plus CQL for ScyllaDB
- `infra/`: the live-test stack
- `livetest/`: live tests for the stores and the external-API services

## Deploying it with dummy provider values

`.env.example` lists every value the deploy needs. Every secret is a placeholder. The provider base URLs point at local stubs, which return fixed responses, so the routes that call a provider answer without real accounts. Replace the placeholders and URLs with real values before a live deploy.

One-time steps the deploy does not do yet:

- Create the Kafka topic `shipments.created` on the store host.
- Create the MinIO buckets `documents`, `cms-assets`, and `media` on each SeaweedFS store.
- Apply the migrations with `anode migrate root@<host> <path>`. ClickHouse migrations run over the server's HTTP interface and need `<PREFIX>_HTTP_ADDR`, `<PREFIX>_DB`, and optionally `<PREFIX>_USER` and `<PREFIX>_PASSWORD`. Scylla migrations run `cqlsh` from the pinned image and need `docker` on the machine running `anode migrate`, plus `<PREFIX>_KEYSPACE`. Both record applied files in `anode_migrations`, so a rerun applies only new files. Store addresses on loopback are reached over SSH when a host is given.
