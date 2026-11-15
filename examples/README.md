# Examples

Go services that Anode analyzes, dry-run deploys, and tests against. Each example has its own README with its services, the lockfile Anode writes for it, and how to run it.

| Example | Services | Stores | What it covers |
| :--- | :---: | :--- | :--- |
| [`sample-shop/`](sample-shop/README.md) | 2 | PostgreSQL | Two HTTP services, direct env vars, the `doctor` contract check |
| [`storefront/`](storefront/README.md) | 3 | PostgreSQL ×2 | Composite DSNs, Goose migrations, Stripe and SendGrid egress |
| [`retail-platform/`](retail-platform/README.md) | 12 | PostgreSQL ×4, Redis ×2, ClickHouse | Config indirection, HTTP and gRPC links, a pruned dead helper |
| [`marketplace/`](marketplace/README.md) | 32 | 11 store kinds, 32 resources | Large-scale analysis, Temporal workers, live store tests |

These are fixtures for Anode's analysis, not production applications. Other example projects that used to live here were removed in v1.4.0 and remain in git history.

## Use

```bash
# Extract the lockfile for an example
anode inspect ./examples/storefront

# Plan a deploy without touching a host
anode deploy root@127.0.0.1 ./examples/storefront --dry-run

# Run the analyzer tests, which read retail-platform and the other fixtures
go test ./internal/analyzer
```

Each example is its own Go module, so `go build ./...` and `go test ./...` also work inside an example directory.
