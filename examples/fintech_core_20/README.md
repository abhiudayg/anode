# Fintech Core 20: Enterprise Banking & Trading Engine

`fintech_core_20` is a 20-microservice architecture modeling an enterprise neo-bank, trading desk, and clearing engine.

Each microservice is designed with real-world, production Go backend architecture:
- Layered separation: `config` -> `repository/store` -> `handler` -> `main.go`
- Cross-package backward taint analysis: database credentials and DSN formats resolved across package boundaries
- Multi-protocol linking: REST APIs, typed gRPC contracts, Kafka event streaming, and AMQP queues
- Zero-trust outbound egress rules: Stripe, Twilio, Persona, CoinGecko, Frankfurter

---

## 20 Microservices Summary

| Service | Architecture & Sinks | Backing Driver | Egress / Contracts |
| :--- | :--- | :--- | :--- |
| `api_gateway` | Reverse proxy with path routing | Internal Ingress | Binds to `auth`, `accounts`, `trading`, `payments`, `cards` |
| `auth_service` | Session manager & token verification | `redis` | JWT Signing Secret |
| `accounts_service` | Account ledgers & balances | `postgres` (Goose) | Multi-layer composite DSN |
| `ledger_engine` | Double-entry bookkeeping journal | `timescaledb` (Goose) | Inbound `RegisterLedgerServiceServer` |
| `trading_engine` | Order book matching engine | `valkey` + `kafka` | Low-latency order placement |
| `market_data` | Live market ticker feed | `redis` | External CoinGecko API (`api.coingecko.com`) |
| `payment_rails` | SEPA / ACH payment executor | `scylladb` | External Stripe API (`api.stripe.com`) |
| `fraud_guard` | Real-time risk evaluation | `qdrant` | Outbound gRPC to `ledger_engine` |
| `kyc_verifier` | Customer passport & ID verification | `minio` | External Persona API (`withpersona.com`) |
| `compliance_audit` | Regulatory AML audit log | `clickhouse` (Goose) | MergeTree audit log |
| `currency_fx` | Spot FX currency exchange | `memcached` | External Frankfurter API (`api.frankfurter.app`) |
| `cards_service` | Card issuance & limits | `mariadb` (Goose) | Masked PAN storage |
| `rewards_service` | Cashback & point redemption | `redis` | Binds to `accounts_service` |
| `statement_gen` | Monthly statement PDF generator | `minio` + `rabbitmq` | Async document generation |
| `notifications` | Transactional alerts & SMS | `rabbitmq` | External Twilio API (`api.twilio.com`) |
| `tax_reporting` | 1099-B tax computations | `postgres` | Capital gains ledger |
| `crypto_custody` | Cold/warm crypto wallet vault | `cockroachdb` (Goose) | Multi-region resilient storage |
| `loan_underwriting` | Automated credit scoring | `mongodb` | Document store |
| `dispute_arbitration` | Chargeback & arbitration flows | `temporal` | Binds to `payment_rails` |
| `reconciliation_job` | Nightly ledger reconciliation | `kafka` + `clickhouse` | Streaming OLAP reconciliation |

---

## Verification

```bash
anode inspect ./examples/fintech_core_20
```
