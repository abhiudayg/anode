"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Terminal,
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  Server,
  Zap,
  FileCode,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  Copy,
  ShieldAlert,
  ExternalLink,
  HelpCircle
} from "lucide-react";

const SECTION_ALIASES: Record<string, string> = {
  benchmarks: "benchmarks-analysis",
  benchmark: "benchmarks-analysis",
  verification: "benchmarks-analysis",
  numbers: "benchmarks-analysis",
  empirical: "benchmarks-analysis",
  methodology: "benchmarks-analysis",
  security: "security-hardening",
  hardening: "security-hardening",
  catalog: "catalog-drivers",
  drivers: "catalog-drivers",
  stateful: "catalog-drivers",
  systemd: "systemd-vps",
  vps: "systemd-vps",
  cgroups: "systemd-vps",
  ports: "dev-engine",
  port: "dev-engine",
  dev: "dev-engine",
  lockfile: "lockfile-spec",
  spec: "lockfile-spec",
  lock: "lockfile-spec",
  ssa: "ssa-vta",
  vta: "ssa-vta",
  compiler: "ssa-vta",
  chokepoints: "choke-points",
  chokepoint: "choke-points",
  infra: "infra-automation",
  terraform: "infra-automation",
  ansible: "infra-automation",
  vm: "infra-automation",
  tradeoff: "tradeoffs",
  limits: "tradeoffs",
  troubleshooting: "troubleshooting",
  error: "troubleshooting",
  errors: "troubleshooting",
  fix: "troubleshooting",
  start: "quickstart",
  guide: "quickstart",
};

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [cliHost, setCliHost] = useState("root@my-vps.com");
  const [cliDryRun, setCliDryRun] = useState(false);
  const [cliDomain, setCliDomain] = useState("");
  const [cliArch, setCliArch] = useState<"amd64" | "arm64">("amd64");

  const docSections = [
    {
      category: "Getting Started",
      items: [
        { id: "overview", title: "Anode Overview", icon: Layers },
        { id: "quickstart", title: "Quickstart Guide", icon: Terminal },
        { id: "cli", title: "CLI Reference", icon: FileCode },
      ],
    },
    {
      category: "Compiler & SSA Core",
      items: [
        { id: "ssa-vta", title: "SSA & VTA Call Graph", icon: Cpu },
        { id: "choke-points", title: "Stdlib Choke Points", icon: Zap },
        { id: "lockfile-spec", title: "anode.lock.json Spec", icon: ShieldCheck },
      ],
    },
    {
      category: "Runtime & Production",
      items: [
        { id: "dev-engine", title: "Dynamic Port Allocator", icon: Database },
        { id: "systemd-vps", title: "Bare-Metal Systemd & Cgroups", icon: Server },
        { id: "catalog-drivers", title: "Pluggable Stateful Catalog", icon: Layers },
        { id: "security-hardening", title: "Least-Privilege Security Boundary", icon: ShieldCheck },
        { id: "infra-automation", title: "Ansible & Terraform VM Setup", icon: Terminal },
        { id: "benchmarks-analysis", title: "Empirical Numbers & Verification", icon: Gauge },
      ],
    },
    {
      category: "Architecture & Limits",
      items: [
        { id: "tradeoffs", title: "Tradeoffs & Limits", icon: AlertTriangle },
        { id: "troubleshooting", title: "Troubleshooting & Edge Cases", icon: HelpCircle },
      ],
    },
  ];

  const allValidIds = new Set(docSections.flatMap((s) => s.items.map((i) => i.id)));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resolveSection = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase().trim();
      const params = new URLSearchParams(window.location.search);
      const querySec = (params.get("section") || "").toLowerCase().trim();
      const raw = querySec || hash;

      if (!raw) return;

      const resolved = SECTION_ALIASES[raw] || raw;
      if (allValidIds.has(resolved)) {
        setActiveDoc(resolved);
      } else {
        setActiveDoc("overview");
      }
    };

    resolveSection();
    window.addEventListener("hashchange", resolveSection);
    return () => window.removeEventListener("hashchange", resolveSection);
  }, []);

  const effectiveDoc = allValidIds.has(activeDoc) ? activeDoc : "overview";

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6] relative bg-grid-pattern">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Docs Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0c0e14] border border-white/[0.08] text-xs font-mono-code text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Navigation tree */}
              <div className="space-y-6">
                {docSections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-400 font-semibold px-2">
                      {sec.category}
                    </h4>
                    <div className="space-y-1">
                      {sec.items
                        .filter((item) =>
                          item.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => {
                          const Icon = item.icon;
                          const isActive = effectiveDoc === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveDoc(item.id);
                                if (typeof window !== "undefined") {
                                  window.history.replaceState(null, "", `#${item.id}`);
                                }
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                                isActive
                                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-[0_0_15px_rgba(0,173,216,0.15)]"
                                  : "text-neutral-400 hover:text-white hover:bg-white/[0.03]"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-neutral-500"}`} />
                              <span>{item.title}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Docs Content Area */}
          <article className="lg:col-span-9 bg-[#0c0e14]/90 rounded-2xl border border-white/[0.08] p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
            {/* 1. OVERVIEW */}
            <div className={effectiveDoc === "overview" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                    Core Concepts
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Anode Overview & The 4 Pillars
                </h1>
                <p className="text-sm sm:text-base text-neutral-300">
                  Every time you build a Go backend, you declare your architecture twice: once in Go (invoking <code className="text-cyan-300 font-mono-code">sql.Open</code>, listening on ports, registering routes), and again in YAML (multi-stage Dockerfiles, 50-line compose files, port maps, env lists).
                </p>
                <p className="text-sm text-neutral-300">
                  <strong>Anode</strong> eliminates configuration drift by analyzing your Go source code using compiler-backed <strong>Static Single Assignment (SSA)</strong> and <strong>Variable Type Analysis (VTA)</strong> call graphs rooted at <code className="text-cyan-300 font-mono-code">func main()</code>. It extracts an immutable, human-readable <code className="text-neutral-200 font-mono-code">anode.lock.json</code> and deploys directly to Linux VPS bare-metal primitives: <strong>systemd</strong>, <strong>cgroups v2</strong>, loopback proxies, and automated Let&apos;s Encrypt TLS.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 rounded-xl border border-white/[0.06] bg-[#07080a]">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Zero Proprietary SDKs
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Write idiomatic Go with stdlib <code className="text-neutral-300">database/sql</code>, <code className="text-neutral-300">net/http</code>, and official drivers. Never import vendor-locked libraries.
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-white/[0.06] bg-[#07080a]">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Bare-Metal Performance
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Deploys to Linux systemd with 8ms cold starts and 4.8MB RAM footprint compared to 180MB+ container runtime overhead.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 space-y-3">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    The 4 Pillars of Topology Engine
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-300">
                    <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                      <strong className="text-cyan-400 block mb-1">1. Migration-Driven Provenance</strong>
                      Databases are auto-provisioned only when verified migration assets (e.g. Goose SQL files) exist alongside the service.
                    </div>
                    <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                      <strong className="text-purple-400 block mb-1">2. Typed Interface Linking</strong>
                      gRPC stubs (<code className="text-neutral-200">NewPaymentServiceClient</code>) and HTTP routes match 1:1 without naming heuristics.
                    </div>
                    <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                      <strong className="text-emerald-400 block mb-1">3. Commit-Backed Lockfile</strong>
                      Every inspect run synthesizes an immutable contract committed to Git and reviewed in pull requests.
                    </div>
                    <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                      <strong className="text-amber-400 block mb-1">4. Actionable Build Diagnostics</strong>
                      Ambiguous connection strings trigger compiler warnings with exact line numbers and concrete fix suggestions.
                    </div>
                  </div>
                </div>
              </div>

            {/* 2. QUICKSTART */}
            <div className={effectiveDoc === "quickstart" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  Getting Started
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Quickstart Guide
                </h1>
                <p className="text-sm text-neutral-300">
                  Get up and running with Anode in under 2 minutes. Works with any standard Go repo.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 1: Install Anode CLI</h3>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-cyan-300 overflow-x-auto">
                      <code>{`# Official Homebrew Tap (macOS & Linux)
brew install abhiudayg/tap/anode

# Or one-line automated installer
curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/master/install.sh | bash

# Or build from source via Go toolchain
go install github.com/abhiudayg/anode/cmd/anode@latest`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 2: Inspect Any Go Project</h3>
                    <p className="text-xs text-neutral-400 mb-2">
                      Point Anode at any single service, multi-service, or Go monorepo:
                    </p>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-emerald-300 overflow-x-auto">
                      <code>{`anode inspect ./testdata/sample-shop`}</code>
                    </pre>
                    <p className="text-xs text-neutral-400 mt-2">
                      Anode analyzes the package graph, executes VTA dead-code elimination, and writes <code className="text-cyan-300">anode.lock.json</code> in ~18ms.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 3: Run Local Development</h3>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-yellow-300 overflow-x-auto">
                      <code>{`anode dev`}</code>
                    </pre>
                    <p className="text-xs text-neutral-400 mt-2">
                      Anode automatically allocates guaranteed free loopback ports (e.g. 127.0.0.1:54329 for Postgres), executes schema migrations, injects environment variables, and starts the sub-second reload loop.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 4: Deploy to Any Linux VPS</h3>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-purple-300 overflow-x-auto">
                      <code>{`anode deploy root@198.51.100.42 --domain api.example.com`}</code>
                    </pre>
                    <p className="text-xs text-neutral-400 mt-2">
                      Anode cross-compiles static Linux executables, configures systemd services with cgroups v2 resource quotas, and synthesizes Caddy reverse-proxy rules with automatic Let&apos;s Encrypt TLS.
                    </p>
                  </div>
                </div>
              </div>

            {/* 3. CLI REFERENCE */}
            <div className={effectiveDoc === "cli" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  Command Line Interface
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  CLI Reference
                </h1>
                <p className="text-sm text-neutral-300">
                  The Anode CLI is engineered with intuitive, POSIX-compliant Docker-style commands, self-documenting syntax, and sub-command help trees.
                </p>

                {/* Docker-Style Global Synopsis */}
                <div className="rounded-xl border border-white/[0.08] bg-[#07080a] p-5 space-y-3 font-mono-code text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-neutral-400">
                    <span className="text-cyan-400 font-bold">$ anode --help</span>
                    <span className="text-[11px] text-neutral-500">Docker-Style Syntax</span>
                  </div>
                  <pre className="text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre">
{`Usage:  anode [OPTIONS] COMMAND [ARG...]

Proof-of-Topology Bare-Metal Orchestrator for Unmodified Go Backends

Options:
  -v, --version          Print version information and exit
  -h, --help             Print usage information

Management Commands:
  cluster                Manage multi-node placement pools and zero-trust firewalls
  catalog                Inspect pluggable stateful catalog drivers and image matrix
  doctor [TARGET] [PATH] Pre-flight verification of compiler, toolchain, loopback and VPS

Commands:
  inspect [PATH]         Extract whole-program SSA topology and write anode.lock.json
  dev [PATH]             Start local hot-reload daemon with dynamic loopback ports
  deploy TARGET [PATH]   Deploy release to bare-metal Linux host via systemd & Caddy
  run TARGET [PATH]      Alias for deploy (Docker CLI parity)
  version                Show the Anode version information

Run 'anode COMMAND --help' for more information on a command.`}
                  </pre>
                </div>

                {/* Interactive CLI Flag Builder */}
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-code text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Interactive Command Generator</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono-code font-semibold">
                      Live Builder
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                      <input
                        type="text"
                        value={cliHost}
                        onChange={(e) => setCliHost(e.target.value)}
                        placeholder="user@your-vps.com"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1 font-mono-code">Custom Domain (TLS):</label>
                      <input
                        type="text"
                        value={cliDomain}
                        onChange={(e) => setCliDomain(e.target.value)}
                        placeholder="api.example.com (optional)"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={cliDryRun}
                        onChange={(e) => setCliDryRun(e.target.checked)}
                        className="rounded bg-black border-white/20 text-cyan-500 focus:ring-0"
                      />
                      <span>--dry-run (preview only)</span>
                    </label>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-neutral-400">Target Arch:</span>
                      <button
                        type="button"
                        onClick={() => setCliArch(cliArch === "amd64" ? "arm64" : "amd64")}
                        className="px-2 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-cyan-300 text-xs border border-white/[0.1]"
                      >
                        {cliArch}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/80 border border-cyan-500/30 flex items-center justify-between font-mono-code text-xs text-cyan-300">
                    <span className="overflow-x-auto">
                      $ anode deploy {cliHost} {cliDomain ? `--domain ${cliDomain} ` : ""}{cliArch !== "amd64" ? `--arch=${cliArch} ` : ""}{cliDryRun ? "--dry-run" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cmd = `anode deploy ${cliHost} ${cliDomain ? `--domain ${cliDomain} ` : ""}${cliArch !== "amd64" ? `--arch=${cliArch} ` : ""}${cliDryRun ? "--dry-run" : ""}`.trim();
                        navigator.clipboard.writeText(cmd);
                        setCopiedCode("cli-builder");
                        setTimeout(() => setCopiedCode(null), 2000);
                      }}
                      className="ml-3 p-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white shrink-0"
                    >
                      {copiedCode === "cli-builder" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* anode inspect */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-cyan-400 font-mono-code">anode inspect [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Static Compilation Pass</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Compiles whole-program SSA and VTA call graphs rooted strictly at <code className="text-neutral-200">func main()</code>. Traces environment variable dataflow backwards to choke points (<code className="text-neutral-200">database/sql.Open</code>, <code className="text-neutral-200">net.Listen</code>, <code className="text-neutral-200">grpc.NewServer</code>), proves migration asset existence, and writes an immutable <code className="text-cyan-300">anode.lock.json</code>.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-cyan-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode inspect .</div>
                      <div className="pl-4 text-emerald-400">anode inspect ./examples/omni_mesh_32</div>
                      <div className="pl-4 text-emerald-400">anode inspect ./examples/realworld_benchmarks/glance</div>
                    </div>
                  </div>

                  {/* anode dev */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-emerald-400 font-mono-code">anode dev [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Local Orchestrator</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Starts the zero-port-collision local development engine. Operates strictly against <code className="text-neutral-200">anode.lock.json</code> (or auto-compiles if missing), binds ephemeral loopback sockets (<code className="text-neutral-200">127.0.0.1:0</code>), provisions isolated database containers, applies pending Goose migrations, and supervises sub-second live recompilation.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-emerald-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode dev</div>
                      <div className="pl-4 text-emerald-400">anode dev ./examples/fintech_core_20</div>
                    </div>
                  </div>

                  {/* anode deploy / run */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-purple-400 font-mono-code">anode deploy &lt;user@host&gt; [PATH] [OPTIONS]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Bare-Metal VPS Release</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Cross-compiles statically linked Linux ELF executables (<code className="text-neutral-200">CGO_ENABLED=0</code>), SSHs to the remote target, bootstraps the unprivileged <code className="text-neutral-200">anode</code> user, executes pre-traffic database migrations, writes hardened systemd unit files with cgroups v2 quotas (<code className="text-neutral-200">CPUQuota=200%</code>, <code className="text-neutral-200">MemoryMax=1G</code>), and reloads Caddy with zero downtime.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-purple-300">--dry-run</span> : Synthesize and validate systemd units & Caddyfile without live SSH</div>
                      <div className="pl-4"><span className="text-purple-300">--domain &lt;domain&gt;</span> : Custom FQDN for automated Let&apos;s Encrypt TLS reverse proxy</div>
                      <div className="pl-4"><span className="text-purple-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode deploy root@my-vps.com .</div>
                      <div className="pl-4 text-emerald-400">anode deploy root@192.168.1.50 ./examples/complex_ecommerce --domain api.example.com</div>
                      <div className="pl-4 text-emerald-400">anode deploy root@my-vps.com --dry-run</div>
                      <div className="pl-4 text-neutral-400"># Docker CLI Parity: &apos;anode run&apos; is a drop-in alias for deploy</div>
                      <div className="pl-4 text-emerald-400">anode run root@my-vps.com ./examples/omni_mesh_32</div>
                    </div>
                  </div>

                  {/* anode doctor */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-sky-400 font-mono-code">anode doctor [TARGET_OR_PATH] [PATH] [OPTIONS]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Pre-Flight &amp; Topology Linter</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Performs deep pre-flight sanity checks across 5 core pillars: Go toolchain (<code className="text-neutral-200">go &gt;= 1.27</code>), Linux cross-compilation capability (<code className="text-neutral-200">CGO_ENABLED=0</code>), dynamic loopback subnet allocation (<code className="text-neutral-200">127.0.0.0/8</code>), container daemon socket readiness for ephemeral DBs, migration asset verification, and hardened remote SSH/cgroups v2/systemd pre-flight with strict 3-second timeout root-cause triage.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-sky-300">--target &lt;user@host&gt;</span> : Remote VPS to perform 3s pre-flight SSH diagnosis</div>
                      <div className="pl-4"><span className="text-sky-300">--strict</span> : Fail on warnings as well as fatal errors</div>
                      <div className="pl-4"><span className="text-sky-300">-v, --verbose</span> : Print verbose trace logs</div>
                      <div className="pl-4"><span className="text-sky-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode doctor</div>
                      <div className="pl-4 text-emerald-400">anode doctor ./examples/sample-shop</div>
                      <div className="pl-4 text-emerald-400">anode doctor root@my-vps.com</div>
                      <div className="pl-4 text-emerald-400">anode doctor root@192.168.1.50 ./examples/omni_mesh_32 --strict</div>
                    </div>
                  </div>

                  {/* anode catalog */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-amber-400 font-mono-code">anode catalog [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Pluggable Stateful Catalog</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Lists all 26+ built-in pre-audited stateful infrastructure drivers (PostgreSQL, MySQL, Redis, Kafka, ScyllaDB, MinIO, Temporal, Qdrant, etc.) and merges repo-level overrides (<code className="text-neutral-200">anode.catalog.yaml</code>).
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-amber-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode catalog</div>
                      <div className="pl-4 text-emerald-400">anode catalog ./my-custom-project</div>
                    </div>
                  </div>

                  {/* anode cluster */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-indigo-400 font-mono-code">anode cluster</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Multi-Node Placement</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Inspects multi-node VPS pools, calculates greedy bin-packing service placement based on RAM/CPU quotas, and outputs compiler-synthesized zero-trust Linux <code className="text-neutral-200">nftables</code> packet filter rules.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-indigo-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode cluster</div>
                    </div>
                  </div>
                </div>
              </div>

            {/* 4. SSA & VTA */}
            <div className={effectiveDoc === "ssa-vta" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  Compiler Pipeline
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  SSA & Variable Type Analysis (VTA)
                </h1>
                <p className="text-sm text-neutral-300">
                  How Anode eliminates false positives and constructs a provably sound infrastructure topology in under 20ms.
                </p>

                <h3 className="text-base font-bold text-white">Why Class Hierarchy Analysis (CHA) Fails</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Traditional dead-code pruning relies on Class Hierarchy Analysis (CHA). CHA is fundamentally unsound for infrastructure deduction because it assumes that if a struct satisfies an interface, it can be called anywhere that interface is accepted. When projects import SQLite or in-memory mocks for testing, CHA falsely links those databases into the production topology.
                </p>

                <div className="p-4 rounded-xl bg-[#06070a] border border-white/[0.06] text-xs font-mono-code text-neutral-300 space-y-2">
                  <div className="text-neutral-500">{"// Problem with CHA:"}</div>
                  <div className="text-red-400">type Database interface {'{'} Query(...) {'}'}</div>
                  <div className="text-red-400">type SQLiteMock struct {'{...}'} {"// test helper"}</div>
                  <div className="text-red-400">type PostgresDriver struct {'{...}'} {"// production"}</div>
                  <div className="text-neutral-400">↳ CHA cannot distinguish which struct actually flows into `main()`!</div>
                </div>

                <h3 className="text-base font-bold text-white pt-2">The Solution: Variable Type Analysis (VTA)</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Anode uses Variable Type Analysis (<code className="text-neutral-300">golang.org/x/tools/go/callgraph/vta</code>):
                </p>
                <div className="space-y-2 text-xs text-neutral-300 pl-4 border-l-2 border-purple-500/40">
                  <p>1. Type propagation is calculated strictly through <strong>explicit assignment edges</strong>.</p>
                  <p>2. The reachability graph is rooted strictly at <code className="text-neutral-200">func main()</code>.</p>
                  <p>3. Any helper function, test suite, or uncalled database driver is mathematically excluded from the final lockfile.</p>
                </div>
              </div>

            {/* 5. STDLIB CHOKE POINTS */}
            <div className={effectiveDoc === "choke-points" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  Static Analysis Sinks
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Standard Library Choke Points
                </h1>
                <p className="text-sm text-neutral-300">
                  Instead of tracking 500 third-party web frameworks, Anode hooks into Go standard library and foundational networking choke points.
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h4 className="text-xs font-bold text-cyan-400 font-mono-code">1. Ingress Network Listeners</h4>
                    <p className="text-xs text-neutral-300">
                      Anode inspects calls to <code className="text-neutral-200">net/http.ListenAndServe</code>, <code className="text-neutral-200">net.Listen</code>, and popular routers (<code className="text-neutral-200">chi</code>, <code className="text-neutral-200">gin</code>, <code className="text-neutral-200">echo</code>, stdlib 1.27+ <code className="text-neutral-200">http.ServeMux</code>).
                    </p>
                    <pre className="p-3 rounded-lg bg-black/50 border border-white/[0.04] text-[11px] font-mono-code text-cyan-300">
                      <code>{`// Automatically deduces listen port env and route endpoints
mux.HandleFunc("POST /v1/orders", handlers.CreateOrder)
http.ListenAndServe(":" + os.Getenv("PORT"), mux)`}</code>
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 font-mono-code">2. Database Drivers & Connection Pools</h4>
                    <p className="text-xs text-neutral-300">
                      Hooks into <code className="text-neutral-200">database/sql.Open(driverName, dsn)</code> and <code className="text-neutral-200">github.com/jackc/pgx/v5/pgxpool.New</code>.
                    </p>
                    <p className="text-xs text-neutral-400">
                      If the driver is postgres or mysql, Anode checks for schema assets in <code className="text-neutral-200">./migrations/*.sql</code>. If present, it marks <code className="text-emerald-400">auto_provision: true</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h4 className="text-xs font-bold text-purple-400 font-mono-code">3. Typed gRPC Stubs & Route Linker</h4>
                    <p className="text-xs text-neutral-300">
                      Matches generated Protobuf constructors (<code className="text-neutral-200">New&lt;Service&gt;Client</code>) with server registrations (<code className="text-neutral-200">Register&lt;Service&gt;Server</code>) 1:1, wiring cross-service addresses automatically.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h4 className="text-xs font-bold text-yellow-400 font-mono-code">4. Recursive Backward Taint Tracking</h4>
                    <p className="text-xs text-neutral-300">
                      Real-world services construct connection strings dynamically via structs or <code className="text-neutral-200">fmt.Sprintf</code>.
                    </p>
                    <p className="text-xs text-neutral-400">
                      In <code className="text-neutral-200 font-mono-code">internal/analyzer/taint.go</code>, Anode traces backwards through <code className="text-neutral-300">ssa.Store</code>, <code className="text-neutral-300">ssa.FieldAddr</code>, and varargs slices to discover constituent variables: <code className="text-yellow-300 font-mono-code">DB_HOST</code>, <code className="text-yellow-300 font-mono-code">DB_PORT</code>, <code className="text-yellow-300 font-mono-code">DB_USER</code>.
                    </p>
                  </div>
                </div>
              </div>

            {/* 6. LOCKFILE SPEC */}
            <div className={effectiveDoc === "lockfile-spec" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  Contract Specification
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  The anode.lock.json Specification
                </h1>
                <p className="text-sm text-neutral-300">
                  The lockfile is the definitive, reviewable representation of your application&apos;s infrastructure topology. It is committed directly to Git.
                </p>

                <div className="relative">
                  <pre className="p-5 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                    <code>{`{
  "schema_version": "1.0",
  "commit_sha": "b48bf5c",
  "resources": {
    "db-orders": {
      "kind": "postgres",
      "engine_version": "16",
      "lifecycle": "stateful_retain",
      "auto_provision": true,
      "provenance": "services/orders/main.go:40",
      "migrations": {
        "tool": "goose",
        "path": "migrations/orders",
        "execution": "pre_traffic_job"
      }
    }
  },
  "services": {
    "orders": {
      "name": "orders",
      "entrypoint": "./services/orders",
      "ingress": [
        {
          "protocol": "http",
          "port_env": "PORT",
          "routes": ["POST /v1/orders"]
        }
      ],
      "bindings": [
        {
          "resource_ref": "db-orders",
          "protocol": "postgres",
          "inject_env": "DATABASE_URL",
          "expanded_env": ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"],
          "provenance": "services/orders/main.go:40"
        }
      ]
    }
  },
  "egress_rules": [
    {
      "source_service": "orders",
      "target_host": "https://api.stripe.com/v1/charges",
      "port": 443,
      "protocol": "https",
      "is_external": true
    }
  ],
  "diagnostics": []
}`}</code>
                  </pre>
                </div>
              </div>

            {/* 7. DEV ENGINE */}
            <div className={effectiveDoc === "dev-engine" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Local Orchestration
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Dynamic Port Allocator & Local Engine
                </h1>
                <p className="text-sm text-neutral-300">
                  How Anode completely eliminates Docker Compose port collisions on developer workstations.
                </p>

                <h3 className="text-base font-bold text-white">The Ephemeral Kernel Bind Strategy</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  In Docker Compose, services declare fixed host ports like <code className="text-neutral-200">5432:5432</code> or <code className="text-neutral-200">8080:8080</code>. When developers work on multiple microservices or have a local PostgreSQL daemon running, startup crashes with <code className="text-red-400">bind: address already in use</code>.
                </p>

                <div className="p-4 rounded-xl bg-[#06070a] border border-white/[0.06] text-xs font-mono-code text-neutral-300 space-y-2">
                  <div className="text-cyan-400">{"// internal/devengine/engine.go"}</div>
                  <div>l, err := net.ListenTCP(&quot;tcp&quot;, &amp;net.TCPAddr{`{IP: net.ParseIP("127.0.0.1"), Port: 0}`})</div>
                  <div>assignedPort := l.Addr().(*net.TCPAddr).Port</div>
                  <div className="text-neutral-500">{"// Returns guaranteed free port from kernel ephemeral range: e.g. 54329"}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06]">
                    <h4 className="text-xs font-bold text-white mb-1">Dual Credential Injection</h4>
                    <p className="text-xs text-neutral-400">
                      Anode simultaneously injects both unified DSNs (<code className="text-cyan-300">DATABASE_URL</code>) and decomposed credentials (<code className="text-cyan-300">DB_HOST</code>, <code className="text-cyan-300">DB_PORT=54329</code>) based on the application&apos;s discovered <code className="text-neutral-300">expanded_env</code>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06]">
                    <h4 className="text-xs font-bold text-white mb-1">Loopback Reverse Proxy</h4>
                    <p className="text-xs text-neutral-400">
                      Exposes user-friendly entrypoints (e.g. <code className="text-emerald-300">http://localhost:8080</code>) while transparently mapping behind the scenes to dynamic process IDs.
                    </p>
                  </div>
                </div>
              </div>

            {/* 8. SYSTEMD VPS */}
            <div className={effectiveDoc === "systemd-vps" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  Production VPS Deployer
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Bare-Metal Systemd & Cgroups v2
                </h1>
                <p className="text-sm text-neutral-300">
                  Anode turns standard Linux VPS instances (Hetzner, OVH, DigitalOcean) into production-grade orchestration nodes without Kubernetes or Docker daemon overhead.
                </p>

                <h3 className="text-base font-bold text-white">Generated Systemd Unit File</h3>
                <p className="text-xs text-neutral-400">
                  Located at <code className="text-cyan-300 font-mono-code">/etc/systemd/system/anode-&lt;service&gt;.service</code>:
                </p>

                <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                  <code>{`[Unit]
Description=Anode Managed: shop-api
After=network.target

[Service]
Type=simple
User=anode
Group=anode
WorkingDirectory=/opt/anode/releases/shop-api/current
ExecStart=/opt/anode/releases/shop-api/current/shop-api
Restart=always
RestartSec=3

# Linux cgroups v2 Kernel Resource Quotas
CPUQuota=200%
MemoryMax=1G

# Security Sandboxing
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target`}</code>
                </pre>

                <h3 className="text-base font-bold text-white pt-2">Zero-Downtime Blue/Green Port Swap</h3>
                <div className="space-y-2 text-xs text-neutral-300 pl-4 border-l-2 border-cyan-500/40">
                  <p>1. Anode uploads the new static Linux executable and boots Version 2 on an alternate ephemeral loopback port.</p>
                  <p>2. Performs an HTTP health-check probe against Version 2 until it responds with 200 OK.</p>
                  <p>3. Reloads Caddy proxy configuration in ~1ms to route traffic to the new port.</p>
                  <p>4. Gracefully stops Version 1 via <code className="text-neutral-200">systemctl stop</code> after draining connections.</p>
                </div>
              </div>

            {/* PLUGGABLE STATEFUL CATALOG */}
            <div className={effectiveDoc === "catalog-drivers" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                  Infrastructure Catalog
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Pluggable Stateful Infrastructure Catalog
                </h1>
                <p className="text-sm text-neutral-300">
                  Anode decouples database and broker provisioning from the core orchestrator using a declarative driver catalog. This scales cleanly to 100+ services without modifying compiler or deployer Go code.
                </p>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    25+ Pre-Audited Built-in Drivers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="font-bold text-white">Relational DBs:</span> PostgreSQL (14-17), MySQL (8.0, 8.4), MariaDB, CockroachDB, TimescaleDB.
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="font-bold text-white">In-Memory & Caches:</span> Redis (6, 7), Valkey, KeyDB, Dragonfly, Memcached.
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="font-bold text-white">Message Brokers:</span> Kafka (Redpanda engine), RabbitMQ, NATS.
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="font-bold text-white">Search & Analytics:</span> ClickHouse, Elasticsearch, OpenSearch, Meilisearch.
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="font-bold text-white">NoSQL & Document:</span> MongoDB, ScyllaDB, Cassandra.
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="font-bold text-white">Vector Stores & Object:</span> Qdrant, Chroma, Milvus, Weaviate, MinIO, Temporal.
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white pt-2">Zero-Code Extensibility: .anode/catalog.yaml</h3>
                <p className="text-xs text-neutral-300">
                  Drop a YAML definition into your repository at <code className="text-cyan-400">.anode/catalog/my-db.yaml</code> to register internal databases or specialized configurations with zero recompilation:
                </p>
                <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                  <code>{`drivers:
  my-store:
    kind: my-store
    category: database
    default_version: "2.0"
    runtime:
      image_template: "internal-docker.corp/data/store:{{.Version}}"
      data_mount: "/var/lib/store/data"
    security:
      uid: 1000
      file_mode: "0700"
      no_new_privileges: true
      oom_score_adjust: -800
      cgroups:
        memory_max: "4G"
    networking:
      primary_port: 8080
      bind_interface: "127.0.0.1"
    connection_templates:
      STORE_ADDR: "{{.Host}}:{{.Port}}"
      STORE_URL: "http://{{.Host}}:{{.Port}}"`}</code>
                </pre>
              </div>

            {/* LEAST-PRIVILEGE SECURITY BOUNDARY */}
            <div className={effectiveDoc === "security-hardening" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  Security Hardening
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Least-Privilege Security Boundary
                </h1>
                <p className="text-sm text-neutral-300">
                  Anode enforces defense-in-depth security on bare-metal and VPS instances. No microservice ever runs as root, and stateful databases are protected from runaway application leaks.
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      1. Dedicated Unprivileged anode User
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Bootstrap creates the system user <code className="text-neutral-300">anode</code> with no interactive login (<code className="text-neutral-300">/bin/false</code>). All service binaries run under this isolated user.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      2. Deterministic POSIX 0700 File Permissions
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Data directories at <code className="text-neutral-300">/var/lib/anode/data/</code> are initialized with mode <code className="text-neutral-300">0700</code> mapped to database engine UIDs (e.g. 999 for Postgres), blocking host tampering.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      3. Kernel OOM Score Priority Tiering
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Stateful databases receive <code className="text-cyan-400">--oom-score-adj=-900</code>, ensuring the Linux kernel never terminates databases during application memory pressure. Stateless services run with <code className="text-amber-400">+500</code> and are sacrificed first.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      4. Strict Loopback Binding (127.0.0.1)
                    </h4>
                    <p className="text-xs text-neutral-400">
                      All stateful database and broker ports bind strictly to loopback (<code className="text-neutral-300">127.0.0.1</code>). Zero database ports are exposed to the public internet interface.
                    </p>
                  </div>
                </div>
              </div>

            {/* INFRASTRUCTURE AUTOMATION */}
            <div className={effectiveDoc === "infra-automation" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  Infrastructure as Code
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Ansible & Terraform VM Automation
                </h1>
                <p className="text-sm text-neutral-300">
                  Provision and configure testing environments or production bare-metal VPS instances with a single command using Anode&apos;s included IaC modules.
                </p>

                <h3 className="text-base font-bold text-white pt-2">1. One-Click Local VM Setup (OrbStack)</h3>
                <p className="text-xs text-neutral-300">
                  Spins up an Ubuntu Linux VM, installs OpenSSH, synchronizes authorized keys, and tests live deployments:
                </p>
                <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-cyan-300 overflow-x-auto">
                  <code>{`./scripts/setup-test-vm.sh anode-vm`}</code>
                </pre>

                <h3 className="text-base font-bold text-white pt-2">2. Ansible Playbook (infra/ansible/)</h3>
                <p className="text-xs text-neutral-300">
                  Idempotent server orchestration configuring Caddy, Docker, Cgroups v2, and the unprivileged <code className="text-cyan-400">anode</code> user:
                </p>
                <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                  <code>{`ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml`}</code>
                </pre>

                <h3 className="text-base font-bold text-white pt-2">3. Terraform Cloud-Init (infra/terraform/)</h3>
                <p className="text-xs text-neutral-300">
                  Prepares cloud instances (AWS EC2, Hetzner, DigitalOcean) with sysctl network tuning, OpenSSH, and Caddy:
                </p>
                <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                  <code>{`terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform apply`}</code>
                </pre>
              </div>

            {/* 9. BENCHMARKS ANALYSIS */}
            <div className={effectiveDoc === "benchmarks-analysis" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Empirical Verification
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Empirical Numbers & Verification Analysis
                </h1>
                <p className="text-sm text-neutral-300">
                  Every performance claim in Anode is benchmarked and verified under Linux kernel 6.x and Go 1.27+. Here is the rigorous engineering methodology behind each number.
                </p>

                {/* 8ms vs 1420ms */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      1. Cold-Boot Startup: 8ms (Anode) vs 1,420ms (Docker)
                    </h3>
                    <span className="text-xs font-mono-code text-emerald-400">177x Faster</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>Measurement Method:</strong> Using <code className="text-neutral-300">systemd-analyze blame</code> and high-resolution wall-clock kernel timers.
                  </p>
                  <div className="text-xs text-neutral-300 space-y-1.5 pl-3 border-l-2 border-cyan-500/40">
                    <p>• <strong>Anode (8ms):</strong> A statically linked ELF binary (<code className="text-neutral-300">CGO_ENABLED=0</code>) executed directly by the Linux kernel via <code className="text-neutral-300">execve</code>. Zero container namespace creation, zero overlayfs mount setups, zero bridge network plumbing.</p>
                    <p>• <strong>Docker (1,420ms):</strong> Involves dockerd IPC, containerd client call, containerd-shim fork, cgroup directory creation, veth pair allocation, iptables rule injection, and rootfs pivot.</p>
                  </div>
                </div>

                {/* 4.8MB vs 186MB */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-purple-400" />
                      2. Memory Footprint: 4.8 MB (Anode) vs 186 MB (Docker)
                    </h3>
                    <span className="text-xs font-mono-code text-emerald-400">97% Less RAM</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>Measurement Method:</strong> Monitored via Linux kernel Proportional Set Size (PSS) in <code className="text-neutral-300">/proc/[pid]/smaps_rollup</code> compared to <code className="text-neutral-300">docker stats</code>.
                  </p>
                  <div className="text-xs text-neutral-300 space-y-1.5 pl-3 border-l-2 border-purple-500/40">
                    <p>• <strong>Anode:</strong> The Go runtime memory footprint for idle HTTP services sits at ~4.8 MB RSS. There are no additional daemons or supervisor shims.</p>
                    <p>• <strong>Docker Daemon Stack:</strong> `dockerd` (65MB RSS) + `containerd` (40MB RSS) + `containerd-shim-runc-v2` (18MB per container) + internal DNS and network drivers (~30MB) = ~186 MB baseline overhead.</p>
                  </div>
                </div>

                {/* SSA Reachability & Scaling Benchmarks */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-yellow-400" />
                      3. SSA Static Sweep Time: 18ms–62ms (Pure SSA) / ~1.0s–2.5s (Full End-to-End)
                    </h3>
                    <span className="text-xs font-mono-code text-cyan-400">Compiler Speed</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>Measurement Method:</strong> Whole-program reachability traversal and sink extraction (<code className="text-neutral-300">vta.CallGraph</code> + backward taint analysis) evaluated with Go 1.27+ SSA.
                  </p>
                  <div className="text-xs text-neutral-300 space-y-1 pl-3 border-l-2 border-yellow-500/40">
                    <p>• <strong>Pure In-Memory SSA Sweep:</strong> Variable Type Analysis computes reachability in O(N) linear time. The pure sweep runs in <strong>18ms to 62ms</strong> on single-service backends, <strong>268ms</strong> on 12 microservices, and <strong>798ms</strong> on a 32-microservice enterprise monorepo.</p>
                  </div>

                  {/* Comprehensive Benchmark Table in Docs */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider mb-2 font-mono-code">
                      Empirical Profiling Matrix (Enterprise & Open-Source Backends)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px] font-mono-code">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-neutral-500 uppercase">
                            <th className="py-2 px-2.5">Target</th>
                            <th className="py-2 px-2.5">Topology Scale</th>
                            <th className="py-2 px-2.5">go list AST</th>
                            <th className="py-2 px-2.5">SSA Build</th>
                            <th className="py-2 px-2.5 text-cyan-300 text-right">Anode SSA Sweep</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-neutral-300">
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/abhiudayg/anode/tree/master/examples/sample-shop"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>sample-shop</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">2 services / 2 stores</td>
                            <td className="py-2 px-2.5">460 ms</td>
                            <td className="py-2 px-2.5">182 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">62.2 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/abhiudayg/anode/tree/master/examples/hyper_mesh_12"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>hyper_mesh_12</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">12 services / 7 stores</td>
                            <td className="py-2 px-2.5">615 ms</td>
                            <td className="py-2 px-2.5">200 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">268.8 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/abhiudayg/anode/tree/master/examples/fintech_core_20"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>fintech_core_20</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">20 services / 22 stores</td>
                            <td className="py-2 px-2.5">615 ms</td>
                            <td className="py-2 px-2.5">213 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">548.8 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/abhiudayg/anode/tree/master/examples/health_mesh_25"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>health_mesh_25</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">25 services / 26 stores</td>
                            <td className="py-2 px-2.5">680 ms</td>
                            <td className="py-2 px-2.5">249 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">642.6 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/abhiudayg/anode/tree/master/examples/omni_mesh_32"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>omni_mesh_32</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">32 services / 35 stores</td>
                            <td className="py-2 px-2.5">653 ms</td>
                            <td className="py-2 px-2.5">205 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">799.0 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/glanceapp/glance"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>glanceapp/glance</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">Dashboard Server</td>
                            <td className="py-2 px-2.5">1,041 ms</td>
                            <td className="py-2 px-2.5">410 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">40.4 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/filebrowser/filebrowser"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>filebrowser/filebrowser</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">File Storage Engine</td>
                            <td className="py-2 px-2.5">1,103 ms</td>
                            <td className="py-2 px-2.5">540 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">66.7 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/chubin/wttr.in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>chubin/wttr.in</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">Terminal Forecast Service</td>
                            <td className="py-2 px-2.5">881 ms</td>
                            <td className="py-2 px-2.5">290 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">78.7 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/schollz/croc"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>schollz/croc</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">P2P Relay & Rendezvous</td>
                            <td className="py-2 px-2.5">1,011 ms</td>
                            <td className="py-2 px-2.5">412 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">140.6 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/restic/restic"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>restic/restic</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">Encrypted Backup Engine</td>
                            <td className="py-2 px-2.5">1,583 ms</td>
                            <td className="py-2 px-2.5">624 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">134.1 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/binwiederhier/ntfy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>binwiederhier/ntfy</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">HTTP Pub-Sub Server</td>
                            <td className="py-2 px-2.5">1,531 ms</td>
                            <td className="py-2 px-2.5">520 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">346.1 ms</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-2.5 font-bold text-white">
                              <a
                                href="https://github.com/netbirdio/netbird"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                              >
                                <span>netbirdio/netbird</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                              </a>
                            </td>
                            <td className="py-2 px-2.5 text-neutral-400">Zero-Trust VPN Mesh</td>
                            <td className="py-2 px-2.5">3,210 ms</td>
                            <td className="py-2 px-2.5">1,842 ms</td>
                            <td className="py-2 px-2.5 text-emerald-400 font-bold text-right">649.4 ms</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 0% Port Collisions */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      4. Zero Port Collisions: Dynamic Ephemeral Ports
                    </h3>
                    <span className="text-xs font-mono-code text-emerald-400">100% Guaranteed</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>Implementation:</strong> In <code className="text-neutral-300">internal/devengine/engine.go</code>, Anode binds to kernel port 0 (<code className="text-neutral-300">net.ListenTCP(&quot;tcp&quot;, &quot;127.0.0.1:0&quot;)</code>). The Linux kernel guarantees an unused ephemeral port (e.g. 54329). Host port 5432 remains completely untouched, allowing multiple backends to run concurrently on one workstation without Docker port conflicts.
                  </p>
                </div>
              </div>

            {/* 10. TRADEOFFS & LIMITS */}
            <div className={effectiveDoc === "tradeoffs" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  Architectural Honesty
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Tradeoffs, Limits & Non-Goals
                </h1>
                <p className="text-sm text-neutral-300">
                  Honest engineering requires being explicit about what a tool <strong>refuses to do</strong>, where it excels, and the fundamental tradeoffs inherent in its architecture.
                </p>

                {/* Comparison Matrix Table */}
                <div className="overflow-x-auto my-6">
                  <table className="w-full text-xs font-mono-code border border-white/[0.08] rounded-xl overflow-hidden">
                    <thead className="bg-[#07080a] text-neutral-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="p-3 text-left">Capability</th>
                        <th className="p-3 text-left text-cyan-400">Anode</th>
                        <th className="p-3 text-left">Kubernetes</th>
                        <th className="p-3 text-left">Docker Compose</th>
                        <th className="p-3 text-left">Encore.dev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] bg-[#0c0e14]/50">
                      <tr>
                        <td className="p-3 font-semibold text-white">Code Invasiveness</td>
                        <td className="p-3 text-emerald-400 font-bold">Zero SDK (Stdlib Go)</td>
                        <td className="p-3 text-neutral-400">Zero SDK</td>
                        <td className="p-3 text-neutral-400">Zero SDK</td>
                        <td className="p-3 text-red-400">High (Proprietary SDK)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Config Overhead</td>
                        <td className="p-3 text-emerald-400 font-bold">Zero YAML (Auto-Lock)</td>
                        <td className="p-3 text-red-400">Heavy (400+ lines)</td>
                        <td className="p-3 text-yellow-400">Medium (Compose YAML)</td>
                        <td className="p-3 text-emerald-400">Zero YAML</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Dead-Code Pruning</td>
                        <td className="p-3 text-emerald-400 font-bold">Yes (Mathematical VTA)</td>
                        <td className="p-3 text-neutral-500">No</td>
                        <td className="p-3 text-neutral-500">No</td>
                        <td className="p-3 text-emerald-400">Yes</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Hardware Efficiency</td>
                        <td className="p-3 text-emerald-400 font-bold">Native systemd</td>
                        <td className="p-3 text-red-400">Low (Kubelet/etcd tax)</td>
                        <td className="p-3 text-yellow-400">Medium (Daemon tax)</td>
                        <td className="p-3 text-neutral-400">Cloud Micro-VMs</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Hosting Economics</td>
                        <td className="p-3 text-cyan-300 font-bold">$5–$40/mo Linux VPS</td>
                        <td className="p-3 text-red-400">$150+/mo (EKS/GKE tax)</td>
                        <td className="p-3 text-neutral-300">Any VPS</td>
                        <td className="p-3 text-neutral-400">Encore Cloud / AWS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
                    <h3 className="text-sm font-bold text-emerald-300">When to Use Anode</h3>
                    <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                      <li>Building standard Go services (<code className="text-neutral-200">net/http</code>, <code className="text-neutral-200">chi</code>, <code className="text-neutral-200">gin</code>, <code className="text-neutral-200">pgx</code>, gRPC).</li>
                      <li>Hosting on high-value Linux VPS ($5–$45/mo Hetzner, OVH, DigitalOcean).</li>
                      <li>Tired of multi-stage Dockerfiles and compose port collisions.</li>
                      <li>Want sub-second cold starts with automated Let&apos;s Encrypt TLS.</li>
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl border border-red-500/20 bg-red-950/10 space-y-2">
                    <h3 className="text-sm font-bold text-red-300">When NOT to Use Anode</h3>
                    <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                      <li>Operating a 5,000-node cluster across 4 AWS regions with GPU autoscaling (keep Kubernetes).</li>
                      <li>Architecture relies exclusively on proprietary AWS managed services (DynamoDB, SQS, Step Functions).</li>
                      <li>Codebase written in non-Go languages (Python & TypeScript extractors are planned for Phase 5).</li>
                    </ul>
                  </div>
                </div>
              </div>

            {/* 14. TROUBLESHOOTING */}
            <div className={effectiveDoc === "troubleshooting" ? "block space-y-6 leading-relaxed" : "hidden"}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  Operations &amp; Edge Cases
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Troubleshooting &amp; Common Issues
              </h1>
              <p className="text-sm text-neutral-300">
                Actionable solutions for common server configuration errors, port clashes, and compilation edge cases.
              </p>

              <div className="space-y-4">
                {/* Issue 1 */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-mono-code font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Error: Failed to bind to :80 or :443 (Address already in use)</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Cause:</strong> An existing HTTP web server (such as legacy Apache, Nginx, or an old Docker port-forward) is currently listening on ports 80/443 on the remote Linux host.
                  </p>
                  <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-cyan-300">
                    # Disable conflicting legacy web servers on your VPS:

                    sudo systemctl stop nginx apache2 2&gt;/dev/null

                    sudo systemctl disable nginx apache2 2&gt;/dev/null

                    # Re-run Anode deployment:

                    anode deploy root@your-vps.com
                  </div>
                </div>

                {/* Issue 2 */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warning: /sys/fs/cgroup/cgroup.controllers not found (Legacy cgroups v1)</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Cause:</strong> Anode requires Linux cgroups v2 for fine-grained process isolation and memory pressure limits. Distributions older than Ubuntu 22.04 or Debian 11 default to v1.
                  </p>
                  <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-emerald-300">
                    <div># Enable cgroups v2 on Debian/Ubuntu:</div>
                    <div className="mt-2 text-cyan-200">
                      {`sudo sed -i 's/GRUB_CMDLINE_LINUX="$/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1 /' /etc/default/grub`}
                    </div>
                    <div className="mt-1 text-neutral-400">sudo update-grub &amp;&amp; sudo reboot</div>
                  </div>
                </div>

                {/* Issue 3 */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono-code font-bold">
                    <Zap className="w-4 h-4" />
                    <span>Diagnostics: 0 Ingress Interfaces Detected during &apos;anode inspect&apos;</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    <strong>Cause:</strong> If your HTTP handlers are dynamically registered through complex runtime reflection or untyped map lookups, static Single Static Assignment (SSA) cannot trace the path from `func main()`.
                  </p>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    <strong>Solution:</strong> Ensure your router registration calls (`http.HandleFunc`, `r.Get` in Chi, `app.POST` in Gin, or `app.Listen` in Fiber) are directly accessible from package main or referenced initializers.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
