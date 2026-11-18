# SIGTERM drain, before and after (2026-11-18)

Question: when a service is restarted under load, do in-flight or new requests fail?

Setup: OrbStack Ubuntu 26.04 arm64 VM (local, not GCE). `examples/marketplace/services/orders` on :9020 under a systemd unit with `Restart=always`, `RestartSec=3`, `KillSignal=SIGTERM`, `TimeoutStopSec=10`. Caddy on :8080 in front. 50 closed-loop clients on `GET /healthz` through Caddy, 20 s. `systemctl kill -s TERM` at t=8 s. Load runs on the same VM, so the numbers are not network-accurate.

| Arm | Binary | Caddy | Requests | Transport errors | Non-200 | Error window |
|---|---|---|---|---|---|---|
| old | before this change (no SIGTERM drain) | `reverse_proxy` only | 715,459 | 0 | 118,047 (503 from Caddy) | 3.14 s |
| new run 1 | SIGTERM drain | `lb_try_duration 5s`, `lb_try_interval 100ms` | 606,324 | 0 | 0 | none |
| new run 2 | same | same | 581,822 | 0 | 0 | none |
| new run 3 | same | same | 573,464 | 0 | 0 | none |

What changed:
- `internal/deployer/systemd.go`: unit gets `KillSignal=SIGTERM` and `TimeoutStopSec=10`. Caddy routes get `lb_try_duration 5s` so requests wait for the restarting upstream instead of failing.
- `examples/marketplace/services/orders/main.go`: stops accepting on SIGTERM, drains in-flight requests (8 s cap), then exits.

What this does not show:
- Latency. Requests that arrive during the restart wait until the service is back, up to about 3 s. p99 during the gap was not measured.
- Services that do not drain. The unit settings only give them time; a service that exits on SIGTERM without `Shutdown` still drops in-flight requests. The orders example is the reference.
- The 2026-11-18 GCE failure matrix (21% errors) is the production-like number; this is a local rerun of the same shape.

Reproduce:
```
cd loadgen && GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -o ../loadgen . && cd ..
# build the new orders binary from examples/marketplace/services/orders/main.go
sudo S=$PWD ./drain_test.sh <orders-binary> Caddy.new NEW
```
