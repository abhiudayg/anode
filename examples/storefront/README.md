# Storefront

A three-service online store fixture. It exercises composite database DSNs, Goose migrations, and external payment and email APIs.

| Service | Routes | Stores and egress |
| :--- | :--- | :--- |
| `catalog` | `GET /v1/products` | PostgreSQL `db-catalog-db` (migrations in `migrations/catalog`) |
| `orders` | `POST /v1/orders` | PostgreSQL `db-orders` (migrations in `migrations/orders`) |
| `notifications` | `POST /v1/notifications/email` | SendGrid, `https://api.sendgrid.com/v3/mail/send` |

Stripe is also called from `orders`, at `https://api.stripe.com/v1/charges`.

## What `anode inspect` records

Run `anode inspect ./examples/storefront`. The checked-in `anode.lock.json` is its output for this code.

- 3 services, 2 PostgreSQL resources, 2 external egress rules, 0 diagnostics.
- Secret variables: `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY`, `TWILIO_AUTH_TOKEN`.
- Twilio appears only as a secret. The code reads `TWILIO_AUTH_TOKEN` but does not call a Twilio host, so no Twilio egress rule is recorded.

## Try it

```bash
anode inspect ./examples/storefront
anode dev ./examples/storefront
anode deploy root@127.0.0.1 ./examples/storefront --dry-run
```

`anode dev` needs Docker for the PostgreSQL containers. The `--dry-run` deploy needs no host.

## Limits

This is a fixture for Anode's analysis, not a production store. It has no authentication, payment handling, or retries. Multi-service topologies are outside the supported profile; see [`docs/supported-profile.md`](../../docs/supported-profile.md).
