# Production Deployment Guide

Anode deploys unmodified Go backends to bare-metal servers or cloud VPS instances using native SSH and systemd.

---

## 1. Prerequisites

### Local Machine:
- The `anode` binary (`go install github.com/abhiudayg/anode/cmd/anode@latest` or pre-built binary).
- An active SSH key (`~/.ssh/id_ed25519` or `~/.ssh/id_rsa`) loaded into `ssh-agent`.

### Target Server:
- Any Linux distribution with `systemd` (Ubuntu 22.04+, Debian 12+, Rocky Linux 9+, Fedora).
- Root or passwordless sudo SSH access.

---

## 2. Deploying an Application

### Step 1: Generate or Inspect Lockfile
```bash
anode inspect ./my-backend
```
Verifies that all ingress routes, database bindings, secrets, and outbound egress rules are mathematically proven and committed to `anode.lock.json`.

### Step 2: Validate Deployment Plan (Dry-Run)
```bash
anode deploy root@my-vps.com ./my-backend --dry-run
```
Synthesizes the systemd service units, high-port allocations (`21040+`), and Caddy reverse-proxy configuration without modifying the remote host.

### Step 3: Execute Production Deployment
```bash
anode deploy root@my-vps.com ./my-backend --domain api.mycompany.com
```

---

## 3. The 6-Stage Autonomous Provisioning Lifecycle

```
[anode deploy root@my-vps.com ./my-backend]
  │
  ├── 1. Host Discovery & Bootstrap
  │      • Connects via DialSSH (golang.org/x/crypto/ssh).
  │      • Queries `uname -m` (arm64 or amd64 auto-detection).
  │      • Creates unprivileged `anode` system user.
  │      • Prepares `/var/lib/anode/{bin,releases,data,caddy}`.
  │      • Installs/verifies Caddy edge reverse proxy.
  │
  ├── 2. Stateful Infrastructure Provisioning
  │      • Inspects `anode.lock.json` resources with `auto_provision: true`.
  │      • Resolves matching driver from the catalog.
  │      • Mounts persistent storage at `/var/lib/anode/data/<resource>`.
  │      • Enforces cgroups v2 limits and loopback binding (`127.0.0.1`).
  │
  ├── 3. Pre-Traffic Schema Migrations
  │      • Discovers Goose or SQL migrations (e.g. `migrations/orders`).
  │      • Runs database migrations *before* starting new service binaries.
  │      • Aborts deployment cleanly if migrations fail.
  │
  ├── 4. Static Linux Cross-Compilation & Streaming
  │      • Compiles static binaries (`CGO_ENABLED=0 GOOS=linux GOARCH=<arch>`).
  │      • Streams binaries over SSH to `/var/lib/anode/releases/<release_id>/`.
  │
  ├── 5. Blue/Green Systemd Unit Activation
  │      • Allocates conflict-free loopback ports (`21040`, `21041`).
  │      • Injects inter-service discovery URLs (e.g. `PAYMENTS_SERVICE_URL`).
  │      • Activates units under `User=anode` with systemd sandboxing.
  │      • Verifies loopback `/healthz` endpoints.
  │
  └── 6. Zero-Downtime Edge Proxy Cutover
         • Writes `/etc/caddy/Caddyfile` with path-based routing.
         • Issues `systemctl reload caddy`.
         • Traffic shifts instantly with zero dropped connections.
```

---

## 4. Automated Host Provisioning (Ansible & Terraform)

For setting up a fleet of bare-metal servers or cloud instances:

### With Ansible:
```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml
```

### With Terraform & Cloud-Init:
Deploy the cloud-init configuration from [`infra/terraform/cloud-init.yaml`](../infra/terraform/cloud-init.yaml) to automatically initialize cloud VPS instances.
