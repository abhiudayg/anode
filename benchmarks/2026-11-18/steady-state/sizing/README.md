# Sizing: smallest VM that holds the p99 SLO (2026-11-18)

Workload: the orders route only, `GET /v1/orders/{id}` against its Postgres 16 store (one seeded row). Everything else on the target stopped: one service unit and one store container running; 657 MB of 7.9 GB used.
Load: open-loop 500 RPS, 10 s warm-up, 60 s measured, from `anode-loadgen` through Caddy.
SLO (chosen for this test): p99 <= 10 ms and zero errors.

Prices, GCE E2 us-central1 (Iowa, pricing for the Americas SKU group), from the Cloud Billing Catalog API, effective 2026-11-17:
- E2 core: $0.02181159 per vCPU-hour; RAM: $0.00292353 per GiB-hour.
- e2-standard-2 (2 vCPU, 8 GiB): $0.0670/h, $48.92 per 730 h.
- e2-standard-4: $0.1340/h, $97.84 per 730 h. e2-standard-8: $0.2680/h, $195.67 per 730 h.
- e2-small: no separate SKU found in the catalog results, so its price is not stated here.

| Arm | Achieved | 200s | p99 ms | Errors | Holds SLO on e2-standard-2 |
|---|---|---|---|---|---|
| anode unit | 500 | 29,999 | 6.25 | 0 | yes |
| bare unit | 500 | 29,999 | 3.84 | 0 | yes |
| Docker | 500 | 29,999 | 3.74 | 0 | yes |

Caveats:
- One run per arm. The anode p99 here (6.25 ms) is higher than the bare and Docker runs, and higher than the 2.45 ms from the e2-standard-8 run; it is not repeated, so treat the gap as unconfirmed.
- The smallest machine tested is e2-standard-2. e2-small was not tested, since no verified price exists for it.
- The memory figure (657 MB used) is for the orders footprint only; the full 32-service stack was not sized.
