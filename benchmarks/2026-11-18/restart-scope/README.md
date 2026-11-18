# Restart scope: change one of 12 services, check the rest (2026-11-18)

Question: when one service changes, does anode restart only that service, and do the other 11 keep serving?

Setup: a synthetic 12-service Go project (`project/`), deployed with `anode deploy` to a local OrbStack Ubuntu 26.04 VM (not GCE) over SSH, `--plain-http`. Each service answers `GET /healthz` with its name, version, and PID. Load: open loop, 10 RPS per service, from the Mac, through Caddy on the VM. Per-service `status_err` counts transport errors (no HTTP response); HTTP status codes are reported separately.

## Result: the restart is scoped
- No-change deploy: 12 of 12 "unchanged, not restarted". No uploads. All 12 PIDs identical before and after (`out/pids-before-deploy2.txt`, `out/pids-after-deploy2.txt`).
- Change `svc07` only: 11 unchanged, 1 uploaded and restarted. Only `svc07`'s PID changed (`out/pids-before-change.txt`, `out/pids-after-change.txt`).
- `svc07` had 0 failed requests through its own restart (1,004 sent, 1,004 HTTP 200). Caddy's 15 s hold covered the restart.

## Result: the other 11 had no HTTP 5xx, but not zero failures
Across the change deploy (`out/change-svc07-v2-svc*.txt`), each unchanged service had 1–7 transport errors per ~1,000 requests, and zero 5xx responses. So "no 5xx on the other 11" holds, but "zero failed requests" does not.

Two other runs show the same kind of noise:
- The first no-change deploy (`deploy2-nochange`) had 17–34% transport errors. That run followed a change from a domain site (HTTPS) to an IP site (HTTP) in the Caddy config. A repeat no-change deploy (`deploy3-repro`) had 1–2 per service per 120 s. That suggests the big burst was a one-time config transition.
- Baseline with no deploy (`baseline-idle`): zero errors in ~300 requests per service.

## What was ruled out as the source of the errors
- Service restarts: none in the no-change runs (the journal shows no stop or restart events in that window).
- Caddy reload alone under load (`caddy-reload-test`): zero errors.
- Mac cross-compiling during load (`cpu-load-test`): zero errors.
- `systemctl daemon-reload` ×12 under load (`daemon-reload-test`): zero errors.
- Binary uploads over SSH under load (`upload-test`): zero HTTP errors.

Not ruled out: the residual transport errors during deploys. The cause is not identified. The likely candidates are the remaining deploy steps (the Caddy reload that follows the file writes, and pruning), but none was tested in isolation at the same time.

## Caveats
- One change, one run per condition. The residual error rate is small and per-run noise is not characterized.
- Local VM, load from the Mac over `orb.local`.
- The per-service requests are on different paths on one Caddy, so the test shows the restart is scoped, not per-process isolation under heavy load.
- `scp` to the VM was reset by sshd when many uploads ran at once. That is an SSH limit on the test VM. It did not affect HTTP.
