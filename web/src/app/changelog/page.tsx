"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Terminal,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Zap,
  Filter
} from "lucide-react";

interface ReleaseUpdate {
  title: string;
  category: "CLI" | "Security" | "Runtime" | "Networking";
  description: string;
  badge?: string;
  codeSnippet?: {
    title: string;
    code: string;
  };
}

interface Release {
  version: string;
  date: string;
  tag: string;
  isLatest?: boolean;
  summary: string;
  highlights: string[];
  updates: ReleaseUpdate[];
}

const RELEASES: Release[] = [
  {
    version: "v1.1.0",
    date: "November 13, 2026",
    tag: "v1.1.0",
    isLatest: true,
    summary:
      "Operational, diagnostic, and kernel security release introducing bare-metal process inspection (anode ps) with cgroups v2 resource accounting, decoupled 2-phase pre-flight network diagnostics (anode doctor), anti-jailbreak systemd confinement, and in-memory streaming SCP binary deployment.",
    highlights: [
      "Bare-Metal Process Inspection (anode ps): Direct systemd service inspection with zero container engine overhead.",
      "Cgroups v2 Resource Accounting: Real-time memory.current vs MemoryMax=1G tracking with smaps PSS/RSS fallback.",
      "Decoupled Pre-Flight Diagnostics (anode doctor): 2-phase verification isolating closed port 22/firewalls from SSH auth rejections.",
      "Caddy Edge Route Mapping: Automatically resolves upstream loopback ports to public internet-facing domains.",
      "Anti-Jailbreak Kernel Confinement: DynamicUser=yes, ProtectProc=invisible, ProcSubset=pid, and RestrictNamespaces=true.",
      "In-Memory Streaming SCP: Replaces /tmp staging writes with direct encrypted in-memory byte streaming.",
      "Website Changelog & System Evolution: Dedicated interactive release timeline page at /changelog.",
    ],
    updates: [
      {
        title: "anode ps: Bare-Metal Process Inspection & Cgroups v2",
        category: "CLI",
        badge: "New Command",
        description:
          "Inspect running Go services over SSH or locally with complete Docker/Kubernetes parity. Measures real-time memory usage directly from cgroups v2 (memory.current vs MemoryMax=1G) with automated fallback to /proc/<pid>/smaps_rollup (PSS/RSS) or /proc/<pid>/statm. Captures TasksCurrent thread counts, detects flapping and crashloops (NRestarts, SubState=auto-restart), maps Caddy reverse-proxy edge routes, and outputs both ANSI tables and scriptable JSON.",
        codeSnippet: {
          title: "Terminal Output — anode ps --target=prod",
          code: `$ anode ps --target=prod
TARGET: prod (198.51.100.24:22)
SERVICE           STATUS       PID      CPU    MEMORY (PSS/MAX)     TASKS  REST   UPTIME  EDGE ROUTE
api.service       active       142091   0.4%   18.4MB / 1.0GB (1%)  14     0      4d 12h  https://api.example.com -> 127.0.0.1:8080
worker.service    active       142104   1.2%   42.1MB / 2.0GB (2%)  28     0      4d 12h  internal
metrics.service   active       142118   0.1%   8.2MB / 512MB (1%)   8      0      4d 12h  https://metrics.example.com -> 127.0.0.1:9090

3 services running (bare metal systemd + cgroups v2)`,
        },
      },
      {
        title: "anode doctor: Decoupled 2-Phase Pre-Flight Verification",
        category: "CLI",
        badge: "New Command",
        description:
          "Executes a sub-100ms sanity check prior to deployment. Decoupled into two distinct phases: Phase 1 executes a raw TCP dial (strict 3s deadline) to catch firewalls, closed port 22, or bad DNS; Phase 2 performs the SSH auth handshake to diagnose rejected keys. Validates Go static cross-compilation (CGO_ENABLED=0), local loopback address space (127.0.0.0/8), and container runtime availability.",
        codeSnippet: {
          title: "Terminal Output — anode doctor",
          code: `$ anode doctor
[1/5] Checking Go compiler toolchain...
      go version go1.27.2 linux/amd64 (CGO_ENABLED=0 pure static)  [OK]
[2/5] Validating local loopback range (127.0.0.0/8)...
      Subnet binding capability verified (zero collisions)         [OK]
[3/5] Inspecting container runtime (Docker / Podman)...
      Docker daemon active (v27.3.1 rootless)                      [OK]
[4/5] Verifying lockfile topology (anode.lock.json)...
      Contract SHA256: 8e4b7a1... 4/4 Pillars satisfied            [OK]
[5/5] Testing remote VPS connectivity (prod)...
      Phase 1: Raw TCP dial 198.51.100.24:22 (deadline: 3s)        [OK]
      Phase 2: SSH auth handshake (user: deploy, key: ed25519)     [OK]

Result: 5/5 passed. Pre-flight healthy — ready for zero-downtime deployment.`,
        },
      },
      {
        title: "Anti-Jailbreak Systemd Kernel Confinement",
        category: "Security",
        badge: "Hardening",
        description:
          "Rigorous multi-tenant process confinement: DynamicUser=yes assigns transient unprivileged UIDs, ProtectSystem=strict mounts the filesystem read-only, ProtectProc=invisible and ProcSubset=pid conceal neighboring processes from /proc, and LockPersonality=true, MemoryDenyWriteExecute=true, and RestrictNamespaces=true block namespace escapes and runtime memory rewriting.",
        codeSnippet: {
          title: "Synthesized Systemd Confinement Directives",
          code: `[Service]
DynamicUser=yes
ProtectSystem=strict
ProtectHome=true
ProtectProc=invisible
ProcSubset=pid
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
LockPersonality=true
MemoryDenyWriteExecute=true
RestrictRealtime=true
RestrictNamespaces=true
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM`,
        },
      },
      {
        title: "In-Memory Streaming SCP Deployments (StreamBytes)",
        category: "Runtime",
        badge: "Transport",
        description:
          "Replaced temporary /tmp staging file writes during remote deployment with direct in-memory SCP streaming over encrypted SSH channels. Eliminates world-writable file race conditions, symlink traversal attacks, and multi-tenant disk probing on target VPS hosts.",
      },
      {
        title: "Caddy Edge Route Reverse Resolution",
        category: "Networking",
        badge: "Edge",
        description:
          "Inspects active Caddy reverse-proxy configurations to map backend loopback ports (e.g. 127.0.0.1:8080) directly back to their internet-facing domain hostnames with automated Let's Encrypt TLS status reporting.",
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "November 11, 2026",
    tag: "v1.0.0",
    summary:
      "Initial general availability release of Anode — the Proof-of-Topology bare-metal orchestrator for unmodified Go backends. Eliminates Docker and Kubernetes by compiling unmodified Go AST and SSA call graphs directly into hardened Linux systemd unit files, dynamic loopback networks, and automated Caddy TLS reverse proxies.",
    highlights: [
      "4-Pillar Proof of Topology Engine: Migration-driven stateful provisioning, typed gRPC/HTTP route linking, commit-backed anode.lock.json, and actionable diagnostic compiler warnings.",
      "Whole-Program Go SSA & VTA: Compiler pipeline analyzing standard library choke points and backward taint tracking in under 60ms.",
      "Bare-Metal VPS Deployer (anode deploy): Cross-compilation (arm64/amd64), hardened systemd unit sandboxing, and Linux cgroups v2 resource ceilings (CPUQuota, MemoryMax).",
      "Local Dev Orchestrator (anode dev): Ephemeral kernel socket allocation (127.0.0.1:0) guaranteeing 0% port collisions with sub-second hot reload.",
      "Pluggable Infrastructure Catalog: 28 out-of-the-box stateful drivers with intelligent version matrix resolution and least-privilege security.",
      "Cluster & Security Engine (anode cluster): Multi-node greedy least-loaded bin-packer and compiler-synthesized nftables zero-trust firewall policy.",
      "Enterprise & Real-World Benchmarks: Evaluated across OmniMesh-32, HealthMesh-25, Fintech Core 20, and 10 famous open-source Go backends.",
      "Soft-Orphan Volume Protection: Prevents accidental data loss by refusing to drop persistent volumes without explicit confirmation.",
    ],
    updates: [
      {
        title: "4-Pillar Proof of Topology Engine",
        category: "Runtime",
        badge: "Core",
        description:
          "Foundational engine guaranteeing mathematical parity between local development and production. Pillar 1 (Database Provenance) ensures stateful stores are provisioned only when verifiable migration assets (migrations/*.sql or Goose) exist. Pillar 2 (Typed Interface Linking) maps gRPC client stubs (New<X>Client) to server registrations (Register<X>Server) and HTTP router tables (chi, gin, echo, Go 1.22+ http.ServeMux). Pillar 3 (Commit-Backed Lockfile) produces deterministic anode.lock.json files. Pillar 4 (Actionable Diagnostics) emits precise compiler warnings with file:line provenance.",
        codeSnippet: {
          title: "Synthesized anode.lock.json Contract",
          code: `{
  "version": "1.0.0",
  "contract_hash": "8e4b7a1d3f9e8a2c...",
  "services": [
    {
      "name": "api",
      "binary": "bin/api",
      "ingress": [
        { "protocol": "http", "port_env": "PORT", "routes": ["GET /v1/health", "POST /v1/orders"] }
      ],
      "bindings": [
        { "resource_ref": "db-postgres", "protocol": "postgres", "inject_env": "DATABASE_URL" }
      ]
    }
  ]
}`,
        },
      },
      {
        title: "Whole-Program Go SSA & Variable Type Analysis (VTA)",
        category: "CLI",
        badge: "Compiler",
        description:
          "Proprietary static analysis pipeline using golang.org/x/tools/go/ssa. Builds a Variable Type Analysis (VTA) call graph rooted strictly at func main(), mathematically pruning dead code and mock test drivers. Detects standard library choke points on database/sql.Open, pgxpool.New, net.Listen, and http.ListenAndServe, with recursive backward taint tracking through structs, ssa.Store, ssa.FieldAddr, and fmt.Sprintf varargs slices.",
      },
      {
        title: "Bare-Metal VPS Deployer (anode deploy / anode run)",
        category: "Runtime",
        badge: "Production",
        description:
          "Builds pure static Go ELF binaries locally (CGO_ENABLED=0) with automatic target architecture detection (uname -m -> arm64/amd64). Deploys to Linux VPS hosts with hardened systemd units (NoNewPrivileges=true, ProtectSystem=strict, ProtectHome=true, PrivateTmp=true, PrivateDevices=true, ProtectKernelTunables=true, RestrictSUIDSGID=true), Linux cgroups v2 quotas (CPUQuota=200%, MemoryMax=1G), zero-downtime blue/green port swaps, and automated Caddy reverse proxy synthesis with Let's Encrypt TLS.",
      },
      {
        title: "Local Dev Orchestrator (anode dev)",
        category: "CLI",
        badge: "Dev Loop",
        description:
          "Provides zero-collision local microservice orchestration. Allocates dynamic kernel sockets via net.ListenTCP('tcp', '127.0.0.1:0') to guarantee 0% host port collisions. Injects both unified DSN (DATABASE_URL) and decomposed credentials (DB_HOST, DB_PORT, DB_USER), executes automated migrations prior to boot, and supervises sub-second file-watching hot-reloads.",
      },
      {
        title: "Pluggable Infrastructure Catalog (anode catalog)",
        category: "Security",
        badge: "Catalog",
        description:
          "Declarative service catalog (defaults.yaml) supporting 28 pre-audited stateful drivers including PostgreSQL, MySQL, MariaDB, CockroachDB, TimescaleDB, Redis, Valkey, KeyDB, Dragonfly, Memcached, Kafka/Redpanda, RabbitMQ, NATS, ClickHouse, MongoDB, ScyllaDB, Cassandra, Elasticsearch, Qdrant, MinIO, and Temporal. Enforces strict least-privilege security container configurations with non-root UIDs, 0700 POSIX directory isolation, no-new-privileges:true, --oom-score-adj=-900 kernel protection, and 127.0.0.1 loopback binding.",
      },
      {
        title: "Cluster & Security Engine (anode cluster)",
        category: "Networking",
        badge: "Zero-Trust",
        description:
          "Multi-node greedy least-loaded bin-packer for distributing services across registered VPS instances. Synthesizes Linux kernel nftables firewall policies directly from compiler topology: drops all undeclared lateral container traffic by default, permitting only explicitly declared egress routes.",
      },
      {
        title: "Enterprise & Real-World Benchmark Verification",
        category: "CLI",
        badge: "Benchmarks",
        description:
          "Validated against enterprise synthetic meshes including OmniMesh-32 (32 services, 14 drivers), HealthMesh-25 (25 microservices), Fintech Core 20 (20 microservices), as well as 10 famous unmodified open-source Go repositories: croc, glance, 1Panel, restic, filebrowser, ntfy, netbird, wttr.in, cloudreve, and navidrome. Harmonized SSA sweep profiles achieve sub-100ms on single-service backends scaling to 799ms on a 32-service enterprise monorepo.",
      },
      {
        title: "Soft-Orphan Volume Protection & Reliability",
        category: "Security",
        badge: "Safety",
        description:
          "To safeguard production data during topology refactoring, Anode marks decommissioned stateful resources as 'lifecycle: orphaned' and refuses to drop persistent database volumes automatically without an explicit --confirm flag.",
      },
      {
        title: "Docker-Style CLI Experience & Distribution",
        category: "CLI",
        badge: "Distribution",
        description:
          "Clean Docker-style synopsis: 'Usage: anode [OPTIONS] COMMAND [ARG...]' with subcommands inspect, dev, deploy (anode run alias), catalog, and cluster. Distributed via official Homebrew tap (brew install abhiudayg/tap/anode), one-line curl install script (install.sh), and automated multi-arch GitHub Actions CI/CD (darwin/amd64, darwin/arm64, linux/amd64, linux/arm64).",
      },
    ],
  },
];

export default function ChangelogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ["All", "CLI", "Security", "Runtime", "Networking"];

  const handleCopy = (text: string, id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="space-y-4 pb-12 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-code text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Releases &amp; Architecture Timeline</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Changelog
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
            All notable changes and architectural updates to the Anode Proof-of-Topology orchestrator, synchronized with the repository CHANGELOG.md.
          </p>

          {/* Quick Stats / Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Current Release</div>
              <div className="text-lg font-bold text-emerald-400 font-mono-code mt-0.5">v1.1.0</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Pillars Verified</div>
              <div className="text-lg font-bold text-cyan-400 font-mono-code mt-0.5">4 / 4 Deterministic</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Docker Overhead</div>
              <div className="text-lg font-bold text-purple-400 font-mono-code mt-0.5">0 MB / 0 ms</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Pre-Flight Speed</div>
              <div className="text-lg font-bold text-amber-400 font-mono-code mt-0.5">&lt; 100 ms</div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs font-mono-code text-neutral-400 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span>Filter:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono-code transition-colors ${
                  selectedCategory === cat
                    ? "bg-cyan-500 text-black font-semibold"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Releases Timeline */}
        <div className="pt-12 space-y-16">
          {RELEASES.map((release) => {
            const filteredUpdates =
              selectedCategory === "All"
                ? release.updates
                : release.updates.filter((u) => u.category === selectedCategory);

            if (selectedCategory !== "All" && filteredUpdates.length === 0) {
              return null;
            }

            return (
              <section
                key={release.version}
                id={release.version}
                className="relative pl-0 sm:pl-8 sm:border-l sm:border-white/[0.1] space-y-8"
              >
                {/* Timeline Dot */}
                <div className="hidden sm:flex absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#08090b] border-2 border-cyan-400 items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                {/* Release Header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono-code tracking-tight">
                      {release.version}
                    </h2>
                    {release.isLatest && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code font-semibold">
                        Latest Stable (GA)
                      </span>
                    )}
                    <span className="text-xs font-mono-code text-neutral-400">
                      {release.date}
                    </span>
                    <button
                      onClick={() => handleCopy(release.version, release.version)}
                      className="text-xs font-mono-code text-neutral-400 hover:text-white flex items-center gap-1 transition-colors ml-auto"
                      title="Copy release anchor"
                    >
                      {copiedId === release.version ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span>#{release.version}</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                    {release.summary}
                  </p>

                  {/* Highlights Bullet Box */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <div className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold">
                      Key Capabilities:
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-300">
                      {release.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Updates Cards */}
                <div className="space-y-6 pt-2">
                  {filteredUpdates.map((update, uIdx) => (
                    <div
                      key={uIdx}
                      className="p-5 sm:p-6 rounded-2xl bg-[#0b0d13] border border-white/[0.08] hover:border-cyan-500/30 transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {update.title}
                          </h3>
                          {update.badge && (
                            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                              {update.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400">
                          {update.category}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                        {update.description}
                      </p>

                      {update.codeSnippet && (
                        <div className="rounded-xl border border-white/[0.08] bg-[#050608] overflow-hidden shadow-inner">
                          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono-code text-neutral-400">
                            <span>{update.codeSnippet.title}</span>
                            <button
                              onClick={() =>
                                handleCopy(
                                  update.codeSnippet!.code,
                                  `${release.version}-${uIdx}`
                                )
                              }
                              className="hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                            >
                              {copiedId === `${release.version}-${uIdx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs font-mono-code text-neutral-200 leading-relaxed">
                            <code>{update.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Upgrade / Installation Call to Action */}
        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-[#0c0f17] to-[#08090b] border border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono-code uppercase tracking-wider font-semibold">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Stay Up to Date</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Upgrade to Anode v1.1.0 in Seconds
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
            Update your local toolchain using Homebrew or standard Go tooling to unlock bare-metal process inspection (anode ps) and pre-flight diagnostics (anode doctor).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                handleCopy("brew update && brew upgrade anode", "cta-brew")
              }
              className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-xs font-mono-code text-white flex items-center gap-2 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>brew upgrade anode</span>
              {copiedId === "cta-brew" ? (
                <Check className="w-3 h-3 text-emerald-400 ml-1" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400 ml-1" />
              )}
            </button>

            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono-code font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Explore CLI Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="https://github.com/abhiudayg/anode/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/[0.05] text-neutral-400 hover:text-white text-xs font-mono-code transition-colors flex items-center gap-1.5"
            >
              <span>GitHub Releases</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
