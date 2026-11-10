# OmniMesh-32 Enterprise Architecture Benchmark

`omni_mesh_32` is a hyper-scale, 32-microservice distributed banking and commerce platform designed to benchmark and stress-test the limits of **Anode's** whole-program SSA compiler, static type analysis, and bare-metal cluster deployment engine.

It exercises 14 distinct backing stores and infrastructure drivers defined in `internal/catalog/defaults.yaml`.

---

## Architecture Topology

```
                                      ┌───────────────────────┐
                                      │   1. apigateway       │ (Public Reverse Proxy Entrypoint)
                                      └───────────┬───────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┬─────────────────────┐
                 ▼                                ▼                                ▼                     ▼
      ┌────────────────────┐           ┌────────────────────┐           ┌────────────────────┐ ┌────────────────────┐
      │     2. auth        │           │     3. users       │           │    4. catalog      │ │     5. search      │
      │ (Redis + JWT Keys) │           │ (Postgres + Goose) │           │     (MongoDB)      │ │  (Qdrant Vector)   │
      └──────────┬─────────┘           └────────────────────┘           └──────────┬─────────┘ └────────────────────┘
                 │                                                                 │
                 ▼                                                                 ▼
      ┌────────────────────┐                                            ┌────────────────────┐
      │    6. orders       │ ────────────────────────────────────────── │  15. recs-engine   │
      │ (Postgres + Queue) │                                            │ (Qdrant + Redis)   │
      └──────────┬─────────┘                                            └────────────────────┘
                 │
                 ├──────────────────────────────┬──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌────────────────────┐         ┌────────────────────┐         ┌────────────────────┐
      │   7. payments      │         │   8. inventory     │         │  19. accounting    │
      │ (ScyllaDB + Stripe)│         │(MariaDB + RedisLk) │         │ (Timescale + gRPC) │
      └──────────┬─────────┘         └──────────┬─────────┘         └────────────────────┘
                 │                              │
                 ▼                              ▼
      ┌────────────────────┐         ┌────────────────────┐
      │   23. disputes     │         │   9. warehouse     │
      │ (Temporal Worker)  │         │    (RabbitMQ)      │
      └────────────────────┘         └──────────┬─────────┘
                                                │
                                                ▼
                                     ┌────────────────────┐
                                     │   10. shipping     │
                                     │ (Kafka + EasyPost) │
                                     └────────────────────┘
```

---

## 32 Microservices Breakdown

| # | Service | Primary Backing Store | Drivers / Egress | Role & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `apigateway` | Loopback Ingress | HTTP Reverse Proxy | Ingress routing to auth, users, orders, search, media |
| **2** | `auth` | `redis` | JWT Secret Key | Session store, authentication tokens, user lookups |
| **3** | `users` | `postgres` | Goose Migrations | User account management, credential authentication |
| **4** | `catalog` | `mongodb` | Document Store | High-volume product catalog metadata |
| **5** | `search` | `qdrant` | Vector Embeddings | Neural semantic product and vector search |
| **6** | `orders` | `postgres` | Goose Migrations, gRPC | Multi-phase order checkout, inventory reservation |
| **7** | `payments` | `scylladb` | External Stripe API | High-throughput distributed payment ledger |
| **8** | `inventory` | `mariadb` | Redis Mutex, Goose | Real-time stock counters with distributed locking |
| **9** | `warehouse` | `rabbitmq` | Task Queue | Order fulfillment packaging and dispatch pipeline |
| **10** | `shipping` | `kafka` | External EasyPost API | Real-time package tracking and label creation |
| **11** | `notifications` | `rabbitmq` | External SendGrid API | Push notification dispatcher with rate limiting |
| **12** | `email` | `rabbitmq` | Internal Audit Binding | Transactional receipt and invoice mailer |
| **13** | `auditlog` | `clickhouse` | Goose Migrations | Append-only immutable regulatory audit ledger |
| **14** | `analytics` | `clickhouse` | OLAP Aggregations | Real-time conversion and traffic analysis |
| **15** | `recommendations` | `qdrant` | Redis Feature Store | Real-time collaborative filtering & vector similarity |
| **16** | `media` | `minio` | S3-Compatible Object | Product image and video asset CDN storage |
| **17** | `documents` | `minio` + `mongodb` | Dual Storage Driver | Invoice PDF generation and metadata indexing |
| **18** | `fraud` | `scylladb` | Typed gRPC Server | Real-time transactional risk evaluation |
| **19** | `accounting` | `timescaledb` | Goose, gRPC Server | Double-entry bookkeeping balance sheet |
| **20** | `tax` | External API | External Avalara API | Real-time sales tax and VAT computation |
| **21** | `workflows` | `temporal` | Workflow Engine | Complex asynchronous returns and order orchestration |
| **22** | `subscriptions` | `cockroachdb` | Goose Migrations | Recurring billing and plan management |
| **23** | `disputes` | `temporal` | Internal Payment Binding | Chargeback processing and resolution workflows |
| **24** | `reviews` | `mongodb` | Document Store | User rating and verified review submissions |
| **25** | `cms` | `minio` + `postgres` | Static Assets + SQL | Marketing landing page copy and blog storage |
| **26** | `pricing` | `valkey` | High-Speed Cache | Ultra-low-latency dynamic spot pricing |
| **27** | `loyalty` | `postgres` + `redis` | Goose + Sorted Sets | Gamified customer reward tiers and leaderboards |
| **28** | `coupons` | `memcached` + `postgres` | Ephemeral LRU Cache | Promotional discount validation and rate-limiting |
| **29** | `metrics` | `clickhouse` | Time-Series OLAP | High-cardinality telemetry ingestion |
| **30** | `webhooks` | `rabbitmq` | HMAC Secret Key | Outbound partner webhook dispatch queue |
| **31** | `crm` | External API | External Salesforce API | Enterprise customer sync and sales pipeline feed |
| **32** | `livechat` | `redis` | WebSocket Pub/Sub | Real-time support messaging and agent routing |

---

## Backing Store Coverage Matrix

| Infrastructure Kind | Services Leveraging Driver | Least Privilege & Sandboxing Profile |
| :--- | :--- | :--- |
| **`postgres`** | `users`, `orders`, `cms`, `loyalty`, `coupons` | UID 999, `0700` POSIX isolation, `--oom-score-adj=-900` |
| **`mariadb`** | `inventory` | UID 999, `127.0.0.1:3306`, `--oom-score-adj=-900` |
| **`timescaledb`** | `accounting` | UID 999, `0700` POSIX isolation, `--oom-score-adj=-900` |
| **`cockroachdb`** | `subscriptions` | UID 10005, `--security-opt=no-new-privileges:true` |
| **`scylladb`** | `payments`, `fraud` | UID 10001, `--oom-score-adj=-900` |
| **`clickhouse`** | `auditlog`, `analytics`, `metrics` | UID 101, `0700` POSIX isolation, OLAP compression |
| **`mongodb`** | `catalog`, `documents`, `reviews` | UID 999, `127.0.0.1:27017` |
| **`redis`** | `auth`, `inventory`, `recommendations`, `loyalty`, `livechat` | UID 999, ephemeral loopback mapping |
| **`valkey`** | `pricing` | UID 999, dynamic loopback port mapping |
| **`memcached`** | `coupons` | UID 11211, `127.0.0.1:11211` |
| **`rabbitmq`** | `warehouse`, `notifications`, `email`, `webhooks` | UID 999, `127.0.0.1:5672` |
| **`kafka`** | `shipping` | UID 1000, `127.0.0.1:9092` |
| **`minio`** | `media`, `documents`, `cms` | UID 1000, `0700` POSIX bucket permissions |
| **`temporal`** | `workflows`, `disputes` | UID 1000, `127.0.0.1:7233` |
| **`qdrant`** | `search`, `recommendations` | UID 1000, `127.0.0.1:6333` |

---

## Verification

To verify that Anode analyzes this 32-microservice architecture and compiles a deterministic lockfile:

```bash
anode inspect ./examples/omni_mesh_32
```
