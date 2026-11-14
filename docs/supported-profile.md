# Supported Project Profile

Anode targets one class of project first. Everything else is outside the current scope and is reported, not guessed.

## In scope

- A Go HTTP service owned by the developer, with one `main` package in the project.
- Postgres and/or Redis, connected directly with `database/sql`, `pgx`, or `go-redis` from the project's own code.
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

- **Secrets and connection strings come from `.env`** in the project folder. Anode does not generate them, except the Redis password below.
  - Each secret the code reads (`STRIPE_SECRET_KEY`, for example) must be present. Missing values stop the deploy before any server change.
  - A Postgres connection that comes from a config file needs `<RESOURCE>_DSN`, for example `DB_CONFIG_FIXTURE_DSN`.
  - A Redis password is read from `REDIS_<RESOURCE>_PASSWORD`, for example `REDIS_FILEBROWSER_EXAMPLE_PASSWORD`.
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
- **Application ports** (21040 and up) are dropped on external interfaces by an iptables rule installed during bootstrap. The rule is not yet persisted across reboots.
- **Releases:** the newest three releases are kept, along with their env and config files. Older releases and units of removed services are deleted after a successful deploy.
- **Rollback:** `anode rollback user@host` switches each recorded app unit back to the previous release. It stops and reports if any step fails.
- **Deploy input checks** also run in `anode doctor`, which reports missing `.env` values before any deploy.
- **Security:** see `docs/security-audit.md` for open findings, including the root deploy user.
