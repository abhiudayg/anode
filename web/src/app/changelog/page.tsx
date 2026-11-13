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
    date: "November 2026",
    tag: "v1.0.0",
    isLatest: true,
    summary:
      "General Availability release of Anode — the Proof-of-Topology bare-metal orchestrator for unmodified Go backends. Features deep SSA static analysis, pre-flight VPS network diagnostics (anode doctor), bare-metal process inspection (anode ps), zero-downtime blue/green deployment, and hardened systemd kernel sandboxing.",
    highlights: [
      "Zero-SDK Import Rule: User Go code remains 100% standard library / unmodified third-party packages.",
      "Whole-Program Go SSA & VTA: Compiler extracts routes, listeners, and dependencies in under 60ms.",
      "Decoupled Pre-Flight Diagnostics (anode doctor): 2-phase diagnosis isolating closed port 22/firewalls from SSH public key auth.",
      "Bare-Metal Process Inspection (anode ps): Real-time cgroups v2 memory extraction and crashloop detection.",
      "Anti-Jailbreak Confinement: DynamicUser=yes, ProtectProc=invisible, ProcSubset=pid, RestrictNamespaces=true, and streaming SCP.",
      "Zero-Downtime Deployment (anode deploy): Atomic symlink flipping with automated Caddy TLS reverse-proxy reload.",
      "Zero-Collision Dev (anode dev): Ephemeral 127.x.y.z loopback orchestration ending port 8080 clashes.",
      "Pre-Audited Catalog: Native support for 28+ stateful database and message broker drivers.",
    ],
    updates: [
      {
        title: "anode doctor: Decoupled 2-Phase Pre-Flight Verification",
        category: "CLI",
        badge: "Core",
        description:
          "Runs a 100ms sanity check before anything leaves your machine. Decoupled into two distinct phases: Phase 1 executes a raw TCP dial (strict 3s deadline) to catch firewalls, closed port 22, or bad DNS; Phase 2 performs the SSH auth handshake to diagnose rejected keys. Validates Go static cross-compilation (CGO_ENABLED=0) and local loopback address space (127.0.0.0/8).",
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
        title: "anode ps: Bare-Metal Process Inspection & Cgroups v2",
        category: "CLI",
        badge: "Core",
        description:
          "Inspect remote or local systemd services orchestrated by Anode with zero container engine overhead. Measures real-time memory usage directly from cgroups v2 (memory.current vs MemoryMax) with an automated fallback to /proc/<pid>/smaps_rollup (PSS/RSS). Detects flapping and crashloops (NRestarts, SubState=auto-restart), resolves Caddy edge routes, and outputs both ANSI tables and scriptable JSON.",
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
        title: "Anti-Jailbreak Systemd Kernel Confinement",
        category: "Security",
        badge: "Hardening",
        description:
          "Comprehensive multi-tenant process confinement: DynamicUser=yes allocates transient unprivileged UIDs, ProtectSystem=strict mounts entire filesystem read-only, ProtectProc=invisible and ProcSubset=pid conceal other tenants' processes, and LockPersonality=true, MemoryDenyWriteExecute=true, and RestrictNamespaces=true block namespace escapes and memory rewriting.",
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
        title: "Streaming SCP In-Memory Deployments (StreamBytes)",
        category: "Runtime",
        badge: "Transport",
        description:
          "Replaced temporary /tmp staging file writes during remote deployment with direct in-memory SCP streaming over encrypted SSH channels. Eliminates world-writable file race conditions, symlink traversal attacks, and multi-tenant disk probing on target VPS hosts.",
      },
      {
        title: "Edge Route Reverse Resolution via Caddy",
        category: "Networking",
        badge: "Edge",
        description:
          "Inspects active Caddy reverse-proxy configurations to map backend loopback ports (e.g. 127.0.0.1:8080) directly back to their internet-facing domain hostnames with automated Let's Encrypt TLS.",
      },
      {
        title: "Zero-Downtime Blue/Green Deployments (anode deploy)",
        category: "Runtime",
        badge: "Deploy",
        description:
          "Deploys without Docker daemon overhead: cross-compiles static ELF binaries locally, streams to /opt/anode/<app>/releases/<timestamp>, runs pre-flight health probes against new listeners, flips atomic symlinks (current -> releases/<timestamp>), and reloads Caddy with zero dropped connections.",
      },
      {
        title: "Zero-Collision Dev Orchestration (anode dev)",
        category: "CLI",
        badge: "Dev Loop",
        description:
          "Deterministic sub-second file watcher and hot-reloader. Assigns unique loopback IPs (127.18.0.1, 127.18.0.2) to each service and backing datastore so developers never encounter port collisions.",
      },
      {
        title: "Whole-Program Go SSA & Variable Type Analysis (VTA)",
        category: "CLI",
        badge: "Compiler",
        description:
          "Deep static analysis of Go AST and SSA representations. Resolves dynamic http.Handler binds, route maps, and backing store drivers in under 60ms without requiring any SDK imports in user code.",
      },
      {
        title: "Deterministic Contract & Lockfile (anode.lock.json)",
        category: "Runtime",
        badge: "Contract",
        description:
          "Captures application topology into a versioned, cryptographically hash-verified contract. The 4 Proof-of-Topology pillars guarantee identical runtime behavior between local dev and remote bare-metal VPS.",
      },
      {
        title: "Catalog of 28+ Pre-Audited Stateful Drivers",
        category: "Runtime",
        badge: "Drivers",
        description:
          "Automatic detection and zero-config orchestration for PostgreSQL, MySQL, SQLite, Redis, ClickHouse, MongoDB, Kafka, RabbitMQ, NATS, and MinIO with integrated Goose/Golang-Migrate migrations.",
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
            Every architectural update to Anode: compiler SSA extraction improvements, bare-metal process monitoring, pre-flight VPS network diagnostics, and hardened Linux kernel sandboxing.
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
            Install Anode via Homebrew or standard Go tooling to unlock bare-metal process inspection (anode ps) and decoupled pre-flight diagnostics (anode doctor).
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
