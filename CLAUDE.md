# CLAUDE.md — Anthropic Claude & AI Pair-Programming Guide

This file provides quick-reference commands, code style rules, and development protocols for **Anode** (`github.com/abhiudayg/anode`).

---

## 🛠️ Build, Test, & Lint Commands

### Go Core (`anode` binary)
```bash
# Run all unit tests
go test -v ./...

# Run tests for a specific internal package
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

## 📐 Code Style & Conventions

### Go Architecture Guidelines
- **Go Version**: Idiomatic **Go 1.27+**.
- **The Zero-SDK Rule**: Never require user applications to import Anode code. All analysis is done by inspecting Go standard library types (`database/sql`, `net/http`) and popular routers (`chi`, `gin`, `fiber`, `echo`) statically.
- **Error Handling**: Explicit return of `error` values. Wrap errors with context: `fmt.Errorf("step description: %w", err)`.
- **Formatting**: Format code with `gofmt -s -w .` before committing.
- **Testing**: Place unit tests adjacent to source files (`foo_test.go`). Use table-driven tests for multiple inputs.

### TypeScript / Next.js Guidelines
- **Framework**: Next.js 16 (App Router) with Tailwind CSS.
- **Type Safety**: Strict typing without `any`. Use `unknown` or specific interfaces.
- **JSX Hygiene**: Escape apostrophes and quotation marks in JSX text (`&apos;`, `&quot;`) or wrap comments in `{"// comment"}` to adhere to ESLint rules.
- **Imports**: Group standard library/React imports first, then external packages, then internal components (`@/components/...`). Clean up all unused imports before committing.

---

## 🔒 Security & CodeQL Scanning
- Custom CodeQL configuration resides in `.github/codeql/codeql-config.yml`.
- `examples/**` is excluded from CodeQL scanning to avoid false positives from third-party benchmark repositories.
- Never use `ssh.InsecureIgnoreHostKey()` unconditionally. Check `~/.ssh/known_hosts` first via `golang.org/x/crypto/ssh/knownhosts`.

---

## 🚀 Commit & Pull Request Protocol
1. **Commit Message Format**: Follow Conventional Commits:
   - `feat(...)`, `fix(...)`, `docs(...)`, `perf(...)`, `test(...)`, `chore(...)`
2. **GPG Signing**: All commits MUST be GPG-signed (`git commit -S -m "..."`).
3. **PR Template**: Follow `.github/pull_request_template.md` completely.
4. **Feature Map Updates**: Whenever adding or modifying CLI commands or flags:
   - Update help text in `cmd/anode/main.go`
   - Update documentation in `web/src/app/docs/page.tsx`
   - Update `README.md`
   - Add unit tests covering the new functionality.
