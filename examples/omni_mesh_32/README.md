# omni_mesh_32

A 32-service Go sample mesh. Each service uses the official client library for its store, reads its connection settings from environment variables, and serves HTTP. Some services call each other over HTTP, and five services call external APIs.

It is a fixture for Anode's analysis, not a system to run. It has not been deployed. Multi-service meshes are outside the supported profile in [`docs/supported-profile.md`](../../docs/supported-profile.md).

## What `anode inspect` detects

Run `anode inspect ./examples/omni_mesh_32`. The lockfile in this directory is its output for this code.

| Found by Anode | Count | Stores |
| :--- | :---: | :--- |
| Resources | 14 | Postgres 7 (`accounting` via TimescaleDB, `subscriptions` via CockroachDB, plus `cms`, `coupons`, `loyalty`, `orders`, `users`), Redis 5 (`auth`, `inventory`, `livechat`, `loyalty`, `recommendations`), Valkey 1 (`pricing`), MySQL protocol 1 (`inventory`, MariaDB) |
| External egress | 5 | Stripe, SendGrid, Salesforce, EasyPost, Avalara |
| Diagnostics | 2 | Two Qdrant REST calls (`search`, `recommendations`) that Anode cannot match to an internal service. Qdrant is a real dependency; Anode simply has no sink for it |

Anode does not detect the other 21 store connections in this mesh. It has no sink for these clients:

| Store | Services | Client library |
| :--- | :--- | :--- |
| MongoDB | `catalog`, `documents`, `reviews` | `go.mongodb.org/mongo-driver/v2` |
| RabbitMQ | `email`, `notifications`, `warehouse`, `webhooks` | `github.com/rabbitmq/amqp091-go` |
| MinIO | `cms`, `documents`, `media` | `github.com/minio/minio-go/v7` |
| ClickHouse | `analytics`, `auditlog`, `metrics` | `github.com/ClickHouse/clickhouse-go/v2` |
| ScyllaDB | `fraud`, `payments` | `github.com/gocql/gocql` |
| Temporal | `disputes`, `workflows` | `go.temporal.io/sdk/client` |
| Kafka | `shipping` | `github.com/segmentio/kafka-go` |
| Memcached | `coupons` | `github.com/bradfitz/gomemcache/memcache` |
| Qdrant | `search`, `recommendations` | plain HTTP (no SDK) |

So the lockfile is a partial map of this code, not a complete inventory of its stores.

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
| `disputes` | Temporal | `payments` | |
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
| `workflows` | Temporal | | |

`payments` also needs the Stripe secret key from the environment. `shipping` and `tax` need their own provider keys.

## Migrations

`migrations/<service>/` holds the schema for each store-backed service: SQL for Postgres, Timescale, CockroachDB, MariaDB, and ClickHouse, and CQL for ScyllaDB. Anode does not apply them. Apply them with your own tool, for example `psql`, `mysql`, `clickhouse-client --multiquery`, or `cqlsh -f`, before starting the service. The services assume the tables exist.

## Not included

- No Temporal worker. `disputes` and `workflows` start workflows on the `disputes` and `workflows` task queues, and nothing in this mesh runs them.
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
