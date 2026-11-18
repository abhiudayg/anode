# Corpus: top Go server applications that use Docker (2026-11-18)

Question: when `anode inspect` runs on real Go applications, which ones does it analyze, and what does it miss?

## Method
- Selection: GitHub search for Go repositories mentioning Docker, ranked by stars. Excluded: awesome lists, CLI tools, libraries and frameworks, and infrastructure projects (Kubernetes, Moby, Compose, and similar). The top 25 that remain are in `pins.tsv`.
- Pinning: each repo is pinned to the default branch HEAD at the time of the run (`pins.tsv`).
- Run: shallow clone at the pinned SHA, then `anode inspect .` with a 15-minute timeout. Results are in `outcomes.tsv`.
- Scope: analysis only. No deploy was attempted, so "N/25 deploys with zero manual overrides" is not measured here.
- Two repos (etcd, prometheus) and vault were rerun after a setup mistake (see below). Raw logs and clones are kept outside the repo; they are large.

## Result
- **16 of 25** produced a lockfile.
- **9 did not**:
  - 4 are a build problem in the repo or its toolchain: syncthing (generated assets missing: `auto.Assets`), alist and photoprism (cgo headers: `fuse.h`, `tensorflow/c/c_api.h`), CasaOS (a dependency version that cannot be resolved, and `unix.MS_*` constants missing on this platform).
  - 2 have the module not at the repo root: Wei-Shaw/sub2api and 1Panel. Anode expects `go.mod` at the root; the error is `pattern ./...: directory prefix . does not contain main module`.
  - **2 are anode crashes**: seaweedfs and router-for-me/CLIProxyAPI both die with `fatal error: stack overflow`.
  - 1 timed out: hashicorp/vault, at 15 minutes, with no output.

## Anode bug: unbounded recursion in taint tracing
`internal/analyzer/taint.go`: `traceToEnvVarWithDepth` bounds its own depth at 25, but `FindStoreToAlloc`, `TraceCapturedVar`, and `TraceFieldAddrSource` call `TraceToEnvVar` again. That call starts a new trace with depth 0 and a new visited set, so a cycle through these helpers never reaches the limit. The stack shows `traceToEnvVarWithDepth → TraceToEnvVar → FindStoreToAlloc → …` repeating until the goroutine stack overflows. The fix is to carry one trace context (depth and visited set) through every helper. That is a refactor, so it is not in this change.

## What the 16 lockfiles show (most common diagnostics)
- **gRPC client with no server in the workspace** (`has no matching server registration`): the most common message, across etcd, traefik, beszel, gitea, memos, and Xray. Many of these are clients of gRPC APIs that the project does not serve, so the warning is probably noise. It needs a check before it is trusted.
- **Database or Redis connection opened inside a dependency**: gitea, 21 times. Anode reports it but does not bind it to a store. This is the ORM case from the support matrix.
- **Environment variable name built at runtime**: gitea, 14 times. The name is not recorded, so the binding is missing.

## Reruns
- etcd and prometheus failed the first time because `GOFLAGS=-mod=mod` was set in the runner. That is incompatible with workspace mode. Rerun without it: both pass.
- vault: the first run failed with the same `GOFLAGS` error. The rerun timed out at 15 minutes.

## Not in this run
- Deploy success per repo.
- Routers the analyzer does not recognize (gin, echo, fiber, per the support matrix). Routes registered through them are missing from these counts. Not checked per repo.
