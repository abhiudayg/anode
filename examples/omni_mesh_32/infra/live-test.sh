#!/usr/bin/env bash
# Starts the live infrastructure, waits for each store port, runs the tests tagged live, and stops the infrastructure.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose -f infra/compose.yaml up -d --wait
trap 'docker compose -f infra/compose.yaml down' EXIT
wait_port() {
	for _ in $(seq 1 120); do
		if (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; then return 0; fi
		sleep 1
	done
	echo "port $1 did not open" >&2
	return 1
}
for port in 7233 15432 16379 16380 13306 27018 5673 9001 11212 16333; do wait_port "$port"; done
export TEMPORAL_LIVE_ADDR=127.0.0.1:7233
go test -count=1 -tags live -v ./services/disputes ./services/workflows -run AgainstTemporalServer
go test -count=1 -tags live -v ./livetest -timeout 15m
