# Examples

Small Go services used to exercise Anode's analysis, dry-run deploy, and tests. Each example has its own README.

| Example | Services | What it covers | Used by |
| :--- | :---: | :--- | :--- |
| [`sample-shop/`](sample-shop/README.md) | 2 | Two HTTP services with Postgres and direct env vars | Tests, `anode doctor` help, deploy walkthroughs |
| [`complex-ecommerce/`](complex-ecommerce/README.md) | 3 | Composite DSN formatting, pre-traffic migrations, external egress (Stripe, SendGrid) | README quick start, `anode dev` and `deploy --dry-run` |
| [`omni-mesh-32/`](omni-mesh-32/README.md) | 32 | All 32 store resources detected; Kafka and Qdrant calls are not | `anode cluster` help |
| [`hyper-mesh-12/`](hyper-mesh-12/README.md) | 12 | Config indirection, composite DSNs, mixed gRPC and REST, external egress, dead code | `internal/analyzer` test fixture (`testdata` links here) |

The examples in this directory are fixtures, not production applications. Other example projects that used to live here were removed in v1.4.0; they remain in git history.

## Verification

```bash
# Extract the lockfile
anode inspect ./examples/sample-shop
anode inspect ./examples/complex-ecommerce

# Synthesize a deploy plan without touching a host
anode deploy root@127.0.0.1 ./examples/complex-ecommerce --dry-run

# Run the Go test suite, including the analyzer tests that read these fixtures
go test ./...
```
