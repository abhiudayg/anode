#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="${1:-all}"
RUN_ID=$(date +%Y%m%d_%H%M%S)
RUN_DIR=".verify/artifacts/$RUN_ID"
mkdir -p "$RUN_DIR" .verify/output
if [ -f ".verify/review.txt" ]; then
  cp ".verify/review.txt" "$RUN_DIR/review.txt"
fi

echo "=========================================================="
echo " agstack Verification Harness"
echo " Run ID : $RUN_ID"
echo " Target : $TARGET"
echo " Root   : $ROOT_DIR"
echo "=========================================================="

# 1. Doctor Phase
if [ "$TARGET" = "all" ] || [ "$TARGET" = "doctor" ]; then
  if [ -f ".verify/doctor.sh" ]; then
    echo "--- [Phase 1/4: Doctor] ---"
    bash .verify/doctor.sh | tee "$RUN_DIR/doctor.log"
  fi
fi

if [ "$TARGET" = "doctor" ]; then
  exit 0
fi

# 2. Unit & Integration Test Phase
if [ "$TARGET" = "all" ] || [ "$TARGET" = "unit" ]; then
  echo "--- [Phase 2/4: Unit & Regression Tests] ---"
  go test -v ./internal/... | tee "$RUN_DIR/unit.log"
fi

if [ "$TARGET" = "unit" ]; then
  exit 0
fi

# 3. Static & Feature Coverage Phase
if [ "$TARGET" = "all" ] || [ "$TARGET" = "static" ]; then
  echo "--- [Phase 3/4: Static Analysis & Contract Coverage] ---"
  go vet ./... | tee "$RUN_DIR/vet.log"

  if [ -x ".verify/checks/feature_coverage.sh" ]; then
    echo "Auditing feature contract step coverage..."
    .verify/checks/feature_coverage.sh .verify/features/topology-compiler.md .verify/functional/topology_compiler.txt "^CMD " | tee -a "$RUN_DIR/coverage.log"
    .verify/checks/feature_coverage.sh .verify/features/dev-orchestrator.md .verify/functional/dev_orchestrator.txt "^CMD " | tee -a "$RUN_DIR/coverage.log"
    .verify/checks/feature_coverage.sh .verify/features/production-deployer.md .verify/functional/production_deployer.txt "^CMD " | tee -a "$RUN_DIR/coverage.log"
    .verify/checks/feature_coverage.sh .verify/features/cluster-scheduler.md .verify/functional/cluster_scheduler.txt "^CMD " | tee -a "$RUN_DIR/coverage.log"
  fi
fi

if [ "$TARGET" = "static" ]; then
  exit 0
fi

# 4. Functional & Quality Gates Phase
if [ "$TARGET" = "all" ] || [ "$TARGET" = "functional" ]; then
  echo "--- [Phase 4/4: Quality Gate Suite & Functional Execution] ---"
  if [ -f ".verify/gates.conf" ] && [ -x ".verify/checks/gate_report.sh" ]; then
    .verify/checks/gate_report.sh .verify/gates.conf "$RUN_DIR"
    cat "$RUN_DIR/evidence.md"
  else
    # Fallback direct execution if gate reporter not present
    go build -o .verify/output/anode ./cmd/anode
    .verify/output/anode inspect ./testdata/sample-shop > "$RUN_DIR/sample-shop.iag.json"
    .verify/output/anode inspect ./testdata/hyper_mesh_12 > "$RUN_DIR/hyper_mesh_12.iag.json"
    .verify/output/anode dev ./testdata/sample-shop > "$RUN_DIR/sample-shop.dev.log"
    .verify/output/anode deploy root@192.168.1.100 ./testdata/hyper_mesh_12 --dry-run > "$RUN_DIR/hyper_mesh_12.deploy.log"
    .verify/output/anode cluster ./testdata/hyper_mesh_12 > "$RUN_DIR/hyper_mesh_12.cluster.log"
  fi
fi

# Link latest run
rm -rf .verify/artifacts/latest
ln -sfn "$RUN_ID" .verify/artifacts/latest 2>/dev/null || cp -r "$RUN_DIR" .verify/artifacts/latest

echo "=========================================================="
echo " ✓ Verification Suite Passed Successfully"
echo " Evidence recorded in .verify/artifacts/$RUN_ID/"
echo "=========================================================="
