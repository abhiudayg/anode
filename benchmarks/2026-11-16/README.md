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
