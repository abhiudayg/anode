---
name: Feature Request
about: Suggest a new feature, CLI utility, or catalog driver for Anode
title: "[FEAT]: "
labels: ["enhancement"]
assignees: ""
---

### Problem Statement
<!-- Is your feature request related to a problem? Please describe. -->

### Proposed Solution / Utility Design
<!-- Describe the feature, CLI command flag, or new database driver template you would like to see. -->

### Invariant Compliance
Does this proposal preserve the 4 Proof-of-Topology Pillars?
- [ ] **Zero-SDK Rule**: Does not require user applications to import custom Anode packages.
- [ ] **Deterministic Lockfile**: Can be serialized into reproducible `anode.lock.json`.
- [ ] **Zero Port Collisions**: Works with dynamic loopback port allocations (`127.0.0.0/8`).
- [ ] **Least-Privilege Security**: Respects `DynamicUser=yes` and Linux cgroups v2 limits.

### Alternative Approaches Considered
<!-- Any alternative solutions or workarounds you've considered. -->
