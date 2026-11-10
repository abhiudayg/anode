#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p .verify/artifacts .verify/output

echo "=== 1. Building anode binary ==="
go build -o .verify/output/anode ./cmd/anode

echo "=== 2. Running static analysis & vet ==="
go vet ./...

echo "=== 3. Running unit & integration tests ==="
go test -v ./internal/... | tee .verify/artifacts/test.log

echo "=== 4. Testing CLI inspect on sample-shop ==="
.verify/output/anode inspect ./testdata/sample-shop > .verify/artifacts/sample-shop.iag.json

echo "=== 5. Testing CLI inspect on hyper_mesh_12 ==="
.verify/output/anode inspect ./testdata/hyper_mesh_12 > .verify/artifacts/hyper_mesh_12.iag.json

echo "=== 6. Testing CLI dev planning on sample-shop ==="
.verify/output/anode dev ./testdata/sample-shop > .verify/artifacts/sample-shop.dev.log

echo "=== 7. Testing CLI deploy synthesis on hyper_mesh_12 ==="
.verify/output/anode deploy root@192.168.1.100 ./testdata/hyper_mesh_12 --dry-run > .verify/artifacts/hyper_mesh_12.deploy.log

echo "=== Verification Suite Passed Successfully ==="
