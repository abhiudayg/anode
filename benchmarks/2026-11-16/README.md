# Benchmarks, 2026-11-16

Raw scripts and results behind the figures on the anode website and the blog post
"why we ditched docker for go backends". Each result file is the output of the script with the same name.

## Environment

- Host: Apple Silicon Mac (arm64), macOS 27.2.
- Linux target: OrbStack machine `anode-bench`, Debian 12 (bookworm), arm64, 7 vCPU, 8 GB RAM, systemd as PID 1.
- Docker 20.10.24. PostgreSQL 15 (apt on the VM for the anode arm; `postgres:15` container for the Docker arm).
- anode 1.6.0 (`anode inspect`, `anode deploy --plain-http`). Services are static Linux builds with `CGO_ENABLED=0 -trimpath`, identical in both arms.
- Tekmor 1.0.0; claude CLI 2.1.325 for the LLM-judge baseline.

## Method and results

### 1. Analyzer time (`anode inspect`)
Script: `scripts/anode_bench.sh`. Result: `results/anode_results.tsv`.
Median of 5 runs per example app on the Mac. Lockfile hash identical in all 20 runs.

| Fixture | Services | Store resources | Median time | Median peak RSS |
|---|---:|---:|---:|---:|
| sample-shop | 2 | 2 | 1.10 s | 685 MB |
| storefront | 3 | 2 | 1.19 s | 712 MB |
| retail-platform | 12 | 6 | 2.21 s | 991 MB |
| marketplace | 32 | 35 | 8.81 s | 2,792 MB |

Peak RSS is analyzer memory at build time, not service memory.

### 2. Cold start, single service
Scripts: `scripts/precise_coldboot.sh`, `scripts/unit_variants.sh`, `scripts/unit_split.sh`.
Results: `results/coldstart_precise_single_service.tsv`, `results/unit_variants.tsv`, `results/unit_split.tsv`.
Clock: bash `EPOCHREALTIME`. Ready: TCP connect and HTTP 200 on `/healthz`. Page cache dropped before each run. 10 runs per arm.

| Arm | Median | Range |
|---|---:|---:|
| direct exec, no supervisor | 4.7 ms | 3.7 to 6.9 ms |
| bare systemd unit (`ExecStart` only) | 11.1 ms | 9.9 to 17.2 ms |
| anode unit without `DynamicUser` | 12.0 ms | 11.1 to 15.7 ms |
| anode unit as deployed | 34.9 ms | 31.9 to 36.8 ms |
| Docker container (`docker run -d`) | 607 ms | 592 to 914 ms |

`DynamicUser` accounts for about 20 ms of the anode unit's cold start. The sandbox directives account for about 1 ms.
`results/coldboot_curl_superseded.tsv` is from an earlier curl-based run; it is kept for transparency and is superseded by the table above.

### 3. Idle memory, single service
Script: `scripts/run_coldboot.sh` (memory phase). Result: `results/idle_single_service.tsv`.
Measured 20 s after the health check passed.

| Process | RSS |
|---|---:|
| anode service (no daemon) | 5.5 MB |
| Docker: service process | 5.8 MB |
| Docker: dockerd, containerd and shims | 96.6 MB (a second run: 101 MB) |
| Docker total | 102 to 106 MB across runs |

### 4. Multi-service stack: sample-shop, PostgreSQL 15 (anode vs Docker)
Script: `scripts/stack_bench.sh`. Results: `results/stack_coldstart.tsv`, `results/stack_idle.tsv`.
Stack: `orders` and `payments` services, one PostgreSQL 15 server with two databases (`orders`, `payments`), same credentials and environment in both arms.
Ready: both `/healthz` return 200 and `pg_isready` succeeds. After the timed runs, each database was checked once per arm with `SELECT 1` (both returned 1 in both arms; command run by hand, not in the script).
10 interleaved runs per arm.

| Arm | Median to ready | Range |
|---|---:|---:|
| anode: apt PostgreSQL + two anode units | 2,373 ms | 2,364 to 2,388 ms |
| Docker: `postgres:15` container + two containers | 1,616 ms | 1,498 to 1,734 ms |

Most of the anode arm's time is Debian's PostgreSQL startup. Measured alone (`scripts/pg_alone.sh`, `results/pg_alone.tsv`, 5 runs):
apt PostgreSQL median 2,373 ms; the `postgres:15` container median 642 ms.
The gap is database packaging, not the services: the two service units start in about 35 ms each.

Idle memory (20 s after ready; `results/stack_idle.tsv`):

| | anode | Docker |
|---|---:|---:|
| PostgreSQL, all processes | 75.2 MB | 68.6 MB |
| orders service | 6.5 MB | 6.8 MB |
| payments service | 6.4 MB | 6.1 MB |
| Docker daemons (dockerd, containerd, shims) | none | 120.0 MB |
| **Total** | **88.1 MB** | **201.5 MB** |

The anode arm also runs Caddy as the edge proxy (13.8 MB RSS). It is excluded from the total above because the Docker arm has no equivalent edge.

### 5. Deploy and build time
Results: `results/deploy_times.txt`, `results/docker_build_times.txt`.

- `anode deploy root@<vm> . --plain-http`, 5 runs, wall time: median 5.1 s (6.2 s on the first run, before the Go build cache was warm).
  This includes cross-compiling both services, uploading them, starting them and updating Caddy.
- `docker build --no-cache` of both service images from the same prebuilt binaries, 5 runs: median 2.0 s.

These two numbers are not like-for-like: the anode figure includes compilation and the edge proxy, the Docker figure does not.

### 6. Tekmor overhead and the LLM-judge baseline
Scripts: `scripts/tekmor_bench.sh`, `scripts/llm_bench.sh`, `scripts/judge_bench.sh`.
Results: `results/tekmor_results.tsv`, `results/llm_results.tsv`, `results/judge_results.tsv`, `results/llm-bridge-direct.log`, `results/judge_log.txt`.

- Tiny Go fixture, 10 runs: direct `go test` median 0.24 s; `tekmor verify` median 0.34 s.
- llm-bridge (`pnpm -r --if-present test`), 5 runs: direct median 35.68 s; `tekmor verify` median 35.80 s.
- LLM judge: the claude CLI reads the llm-bridge log and answers PASS or FAIL. 5 calls: median wall time 4.5 s; all answers PASS.
  Reported tokens per call median 46,204, of which about 40k are CLI overhead (system context) and about 3.5k are the log.
  Cost per call: $0.0006 to $0.009, depending on cache hits.

### 7. Tekmor memory
`tekmor verify receipt` peak RSS, 5 runs: median 8.3 MB. Measured with `/usr/bin/time -l`.

## Caveats

- One laptop, one VM, one service set. No remote production host.
- The Docker arm uses default `docker run` settings. The anode unit has its limits and hardening.
- Postgres on the anode arm was installed by hand on the VM. `anode deploy` did not install the stores: the stores are declared `runtime = "binary"` and the deploy expected the databases to exist.
- Sample-shop's handlers do not query the database, so `/healthz` alone would not show a working database. The readiness check therefore includes `pg_isready` and a `SELECT 1` per database.
- Not measured: a remote VPS, larger service counts with Postgres, and the Caddy route-swap time.

## 8. Remote host: Google Compute Engine (e2-small, us-central1-a)

Scripts: `scripts/gcp/gcp_bench.sh` (runs on the VM). Results: `results/gcp/results.tsv` (cold start and idle memory, both arms).

Host: Debian 12 (bookworm), x86_64 e2-small (2 vCPU shared, 2 GB RAM), 10 GB pd-standard disk, Spot provisioning, default VPC. Docker 20.10.24. The same anode release binary runs in both arms. The VM was created for this run and deleted afterwards.

Deploy: `anode deploy anode@<public-ip> . --plain-http`, after the host preparation described below.

| Measure | anode unit | Docker container |
|---|---:|---:|
| Cold start to `/healthz` 200, median of 10 (page cache dropped) | 489 ms (range 188 to 744 ms) | 1,670 ms (range 1,474 to 2,368 ms) |
| Idle service RSS, 20 s after ready | 5.6 MB | 6.5 MB |
| Idle daemons RSS (dockerd, containerd, shims) | none | 147.5 MB |
| Caddy edge RSS (anode arm only) | 48.7 MB | not applicable |

Public round-trip: retracted. The 507 ms figure from the first GCE run measured Caddy's empty fallback response, not the service, because the route was not declared in the lockfile (see section 9). It is not a valid result and has been removed from the site.

Compared with the laptop VM in section 2, the anode cold start is about 14 times slower on this host. This VM is a shared-core instance with a network-attached disk, and the page cache is dropped before every run, so each start reads the binary and runtime from disk. We did not profile the cause further.

How the host was prepared:

- `anode host-setup` requires a root login. GCE disables root SSH (`PermitRootLogin no`), and we did not change that setting. We reproduced the three steps `host-setup` performs as the sudo-capable user: create the `anode` user, install the deploy key, and add `anode ALL=(root) NOPASSWD: ALL` in `/etc/sudoers.d/anode-deploy`.
- The public firewall rule was limited to the operator's address. Both the VM and the rule were removed after the run.

## 9. Caddy route-swap time (GCE, one service)

Scripts: `scripts/gcp/route_swap_probe.sh` (polls `/version` through Caddy every 50 ms from the VM), and the deploy command on the operator's Mac. Results: `results/gcp/route-swap/` (probe logs for three deploys, plus the systemd journal for one of them).

Setup: one service that returns its version string, deployed with `anode deploy`. Each deploy replaces the release with the next version (v4 to v5, v5 to v6, v6 to v7). The probe records every response with its version or failure.

| Run | Requests sampled | Last old-version response to first new-version response | Failed requests (502) |
|---|---:|---:|---:|
| 1 (v4 to v5) | 625 | 148 ms | 1 |
| 2 (v5 to v6) | 908 | 152 ms | 1 |
| 3 (v6 to v7) | 909 | 143 ms | 1 |

Connection failures to Caddy: none in any run. In run 1 the journal shows the service stopped at .2955 and started again at .3073 (about 12 ms with no process), and the 502 came about 20 ms after the new process started, before the new version was reachable through Caddy. The probe samples every 50 ms, so the window is accurate to about ±50 ms.

What this means: a redeploy is a restart in place, as the architecture page says. A client sees a failed request and a window of roughly 150 ms during which the old and new versions are not served. This was measured with one service and one probe at 50 ms intervals, with a steady request stream. It does not cover concurrent load, long-running requests, or multi-service restarts.

## 10. Multi-service stack on GCE (sample-shop, two services and PostgreSQL 15)

Script: `scripts/stack_bench.sh` (section 4), run on the VM. Results: `results/gcp/stack_2svc_postgres.txt`.

Ready means both health checks return 200 and `pg_isready` succeeds. Median of 10 interleaved runs.

| Arm | Ready (median) | Range |
|---|---:|---:|
| anode: apt PostgreSQL and two anode units | 4,463 ms | 4,166 to 4,646 ms |
| Docker: postgres:15 container and two containers | 4,132 ms | 3,991 to 4,433 ms |

Idle memory after 20 s: anode 83.7 MB (PostgreSQL 67.8 MB, orders 6.9 MB, payments 8.9 MB). Docker 274 MB (PostgreSQL 62.7 MB, services 16.7 MB, daemons 194.5 MB). Caddy adds 45.1 MB on the anode side and is excluded from the total.

On this VM the database start dominates both arms, and the gap is small. The laptop VM result in section 4 is much larger for the anode arm, because apt PostgreSQL starts more slowly here than on the laptop.

## 11. Larger service count with a database (GCE, 12 services)

Scripts: `scripts/gcp/many_bench.sh`. Results: `results/gcp/many12_postgres.txt`.

The services are synthetic, not a real application. Each one is a Go `net/http` service that opens its own PostgreSQL database with `database/sql` and `lib/pq`, and its `GET /healthz` pings that database. Every service runs `anode inspect` and `anode deploy` as a separate unit. There are 12 services, 12 databases, one PostgreSQL 15 server, and the same binaries in both arms.

Deploy: `anode deploy` for all 12 services took 201 seconds of wall time, including cross-compiling each binary. The first build of the module had to download `lib/pq`; a later deploy would be shorter, but we did not measure that.

Ready means all 12 health checks return 200. Each check pings its own database. Median of 5 runs.

| Arm | Ready (median) | Range |
|---|---:|---:|
| anode: apt PostgreSQL and 12 anode units | 10.9 s | 10.4 to 11.2 s |
| Docker: postgres:15 container and 12 containers | 8.9 s | 8.7 to 9.1 s |

Idle memory after 20 s: anode 112 MB across the 12 services, plus PostgreSQL 226 MB. Docker 101 MB across the 12 containers, plus PostgreSQL 214 MB, plus 339 MB of daemons. Caddy adds 52 MB on the anode side and is excluded.

Two findings from this run:

- Docker was faster to ready here. The anode arm's extra time is mostly PostgreSQL startup and unit start-up order; we did not profile it further.
- With 12 services, all declaring `GET /healthz`, Caddy's generated config sends `/healthz` to a single service. The other services are not reachable through the public route. This is a routing gap in the generated edge configuration, and it did not affect the readiness measurements, which hit each service's own port.

Notes on this run: the first Docker arm did not become ready because the Postgres container had been created earlier for a smaller stack and never received the 12 new databases. That run is excluded. The results above come from a rerun after the roles and databases were created.
