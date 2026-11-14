# Examples

Small Go services used to exercise Anode's analysis, dry-run deploy, and tests. Each example has its own README.

| Example | Services | What it covers | Used by |
| :--- | :---: | :--- | :--- |
| [`sample-shop/`](sample-shop/README.md) | 2 | Two HTTP services with Postgres and direct env vars | Tests, `anode doctor` help, deploy walkthroughs |
| [`complex_ecommerce/`](complex_ecommerce/README.md) | 3 | Composite DSN formatting, pre-traffic migrations, external egress (Stripe, SendGrid) | README quick start, `anode dev` and `deploy --dry-run` |
| [`omni_mesh_32/`](omni_mesh_32/README.md) | 32 | 14 of 35 store connections detected by Anode; 21 undetected | `anode cluster` help |
| [`hyper_mesh_12/`](hyper_mesh_12/README.md) | 12 | Config indirection, composite DSNs, mixed gRPC and REST, external egress, dead code | `internal/analyzer` test fixture (`testdata` links here) |

The examples in this directory are fixtures, not production applications. Other example projects that used to live here were removed in v1.4.0; they remain in git history.

## Verification

```bash
# Extract the lockfile
anode inspect ./examples/sample-shop
anode inspect ./examples/complex_ecommerce

# Synthesize a deploy plan without touching a host
anode deploy root@127.0.0.1 ./examples/complex_ecommerce --dry-run

# Run the Go test suite, including the analyzer tests that read these fixtures
go test ./...
```
