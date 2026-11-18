# Failure matrix, anode units on GCE e2-standard-8 (2026-11-18)

Host and state: the same VM as the marketplace comparison, 32 anode units and 32 store containers running. Load: `loadgen` from the VM at 127.0.0.1 with the Caddy Host header, 50 or 10 closed-loop clients. Unit: `anode-orders`, `Restart=always`, `RestartSec=3`.

| Scenario | Command | Observed | Downtime / error window | Recovery |
|---|---|---|---|---|
| SIGTERM with 50 clients on `/healthz` | `systemctl kill -s TERM anode-orders` | 198,766 connection errors of 931,772; 0 non-200 responses | one contiguous window, 3.37 s | automatic, `Restart=always` after 3 s plus boot |
| Postgres down 10 s, `GET /v1/orders/{id}`, 10 clients | `docker stop anode-db-orders-postgres` for 10 s | 96,013 responses 500 during the outage; 404 (not found) before and after | 500s from 377,361 to 387,956 ms (10.6 s) | immediate once Postgres returns; no service restart |
| Port taken (`:21059` held by another process) | stop unit, bind port, start unit | journal: `listen tcp :21059: bind: address already in use`, `status=1/FAILURE`, restart every about 4 s | service down until the port was freed | automatic after the port was freed |

Not run, with reasons:
- **OOM under `MemoryMax`:** the unit sets no `MemoryMax`, `MemoryHigh`, or `TasksMax`. There is no limit to test. This is a gap in the unit template, not a result.
- **Crash-loop 100x:** the port-taken run already shows the restart loop; `Restart=always` has no start limit, so it retries indefinitely at 3 s intervals.
- **Bad migration, non-compiling deploy, full disk, deploy while the old release is unhealthy:** not run. A non-compiling deploy would need a copy of the project and a build step that could touch the shared host; not worth the risk here.

Findings:
- Services have no graceful shutdown: SIGTERM exits immediately, so every request in flight at that moment fails. The 3.4 s window is the restart delay and boot time.
- A DB outage shows up as 500s for exactly the outage length, with no restart needed when the database returns.
- The unit template has no memory or task limits.
