# Anode Tradeoffs, Boundaries & Non-Goals

Honest engineering requires being explicit about what a tool **refuses to do**, where it excels, and the fundamental tradeoffs inherent in its architecture.

This document serves as an architectural critique of Anode, comparing it against industry alternatives (Kubernetes, Docker Compose, Encore, Terraform) and detailing its intentional non-goals.

---

## 1. Architectural Comparison Matrix

| Capability | Anode | Kubernetes / Helm | Docker Compose | Encore.dev | Terraform / Pulumi |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Code Invasiveness** | **Zero SDK** (Standard Go) | Zero SDK | Zero SDK | **High** (Proprietary SDK) | Zero SDK |
| **Configuration Overhead** | **Zero YAML** (`anode.lock.json` auto-generated) | Heavy (400+ lines YAML/CRDs) | Medium (Compose YAML) | Zero YAML (Annotation-driven) | Heavy (HCL / State files) |
| **Dead-Code Elimination** | **Yes** (Mathematical VTA) | No | No | Yes (Compiler-driven) | No |
| **Database Auto-Provisioning** | **Yes** (Migration-Proven) | Manual (Operators/Helm) | Manual (Compose blocks) | Yes | Manual (RDS/Cloud SQL) |
| **Hardware Efficiency** | **High** (Native systemd + bare metal) | Low (Control plane tax: etcd, flannel, kubelet) | Medium (Docker daemon overhead) | High (Cloud-native micro-VMs) | N/A |
| **Hosting Economics** | **$5–$40/mo VPS** (Hetzner, OVH, DO) | $150+/mo (EKS/GKE control plane, NAT, ALBs) | Any VPS | Encore Cloud or AWS/GCP | Cloud Providers |
| **Deployment Target** | Bare-Metal / Linux VPS | Cloud Clusters | Single Node | AWS / GCP / Azure | Cloud Providers |

---

## 2. Core Tradeoffs in Anode

### Tradeoff 1: Static Deduction vs. Extreme Runtime Dynamism
* **The Tradeoff:** Anode deduces topology using compile-time SSA analysis and workspace conventions.
* **The Limit:** If an engineering team fetches their database driver name dynamically over an HTTP JSON API at runtime or uses extreme reflection to construct dynamic listeners, static analysis *cannot* infer the topology.
* **The Resolution:** Anode handles this by failing fast at build time with an actionable diagnostic, allowing the developer to declare the dynamic binding in `anode.lock.json` or `anode.toml`. We trade magic for deterministic predictability.

### Tradeoff 2: Native Linux Primitives (`systemd` + VPS) vs. Infinite Cloud Elasticity
* **The Tradeoff:** Anode optimizes for single-node and multi-node Linux servers (Hetzner, DigitalOcean, bare metal) using `systemd`, cgroups v2, and loopback proxies rather than Kubernetes container networks.
* **The Advantage:** 
  - Zero Kubernetes overhead (saving $150–$300/mo in cloud control plane fees).
  - Raw bare-metal CPU performance (no container network overlay latency).
  - Deployments complete in seconds via SSH.
* **The Limit:** If you are a Fortune 500 company operating a 5,000-node cluster spanning 4 AWS availability zones with automated horizontal pod autoscaling across GPU clusters, **Anode is not for you**. Kubernetes remains the right tool for hyper-scale enterprise infrastructure.

### Tradeoff 3: Migration-First Database Provisioning
* **The Tradeoff:** Anode will **only** auto-provision a database if it finds verified schema migration assets (`migrations/*.sql` or Goose).
* **Why we chose this:** In older tools (like Klotho), seeing `sql.Open` triggered an automatic database provision. This caused catastrophic false positives when developers used SQLite test helpers, connecting to the wrong databases.
* **The Consequence:** If you write a greenfield prototype without any migration folder, Anode will classify the database as unmanaged until you create your first migration file. This is a deliberate, safety-first constraint.

---

## 3. Explicit Non-Goals

1. **Not a Multi-Cloud Infrastructure Provisioner:**
   Anode will not provision AWS VPCs, IAM roles, Route53 zones, or GCP BigQuery datasets. If you need complex cloud-provider topology, use Terraform or Pulumi. Anode is an **Application-Centric Orchestrator** for deploying services to Linux servers.
2. **Not a Container Engine:**
   Anode does not attempt to reinvent `containerd` or Docker. On production servers, Anode deploys native static Linux binaries directly supervised by `systemd`, using containers only when necessary for isolated stateful dependencies (Postgres/Redis).
3. **Not a Proprietary Framework:**
   Anode will never publish an `anode/sdk` that developers must import into their business logic. If using Anode requires you to rewrite your HTTP handlers or database queries, we have failed our mission.
4. **Not a "Magic" Black Box:**
   Anode will never secretly provision or delete infrastructure behind your back. Every deduced resource, binding, and egress rule is explicitly serialized into `anode.lock.json` for human review before execution.

---

## 4. When to Use Anode (and When NOT to)

### Use Anode If:
* You are building a Go backend or multi-service application (using `net/http`, `chi`, `gin`, `pgx`, `database/sql`, or gRPC).
* You want to host on cost-efficient Linux VPS servers ($5–$45/mo on Hetzner, OVH, Scaleway, or DigitalOcean) instead of paying 5x markups for cloud PaaS.
* You are tired of maintaining multi-stage Dockerfiles and debugging Docker Compose port collisions.
* You want zero-downtime deployments with automatic Let's Encrypt TLS certificates.

### Do NOT Use Anode If:
* You require a multi-cloud enterprise service mesh (e.g. Istio / Linkerd) across hundreds of Kubernetes clusters.
* Your application architecture relies entirely on proprietary cloud managed services (AWS DynamoDB, SQS, Step Functions, Aurora Serverless) rather than standard Postgres/Redis.
* Your codebase is written in a language not yet supported by Anode's compiler backend (TypeScript and Python extractors are scheduled for Phase 5).
