# Project Verification (`.verify/`)

This directory implements the full **`agstack` verification and feature-map standard** (`packages/agstack/skills/verification/` & `packages/agstack/skills/feature-map/`).

```text
.verify/
├── verify.toml        allowlist of trusted verification commands
├── run.sh             phased runner: doctor, unit, static, functional
├── doctor.sh          read-only environment and toolchain checks
├── gates.conf         ordered quality gates for this repository
├── high-risk.txt      path patterns requiring independent review
├── features/
│   ├── README.md      feature index and proof standards
│   ├── topology-compiler.md
│   ├── dev-orchestrator.md
│   ├── production-deployer.md
│   └── cluster-scheduler.md
├── functional/
│   ├── topology_compiler.txt
│   ├── dev_orchestrator.txt
│   ├── production_deployer.txt
│   └── cluster_scheduler.txt
├── checks/
│   ├── feature_coverage.sh  step-level request entry coverage auditor
│   └── gate_report.sh       ordered quality gate runner & evidence generator
├── env/
│   └── test.env       verification environment defaults
└── artifacts/         gitignored; logs, reports, and evidence records
```

## Phased Runner Lifecycle

1. **Doctor Phase (`doctor.sh`)**:
   Read-only audit verifying the Go compiler (1.22+), Git, workspace root integrity, and OpenSSH client.
2. **Unit & Regression Phase (`internal/...`)**:
   Deep regression suite validating lockfile serialization, SSA taint analysis, gRPC linking, Bin-packing, and zero-trust firewall generation.
3. **Static & Feature Coverage Phase (`checks/feature_coverage.sh`)**:
   Runs `go vet ./...` and verifies that every functional test entry in the repository is mapped to exactly one step in `.verify/features/*.md`.
4. **Functional & Quality Gate Phase (`checks/gate_report.sh`)**:
   Executes ordered quality gates specified in `gates.conf` from cheapest to most expensive, logging results to `.verify/artifacts/<RUN_ID>/evidence.md`.

## Execution

- **Default Complete Run**:
  ```bash
  .verify/run.sh
  ```
- **Targeted Phase Execution**:
  ```bash
  .verify/run.sh doctor
  .verify/run.sh unit
  .verify/run.sh static
  .verify/run.sh functional
  ```
- **agstack Verified Execution**:
  ```bash
  agent-brain verify -- .verify/run.sh
  ```
