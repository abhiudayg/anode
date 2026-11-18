# Drain 2×2: does draining help, with and without Caddy retry? (2026-11-18)

Question: when a service is restarted under load, do requests fail, and does the app's drain or Caddy's retry change that?

Setup: OrbStack Ubuntu 26.04 arm64 VM (local, not GCE). `slowsvc` (see `slowsvc/`) serves `GET /slow1500`, which takes 1.5 s, in two modes:
- `plain`: the process exits as soon as the listener closes (the pre-fix pattern).
- `drain`: stops accepting on SIGTERM, waits for in-flight requests (up to 8 s), then exits.

Each service runs under a unit with `Restart=always`, `RestartSec=3`, `KillSignal=SIGTERM`, `TimeoutStopSec=10`. Four Caddy front ends, one per arm: `noretry` is plain `reverse_proxy`; `retry` sets `lb_try_duration 5s`, `lb_try_interval 100ms`.

Load: open loop, 20 RPS, 3 s warm-up, 25 s measured, client timeout 5 s, from the Mac over `orb.local`. SIGTERM at 8 s into the measured window. 3 runs per arm.

## Results (per run; identical across the 3 runs in every arm)

| Arm | Sent | HTTP 200 | HTTP 502 | Client error (5 s timeout) |
|---|---|---|---|---|
| plain + noretry | 499 | ~405 | 92–96 | 0 |
| drain + noretry | 499 | ~401 | 97–99 | 0 |
| plain + retry | 499 | ~474 | 0 | 24–26 |
| drain + retry | 499 | ~472 | 0 | 25–28 |

Per-run files: `results/rep{1,2,3}-{arm}.txt`.

## What this shows
- The draining service exits cleanly about 2 s after SIGTERM (`journalctl`: "Deactivated successfully"). The drain works.
- Without retry, draining does not reduce failures. It saves the in-flight requests, but it also closes the listener at SIGTERM, which lengthens the outage for new requests. The two effects roughly cancel (96 vs 97–99 failures). Per-request timing is not recorded, so the split between in-flight and new-request failures is an inference, not a measurement.
- With retry, every failure is a client-side 5 s timeout. Caddy holds requests for up to `lb_try_duration` = 5 s, the same as the client timeout, so the client gives up first. The restart gap with a drain is longer than 5 s (about 2 s drain + 3 s `RestartSec` + boot), so the hold runs out before the service is back.
- The retry window (5 s) is shorter than drain plus restart. This is the defect the data points at.

## What this does not show
- Per-request timing, so no split between in-flight and new-request failures.
- The client timeout (5 s) is the same as Caddy's hold. A longer client timeout would show whether held requests succeed later.
- Remote hosts.
- Any effect on the earlier `sigterm-drain` result. That run used `/healthz`, which is instant and has no in-flight requests to drain. Its "0 failed" came from Caddy's retry covering a restart shorter than 5 s, not from the drain.

## Not changed
The Caddy defaults (`lb_try_duration 5s`) are unchanged here. Raising the hold, or cutting `RestartSec`, is a product decision: the hold has to exceed drain + restart + boot, and that makes clients wait longer.

Reproduce: see `scripts/drain2x2-setup.sh` (run as root in the VM, after building `slowsvc` for linux/arm64) and `scripts/drain2x2-run.sh` (run on the Mac; it expects the loadgen at `steady-state/scripts/loadgen_open`).
