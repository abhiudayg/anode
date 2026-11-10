# Pluggable Infrastructure Driver Catalog

Anode decouples stateful dependency provisioning from its core Go orchestrator by utilizing a **Pluggable Declarative Driver Catalog**.

This architecture allows Anode to scale across 100+ stateful services (databases, caches, message brokers, vector engines, search clusters, object stores) without modifying compiler or orchestrator Go source code.

---

## 1. Catalog Resolution Hierarchy

When Anode inspects or deploys a service requiring a stateful resource (e.g. `postgres`, `redis`, `kafka`, `qdrant`), it resolves the driver specification across three hierarchical layers:

1. **Repository Overrides (`.anode/catalog/` or `anode.catalog.yaml`)**:
   Allows a team to define custom internal databases, proprietary Docker images, or specialized memory/CPU limits for their repository.
2. **User Overrides (`~/.anode/catalog/`)**:
   Global developer machine overrides.
3. **Embedded Pre-Audited Defaults (`internal/catalog/defaults.yaml`)**:
   Shipped inside the compiled `anode` binary via Go `embed.FS`, containing audited production configurations for 25+ industry standard primitives.
4. **Dynamic Fallback**:
   If an unknown or proprietary kind is declared (e.g. `scylladb` or `internal-kv`), Anode automatically synthesizes a safe, least-privilege driver with loopback binding and cgroups v2 memory limits.

---

## 2. Driver Specification Schema

Every driver is defined by a declarative specification:

```yaml
postgres:
  kind: postgres
  category: database
  default_version: "16"
  supported_versions:
    "14":
      image: "postgres:14-alpine"
    "15":
      image: "postgres:15-alpine"
    "16":
      image: "postgres:16-alpine"
    "17":
      image: "postgres:17-alpine"
  runtime:
    image_template: "postgres:{{.Version}}-alpine"
    data_mount: "/var/lib/postgresql/data"
    default_env:
      POSTGRES_USER: "postgres"
      POSTGRES_PASSWORD: "postgres"
      POSTGRES_DB: "${DB_NAME}"
  security:
    uid: 999
    gid: 999
    file_mode: "0700"
    no_new_privileges: true
    drop_capabilities: ["ALL"]
    add_capabilities: ["CHOWN", "DAC_OVERRIDE", "FOWNER", "SETGID", "SETUID"]
    oom_score_adjust: -900
    cgroups:
      memory_max: "2G"
      cpu_quota: "200%"
  networking:
    primary_port: 5432
    bind_interface: "127.0.0.1"
    protocol: "postgres"
  connection_templates:
    URL: "postgres://postgres:postgres@{{.Host}}:{{.Port}}/{{.Database}}?sslmode=disable"
    HOST: "{{.Host}}"
    PORT: "{{.Port}}"
    USER: "postgres"
    PASSWORD: "postgres"
    DATABASE: "{{.Database}}"
    ADDR: "{{.Host}}:{{.Port}}"
  readiness_probe:
    command: ["pg_isready", "-U", "postgres", "-h", "127.0.0.1"]
    tcp_port: 5432
    initial_delay_sec: 2
    timeout_sec: 1
```

---

## 3. Versioning Mechanics

Anode handles database and broker versioning through a deterministic 4-tier pipeline:

```
+-------------------------------------------------------------------+
| 1. Lockfile Contract (anode.lock.json)                            |
|    "db-orders": { "kind": "postgres", "engine_version": "15" }    |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
| 2. Pinned Version Lookup (supported_versions)                     |
|    Does driver have "15"? -> resolves "postgres:15-alpine"        |
+---------------------------------+---------------------------------+
                                  | (If not pinned)
                                  v
+-------------------------------------------------------------------+
| 3. Dynamic Semver Interpolation (image_template)                  |
|    Renders "postgres:{{.Version}}-alpine" -> "postgres:15.2-alpine"|
+---------------------------------+---------------------------------+
                                  | (If version omitted)
                                  v
+-------------------------------------------------------------------+
| 4. Audited LTS Fallback (default_version)                         |
|    Defaults to driver's certified LTS release ("16")              |
+-------------------------------------------------------------------+
```

---

## 4. Writing Custom Drivers

To add a custom database or queue (e.g. `scylladb` or `qdrant`), create `.anode/catalog/my-store.yaml`:

```yaml
drivers:
  my-store:
    kind: my-store
    category: database
    default_version: "2.0"
    runtime:
      image_template: "internal-docker.corp/data/store:{{.Version}}"
      data_mount: "/var/lib/store/data"
    security:
      uid: 1000
      gid: 1000
      file_mode: "0700"
      no_new_privileges: true
      oom_score_adjust: -800
      cgroups:
        memory_max: "4G"
        cpu_quota: "200%"
    networking:
      primary_port: 8080
      bind_interface: "127.0.0.1"
      protocol: "http"
    connection_templates:
      STORE_ADDR: "{{.Host}}:{{.Port}}"
      STORE_URL: "http://{{.Host}}:{{.Port}}"
```

Anode immediately recognizes `my-store`, provisions it with least privilege, and injects `STORE_ADDR` and `STORE_URL` into consuming services.
