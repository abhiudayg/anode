# CLAUDE.md — Anthropic Claude & AI Pair-Programming Protocol

> **CRITICAL ARCHITECTURAL DIRECTIVE**:
> All AI coding assistants, models, and contributors MUST adhere strictly to the rules, invariants, and navigation patterns detailed in [`AGENTS.md`](./AGENTS.md).
> [`AGENTS.md`](./AGENTS.md) is the single authoritative source of truth for Anode's Proof-of-Topology architecture, binary design, and coding patterns.

---

## 🛠️ Build, Test, & Lint Commands

### Go Core (`anode` binary)
```bash
# Run all unit tests
go test -v ./...

# Run tests for specific packages
go test -v ./internal/analyzer/...
go test -v ./internal/deployer/...

# Build the anode CLI binary locally
go build -o bin/anode ./cmd/anode

# Run anode inspect on test fixtures
./bin/anode inspect ./testdata/sample-shop -v
```

### Web Application & Documentation (`web/`)
```bash
cd web

# Install frontend dependencies
bun install

# Run ESLint (strictly enforced with 0 errors)
bun run lint

# Run Next.js production build and static page generation
bun run build

# Start local Next.js dev server
bun run dev
```

---

## 📐 Non-Negotiable Invariants (from `AGENTS.md`)
1. **The Zero-SDK Rule**: User Go applications NEVER import an Anode SDK. All deduction is static via Go SSA & VTA across standard library calls (`database/sql`, `net/http`) and popular routers.
2. **Deterministic Contract**: `anode.lock.json` must be deterministic and commit-backed (`SHA-256`).
3. **Zero Port Collisions**: Local dev multiplexes across `127.0.0.0/8` dynamic loopbacks.
4. **Least-Privilege Systemd**: `DynamicUser=yes`, `ProtectSystem=strict`, cgroups v2 resource ceilings.

---

## 🔒 Security, Language Stats, & CodeQL
- **GitHub Linguist**: Root `.gitattributes` marks `web/**` as documentation and `examples/**` as vendored to ensure repository language metrics reflect **Go (95%+)**.
- **CodeQL**: Configured in `.github/codeql/codeql-config.yml` to ignore third-party benchmarks in `examples/`.
- **SSH Keys**: Never use `ssh.InsecureIgnoreHostKey()` unconditionally. Check `~/.ssh/known_hosts` first via `golang.org/x/crypto/ssh/knownhosts`.

---

## 🚀 Commit & Pull Request Protocol
1. **Commit Messages**: Follow Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`, `test:`, `chore:`).
2. **GPG Signing**: All commits MUST be GPG-signed (`git commit -S -m "..."`).
3. **PR Template**: Follow [`.github/pull_request_template.md`](./.github/pull_request_template.md) completely.
4. **Issue Templates**: Use [`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE/) for bug reports, topology failures, and feature requests.
5. **Feature Map Updates**: When modifying CLI commands, update `cmd/anode/main.go`, `web/src/app/docs/page.tsx`, and `README.md`.
