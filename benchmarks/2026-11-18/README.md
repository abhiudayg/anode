# Benchmarks, 2026-11-18

Marketplace comparison (anode vs pure Docker), and port collisions with `anode dev`.
Raw per-request load logs (about 1 GB) are not committed; the summaries and tables below come from them.

## Marketplace: anode vs Docker, two orders

Host: GCE `e2-standard-8`, 32 GB, Debian 12, us-central1-a, on-demand. Same host, same stores, same routes, same binaries, same environment for both arms.
Stores: 28 anode-managed containers plus 4 hand-started (TimescaleDB, CockroachDB, ClickHouse, Scylla) = 32 store containers, running in both arms.
Migrations applied with `anode migrate` before the runs.

Protocol (`marketplace-comparison/scripts/mp_compare.sh`, `marketplace-comparison/scripts/mp_arm.sh`):
1. Functional parity: every registered route (85) requested in both arms, status codes compared.
2. Cold start: 32 services started together, page cache dropped before each trial, 5 trials. A trial whose drop or readiness fails is retried, not recorded.
3. Idle memory 20 s after ready: cgroup `memory.current` for services, RSS for services, and daemon RSS (dockerd, containerd, shims) reported separately.
4. Load: 50 closed-loop clients on `GET /healthz` through Caddy, 15 minutes, a whole-project redeploy at minute 3.

Run 1 = anode first, Docker second. Run 2 = Docker first, anode second.

| | Anode run 1 | Anode run 2 | Docker run 1 | Docker run 2 |
|---|---|---|---|---|
| Smoke, 85 routes | 41 200 / 31 400 / 3 401 / 7 404 / 3 500 | same | same | same |
| Cold start median (5 trials) | 3.36 s | 3.33 s | 5.58 s | 5.65 s |
| Services memory, cgroup | 526 MB | 533 MB | 504 MB | 511 MB |
| Services RSS | 398 MB | 404 MB | 376 MB | 380 MB |
| Daemon RSS (store containers included in both) | 696 MB | 897 MB | 1,173 MB | 1,294 MB |
| Requests / transport errors | 10.58 M / 0 | 10.82 M / 0 | 10.91 M / 0 | 10.73 M / 0 |

Transport errors are requests that got no HTTP response. Non-200 responses, including the 502s counted in the redeploy row, are reported separately.
| Load p50 / p99 | 3.67 / 12.0 ms | 3.59 / 11.8 ms | 3.55 / 11.7 ms | 3.62 / 11.8 ms |
| 502s during redeploy | 2,743 | 2,850 | 20,487 | 21,457 |
| 502 window | 300 ms | 283 ms | 2.33 s | 2.37 s |

Route-by-route smoke parity holds in both runs. The same 3 `PUT` routes return 500 in both arms (`/v1/assets`, `/v1/documents`, `/v1/media`, the S3-backed routes); not investigated.

Redeploy method:
- Anode: `anode deploy` from the Mac (builds and uploads a new release, then restarts units).
- Docker: `marketplace-comparison/scripts/mp_docker_redeploy.sh`. Builds and creates the new containers first, then batched stop, remove, rename, start. Switch measured at about 7.3 s from `prepared` to `switched`; the 502 window is the measured client-side gap.
- These are different procedures. The 502 comparison measures each arm's own redeploy method, not Docker's best method.

## Port collisions (`anode dev`)

Script: `port-collisions/collide.py`. 10 copies of `examples/sample-shop`, started together under `anode dev`.
- Result: 10 of 10 copies healthy, 20 distinct ports, all ready within 1.4 s of launch. 475 MB RSS for the 10 dev environments (dev processes and services).
- Fixed host port (Compose-style stand-in, `fixed_ports.txt`): 1 of 10 copies started, 9 failed with "port is already allocated".

Caveats:
- All copies shared one Postgres container I started by hand (`anode dev` asked for external DB URLs in `.env`), so this does not test per-copy store isolation.
- The Compose side used nginx with the same port mapping, not the sample-shop images.

## What these numbers do not show

- `/healthz` is a static 200 with no database call. "Ready" means the process is up, not that the stores answer. The load test therefore measures the Caddy and process path, not database-backed routes.
- The smoke test checks status codes, not correctness or side effects. Requests with `{}` bodies were sent to POST and PUT routes.
- Only sample-sized repos and one VM type were used for these runs.
