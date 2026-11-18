# Steady state: bare unit vs anode unit vs Docker (2026-11-18)

Route: `GET /v1/orders/{id}` (DB-backed, Postgres 16 store, one seeded row, 200 responses).
Path: load VM `anode-loadgen` (e2-standard-4, same zone) -> Caddy on the target VM (port 80, Host header) -> orders service (port 21059). The target's firewall drops direct traffic to service ports 21040-21999, so every arm goes through Caddy.
Open-loop generator (`scripts/loadgen_open.go`): fixed rate, up to 256 in-flight. 10 s warm-up, 60 s measured.
Service CPU: `/proc/<pid>/stat` utime+stime over the measured window, as % of one core.
All three arms run the same release binary and environment; only the unit or container changes.

| Arm | Rate (target) | Achieved | 200s | p50 ms | p99 ms | p999 ms | service CPU % | service RSS |
|---|---|---|---|---|---|---|---|---|
| anode unit | 100 | 100.0 | 5,999 | 2.40 | 2.98 | 3.55 | 7.4 | 19.8 MB |
| bare unit | 100 | 100.0 | 5,999 | 2.49 | 3.14 | 3.89 | 4.2 | 20.7 MB |
| Docker | 100 | 100.0 | 5,999 | 2.27 | 2.96 | 3.52 | 4.5 | 19.5 MB |
| anode unit | 500 | 500.0 | 29,999 | 1.97 | 2.54 | 3.04 | 14.6 | 19.9 MB |
| bare unit | 500 | 500.0 | 29,999 | 2.02 | 2.62 | 3.25 | 15.4 | 19.9 MB |
| Docker | 500 | 500.0 | 29,998 | 1.83 | 2.46 | 2.97 | 14.8 | 18.8 MB |
| anode unit | 1000 | 922.2 | 55,335 | 1.80 | 2.45 | 2.94 | 25.5 | 17.0 MB |
| bare unit | 1000 | 914.6 | 54,877 | 1.86 | 2.60 | 3.13 | 25.0 | 19.1 MB |
| Docker | 1000 | 919.5 | 55,170 | 1.77 | 2.47 | 3.00 | not reported (invalid sample) | 18.7 MB |

What this shows:
- At 100 and 500 RPS the three arms are within run-to-run noise on p50, p99, and p999.
- At the 1,000 RPS target all three arms top out at about 915 to 922 RPS. That shared ceiling is the load path (client and Caddy), not the arm. This point does not separate the arms.
- Service CPU at 100 RPS: anode 7.4%, bare 4.2%, Docker 4.5%. One run each; the gap is not established as real.

Not measured:
- Caddy's own contribution (every arm goes through Caddy; no direct-port arm, because the firewall blocks direct access).
- Repeats: one run per cell.
- A 1,000 RPS point that the load path can sustain. Needs a faster generator or several generators.
- The Docker 1,000 RPS CPU sample: the PID read failed mid-run, so the value is discarded.
