# Supported Project Profile

Anode targets one class of project first. Everything else is outside the current scope and is reported, not guessed.

## In scope

- A Go HTTP service owned by the developer, with one `main` package in the project.
- Stores the project connects to directly from its own code with a Go client. Postgres and Redis are the tested stores. Other catalog kinds (MongoDB, RabbitMQ, ClickHouse, and the rest) can run in containers with `runtime = "docker"`; that path is still being tested, see below.
- Connection settings come from either:
  - an environment variable read with `os.Getenv` or `os.LookupEnv`, or
  - a config struct loaded from a JSON file, where each field has a `json` tag. The file path must be a literal in project code, such as `os.ReadFile("config.json")`.
- HTTP routes, and a port set by `PORT` or a literal `ListenAndServe` address.
- Deployed to one Linux host (VPS or VM) with systemd and Caddy in front.

## Out of scope for now

- Connections opened inside dependencies, such as `gorm.Open` or `ent.Open` when the driver code lives in the module cache. `inspect` reports these as diagnostics.
- Config files in YAML or INI. The analyzer records their keys, but the deployer writes JSON only.
- Config loaded through reflection or with names built at runtime. These are not resolved.
- Database migrations. The deployer does not run them.
- Large third-party projects built around their own configuration loaders.
- Multi-service meshes. The 32-service result is an analysis run only, not a deployment or a service-to-service test.
- Non-Go services.

## What `inspect` tells you

- A database or Redis connection in code reachable from `main` is either bound to a resource, or reported as a diagnostic with its location when it is opened inside a dependency.
- Known gap: connections in code that `inspect` cannot reach from `main` (for example, functions registered indirectly through a command framework) are not reported. Treat a missing binding as "not verified", not "absent".
- A connection string read from a config file records a `config_key` (for example `database.dsn`) in the lock file. A literal config file path records `config_file`.

## What `deploy` does for a supported app

- **Secrets and connection strings come from `.env`** in the project folder. Anode does not generate them.
  - Each secret the code reads (`STRIPE_SECRET_KEY`, for example) must be present. Missing values stop the deploy before any server change.
  - A connection string read from a config file needs a `.env` entry named after its `config_key`: dots become underscores and the name is uppercased. For example, `database.dsn` needs `DATABASE_DSN`.
  - A Redis password is read from `REDIS_PASSWORD`. A project can install one native Redis on the host. Redis in a container (`runtime = "docker"`) is not limited, and the preflight check validates the password before any server change.
- **Redis** runs as a native systemd service bound to `127.0.0.1`, with a password, as a dynamic user. The distribution's default Redis service is disabled.
- **Environment variables** for connections read from env are written to a `0600` env file, not the systemd unit.
- **Config files** are built from the `config_key` values, written to a root-only location, and handed to the app's dynamic user with `ExecStartPre=+`. The app reads its file from its working directory.
- **Each app** runs as a dynamic user (`DynamicUser=yes`) with a `StateDirectory` for writes. The release folder is root-owned and read-only to the app.
- **Failures** stop the deploy: a missing secret, a failed Redis start, a service that is not running after restart.

## What is tested end to end

- Redis: native install, password required, password kept out of the unit file and the process list, default Redis disabled.
- App services: start as a dynamic user, write to their state folder, answer HTTP through Caddy.
- The config file handoff: the file is installed with the dynamic user as owner, mode `0400`.

Anything not listed above is not verified end to end yet.

## Definition of done for a supported app

A supported app passes `inspect`, `deploy`, a health check, and an authenticated database or Redis connection on a test host, with no deployment settings written by the developer beyond `.env` secrets.

## Operator steps added by the audit

- **First connection to a host:** the deploy stops and prints the host key fingerprint. Confirm it on the server, then run again with `ANODE_TRUST_NEW_HOST=1`.
- **Application ports** (21040 and up) are dropped on external interfaces by an iptables rule installed during bootstrap. The rule is saved with `netfilter-persistent`, and `anode doctor` checks that it is active and saved.
- **Releases:** the newest three releases are kept, along with their env and config files. Older releases and units of removed services are deleted after a successful deploy.
- **Rollback:** `anode rollback user@host` switches each recorded app unit back to the previous release. It stops and reports if any step fails.
- **Deploy input checks** also run in `anode doctor`, which reports missing `.env` values before any deploy.
- **Security:** see `docs/security-audit.md`. The deploy account's passwordless sudo is an accepted risk for single-owner hosts.

## Versions and runtimes (anode.toml)

- `anode inspect` creates `anode.toml` if it is missing. It adds one `[stores.<name>]` section per store the code uses and one `[services.<name>]` section per service. Each store gets the catalog's default version. Review it before the first deploy.
- `runtime = "binary"` installs the store as a host binary. Only Redis has a binary install today. A project may have one native Redis.
- `runtime = "docker"` runs the store in a container at the pinned version. The container password is read from `.env` under `<RESOURCE>_PASSWORD` (for example `DB_ORDERS_DB_PASSWORD`), written to a `0600` env file on the host, and never put on the command line. Each catalog kind names its password variable in the catalog. Tested end to end for PostgreSQL (`examples/orders-api`). Other kinds are not yet tested. The deploy does not run migrations and does not wait for the database to accept connections.
- App services run as systemd binaries. `runtime = "docker"` is refused for services until the Docker path is designed for DynamicUser services.
- Deploy stops before any host change when a store has no version, when a binary install is not available for its kind, or when the config does not match the lockfile. Nothing falls back to `latest`.
- Native Redis uses `version = "auto"` by default. It takes the version the host's package provides, and the deploy prints it. A pinned version (for example `"8.0"`) is checked against the host after install, and the deploy stops on a mismatch. `auto` is only valid for a binary store. A Docker store needs an explicit version.
- To upgrade, change `version` in `anode.toml` and deploy. Anode does not run migrations, so a breaking data change is your job.

## Which services a deploy restarts

- A service restarts only when its fingerprint changes. The fingerprint covers the binary bytes, the unit, the env file, and the config document. Release IDs and paths are ignored.
- An unchanged service keeps running. The deploy copies its current binary into the new release, so rollback still has it.
- The lockfile hash is not used for this. A code change inside a service can leave the topology, and so the lockfile, unchanged.
- The fingerprint is written after the service passes its health check, so a failed deploy is retried on the next run.
- `anode rollback` clears the fingerprints of the units it restores, so the next deploy restarts them.

## Shutdown (restart and deploy)

- The unit sends `SIGTERM` and waits up to 10 seconds (`TimeoutStopSec`) before it kills the process.
- Caddy holds requests for up to 5 seconds while a unit restarts, so a single-service restart does not return errors to clients.
- A service must stop accepting connections on `SIGTERM` and finish in-flight requests itself, for example with `http.Server.Shutdown`. The unit gives it time; it does not drain for it. See `examples/marketplace/services/orders/main.go`.

## Health check (deploy)

- Every service that serves HTTP must serve `GET /healthz`. Deploy checks it after the service starts and stops the deploy unless it returns a status from 200 to 399.
- A service without the route fails the deploy, even if it answers other paths. This is a breaking change from v1.4.0, which accepted any status below 500 on the first route.

## External stores (recommended for real projects)

- `runtime = "external"` in `anode.toml` marks a store that Anode does not provision. Its connection string comes from `.env`, under the service's binding name (for example `ORDERS_DB_URL`).
- `anode migrate` applies goose migrations for external PostgreSQL stores, from the machine that runs it, using the same connection string.
- The reference deployment is `examples/orders-api`. It was tested end to end with an external PostgreSQL on a separate container on the test host.

## Reviewing inferred values (anode.overrides.json)

- `anode.lock.json` is generated by `anode inspect` from the code. Do not edit it by hand.
- To change an inferred value, add an entry to `anode.overrides.json`: the `path` (for example `resources.documents-minio.buckets`), the `value` you want, and the `inferred` value it replaces.
- While the code still infers the value in `inferred`, the override applies on every `inspect`.
- If the code changes that value, `inspect` stops with a conflict and writes nothing. Update the entry to accept the new value or keep yours.
- Supported paths: `resources.<id>.topics`, `resources.<id>.buckets`, `resources.<id>.collections`, `resources.<id>.kind`, `services.<name>.config_env`.
- If a resource is renamed and exactly one resource in the lockfile comes from the same source file, `inspect` moves the override to it and rewrites the file. If more than one matches, the override is left alone and reported.
- Git history is the version history of the lockfile and the overrides file. There are no numbered versions.
- `anode.state.json` holds deploy state, currently the host port of each container store. Deploy writes it; the config does not carry ports.
- Each successful release records the SHA-256 of the lockfile it deployed at `/var/lib/anode/releases/<release>.lock.sha256` on the host.

## Rollback and failed deploys

- A deploy that fails after it changes host units restores the previous release automatically: its service units, and its Caddyfile.
- Each release keeps a copy of its lockfile and its Caddyfile on the host. `anode rollback` checks that the lockfile copy matches the recorded hash before it changes anything, and refuses a release whose record does not match.
- A release deployed before this change has no lockfile copy or Caddyfile record, so it cannot be restored. Deploy the current version once to create the records.
- Rollback restores units and routes. It does not undo database migrations, and it does not undo data written while the new release was running.

## Known limits

- Migrations are forward-only. Goose `Down` sections are empty, so `anode migrate` cannot reverse a schema change. Write a corrective migration instead.
- ClickHouse migrations run over HTTP and Scylla migrations run through `cqlsh` in the pinned image, both tracked in `anode_migrations`. The Scylla path needs `docker` on the machine running `anode migrate`. Migration files must not contain a `;` inside a string literal, because the runner splits on semicolons.
- The Temporal store runs the Temporal dev server. It is for development and rehearsal, not for production workflow history.
- SeaweedFS (the `minio` kind) runs as one node with no replication.
- The analyzer resolves an environment name only when the whole name is a constant or a constant-only concatenation. A name built at runtime is reported as a warning diagnostic. Declare such names in `anode.overrides.json`.
- Qdrant collections are created only when they are declared in the lockfile; the analyzer does not infer them from code that builds the name at runtime.
- Store kinds fall back to `postgres` when the environment name has no engine keyword. Set the kind in `anode.overrides.json` (`resources.<id>.kind`) when that happens.
