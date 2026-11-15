#!/usr/bin/env bash
# Starts the live infrastructure, waits until the Temporal gRPC port accepts connections, runs the tests tagged
# live, and stops the infrastructure.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f infra/compose.yaml up -d --wait
trap 'docker compose -f infra/compose.yaml down' EXIT
for _ in $(seq 1 60); do
	if (exec 3<>/dev/tcp/127.0.0.1/7233) 2>/dev/null; then break; fi
	sleep 1
done
export TEMPORAL_LIVE_ADDR=127.0.0.1:7233
go test -count=1 -tags live -v -run AgainstTemporalServer ./services/disputes ./services/workflows
