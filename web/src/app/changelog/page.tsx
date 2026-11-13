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
    version: "v1.0.0",
    date: "November 11, 2026",
    tag: "v1.0.0",
    isLatest: true,
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
        codeSnippet: {
          title: "Synthesized Systemd Service Unit",
          code: `[Unit]
Description=api (orchestrated by Anode)
After=network.target

[Service]
Type=simple
ExecStart=/opt/anode/api/current/bin/api
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictSUIDSGID=true
CPUQuota=200%
MemoryMax=1G

[Install]
WantedBy=multi-user.target`,
        },
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
        codeSnippet: {
          title: "Synthesized nftables Zero-Trust Policy",
          code: `table inet anode_filter {
  chain forward {
    type filter hook forward priority 0; policy drop;

    # Allow established & related connections
    ct state established,related accept

    # Allow declared internal microservice egress only
    ip saddr 127.18.0.2 ip daddr 127.18.0.5 tcp dport 5432 accept
    ip saddr 127.18.0.3 ip daddr 127.18.0.6 tcp dport 6379 accept

    # Drop lateral pivot traffic
    drop
  }
}`,
        },
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
              <div className="text-lg font-bold text-emerald-400 font-mono-code mt-0.5">v1.0.0</div>
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
              <div className="text-xs font-mono-code text-neutral-400">SSA Sweep Speed</div>
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
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono-code tracking-tight">
                      {release.version}
                    </span>
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
            <span>Install &amp; Quickstart</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Get Started with Anode v1.0.0
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
            Install the official v1.0.0 release via Homebrew or standard Go tooling to start deploying unmodified Go backends without Docker.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                handleCopy("brew install abhiudayg/tap/anode", "cta-brew")
              }
              className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-xs font-mono-code text-white flex items-center gap-2 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>brew install abhiudayg/tap/anode</span>
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
