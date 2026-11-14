# Production Deployment Guide

Anode deploys Go services to a Linux host over SSH, using systemd units and a Caddy reverse proxy. For which projects are supported, see [`supported-profile.md`](supported-profile.md).

---

## 1. Prerequisites

### Local Machine
- The `anode` binary: build it from source (`go build ./cmd/anode`), or install it with `go install github.com/abhiudayg/anode/cmd/anode@latest`.
- An SSH key (`~/.ssh/id_ed25519` or `~/.ssh/id_rsa`), loaded into `ssh-agent`.
- A `.env` file in the project folder, mode `600`, with every secret the code reads.

### Target Host
- A Linux host with systemd. Tested on Ubuntu VMs only; other distributions are not verified.
- Root SSH access for the first run, or a deploy account created with `anode host-setup` (see below).

---

## 2. Setting Up a Deploy Account

Deploying as root works, but a dedicated account is the recommended setup:

```bash
anode host-setup root@my-vps.com --disable-root-login
anode deploy anode-deploy@my-vps.com ./my-backend
```

`host-setup` creates the `anode-deploy` account, installs `~/.ssh/id_ed25519.pub` for it, and grants passwordless sudo through `/etc/sudoers.d/anode-deploy`. The sudo rule is root-equivalent; see [`security-audit.md`](security-audit.md). With `--disable-root-login`, direct root SSH login is turned off after the deploy account is checked, and the change is removed if `sshd` rejects it.

---

## 3. Deploying an Application

### Step 1: Inspect
```bash
anode inspect ./my-backend
```
Writes `anode.lock.json`: the routes, database and Redis bindings, secrets, and outbound hosts found in the code. Review it before deploying.

### Step 2: Dry-Run
```bash
anode deploy root@my-vps.com ./my-backend --dry-run
```
Prints the systemd units, port allocations (from `21040`), and Caddy configuration. The dry-run does not open an SSH connection.

### Step 3: Deploy
```bash
anode deploy root@my-vps.com ./my-backend --domain api.example.com
```
Without `--domain`, an IP-address target is refused unless you pass `--plain-http`, which serves the site over unencrypted HTTP.

### Step 4: Rollback (if needed)
```bash
anode rollback root@my-vps.com
```
Switches each recorded service unit back to the previous release.

---

## 4. What a Deploy Does

1. **Host check.** Connects over SSH and reads `uname -m` to choose `amd64` or `arm64`. Creates the `anode` system user and the `/var/lib/anode` directories, and installs or verifies Caddy.
2. **Stateful resources.** For each resource in the lockfile with `auto_provision: true`, runs the matching catalog driver. Redis runs as a native systemd service bound to `127.0.0.1`. Other catalog kinds run in containers. Each data directory is created with the mode and owner the driver needs.
3. **Migrations are not run.** The deploy does not apply database migrations. Run them yourself before deploying. See [`supported-profile.md`](supported-profile.md).
4. **Build and upload.** Builds a static binary with `CGO_ENABLED=0 GOOS=linux`, uploads it to `/var/lib/anode/releases/<release_id>/`, and stages config files and secret env files with restricted modes.
5. **Units.** Allocates ports from `21040`, writes one systemd unit per service with `DynamicUser=yes`, `CPUQuota=200%`, `MemoryMax=1G`, and the sandboxing listed in [`security.md`](security.md). Services receive `<NAME>_SERVICE_URL` for each service they call. Each HTTP service is checked on its loopback port after it starts, and the deploy fails if the check does not pass.
6. **Edge.** Writes `/etc/caddy/Caddyfile`, checks it with `caddy validate`, and reloads Caddy. With `--domain`, Caddy obtains a Let's Encrypt certificate.
7. **Retention.** Keeps the newest three releases, and removes older releases, their env files, and units of services that are no longer deployed.

Services are restarted in place. The deploy does not run the new version alongside the old one, so requests in flight during the restart can fail.

---

## 5. Automated Host Provisioning (Ansible & Terraform)

For preparing new hosts:

```bash
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml
```

The Ansible playbook and the Terraform cloud-init file ([`infra/terraform/cloud-init.yaml`](../infra/terraform/cloud-init.yaml)) install Caddy, create the `anode` user and directories, and check that cgroups v2 is enabled. They do not install Docker. Deploying still uses the steps in section 3.
