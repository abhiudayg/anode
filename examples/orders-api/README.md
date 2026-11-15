# orders-api

One Go HTTP service with one PostgreSQL database. It is the smallest example that deploys with a container store, and it is what the Phase 1 Docker deploy was tested with.

| Service | Routes | Stores |
| :--- | :--- | :--- |
| `orders` | `GET /healthz`, `POST /v1/orders?note=...` | PostgreSQL `db-orders-db`, in a container (`runtime = "docker"`) |

## Deploy

Put the database password in `.env`, in the project folder. The key is the resource name in upper case with `_PASSWORD` at the end:

```
DB_ORDERS_DB_PASSWORD=<choose a password>
```

Then:

```bash
anode inspect ./examples/orders-api
anode deploy root@<host> ./examples/orders-api --domain <domain>
```

`.env` must be readable only by its owner (`chmod 600 .env`), and it must not be committed.

## What a deploy does here

- Installs Docker on the host, if it is missing.
- Starts `postgres:16-alpine` on `127.0.0.1:5432`. The password goes to a `0600` env file on the host, not into the command line.
- Writes the connection string into a `0600` secret env file for the service, not the systemd unit.

The deploy does not run the migration in `migrations/orders`. Apply it yourself before the first request, as the profile says:

```bash
docker exec <container> psql -U postgres -d db-orders-db -c "<the Up statement>"
```

The deploy does not wait for PostgreSQL to accept connections after it starts. If the first request arrives during first-run initialization, it fails until the database is ready.
