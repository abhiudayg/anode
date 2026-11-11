## Description

<!-- Provide a concise summary of the changes introduced in this PR. -->

## Type of Change

- [ ] `feat`: New feature or command (e.g. CLI utility, analyzer pass, driver)
- [ ] `fix`: Bug fix or syntax/compiler resolution
- [ ] `docs`: Documentation, guides, or benchmark updates
- [ ] `perf`: Performance optimization (e.g. SSA sweep latency, memory reduction)
- [ ] `refactor`: Code refactoring without behavior change
- [ ] `test`: Added or updated test suites
- [ ] `ci`: GitHub Actions, CodeQL, or Dependabot workflow updates
- [ ] `chore`: Maintenance, version bumps, or asset updates

## Linked Issues & Security Alerts

<!-- E.g., Fixes #12, Resolves CodeQL alert #1199 -->
- Fixes: 

## 4-Pillar Proof-of-Topology Invariants

Every PR modifying Anode's orchestrator or compiler core must preserve the 4 foundational pillars:

- [ ] **Pillar 1 (Deterministic AST Extraction)**: SSA Variable Type Analysis remains whole-program sound. Zero heuristic regex parsing for infrastructure deduction.
- [ ] **Pillar 2 (Zero Port Collisions)**: Ephemeral resources and local services multiplex across the `127.0.0.0/8` loopback subnet without binding to static host ports.
- [ ] **Pillar 3 (Immutable Topology Contract)**: `anode.lock.json` schema remains deterministic, reproducible, and verifiable via SHA-256 commit hash.
- [ ] **Pillar 4 (Least-Privilege Security Boundary)**: Deployed Linux systemd units enforce `DynamicUser=yes`, `ProtectSystem=strict`, and cgroups v2 memory/CPU limits. Zero root daemons.

## Quality & Verification Checklist

- [ ] `go test ./...` executed and passes with 0 failures
- [ ] Frontend typecheck and lint passes (`cd web && bun run lint && bun run build`)
- [ ] GPG-signed commits (`git commit -S`)
- [ ] Zero SDK imports required in user Go applications (pure stdlib compatibility preserved)
- [ ] Documentation and feature maps updated (`README.md`, `web/src/app/docs/page.tsx`, or `examples/`)
- [ ] CodeQL security analysis clean with 0 high/critical alerts

## Verification Evidence / Output Logs

<!-- Paste output of `anode inspect`, `go test`, or screenshots of UI/CLI changes below. -->
```
```
