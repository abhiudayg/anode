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
  AlertTriangle,
  Search,
  Check,
  Copy,
  ShieldAlert,
  HelpCircle,
  ChevronDown
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
  logs: "cli",
  log: "cli",
  ps: "cli",
  status: "cli",
  doctor: "cli",
  deploy: "cli",
  inspect: "cli",
};

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mobileDocsNavOpen, setMobileDocsNavOpen] = useState(false);

  // Interactive Command Generator States
  const [cmdType, setCmdType] = useState<"deploy" | "logs" | "ps" | "doctor" | "dev" | "inspect" | "cluster" | "catalog">("deploy");

  // deploy
  const [cliHost, setCliHost] = useState("root@my-vps.com");
  const [cliDomain, setCliDomain] = useState("");
  const [cliDryRun, setCliDryRun] = useState(false);
  const [cliArch, setCliArch] = useState<"amd64" | "arm64">("amd64");
  const [cliDeployPath, setCliDeployPath] = useState("");
  const [cliDeployAlias, setCliDeployAlias] = useState(false);

  // logs
  const [logsTargetMode, setLogsTargetMode] = useState<"remote" | "local">("remote");
  const [logsTarget, setLogsTarget] = useState("root@my-vps.com");
  const [logsService, setLogsService] = useState("");
  const [logsFollow, setLogsFollow] = useState(true);
  const [logsLines, setLogsLines] = useState("100");
  const [logsTimestamps, setLogsTimestamps] = useState(false);
  const [logsSince, setLogsSince] = useState("");
  const [logsEdge, setLogsEdge] = useState(false);
  const [logsJson, setLogsJson] = useState(false);

  // ps
  const [psTargetMode, setPsTargetMode] = useState<"remote" | "local">("remote");
  const [psTarget, setPsTarget] = useState("root@my-vps.com");
  const [psAll, setPsAll] = useState(false);
  const [psJson, setPsJson] = useState(false);
  const [psVerbose, setPsVerbose] = useState(false);
  const [psAlias, setPsAlias] = useState(false);

  // doctor
  const [doctorTargetMode, setDoctorTargetMode] = useState<"remote" | "local">("remote");
  const [doctorTarget, setDoctorTarget] = useState("root@my-vps.com");
  const [doctorPath, setDoctorPath] = useState("");
  const [doctorStrict, setDoctorStrict] = useState(false);
  const [doctorVerbose, setDoctorVerbose] = useState(false);

  // dev
  const [devPath, setDevPath] = useState("");

  // inspect
  const [inspectPath, setInspectPath] = useState("");

  // cluster
  const [clusterMode, setClusterMode] = useState<"plan" | "firewall" | "init">("plan");
  const [clusterPath, setClusterPath] = useState("");
  const [clusterInventory, setClusterInventory] = useState("");
  const [clusterJson, setClusterJson] = useState(false);

  // catalog
  const [catalogDriver, setCatalogDriver] = useState("");
  const [catalogPath, setCatalogPath] = useState("");
  const [catalogJson, setCatalogJson] = useState(false);

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
  const currentItem = docSections.flatMap((s) => s.items).find((i) => i.id === effectiveDoc);
  const currentTitle = currentItem?.title || "Anode Overview";

  return (
    <div className="min-h-screen bg-[#000000] text-[#f3f4f6] relative bg-grid-pattern">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Mobile Collapsible Docs Directory Accordion */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setMobileDocsNavOpen(!mobileDocsNavOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.1] bg-[#0a0a0c] px-4 py-3 text-xs font-mono-code text-neutral-200 transition-colors hover:bg-white/[0.04]"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <span>Section: <strong className="text-white">{currentTitle}</strong></span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileDocsNavOpen ? "rotate-180 text-white" : "text-neutral-400"}`} />
          </button>

          {mobileDocsNavOpen && (
            <div className="mt-2 rounded-xl border border-white/[0.08] bg-[#090a0d] p-4 space-y-4 shadow-2xl">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#050507] border border-white/[0.08] text-xs font-mono-code text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {docSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="text-[10px] font-mono-code uppercase tracking-wider text-neutral-500 font-semibold px-2">
                      {sec.category}
                    </div>
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
                                setMobileDocsNavOpen(false);
                                if (typeof window !== "undefined") {
                                  window.history.replaceState(null, "", `#${item.id}`);
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-code transition-all text-left ${
                                isActive
                                  ? "bg-white/[0.08] text-white font-semibold border-l-2 border-white"
                                  : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Docs Sidebar: Hidden on mobile/tablet (< lg), sticky on desktop */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0a0a0c] border border-white/[0.08] text-xs font-mono-code text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Navigation tree */}
              <div className="space-y-6">
                {docSections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-400 font-semibold px-2">
                      {sec.category}
                    </div>
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
                                  ? "bg-white/[0.08] text-white border border-white/[0.15] font-semibold shadow-sm"
                                  : "text-neutral-400 hover:text-white hover:bg-white/[0.03]"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
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
          <article className="lg:col-span-9 bg-[#0a0a0c]/90 rounded-2xl border border-white/[0.08] p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
            {/* Accessible Main Page Heading */}
            <h1 className="sr-only">Anode Technical Documentation &amp; CLI Reference</h1>

            {/* 1. OVERVIEW */}
            <div className={effectiveDoc === "overview" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Core Concepts
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Anode Overview & The 4 Pillars
                </h2>
                <p className="text-sm sm:text-base text-neutral-300">
                  Every time you build a Go backend, you declare your architecture twice: once in Go (invoking <code className="text-neutral-200 font-mono-code">sql.Open</code>, listening on ports, registering routes), and again in YAML (multi-stage Dockerfiles, 50-line compose files, port maps, env lists).
                </p>
                <p className="text-sm text-neutral-300">
                  <strong>Anode</strong> eliminates configuration drift by analyzing your Go source code using compiler-backed <strong>Static Single Assignment (SSA)</strong> and <strong>Variable Type Analysis (VTA)</strong> call graphs rooted at <code className="text-neutral-200 font-mono-code">func main()</code>. It extracts an immutable, human-readable <code className="text-neutral-200 font-mono-code">anode.lock.json</code> and deploys directly to Linux VPS bare-metal primitives: <strong>systemd</strong>, <strong>cgroups v2</strong>, loopback proxies, and automated Let&apos;s Encrypt TLS.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                  <div className="p-5 rounded-xl border border-white/[0.06] bg-[#07080a]">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
                      Deploys to Linux systemd without a container runtime.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-white/[0.15] bg-white/[0.04] space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-200">
                    The 4 Pillars of Topology Engine
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-300">
                    <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                      <strong className="text-white block mb-1">1. Migration-Driven Provenance</strong>
                      Databases are auto-provisioned only when verified migration assets (e.g. Goose SQL files) exist alongside the service.
                    </div>
                    <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                      <strong className="text-white block mb-1">2. Typed Interface Linking</strong>
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
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Getting Started
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Quickstart Guide
                </h2>
                <p className="text-sm text-neutral-300">
                  Get up and running with Anode in under 2 minutes. Works with any standard Go repo.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 1: Install Anode CLI</h3>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
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
                      Anode analyzes the package graph, executes VTA dead-code elimination, and writes <code className="text-neutral-200">anode.lock.json</code>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 3: Run Local Development</h3>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-yellow-300 overflow-x-auto">
                      <code>{`anode dev`}</code>
                    </pre>
                    <p className="text-xs text-neutral-400 mt-2">
                      Anode automatically allocates free local ports (e.g. 127.0.0.1:54329 for Postgres), executes schema migrations, injects environment variables, and starts the sub-second reload loop.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Step 4: Deploy to Any Linux VPS</h3>
                    <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
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
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Command Line Interface
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  CLI Reference
                </h2>
                <p className="text-sm text-neutral-300">
                  The Anode CLI is engineered with intuitive, POSIX-compliant Docker-style commands, self-documenting syntax, and sub-command help trees.
                </p>

                {/* Docker-Style Global Synopsis */}
                <div className="rounded-xl border border-white/[0.08] bg-[#07080a] p-5 space-y-3 font-mono-code text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-neutral-400">
                    <span className="text-white font-bold">$ anode --help</span>
                    <span className="text-[11px] text-neutral-500">Docker-Style Syntax</span>
                  </div>
                  <pre className="text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre">
{`Usage:  anode [OPTIONS] COMMAND [ARG...]

Proof-of-Topology Bare-Metal Orchestrator for Unmodified Go Backends

Options:
  -v, --verbose          Print verbose trace logs and contract JSON
      --version          Print version information and exit
  -h, --help             Print usage information

Management Commands:
  cluster                Manage multi-node placement pools and zero-trust firewalls
  catalog                Inspect pluggable stateful catalog drivers and image matrix
  doctor [TARGET] [PATH] Pre-flight verification of compiler, toolchain, loopback and VPS

Commands:
  inspect [PATH]         Extract whole-program SSA topology and write anode.lock.json
  dev [PATH]             Start local hot-reload daemon with ephemeral local port ports
  deploy TARGET [PATH]   Deploy release to bare-metal Linux host via systemd & Caddy
  run TARGET [PATH]      Alias for deploy (Docker CLI parity)
  ps [TARGET] [PATH]     List running processes, cgroup v2 memory/CPU, and Caddy routes
  status [TARGET] [PATH] Alias for ps (process and topology status)
  logs [TARGET] [SVC]    Stream aggregated journald and local supervisor logs
  version                Show the Anode version information

Run 'anode COMMAND --help' for more information on a command.`}
                  </pre>
                </div>

                {/* Enhanced Interactive CLI Command Generator */}
                {(() => {
                  let generatedCommand = "";
                  let commandExplanation = "";

                  if (cmdType === "deploy") {
                    const base = cliDeployAlias ? "anode run" : "anode deploy";
                    const parts = [base, cliHost.trim() || "root@my-vps.com"];
                    if (cliDeployPath.trim()) parts.push(cliDeployPath.trim());
                    if (cliDomain.trim()) parts.push(`--domain ${cliDomain.trim()}`);
                    if (cliArch !== "amd64") parts.push(`--arch=${cliArch}`);
                    if (cliDryRun) parts.push("--dry-run");
                    generatedCommand = parts.join(" ");
                    commandExplanation = cliDryRun
                      ? "Synthesizes systemd unit files and Caddyfile in dry-run preview mode without live SSH deployment."
                      : `Cross-compiles Linux static ELF binaries, enforces cgroups v2 quotas, and deploys to ${cliHost.trim() || "remote VPS"}.`;
                  } else if (cmdType === "logs") {
                    const parts = ["anode logs"];
                    if (logsFollow) parts.push("-f");
                    if (logsLines && logsLines !== "100") parts.push(`-n ${logsLines}`);
                    if (logsTimestamps) parts.push("-t");
                    if (logsSince.trim()) parts.push(`--since ${logsSince.trim()}`);
                    if (logsEdge) parts.push("--edge");
                    if (logsJson) parts.push("--json");
                    if (logsTargetMode === "remote") {
                      parts.push(logsTarget.trim() || "root@my-vps.com");
                    }
                    if (logsService.trim()) parts.push(logsService.trim());
                    generatedCommand = parts.join(" ");
                    commandExplanation = logsTargetMode === "remote"
                      ? (logsFollow
                          ? `Streams real-time journald logs from ${logsTarget.trim() || "remote VPS"} over SSH multiplexed across services.`
                          : `Fetches recent journald log snapshot from ${logsTarget.trim() || "remote VPS"} over SSH.`)
                      : (logsFollow
                          ? "Follows real-time local supervisor logs (.verify/logs/) with color-coded service prefixes."
                          : "Inspects static snapshot of recent local supervisor logs across services.");
                  } else if (cmdType === "ps") {
                    const base = psAlias ? "anode status" : "anode ps";
                    const parts = [base];
                    if (psTargetMode === "remote") {
                      parts.push(psTarget.trim() || "root@my-vps.com");
                    }
                    if (psAll) parts.push("-a");
                    if (psJson) parts.push("--json");
                    if (psVerbose) parts.push("-v");
                    generatedCommand = parts.join(" ");
                    commandExplanation = psTargetMode === "remote"
                      ? `Queries systemd D-Bus and cgroup v2 controller on ${psTarget.trim() || "remote VPS"} for process health, CPU/RAM, and Caddy routing.`
                      : "Queries local dev supervisor status, active ephemeral local port port allocations, and service uptimes.";
                  } else if (cmdType === "doctor") {
                    const parts = ["anode doctor"];
                    if (doctorTargetMode === "remote") {
                      parts.push(doctorTarget.trim() || "root@my-vps.com");
                    }
                    if (doctorPath.trim()) parts.push(doctorPath.trim());
                    if (doctorStrict) parts.push("--strict");
                    if (doctorVerbose) parts.push("-v");
                    generatedCommand = parts.join(" ");
                    commandExplanation = doctorTargetMode === "remote"
                      ? `Performs pre-flight diagnosis of Go toolchain, local ports, and executes 3s TCP/SSH handshake with ${doctorTarget.trim() || "remote VPS"}.`
                      : "Runs 5-pillar local pre-flight checks (Go compiler, cross-compile CGO_ENABLED=0, ephemeral local ports, and container engine).";
                  } else if (cmdType === "dev") {
                    const parts = ["anode dev"];
                    if (devPath.trim()) parts.push(devPath.trim());
                    generatedCommand = parts.join(" ");
                    commandExplanation = "Starts local dev supervisor with ephemeral local sockets (127.0.0.1:0) and sub-second hot reload.";
                  } else if (cmdType === "inspect") {
                    const parts = ["anode inspect"];
                    if (inspectPath.trim()) parts.push(inspectPath.trim());
                    generatedCommand = parts.join(" ");
                    commandExplanation = "Compiles whole-program SSA and VTA call graphs, resolves HTTP/gRPC choke points, and generates anode.lock.json.";
                  } else if (cmdType === "cluster") {
                    if (clusterMode === "init") {
                      const parts = ["anode cluster init"];
                      if (clusterPath.trim()) parts.push(clusterPath.trim());
                      generatedCommand = parts.join(" ");
                      commandExplanation = "Scaffolds an annotated starter anode.cluster.yaml fleet inventory in the project root.";
                    } else {
                      const parts = ["anode cluster"];
                      if (clusterPath.trim()) parts.push(clusterPath.trim());
                      if (clusterInventory.trim()) parts.push(`--inventory=${clusterInventory.trim()}`);
                      if (clusterMode === "firewall") parts.push("--firewall");
                      if (clusterJson) parts.push("--json");
                      generatedCommand = parts.join(" ");
                      commandExplanation = clusterMode === "firewall"
                        ? "Synthesizes atomic zero-trust Linux nftables packet filter rules for every node in the cluster fleet."
                        : "Loads cluster fleet inventory, bin-packs microservices based on RAM/CPU limits, and calculates utilization.";
                    }
                  } else if (cmdType === "catalog") {
                    const parts = ["anode catalog"];
                    if (catalogDriver.trim()) parts.push(catalogDriver.trim());
                    if (catalogPath.trim()) parts.push(catalogPath.trim());
                    if (catalogJson) parts.push("--json");
                    generatedCommand = parts.join(" ");
                    commandExplanation = catalogDriver.trim()
                      ? `Inspects runtime container specs, injected connection variables, and readiness probes for ${catalogDriver.trim()}.`
                      : "Lists all 26+ built-in pre-audited stateful drivers with image tags, ports, and override provenance.";
                  }

                  return (
                    <div className="rounded-xl border border-white/[0.15] bg-white/[0.04] p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-mono-code text-neutral-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-white" />
                          <span>Interactive Command Generator</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.1] text-neutral-200 font-mono-code font-semibold self-start sm:self-auto">
                          Live Builder &amp; Flag Configurator
                        </span>
                      </div>

                      {/* Command Selector Tabs */}
                      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.08] pb-3">
                        {[
                          { id: "deploy" as const, label: "deploy", badge: "VPS" },
                          { id: "logs" as const, label: "logs", badge: "Stream" },
                          { id: "ps" as const, label: "ps", badge: "Metrics" },
                          { id: "doctor" as const, label: "doctor", badge: "Diagnostics" },
                          { id: "dev" as const, label: "dev", badge: "Local" },
                          { id: "inspect" as const, label: "inspect", badge: "SSA" },
                          { id: "cluster" as const, label: "cluster", badge: "Fleet" },
                          { id: "catalog" as const, label: "catalog", badge: "Drivers" },
                        ].map((tab) => {
                          const isActive = cmdType === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setCmdType(tab.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all flex items-center gap-1.5 ${
                                isActive
                                  ? "bg-white/[0.1] text-neutral-200 border border-white/[0.15] shadow-sm shadow-none"
                                  : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-transparent"
                              }`}
                            >
                              <span>anode {tab.label}</span>
                              <span className={`text-[9px] px-1 py-0.5 rounded font-mono-code ${
                                isActive ? "bg-white/[0.1] text-white" : "bg-white/[0.06] text-neutral-500"
                              }`}>
                                {tab.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab Specific Controls */}
                      {cmdType === "deploy" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                              <input
                                type="text"
                                value={cliHost}
                                onChange={(e) => setCliHost(e.target.value)}
                                placeholder="user@your-vps.com"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Custom Domain (TLS):</label>
                              <input
                                type="text"
                                value={cliDomain}
                                onChange={(e) => setCliDomain(e.target.value)}
                                placeholder="api.example.com (optional)"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                              <input
                                type="text"
                                value={cliDeployPath}
                                onChange={(e) => setCliDeployPath(e.target.value)}
                                placeholder=". or ./examples/sample-shop"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400 text-xs font-mono-code">Target Arch:</span>
                                <button
                                  type="button"
                                  onClick={() => setCliArch(cliArch === "amd64" ? "arm64" : "amd64")}
                                  className="px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-neutral-200 text-xs font-mono-code border border-white/[0.1]"
                                >
                                  linux/{cliArch}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={cliDryRun}
                                onChange={(e) => setCliDryRun(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>--dry-run (preview only)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={cliDeployAlias}
                                onChange={(e) => setCliDeployAlias(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>Docker alias (&apos;anode run&apos;)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {cmdType === "logs" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 text-xs font-mono-code">Target Mode:</span>
                            <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                              <button
                                type="button"
                                onClick={() => setLogsTargetMode("remote")}
                                className={`px-2.5 py-0.5 rounded-md ${logsTargetMode === "remote" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Remote VPS (SSH)
                              </button>
                              <button
                                type="button"
                                onClick={() => setLogsTargetMode("local")}
                                className={`px-2.5 py-0.5 rounded-md ${logsTargetMode === "local" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Local Dev Engine
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {logsTargetMode === "remote" && (
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                                <input
                                  type="text"
                                  value={logsTarget}
                                  onChange={(e) => setLogsTarget(e.target.value)}
                                  placeholder="root@my-vps.com"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            )}
                            <div className={logsTargetMode === "local" ? "sm:col-span-2" : ""}>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Service Filter (Optional):</label>
                              <input
                                type="text"
                                value={logsService}
                                onChange={(e) => setLogsService(e.target.value)}
                                placeholder="e.g. orders, payments, caddy (empty for all)"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">History Lines (-n):</label>
                              <div className="flex items-center gap-1.5">
                                {["50", "100", "500"].map((lines) => (
                                  <button
                                    key={lines}
                                    type="button"
                                    onClick={() => setLogsLines(lines)}
                                    className={`px-2 py-1 rounded text-xs font-mono-code border ${
                                      logsLines === lines
                                        ? "bg-white/[0.1] text-neutral-200 border-white/[0.15]"
                                        : "bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:text-white"
                                    }`}
                                  >
                                    {lines}
                                  </button>
                                ))}
                                <input
                                  type="text"
                                  value={logsLines}
                                  onChange={(e) => setLogsLines(e.target.value)}
                                  placeholder="custom"
                                  className="w-20 px-2 py-1 rounded bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Since Window (--since):</label>
                              <input
                                type="text"
                                value={logsSince}
                                onChange={(e) => setLogsSince(e.target.value)}
                                placeholder="e.g. 15m, 1h, 2026-11-14"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={logsFollow}
                                onChange={(e) => setLogsFollow(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>-f, --follow (live streaming)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={logsTimestamps}
                                onChange={(e) => setLogsTimestamps(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>-t, --timestamps (RFC3339)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={logsEdge}
                                onChange={(e) => setLogsEdge(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>--edge (include Caddy logs)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={logsJson}
                                onChange={(e) => setLogsJson(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>--json (ndjson)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {cmdType === "ps" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 text-xs font-mono-code">Target Mode:</span>
                            <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                              <button
                                type="button"
                                onClick={() => setPsTargetMode("remote")}
                                className={`px-2.5 py-0.5 rounded-md ${psTargetMode === "remote" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Remote VPS (SSH)
                              </button>
                              <button
                                type="button"
                                onClick={() => setPsTargetMode("local")}
                                className={`px-2.5 py-0.5 rounded-md ${psTargetMode === "local" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Local Dev Engine
                              </button>
                            </div>
                          </div>

                          {psTargetMode === "remote" && (
                            <div className="text-xs">
                              <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                              <input
                                type="text"
                                value={psTarget}
                                onChange={(e) => setPsTarget(e.target.value)}
                                placeholder="root@my-vps.com"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={psAll}
                                onChange={(e) => setPsAll(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>-a, --all (show stopped units)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={psJson}
                                onChange={(e) => setPsJson(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>--json (raw cgroups v2 telemetry)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={psVerbose}
                                onChange={(e) => setPsVerbose(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>-v, --verbose</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={psAlias}
                                onChange={(e) => setPsAlias(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>Docker alias (&apos;anode status&apos;)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {cmdType === "doctor" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 text-xs font-mono-code">Target Mode:</span>
                            <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                              <button
                                type="button"
                                onClick={() => setDoctorTargetMode("remote")}
                                className={`px-2.5 py-0.5 rounded-md ${doctorTargetMode === "remote" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Remote VPS (SSH)
                              </button>
                              <button
                                type="button"
                                onClick={() => setDoctorTargetMode("local")}
                                className={`px-2.5 py-0.5 rounded-md ${doctorTargetMode === "local" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Local Workspace
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {doctorTargetMode === "remote" && (
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                                <input
                                  type="text"
                                  value={doctorTarget}
                                  onChange={(e) => setDoctorTarget(e.target.value)}
                                  placeholder="root@my-vps.com"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            )}
                            <div className={doctorTargetMode === "local" ? "sm:col-span-2" : ""}>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                              <input
                                type="text"
                                value={doctorPath}
                                onChange={(e) => setDoctorPath(e.target.value)}
                                placeholder=". or ./examples/sample-shop"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={doctorStrict}
                                onChange={(e) => setDoctorStrict(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>--strict (treat warnings as errors)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={doctorVerbose}
                                onChange={(e) => setDoctorVerbose(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>-v, --verbose</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {cmdType === "dev" && (
                        <div className="space-y-3">
                          <div className="text-xs">
                            <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                            <input
                              type="text"
                              value={devPath}
                              onChange={(e) => setDevPath(e.target.value)}
                              placeholder=". (current repo) or ./examples/storefront"
                              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                            />
                          </div>
                          <p className="text-neutral-400 text-xs font-mono-code">
                            Allocates ephemeral local port sockets on 127.0.0.1:0 to avoid port collisions, spins up ephemeral databases, and checks for source changes every 300 ms.
                          </p>
                        </div>
                      )}

                      {cmdType === "inspect" && (
                        <div className="space-y-3">
                          <div className="text-xs">
                            <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                            <input
                              type="text"
                              value={inspectPath}
                              onChange={(e) => setInspectPath(e.target.value)}
                              placeholder=". (current repo) or ./examples/marketplace"
                              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                            />
                          </div>
                          <p className="text-neutral-400 text-xs font-mono-code">
                            Runs SSA and Variable Type Analysis (VTA) call graph sweep, resolves HTTP/gRPC choke points, and outputs immutable <code className="text-neutral-200">anode.lock.json</code>.
                          </p>
                        </div>
                      )}

                      {cmdType === "cluster" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 text-xs font-mono-code">Operation Mode:</span>
                            <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                              <button
                                type="button"
                                onClick={() => setClusterMode("plan")}
                                className={`px-2.5 py-0.5 rounded-md ${clusterMode === "plan" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Placement Matrix
                              </button>
                              <button
                                type="button"
                                onClick={() => setClusterMode("firewall")}
                                className={`px-2.5 py-0.5 rounded-md ${clusterMode === "firewall" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                nftables Firewall
                              </button>
                              <button
                                type="button"
                                onClick={() => setClusterMode("init")}
                                className={`px-2.5 py-0.5 rounded-md ${clusterMode === "init" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                              >
                                Init Fleet Inventory
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                              <input
                                type="text"
                                value={clusterPath}
                                onChange={(e) => setClusterPath(e.target.value)}
                                placeholder=". or ./examples/sample-shop"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                            {clusterMode !== "init" && (
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Custom Inventory (Optional):</label>
                                <input
                                  type="text"
                                  value={clusterInventory}
                                  onChange={(e) => setClusterInventory(e.target.value)}
                                  placeholder="anode.cluster.yaml"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            )}
                          </div>

                          {clusterMode !== "init" && (
                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={clusterJson}
                                  onChange={(e) => setClusterJson(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--json (structured placement &amp; firewall metrics)</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      {cmdType === "catalog" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Driver Kind (Optional):</label>
                              <input
                                type="text"
                                value={catalogDriver}
                                onChange={(e) => setCatalogDriver(e.target.value)}
                                placeholder="e.g. postgres, redis, kafka (empty for all)"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                            <div>
                              <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                              <input
                                type="text"
                                value={catalogPath}
                                onChange={(e) => setCatalogPath(e.target.value)}
                                placeholder=". or ./my-custom-project"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                              <input
                                type="checkbox"
                                checked={catalogJson}
                                onChange={(e) => setCatalogJson(e.target.checked)}
                                className="rounded bg-black border-white/20 text-white focus:ring-0"
                              />
                              <span>--json (structured driver specification)</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Generated Command Box */}
                      <div className="space-y-2 pt-1">
                        <div className="p-3.5 rounded-lg bg-black/90 border border-white/[0.15] flex items-center justify-between font-mono-code text-xs text-neutral-200 shadow-inner">
                          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                            <span className="text-white select-none font-bold">$</span>
                            <span className="text-white font-medium whitespace-nowrap">{generatedCommand}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedCommand);
                              setCopiedCode("cli-builder");
                              setTimeout(() => setCopiedCode(null), 2000);
                            }}
                            className="ml-3 px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] transition-colors"
                            title="Copy command to clipboard"
                          >
                            {copiedCode === "cli-builder" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-sans text-[11px]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="font-sans text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono-code px-1">
                          <span className="text-white font-bold">ℹ</span>
                          <span>{commandExplanation}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-6">
                  {/* anode inspect */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-white font-mono-code">anode inspect [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Static Compilation Pass</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Compiles whole-program SSA and VTA call graphs rooted strictly at <code className="text-neutral-200">func main()</code>. Traces environment variable dataflow backwards to choke points (<code className="text-neutral-200">database/sql.Open</code>, <code className="text-neutral-200">net.Listen</code>, <code className="text-neutral-200">grpc.NewServer</code>), proves migration asset existence, and writes an immutable <code className="text-neutral-200">anode.lock.json</code>.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode inspect .</div>
                      <div className="pl-4 text-emerald-400">anode inspect ./examples/marketplace</div>
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
                      Starts the local development engine. Operates strictly against <code className="text-neutral-200">anode.lock.json</code> (or auto-compiles if missing), binds ephemeral loopback sockets (<code className="text-neutral-200">127.0.0.1:0</code>), provisions isolated database containers, applies pending Goose migrations, and supervises sub-second live recompilation.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-emerald-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode dev</div>
                      <div className="pl-4 text-emerald-400">anode dev ./examples/storefront</div>
                    </div>
                  </div>

                  {/* anode deploy / run */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-white font-mono-code">anode deploy &lt;user@host&gt; [PATH] [OPTIONS]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Bare-Metal VPS Release</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Cross-compiles statically linked Linux ELF executables (<code className="text-neutral-200">CGO_ENABLED=0</code>), SSHs to the remote target, bootstraps the unprivileged <code className="text-neutral-200">anode</code> user, executes pre-traffic database migrations, writes hardened systemd unit files with cgroups v2 quotas (<code className="text-neutral-200">CPUQuota=200%</code>, <code className="text-neutral-200">MemoryMax=1G</code>), and reloads Caddy with zero downtime.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-neutral-200">--dry-run</span> : Synthesize and validate systemd units & Caddyfile without live SSH</div>
                      <div className="pl-4"><span className="text-neutral-200">--domain &lt;domain&gt;</span> : Custom FQDN for automated Let&apos;s Encrypt TLS reverse proxy</div>
                      <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode deploy root@my-vps.com .</div>
                      <div className="pl-4 text-emerald-400">anode deploy root@192.168.1.50 ./examples/storefront --domain api.example.com</div>
                      <div className="pl-4 text-emerald-400">anode deploy root@my-vps.com --dry-run</div>
                      <div className="pl-4 text-neutral-400"># Docker CLI Parity: &apos;anode run&apos; is a drop-in alias for deploy</div>
                      <div className="pl-4 text-emerald-400">anode run root@my-vps.com ./examples/marketplace</div>
                    </div>
                  </div>

                  {/* anode ps / status */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-teal-400 font-mono-code">anode ps [OPTIONS] [TARGET_OR_PATH] [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Process &amp; Cgroups Monitoring</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Inspects running Go microservices, cgroups v2 memory consumption (<code className="text-neutral-200">memory.current / memory.max</code> with smaps PSS/RSS fallback), task thread counts, flapping/crashloop detection (<code className="text-neutral-200">NRestarts</code> and exit status codes), and Caddy reverse-proxy upstream route bindings over SSH or locally.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-teal-300">-a, --all</span> : Show all units (including inactive/stopped services)</div>
                      <div className="pl-4"><span className="text-teal-300">--json</span> : Output complete process, cgroup, and edge metrics as structured JSON</div>
                      <div className="pl-4"><span className="text-teal-300">--target &lt;user@host&gt;</span> : Remote VPS to inspect over SSH</div>
                      <div className="pl-4"><span className="text-teal-300">-v, --verbose</span> : Print verbose trace logs</div>
                      <div className="pl-4"><span className="text-teal-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode ps</div>
                      <div className="pl-4 text-emerald-400">anode ps root@my-vps.com</div>
                      <div className="pl-4 text-emerald-400">anode ps root@192.168.1.50 --all</div>
                      <div className="pl-4 text-emerald-400">anode ps root@my-vps.com --json</div>
                      <div className="pl-4 text-neutral-400"># Docker CLI Parity: &apos;anode status&apos; is a drop-in alias for ps</div>
                      <div className="pl-4 text-emerald-400">anode status root@my-vps.com</div>
                    </div>
                  </div>

                  {/* anode logs */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-orange-400 font-mono-code">anode logs [OPTIONS] [TARGET] [SERVICE]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Log Streaming &amp; Multiplexing</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Aggregates and multiplexes real-time logs across microservices with deterministic color-coded prefixes (<code className="text-neutral-200">[orders]</code>, <code className="text-neutral-200">[payments]</code>). Seamlessly streams from local dev engine log files (<code className="text-neutral-200">.verify/logs/&lt;svc&gt;.log</code>) or remote VPS instances via <code className="text-neutral-200">journalctl -u anode-*.service -o json</code> over SSH, with optional Caddy edge reverse-proxy streaming and line-delimited JSON for log forwarders.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-orange-300">-f, --follow</span> : Follow log output (stream live updates in real time)</div>
                      <div className="pl-4"><span className="text-orange-300">-n, --lines, --tail &lt;N&gt;</span> : Number of lines to show from history (default: 100)</div>
                      <div className="pl-4"><span className="text-orange-300">-t, --timestamps</span> : Show RFC3339 timestamps for each log entry</div>
                      <div className="pl-4"><span className="text-orange-300">--since &lt;TIME&gt;</span> : Show logs more recent than a relative duration (e.g. 10m, 1h) or ISO date</div>
                      <div className="pl-4"><span className="text-orange-300">--until &lt;TIME&gt;</span> : Show logs older than a specific date or relative time</div>
                      <div className="pl-4"><span className="text-orange-300">--edge</span> : Include Caddy reverse-proxy access and edge logs in the stream</div>
                      <div className="pl-4"><span className="text-orange-300">--json</span> : Output structured log records as line-delimited JSON (for Vector, Datadog, Fluentbit)</div>
                      <div className="pl-4"><span className="text-orange-300">--target &lt;user@host&gt;</span> : Remote VPS to stream over SSH</div>
                      <div className="pl-4"><span className="text-orange-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode logs</div>
                      <div className="pl-4 text-emerald-400">anode logs -f</div>
                      <div className="pl-4 text-emerald-400">anode logs orders -f</div>
                      <div className="pl-4 text-emerald-400">anode logs root@my-vps.com -f</div>
                      <div className="pl-4 text-emerald-400">anode logs root@my-vps.com api -n 50 --timestamps</div>
                      <div className="pl-4 text-emerald-400">anode logs root@my-vps.com --edge -f</div>
                      <div className="pl-4 text-emerald-400">anode logs root@my-vps.com --since 1h --json</div>
                    </div>
                  </div>

                  {/* anode doctor */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-white font-mono-code">anode doctor [TARGET_OR_PATH] [PATH] [OPTIONS]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Pre-Flight &amp; Topology Linter</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Performs deep pre-flight sanity checks across 5 core pillars: Go toolchain (<code className="text-neutral-200">go &gt;= 1.27</code>), Linux cross-compilation capability (<code className="text-neutral-200">CGO_ENABLED=0</code>), ephemeral local port subnet allocation (<code className="text-neutral-200">127.0.0.0/8</code>), container daemon socket readiness for ephemeral DBs, migration asset verification, and hardened remote SSH/cgroups v2/systemd pre-flight with strict 3-second timeout root-cause triage.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-neutral-200">--target &lt;user@host&gt;</span> : Remote VPS to perform 3s pre-flight SSH diagnosis</div>
                      <div className="pl-4"><span className="text-neutral-200">--strict</span> : Fail on warnings as well as fatal errors</div>
                      <div className="pl-4"><span className="text-neutral-200">-v, --verbose</span> : Print verbose trace logs</div>
                      <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode doctor</div>
                      <div className="pl-4 text-emerald-400">anode doctor ./examples/sample-shop</div>
                      <div className="pl-4 text-emerald-400">anode doctor root@my-vps.com</div>
                      <div className="pl-4 text-emerald-400">anode doctor root@192.168.1.50 ./examples/marketplace --strict</div>
                    </div>
                  </div>

                  {/* anode catalog */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-amber-400 font-mono-code">anode catalog [OPTIONS] [DRIVER] [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Pluggable Stateful Catalog</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Inspects the built-in catalog of 26+ pre-audited stateful infrastructure drivers (PostgreSQL, MySQL, Redis, Kafka, ScyllaDB, MinIO, Temporal, Qdrant, etc.) and audit override provenance from repo-level <code className="text-neutral-200">anode.catalog.yaml</code>. Supports deep inspection cards for individual drivers and structured JSON export.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                      <div className="pl-4"><span className="text-amber-300">--json</span> : Output catalog specification or individual driver spec as structured JSON</div>
                      <div className="pl-4"><span className="text-amber-300">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode catalog</div>
                      <div className="pl-4 text-emerald-400">anode catalog postgres</div>
                      <div className="pl-4 text-emerald-400">anode catalog redis ./my-custom-project</div>
                      <div className="pl-4 text-emerald-400">anode catalog postgres --json</div>
                      <div className="pl-4 text-emerald-400">anode catalog --json</div>
                    </div>
                  </div>

                  {/* anode cluster */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-white font-mono-code">anode cluster [COMMAND / OPTIONS] [PATH]</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Multi-Node Fleet Placement</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Orchestrates bare-metal and Linux VPS node pools defined in <code className="text-neutral-200">anode.cluster.yaml</code>. Performs greedy Best-Fit Decreasing (BFD) bin-packing against <code className="text-neutral-200">anode.lock.json</code> based on service ingress roles and cgroups v2 RAM limits, and synthesizes atomic zero-trust Linux <code className="text-neutral-200">nftables</code> packet filter rules.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Commands:</div>
                      <div className="pl-4"><span className="text-neutral-200">init</span> : Scaffold a starter annotated anode.cluster.yaml fleet inventory in the project root</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Options:</div>
                      <div className="pl-4"><span className="text-neutral-200">--inventory &lt;PATH&gt;</span> : Custom path to cluster fleet inventory YAML</div>
                      <div className="pl-4"><span className="text-neutral-200">--firewall</span> : Synthesize and display atomic Linux nftables packet filter rules for every node</div>
                      <div className="pl-4"><span className="text-neutral-200">--json</span> : Output placement plan, node capacity, and firewall rules as JSON</div>
                      <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                      <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode cluster</div>
                      <div className="pl-4 text-emerald-400">anode cluster init</div>
                      <div className="pl-4 text-emerald-400">anode cluster --firewall</div>
                      <div className="pl-4 text-emerald-400">anode cluster ./examples/sample-shop</div>
                      <div className="pl-4 text-emerald-400">anode cluster --inventory=/etc/anode/prod-cluster.yaml --json</div>
                    </div>
                  </div>

                  {/* anode version */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-bold text-neutral-300 font-mono-code">anode version</code>
                      <span className="text-[11px] font-mono-code text-neutral-500">Release &amp; Metadata</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Displays the current Anode release version, Git commit SHA, compiler build tag, and supported Go toolchain target.
                    </p>
                    <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <div className="text-neutral-300 font-semibold mb-1">Examples:</div>
                      <div className="pl-4 text-emerald-400">anode version</div>
                      <div className="pl-4 text-emerald-400">anode --version</div>
                    </div>
                  </div>
                </div>
              </div>

            {/* 4. SSA & VTA */}
            <div className={effectiveDoc === "ssa-vta" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Compiler Pipeline
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  SSA & Variable Type Analysis (VTA)
                </h2>
                <p className="text-sm text-neutral-300">
                  How Anode eliminates false positives and constructs a provably sound infrastructure topology.
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
                <div className="space-y-2 text-xs text-neutral-300 pl-4 border-l-2 border-white/[0.15]">
                  <p>1. Type propagation is calculated strictly through <strong>explicit assignment edges</strong>.</p>
                  <p>2. The reachability graph is rooted strictly at <code className="text-neutral-200">func main()</code>.</p>
                  <p>3. Any helper function, test suite, or uncalled database driver is mathematically excluded from the final lockfile.</p>
                </div>
              </div>

            {/* 5. STDLIB CHOKE POINTS */}
            <div className={effectiveDoc === "choke-points" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Static Analysis Sinks
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Standard Library Choke Points
                </h2>
                <p className="text-sm text-neutral-300">
                  Instead of tracking 500 third-party web frameworks, Anode hooks into Go standard library and foundational networking choke points.
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h3 className="text-xs font-bold text-white font-mono-code">1. Ingress Network Listeners</h3>
                    <p className="text-xs text-neutral-300">
                      Anode inspects calls to <code className="text-neutral-200">net/http.ListenAndServe</code>, <code className="text-neutral-200">net.Listen</code>, and popular routers (<code className="text-neutral-200">chi</code>, <code className="text-neutral-200">gin</code>, <code className="text-neutral-200">echo</code>, stdlib 1.27+ <code className="text-neutral-200">http.ServeMux</code>).
                    </p>
                    <pre className="p-3 rounded-lg bg-black/50 border border-white/[0.04] text-[11px] font-mono-code text-neutral-200">
                      <code>{`// Automatically deduces listen port env and route endpoints
mux.HandleFunc("POST /v1/orders", handlers.CreateOrder)
http.ListenAndServe(":" + os.Getenv("PORT"), mux)`}</code>
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h3 className="text-xs font-bold text-emerald-400 font-mono-code">2. Database Drivers & Connection Pools</h3>
                    <p className="text-xs text-neutral-300">
                      Hooks into <code className="text-neutral-200">database/sql.Open(driverName, dsn)</code> and <code className="text-neutral-200">github.com/jackc/pgx/v5/pgxpool.New</code>.
                    </p>
                    <p className="text-xs text-neutral-400">
                      If the driver is postgres or mysql, Anode checks for schema assets in <code className="text-neutral-200">./migrations/*.sql</code>. If present, it marks <code className="text-emerald-400">auto_provision: true</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h3 className="text-xs font-bold text-white font-mono-code">3. Typed gRPC Stubs & Route Linker</h3>
                    <p className="text-xs text-neutral-300">
                      Matches generated Protobuf constructors (<code className="text-neutral-200">New&lt;Service&gt;Client</code>) with server registrations (<code className="text-neutral-200">Register&lt;Service&gt;Server</code>) 1:1, wiring cross-service addresses automatically.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06] space-y-2">
                    <h3 className="text-xs font-bold text-yellow-400 font-mono-code">4. Recursive Backward Taint Tracking</h3>
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
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Contract Specification
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  The anode.lock.json Specification
                </h2>
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
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Dynamic Port Allocator & Local Engine
                </h2>
                <p className="text-sm text-neutral-300">
                  How Anode completely eliminates Docker Compose port collisions on developer workstations.
                </p>

                <h3 className="text-base font-bold text-white">The Ephemeral Kernel Bind Strategy</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  In Docker Compose, services declare fixed host ports like <code className="text-neutral-200">5432:5432</code> or <code className="text-neutral-200">8080:8080</code>. When developers work on multiple microservices or have a local PostgreSQL daemon running, startup crashes with <code className="text-red-400">bind: address already in use</code>.
                </p>

                <div className="p-4 rounded-xl bg-[#06070a] border border-white/[0.06] text-xs font-mono-code text-neutral-300 space-y-2">
                  <div className="text-white">{"// internal/devengine/engine.go"}</div>
                  <div>l, err := net.ListenTCP(&quot;tcp&quot;, &amp;net.TCPAddr{`{IP: net.ParseIP("127.0.0.1"), Port: 0}`})</div>
                  <div>assignedPort := l.Addr().(*net.TCPAddr).Port</div>
                  <div className="text-neutral-500">{"// Returns free port from kernel ephemeral range: e.g. 54329"}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06]">
                    <h3 className="text-xs font-bold text-white mb-1">Dual Credential Injection</h3>
                    <p className="text-xs text-neutral-400">
                      Anode simultaneously injects both unified DSNs (<code className="text-neutral-200">DATABASE_URL</code>) and decomposed credentials (<code className="text-neutral-200">DB_HOST</code>, <code className="text-neutral-200">DB_PORT=54329</code>) based on the application&apos;s discovered <code className="text-neutral-300">expanded_env</code>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#07080a] border border-white/[0.06]">
                    <h3 className="text-xs font-bold text-white mb-1">Loopback Reverse Proxy</h3>
                    <p className="text-xs text-neutral-400">
                      Exposes user-friendly entrypoints (e.g. <code className="text-emerald-300">http://localhost:8080</code>) while transparently mapping behind the scenes to dynamic process IDs.
                    </p>
                  </div>
                </div>
              </div>

            {/* 8. SYSTEMD VPS */}
            <div className={effectiveDoc === "systemd-vps" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Production VPS Deployer
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Bare-Metal Systemd & Cgroups v2
                </h2>
                <p className="text-sm text-neutral-300">
                  Anode turns standard Linux VPS instances (Hetzner, OVH, DigitalOcean) into production-grade orchestration nodes without Kubernetes or Docker daemon overhead.
                </p>

                <h3 className="text-base font-bold text-white">Generated Systemd Unit File</h3>
                <p className="text-xs text-neutral-400">
                  Located at <code className="text-neutral-200 font-mono-code">/etc/systemd/system/anode-&lt;service&gt;.service</code>:
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

                <h3 className="text-base font-bold text-white pt-2">Restart on Deploy</h3>
                <div className="space-y-2 text-xs text-neutral-300 pl-4 border-l-2 border-white/[0.15]">
                  <p>1. Anode uploads the new static Linux executable and writes its systemd unit.</p>
                  <p>2. Restarts the service with <code className="text-neutral-200">systemctl restart</code> and checks GET /healthz until it returns a status from 200 to 399.</p>
                  <p>3. Writes the Caddy configuration for the service and reloads Caddy.</p>
                  <p>4. The restart is in place. Connections open when the service restarts are dropped, so each deploy has a short outage for that service.</p>
                </div>
              </div>

            {/* PLUGGABLE STATEFUL CATALOG */}
            <div className={effectiveDoc === "catalog-drivers" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                  Infrastructure Catalog
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Pluggable Stateful Infrastructure Catalog
                </h2>
                <p className="text-sm text-neutral-300">
                  Anode decouples database and broker provisioning from the core orchestrator using a declarative driver catalog. This scales cleanly to 100+ services without modifying compiler or deployer Go code.
                </p>

                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-white" />
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
                  Drop a YAML definition into your repository at <code className="text-white">.anode/catalog/my-db.yaml</code> to register internal databases or specialized configurations with zero recompilation:
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
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Least-Privilege Security Boundary
                </h2>
                <p className="text-sm text-neutral-300">
                  Anode enforces defense-in-depth security on bare-metal and VPS instances. No microservice ever runs as root, and stateful databases are protected from runaway application leaks.
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      1. Dedicated Unprivileged anode User
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Bootstrap creates the system user <code className="text-neutral-300">anode</code> with no interactive login (<code className="text-neutral-300">/bin/false</code>). All service binaries run under this isolated user.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      2. Deterministic POSIX 0700 File Permissions
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Data directories at <code className="text-neutral-300">/var/lib/anode/data/</code> are initialized with mode <code className="text-neutral-300">0700</code> mapped to database engine UIDs (e.g. 999 for Postgres), blocking host tampering.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      3. Kernel OOM Score Priority Tiering
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Stateful databases receive <code className="text-white">--oom-score-adj=-900</code>, ensuring the Linux kernel never terminates databases during application memory pressure. Stateless services run with <code className="text-amber-400">+500</code> and are sacrificed first.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      4. Strict Loopback Binding (127.0.0.1)
                    </h3>
                    <p className="text-xs text-neutral-400">
                      All stateful database and broker ports bind strictly to loopback (<code className="text-neutral-300">127.0.0.1</code>). Zero database ports are exposed to the public internet interface.
                    </p>
                  </div>
                </div>
              </div>

            {/* INFRASTRUCTURE AUTOMATION */}
            <div className={effectiveDoc === "infra-automation" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Infrastructure as Code
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Ansible & Terraform VM Automation
                </h2>
                <p className="text-sm text-neutral-300">
                  Provision and configure testing environments or production bare-metal VPS instances with a single command using Anode&apos;s included IaC modules.
                </p>

                <h3 className="text-base font-bold text-white pt-2">1. One-Click Local VM Setup (OrbStack)</h3>
                <p className="text-xs text-neutral-300">
                  Spins up an Ubuntu Linux VM, installs OpenSSH, synchronizes authorized keys, and tests live deployments:
                </p>
                <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                  <code>{`./scripts/setup-test-vm.sh anode-vm`}</code>
                </pre>

                <h3 className="text-base font-bold text-white pt-2">2. Ansible Playbook (infra/ansible/)</h3>
                <p className="text-xs text-neutral-300">
                  Idempotent server orchestration configuring Caddy, Docker, Cgroups v2, and the unprivileged <code className="text-white">anode</code> user:
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
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Measured on one Go service with no database. Hardware: OrbStack Debian 12 VM on Apple Silicon (arm64), 7 vCPU, 8 GB RAM, Docker 20.10.24, anode 1.6.0. Both arms run the same static Linux binary that anode deploy produced. Earlier figures on this site were not backed by recorded runs and have been replaced with these.
                </p>
                <div className="overflow-x-auto my-6">
                  <table className="w-full text-xs font-mono-code border border-white/[0.08] rounded-xl overflow-hidden">
                    <thead className="bg-[#07080a] text-neutral-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="p-3 text-left">Measure</th>
                        <th className="p-3 text-left text-white">Anode (systemd unit)</th>
                        <th className="p-3 text-left">Docker (container)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] bg-[#0a0a0c]/50">
                      <tr>
                        <td className="p-3 font-semibold text-white">Cold start to /healthz 200 (median of 10, page cache dropped)</td>
                        <td className="p-3 text-emerald-400 font-bold">35 ms (range 32 to 37 ms)</td>
                        <td className="p-3 text-neutral-400">607 ms (range 592 to 914 ms)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Idle service process RSS (20 s after health check)</td>
                        <td className="p-3 text-emerald-400 font-bold">5.5 MB</td>
                        <td className="p-3 text-neutral-400">5.8 MB</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-white">Idle total including runtime daemons</td>
                        <td className="p-3 text-emerald-400 font-bold">5.5 MB</td>
                        <td className="p-3 text-neutral-400">102.4 MB (dockerd, containerd and shims 96.6 MB)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Config: the anode unit runs with DynamicUser, MemoryMax=1G and CPUQuota=200%. The Docker container uses plain docker run defaults, with no memory limit or extra hardening. Cold start is measured from systemctl start or docker run until a TCP connection returns HTTP 200 on /healthz, timed with a microsecond clock, with page caches dropped before each run. Running the same binary directly with no supervisor reaches a 200 in a median of 4.7 ms (range 3.7 to 6.9 ms). Where the anode time goes, from the same session with 10 runs per variant: a bare systemd unit takes 11 ms, and the anode unit without DynamicUser takes 12 ms, so the sandbox directives add about 1 ms. The full anode unit takes 32 ms, so DynamicUser adds about 20 ms per start. Anode keeps DynamicUser because its isolation policy requires it, so that cost is part of the anode cold start.
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Analyzer timing (anode inspect, median of 5 runs, Apple Silicon Mac): sample-shop 1.10 s, storefront 1.19 s, retail-platform 2.21 s, marketplace 8.81 s. Each run produced an identical lockfile hash. Peak analyzer memory is 0.7 to 2.8 GB, which is build-time memory and is not comparable to service memory.
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Not measured yet: multi-service stacks with PostgreSQL, and a live deploy to a remote host. The Docker comparison ran on a local VM, not a production server.
                </p>
              </div>

            {/* 10. TRADEOFFS & LIMITS */}
            <div className={effectiveDoc === "tradeoffs" ? "block space-y-6 leading-relaxed" : "hidden"}>
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  Architectural Honesty
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Tradeoffs, Limits & Non-Goals
                </h2>
                <p className="text-sm text-neutral-300">
                  Honest engineering requires being explicit about what a tool <strong>refuses to do</strong>, where it excels, and the fundamental tradeoffs inherent in its architecture.
                </p>

                {/* Comparison Matrix Table */}
                <div className="overflow-x-auto my-6">
                  <table className="w-full text-xs font-mono-code border border-white/[0.08] rounded-xl overflow-hidden">
                    <thead className="bg-[#07080a] text-neutral-400 border-b border-white/[0.08]">
                      <tr>
                        <th className="p-3 text-left">Capability</th>
                        <th className="p-3 text-left text-white">Anode</th>
                        <th className="p-3 text-left">Kubernetes</th>
                        <th className="p-3 text-left">Docker Compose</th>
                        <th className="p-3 text-left">Encore.dev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] bg-[#0a0a0c]/50">
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
                        <td className="p-3 text-neutral-200 font-bold">Linux VPS</td>
                        <td className="p-3 text-red-400">Managed Kubernetes (EKS/GKE)</td>
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
                      <li>Hosting on a Linux VPS from Hetzner, OVH, or DigitalOcean.</li>
                      <li>Tired of multi-stage Dockerfiles and compose port collisions.</li>
                      <li>Want automated Let&apos;s Encrypt TLS through Caddy.</li>
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
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Troubleshooting &amp; Common Issues
              </h2>
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
                  <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-neutral-200">
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
                    <div className="mt-2 text-white">
                      {`sudo sed -i 's/GRUB_CMDLINE_LINUX="$/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1 /' /etc/default/grub`}
                    </div>
                    <div className="mt-1 text-neutral-400">sudo update-grub &amp;&amp; sudo reboot</div>
                  </div>
                </div>

                {/* Issue 3 */}
                <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                  <div className="flex items-center gap-2 text-white text-xs font-mono-code font-bold">
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
