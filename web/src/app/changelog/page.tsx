"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Activity,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Zap,
  Lock,
  GitBranch,
  Gauge,
  Workflow,
  Search,
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
    version: "v1.2.0",
    date: "November 2026",
    tag: "v1.2.0",
    isLatest: true,
    summary:
      "Major diagnostic and operational release introducing anode doctor for decoupled network/auth pre-flight checks, anode ps for bare-metal process inspection and cgroups v2 memory extraction, and hardened anti-jailbreak systemd kernel confinement.",
    highlights: [
      "Bare-Metal Process Inspection: anode ps queries systemd D-Bus/CLI directly with zero container engine overhead.",
      "Cgroups v2 Resource Accounting: Real-time memory.current vs MemoryMax tracking with /proc smaps fallback.",
      "Decoupled Pre-Flight Doctor: 2-phase diagnosis isolating closed port 22/firewalls from SSH public key rejections.",
      "Edge Route Reverse Resolution: Caddyfile route parsing mapping backend upstream ports to public domains.",
      "Anti-Jailbreak Confinement: DynamicUser, ProtectProc=invisible, ProcSubset=pid, and RestrictNamespaces=true.",
    ],
    updates: [
      {
        title: "anode ps: Bare-Metal Process Inspection & Cgroups v2",
        category: "CLI",
        badge: "New Command",
        description:
          "Inspect remote or local systemd services orchestrated by Anode. Extracts real-time memory usage directly from cgroups v2 (memory.current vs MemoryMax) with an automated fallback to /proc/<pid>/smaps_rollup (PSS/RSS). Detects service crashloops (NRestarts, SubState=auto-restart) and outputs both human-readable ANSI tables and scriptable JSON.",
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
          "Runs in under 100ms before any deployment leaves your machine. Decoupled into two distinct phases: Phase 1 performs a raw TCP dial (with a strict 3s deadline) to catch firewalls, closed port 22, or bad DNS before attempting auth; Phase 2 verifies SSH public key authentication and TOFU host keys. Verifies Go static binary cross-compilation (CGO_ENABLED=0) and local loopback address space (127.0.0.0/8).",
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
        title: "Edge Route Reverse Resolution via Caddy",
        category: "Networking",
        badge: "Edge",
        description:
          "The CLI inspects active Caddy reverse proxy configurations to map backend loopback ports (e.g. 127.0.0.1:8080) directly back to their internet-facing hostnames (e.g. https://api.example.com). In JSON output mode, each service exposes an edge_route object with domain, upstream port, and TLS status.",
      },
      {
        title: "Anti-Jailbreak Systemd Kernel Confinement",
        category: "Security",
        badge: "Hardening",
        description:
          "Comprehensive security audit and confinement hardening for systemd unit generation: DynamicUser=yes assigns transient unprivileged UIDs, ProtectSystem=strict mounts entire filesystem read-only, ProtectProc=invisible and ProcSubset=pid conceal other tenants' processes, and LockPersonality=true, MemoryDenyWriteExecute=true, and RestrictNamespaces=true block namespace escapes and memory rewriting.",
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
        title: "Streaming SCP Binary Deployments (StreamBytes)",
        category: "Runtime",
        description:
          "Replaced temporary /tmp staging file writes during remote deployment with direct in-memory SCP streaming over encrypted SSH channels. Eliminates world-writable file race conditions, symlink traversal attacks, and multi-tenant disk probing on target VPS hosts.",
      },
    ],
  },
  {
    version: "v1.1.0",
    date: "November 2026",
    tag: "v1.1.0",
    summary:
      "Zero-downtime production deployments with atomic blue/green directory symlinks and local dev loopback proxy orchestration.",
    highlights: [
      "Atomic Blue/Green Deployment: Zero-downtime deployments via current -> releases/<timestamp> symlink flipping.",
      "Ephemeral Loopbacks: Allocates 127.x.y.z addresses to end port 8080 conflicts forever.",
      "Automated TLS Ingress: Native Caddy reverse-proxy configuration synthesis with automatic Let's Encrypt certificates.",
      "Database Container Provisioning: Ephemeral local PostgreSQL/Redis instances with automatic Goose/Golang-Migrate execution.",
    ],
    updates: [
      {
        title: "Atomic Blue/Green Deployment (anode deploy)",
        category: "Runtime",
        badge: "Core",
        description:
          "Production deployment without Docker layers: cross-compiles static ELF binaries locally, streams to /opt/anode/<app>/releases/<timestamp>, runs pre-flight health probes against new listeners, flips the atomic symlink, and triggers Caddy live config reload with zero dropped TCP connections.",
      },
      {
        title: "Zero-Collision Dev Orchestration (anode dev)",
        category: "CLI",
        badge: "Dev Loop",
        description:
          "Sub-second file-watcher and hot-reloader. Assigns unique loopback IPs (127.18.0.1, 127.18.0.2) to each service and backing datastore so developers never suffer 'address already in use' errors.",
      },
      {
        title: "Automated Stateful Migrations",
        category: "Runtime",
        description:
          "Integrated support for goose and golang-migrate. Detects migration files from static analysis, runs schema updates in pre-start systemd hooks, and aborts deployment cleanly if migrations fail.",
      },
    ],
  },
  {
    version: "v1.0.0",
    date: "November 2026",
    tag: "v1.0.0",
    summary:
      "Initial general availability release of Anode — the Proof-of-Topology bare-metal orchestrator for unmodified Go backends.",
    highlights: [
      "Zero-SDK Import Rule: User Go code remains 100% standard library / unmodified third-party packages.",
      "Whole-Program Go SSA & VTA: Proprietary static analysis compiler extracting routing, ports, and environment variables.",
      "Deterministic Contract: Synthesizes immutable anode.lock.json contract pinned with SHA256 checksums.",
      "Hardened Linux Systemd: Automatic generation of production-ready systemd unit files.",
      "Catalog of 28+ Stateful Drivers: Pre-audited drivers for PostgreSQL, MySQL, SQLite, Redis, Kafka, and NATS.",
    ],
    updates: [
      {
        title: "Whole-Program SSA & Variable Type Analysis (VTA)",
        category: "CLI",
        badge: "Compiler",
        description:
          "Deep static analysis of Go AST and Static Single Assignment representations. Inspects net/http, Gin, Chi, Fiber, Echo, and Gorilla Mux to infer listener ports, environment dependencies, and database connection strings in under 60ms.",
      },
      {
        title: "Immutable Lockfile (anode.lock.json)",
        category: "Runtime",
        badge: "Contract",
        description:
          "Captures application topology into a versioned, cryptographically hash-verified contract. The 4 Proof-of-Topology pillars guarantee identical runtime behavior between local dev and remote bare-metal VPS.",
      },
      {
        title: "Direct Systemd Unit & Cgroups v2 Synthesis",
        category: "Security",
        description:
          "Generates unprivileged, isolated systemd services with memory quotas (MemoryMax), CPU quotas (CPUQuota), and task limits (TasksMax) directly on bare-metal Linux.",
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
            Every update to Anode: compiler SSA extraction improvements, bare-metal process monitoring, pre-flight VPS network diagnostics, and hardened Linux kernel sandboxing.
          </p>

          {/* Quick Stats / Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Current Release</div>
              <div className="text-lg font-bold text-emerald-400 font-mono-code mt-0.5">v1.2.0</div>
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
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono-code tracking-tight">
                      {release.version}
                    </span>
                    {release.isLatest && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code font-semibold">
                        Latest Stable
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
            Upgrade to Anode v1.2.0 in Seconds
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
            Update your local toolchain using Homebrew or go install to unlock bare-metal process inspection (anode ps) and pre-flight diagnostics (anode doctor).
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
