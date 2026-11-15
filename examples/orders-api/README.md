# orders-api

One Go HTTP service with one PostgreSQL database. It is the reference deployment for the recommended production shape: the app runs on a Linux host under systemd, and its database is external, configured through `.env`.

| Service | Routes | Stores |
| :--- | :--- | :--- |
| `orders` | `GET /healthz`, `POST /v1/orders?note=...` | PostgreSQL `db-orders-db`, external |

## Deploy

Put the database connection string in `.env`, in the project folder. Its key is the service's binding name, `ORDERS_DB_URL`:

```
ORDERS_DB_URL=postgres://<user>:<password>@<host>:5432/orders?sslmode=require
```

`.env` must be readable only by its owner (`chmod 600 .env`), and it must not be committed.

Then:

```bash
anode inspect ./examples/orders-api
anode migrate ./examples/orders-api
anode deploy root@<host> ./examples/orders-api --domain <domain>
```

`anode migrate` applies the goose migrations in `migrations/orders` to the database in `ORDERS_DB_URL`, from the machine that runs it. The deploy does not run migrations.

## What a deploy does here

- Installs Caddy and writes the service's systemd unit, which runs under `DynamicUser`.
- Writes `ORDERS_DB_URL` to a `0600` env file for the service, not to the unit.
- Waits for `GET /healthz` before switching traffic to the new release.
- Starts nothing for the database. It is not provisioned or managed by Anode.
