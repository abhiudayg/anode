# Security and Jailbreak Audit (supported profile)

Scope: the supported profile in `docs/supported-profile.md`. Anode is a CLI that analyzes a developer's own Go code, writes systemd units, and deploys them over SSH. It contains no language model, so the jailbreak-defense checks apply to the untrusted inputs it handles: repository code, the generated lock file, and the operator's `.env`.

Method: agstack `security-audit` and `jailbreak-defense` checklists, `govulncheck` (Go vulnerabilities), `gitleaks` (secrets), and targeted regression tests. Evidence is in `.verify/artifacts/`.

## Findings

### [FIXED] [CWE-88] Systemd unit injection from lock-file values (critical)
- **What this is:** Environment variable names, values, and single-line fields flowed from the lock file (derived from repository source) into a systemd unit without validation. A variable name containing a newline could add a directive such as `ExecStartPre=+`, which runs as root.
- **Threat vector / CWE:** CWE-88 (argument injection in a generated configuration). A repository could inject root commands at deploy time.
- **Remediation:** `internal/deployer/unitvalidate.go` validates environment names against an identifier pattern, rejects newlines in single-line fields, and rejects quotes and backslashes in values. `GenerateSystemdUnit` calls it first.
- **Verification:** `internal/deployer/audit_test.go` (proved failing before the fix, passing after). Redeployed both live apps.

### [FIXED] [CWE-78] Config file name reaching a root pre-start command (high)
- **What this is:** The config file name from code was placed in an `install` command for `ExecStartPre=+`, with only a `/` check.
- **Remediation:** `validConfigFileName` requires a plain `.json` file name matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$`.
- **Verification:** `TestConfigHandoffRejectsShellAndSystemdMetacharacters`.

### [FIXED] [CWE-306] Application ports reachable from the network (high, conditional)
- **What this is:** Services listen on `PORT` (21040 and up). An application that binds to all interfaces is reachable directly, bypassing Caddy.
- **Evidence:** the sample apps bind to loopback, so they were not exposed. An app that binds to `0.0.0.0` would be.
- **Remediation:** `appPortFirewallCommand` installs iptables when missing and drops inbound TCP to 21040-21999 on non-loopback interfaces. Fails closed if iptables cannot be installed.
- **Verification:** live on `anode-vm`: rule present, direct `:21040` blocked, `/v1/orders` still 201 through Caddy.
- **Open part:** the rule is not persisted, so a reboot removes it (see OPEN below).

### [FIXED] [CWE-295] Silent trust of a new SSH host key (high)
- **What this is:** On first contact the deployer wrote the host key to `known_hosts` without showing it, which allows a man-in-the-middle on first connection.
- **Remediation:** `checkNewHostTrust` prints the fingerprint and stops unless `ANODE_TRUST_NEW_HOST=1` is set. Known hosts are unaffected.
- **Verification:** `TestNewHostRequiresExplicitApproval`.

### [FIXED] [CWE-78] Remote command injection through log time filters (low)
- **Remediation:** `--since` and `--until` values are shell-quoted, and the service name is validated and checked against the host before use.
- **Verification:** `internal/logs/quote_test.go`.

### [FIXED] Secrets in unit files (high, found during the audit)
- **What this is:** External database connection strings, which contain passwords, were written to `Environment=` in a world-readable unit file.
- **Remediation:** they now go into the `0600` env file under `/etc/anode/env/`.
- **Verification:** live check: the env file holds `ORDERS_DB_URL`, the unit does not contain it or the password.

### [ACCEPTED] [CWE-250] Deployment ran as root (high)
- **Status update:** direct root login is now disabled by `anode host-setup --disable-root-login`, which checks the deploy account before touching sshd and removes its own setting if sshd rejects it. Verified live: root login is refused, the deploy account deploys. The privileged helper was evaluated and deliberately not built; see the accepted residual risk below.
- **What this is:** Deploys connect as `root`. A compromised deploy host or stolen key gives root on the server (excessive agency).
- **Remediation:** `anode host-setup root@host` creates a dedicated deploy account with a validated sudoers rule. Deploys run as that account, and every privileged command goes through `sudo -n`.
- **Accepted residual risk:** the sudoers rule is NOPASSWD ALL, which is root-equivalent. A compromised deploy key still gives root on the host. This is accepted for the supported profile (single-owner hosts that the developer controls). A privileged helper would replace about 49 remote call sites with roughly a dozen fixed operations and change the deploy contract; it is not planned unless the supported profile widens to shared or multi-tenant hosts.
- **Done:** direct root SSH login is disabled by `host-setup --disable-root-login`.

### [FIXED] [CWE-319] Plaintext HTTP when the target is an IP address (medium)
- **What this is:** without `--domain`, Caddy serves HTTP only, so app traffic and any secrets it carries are unencrypted.
- **Remediation:** an IP target is refused unless `--plain-http` is passed. `--domain` enables TLS. The `--domain` flag was previously ignored by the parser; it is now read.

### [FIXED] Firewall rule not persistent across reboots (medium)
- **Remediation:** the rule is saved with `netfilter-persistent save`, and `anode doctor` checks that it is active and saved.

### [DOCUMENTED] Untrusted repositories during `inspect` (medium)
- **What this is:** `inspect` loads packages with the Go toolchain. Toolchain steps such as cgo can run code from a repository.
- **Scope decision:** developer-owned code only. The README documents the limit.

### [FIXED] `.env` permissions are not checked (low)
- **Remediation:** deploys refuse a `.env` readable by other users (`checkDotEnvPermissions`).

### [ACCEPTED] Application logs may contain secrets (informational)
- **What this is:** an application can print secrets, for example filebrowser prints its generated admin password at first start. This is the application's behavior, not Anode's.

### [DOCUMENTED] Local development credentials (low)
- **What this is:** `anode dev` uses `postgres:postgres` for the local container, bound to `127.0.0.1` only. Local use only.

### [INFO] Hardcoded IndexNow key in the website (informational)
- **What this is:** `web/src/app/api/indexnow/route.ts` and `web/scripts/ping_indexnow.ts`. The IndexNow key is public by design, since it must be served from the site.

## Dependency and secret scans

- `govulncheck ./...`: no vulnerabilities (`.verify/artifacts/audit/govulncheck.txt`).
- `gitleaks`: 94 findings. Every finding in the Anode code is an example, a test fixture, or a third-party file under `examples/realworld_benchmarks/`. Outside those, the only finding is the IndexNow key above (`.verify/artifacts/audit/gitleaks.json`).

## Jailbreak-defense mapping

| Control | Status |
|---|---|
| Instruction and data separation at the boundary (repository values must not reach privileged commands) | Fixed for unit fields, env names, config file names, and log filters |
| Least privilege for tools | OPEN: root deploy |
| Approval gates for high-impact actions | Added for new SSH hosts. Remote pruning of old releases and units still runs without approval, limited to numeric release folders and `anode-*` units |
| Output redaction | Dev report masks connection strings. Deploy and log errors print key names, not values |
| Regression tests for each control | Present (Go tests, listed above) |

## Remaining work

1. None for the supported profile. The root-equivalent deploy account is an accepted residual risk (see the CWE-250 finding). Revisit if the profile widens to shared hosts.
2. Application logs can contain secrets. This is application behavior that Anode cannot filter reliably. Accepted, and documented in the README.
