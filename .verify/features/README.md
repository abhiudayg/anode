# Anode Feature Map Index & Proof Standards

The feature map is Anode's maintained specification of behavior. It links application and compiler behaviors to the unit, static, and functional verification suites that prove correctness.

## Feature Index

| Feature | Surface | Contract Specification | Test Suite |
|---|---|---|---|
| **Topology Compiler** | CLI `anode inspect` | [`features/topology-compiler.md`](topology-compiler.md) | `internal/analyzer/...`, `internal/iag/...` |
| **Dev Orchestrator** | CLI `anode dev` | [`features/dev-orchestrator.md`](dev-orchestrator.md) | `internal/devengine/...` |
| **Production Deployer** | CLI `anode deploy` | [`features/production-deployer.md`](production-deployer.md) | `internal/deployer/...` |
| **Cluster Scheduler** | CLI `anode cluster` | [`features/cluster-scheduler.md`](cluster-scheduler.md) | `internal/cluster/...` |

## Proof Standards & Preconditions

1. **Deterministic Immutability**: All verification runs write artifacts solely under `.verify/artifacts/<RUN_ID>/`. Source repositories and golden fixtures remain strictly read-only.
2. **Zero-SDK Lock-In**: Under no circumstances should test services or target code require importing proprietary orchestrator SDKs.
3. **Phased Verification Execution**:
   - `Phase 1 (Doctor)`: Read-only toolchain and environment prerequisite audit.
   - `Phase 2 (Unit)`: Deep regression checks across package boundaries.
   - `Phase 3 (Static)`: Static analysis, vet, and quality gate evaluations.
   - `Phase 4 (Functional)`: CLI surface execution against benchmark suites (`sample-shop`, `hyper_mesh_12`).
