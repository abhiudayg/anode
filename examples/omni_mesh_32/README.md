# omni_mesh_32

A 32-service Go sample mesh. Each service uses the official client library for its store, reads its connection settings from environment variables, and serves HTTP. Some services call each other over HTTP, and five services call external APIs.

It is a fixture for Anode's analysis, not a system to run. It has not been deployed. Multi-service meshes are outside the supported profile in [`docs/supported-profile.md`](../../docs/supported-profile.md).

## What `anode inspect` detects

Run `anode inspect ./examples/omni_mesh_32`. The lockfile in this directory is its output for this code.

| Found by Anode | Count | Stores |
| :--- | :---: | :--- |
| Resources | 32 | Postgres 7, Redis 5, MongoDB 3, RabbitMQ 4, MinIO 3, ClickHouse 3, ScyllaDB 2, Temporal 2, Memcached 1, Valkey 1, MySQL protocol 1 (MariaDB). See the lockfile for the env var and service of each |
| External egress | 5 | Stripe, SendGrid, Salesforce, EasyPost, Avalara |
| Diagnostics | 2 | Two Qdrant REST calls (`search`, `recommendations`) that Anode cannot match to an internal service. Qdrant is a real dependency; Anode simply has no sink for it |

Anode does not detect three store connections in this mesh:

| Store | Services | Why |
| :--- | :--- | :--- |
| Kafka | `shipping` | The broker list is set in a struct literal (`kafka.Writer{Addr: kafka.TCP(...)}`), not a constructor call the analyzer matches |
| Qdrant | `search`, `recommendations` | Plain HTTP calls with no client library, so the analyzer cannot identify the store by type |

The two Qdrant calls appear as diagnostics. Kafka is silent.

## Services

| Service | Store | Calls | External |
| :--- | :--- | :--- | :--- |
| `accounting` | TimescaleDB (pgx) | | |
| `analytics` | ClickHouse | | |
| `apigateway` | | `auth`, `users`, `orders`, `media`, `search` (reverse proxy) | |
| `auditlog` | ClickHouse | | |
| `auth` | Redis | `users` | |
| `catalog` | MongoDB | `search` | |
| `cms` | Postgres (pgx), MinIO | | |
| `coupons` | Postgres (pgx), Memcached | | |
| `crm` | | | Salesforce |
| `disputes` | Temporal (worker) | `payments`, `auditlog` (from its activity) | |
| `documents` | MinIO, MongoDB | | |
| `email` | RabbitMQ | `auditlog` | |
| `fraud` | ScyllaDB | | |
| `inventory` | MariaDB, Redis (locks) | | |
| `livechat` | Redis (history and pub/sub) | | |
| `loyalty` | Postgres (pgx), Redis (cache) | | |
| `media` | MinIO | | |
| `metrics` | ClickHouse | | |
| `notifications` | RabbitMQ | | SendGrid |
| `orders` | Postgres (pgx) | `inventory`, `payments`, `accounting` | |
| `payments` | ScyllaDB | | Stripe |
| `pricing` | Valkey | | |
| `recommendations` | Redis (cache), Qdrant | | |
| `reviews` | MongoDB | | |
| `search` | Qdrant | | |
| `shipping` | Kafka | | EasyPost |
| `subscriptions` | CockroachDB (pgx) | | |
| `tax` | | | Avalara |
| `users` | Postgres (pgx) | | |
| `warehouse` | RabbitMQ | `shipping` | |
| `webhooks` | RabbitMQ | | |
| `workflows` | Temporal (worker) | `warehouse` (from its activity) | |

`payments` also needs the Stripe secret key from the environment. `shipping` and `tax` need their own provider keys.

## Migrations

`migrations/<service>/` holds the schema for each store-backed service: SQL for Postgres, Timescale, CockroachDB, MariaDB, and ClickHouse, and CQL for ScyllaDB. Anode does not apply them. Apply them with your own tool, for example `psql`, `mysql`, `clickhouse-client --multiquery`, or `cqlsh -f`, before starting the service. The services assume the tables exist.

## Not included

- Temporal workers run in the same process as the HTTP server of `disputes` (queue `disputes`) and `workflows` (queue `workflows`). Both need a Temporal server at `DISPUTES_TEMPORAL_ADDR` and `WORKFLOWS_TEMPORAL_ADDR`. The workflows are tested with Temporal's test suite, not run against a server.
- Service calls made inside a workflow or activity are not in the lockfile. Temporal registers those functions, so the analyzer's call graph from `main` does not reach them. The `disputes` to `auditlog` and `workflows` to `warehouse` edges are missing for this reason.
- No seed data, no docker-compose, and no provider accounts. The services are not run against live infrastructure in this repository.

## Tests

The unit tests cover the pure logic: the fraud rules, vector parsing, point IDs, and user IDs. They do not connect to any store.

```bash
cd examples/omni_mesh_32
go build ./...
go vet ./...
go test ./...
```

## Anode analysis

```bash
anode inspect .
```

The lockfile in this directory is the output for this code. See "What `anode inspect` detects" above for the counts.
