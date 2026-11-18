# Drain 2×2, rerun with a 15 s Caddy hold (2026-11-18)

Follow-up to `drain-2x2/`. That run used a 5 s Caddy hold and a 5 s client timeout. Its retry arms failed at the client timeout, because the restart outlasted the hold. This run uses the new defaults and a 15 s client timeout.

Changes from the first run:
- Caddy retry arms: `lb_try_duration 15s` (was 5 s).
- Client timeout: 15 s (was 5 s; the loadgen's `-timeout` flag was added for this).
- Units: unchanged `RestartSec=3`, plus a start limit in the template (5 starts in 60 s). The start limit is not exercised in this run.

Setup is the same as the first run: `slowsvc` in plain and drain modes, four Caddy front ends, 20 RPS on a 1.5 s route, SIGTERM 8 s into a 25 s measured window, 3 runs per arm, on a local OrbStack VM.

## Results (per run)

| Arm | Sent | HTTP 200 | HTTP 502 | Client error | p99 ms |
|---|---|---|---|---|---|
| plain + noretry | 498–499 | 403–405 | 94–95 | 0 | ~1,515–1,529 |
| drain + noretry | 499 | 403–406 | 93–96 | 0 | ~1,512–1,531 |
| plain + retry | 499 | 499 | 0 | 0 | ~5,933–6,195 |
| drain + retry | 499 | 499 | 0 | 0 | ~5,996–6,186 |

Per-run files: `results/rep{1,2,3}-{arm}.txt`.

## What this shows
- With the 15 s hold, retry arms have no failed requests in any run. The first run's failures were the client timeout, not the platform.
- The hold has a cost. Requests that arrive during the restart wait about 6 s, so p99 for the retry arms is about 6 s. The no-retry arms show ~1.5 s, the route's own time.
- Without retry, drain still does not reduce failures (~94 vs ~95 per run). The drain saves in-flight requests, but it closes the listener at SIGTERM, which lengthens the outage for new requests. The two effects cancel, as in the first run.
- In the retry arms, the plain service also has zero failures. Caddy appears to retry the in-flight GET after the connection drops, which the drain would otherwise have prevented. So with retry, this experiment cannot isolate the drain's own contribution. The no-retry arms are the only ones where the drain's effect shows, and there it is neutral.

## What this does not show
- Per-request timing, so no split of failures between in-flight and new-request. Retry masks it.
- Non-idempotent requests (POST). Caddy's retry behavior for those was not tested here.
- Remote hosts. This is a local VM with the load generator on the Mac.
- The start limit under real crash-loops in the deployed template (probed separately: a unit that exits immediately reaches `failed` with "Start request repeated too quickly").

Reproduce: `scripts/drain2x2-setup.sh` (root in the VM, after building `slowsvc` for linux/arm64) and `scripts/drain2x2-run.sh` (Mac; loadgen built from `steady-state/scripts` with the `-timeout` flag).
