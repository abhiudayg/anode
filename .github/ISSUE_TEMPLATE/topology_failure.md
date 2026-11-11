---
name: Proof-of-Topology Failure (SSA AST Parser)
about: Report a failure where Anode SSA missed a route, database driver, or secret choke point
title: "[SSA TOPOLOGY]: "
labels: ["compiler", "ssa", "topology-bug"]
assignees: ""
---

### Framework & Router
<!-- Which HTTP router, database driver, or ORM was not detected? (e.g. Gin v1.9, Chi v5, Fiber v3, pgx v5, GORM) -->
- **Router / Web Framework**: 
- **Database Driver / Client**: 
- **Migration Framework**: (Goose / Golang-Migrate / None)

### Go Code Snippet (Choke Point)
<!-- Provide the minimal Go code snippet where the database or handler is initialized. -->
```go
package main

func main() {
    // Paste minimal reproducible code here
}
```

### Anode Inspect Output
<!-- What did `anode inspect -v` output? -->
```
```

### Expected Discovered Endpoints or Resources
<!-- What routes or databases should have been included in anode.lock.json? -->
- Discovered Ingress:
- Discovered Backing Stores:
- Injected Environment Variables:
