"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  FileJson,
  Server,
  Workflow,
  ArrowRight,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

// 5-Pass Compiler Data
const COMPILER_PASSES = [
  {
    id: "ssa",
    passNum: "Pass 01",
    title: "SSA Construction",
    subtitle: "AST Lowering with Generics",
    intent: "Eliminate syntax ambiguity by converting high-level Go into explicit, low-level instructions (Call, Alloc, FieldAddr, Store, BinOp).",
    tech: "golang.org/x/tools/go/ssa with ssa.InstantiateGenerics",
    details: [
      "Expressions, nested calls, and branches are flattened into explicit single-assignment values.",
      "Generic function instantiations are resolved to concrete types.",
      "Removes control-flow noise so subsequent analysis inspects raw execution behavior."
    ],
    snippet: `// Go source:
db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))

// Lowered SSA Instructions:
t0 = os.Getenv("DATABASE_URL")
t1 = sql.Open("postgres", t0)
store db <- t1`
  },
  {
    id: "vta",
    passNum: "Pass 02",
    title: "Reachability Graph",
    subtitle: "Variable Type Analysis (VTA)",
    intent: "Prune dead code and test mocks by computing a strict call graph rooted solely at func main().",
    tech: "golang.org/x/tools/go/callgraph/vta",
    details: [
      "VTA constructs a precise call graph based on variable assignment flow rather than simple class hierarchies.",
      "Why not CHA (Class Hierarchy Analysis)? CHA assumes any struct implementing an interface might be called, erroneously dragging in test doubles and mock DB drivers.",
      "Dead branches and unreferenced packages are dropped entirely."
    ],
    snippet: `// Rooted Call Graph:
func main()
  ├── cmd.Execute()
  │     └── server.NewServer()
  │           ├── net/http.ListenAndServe (Choke Point)
  │           └── db.InitPool()
  └── [Dead Code / Test Helpers Omitted]`
  },
  {
    id: "choke",
    passNum: "Pass 03",
    title: "Choke-Point Sinks",
    subtitle: "Foundational Primitive Matching",
    intent: "Monitor a small, invariant set of standard library primitives rather than maintaining fragile catalogues of hundreds of web frameworks.",
    tech: "internal/analyzer/sinks.go",
    details: [
      "Ingress: net/http.ListenAndServe, net.Listen, and router adapters (Chi, Gin, Fiber).",
      "Databases: database/sql.Open, pgxpool.New, go-redis NewClient, mongo.Connect.",
      "RPC: Generated protoc-gen-go Register<X>Server and New<X>Client constructors."
    ],
    snippet: `// Monitored Choke-Point Sinks:
• Ingress:   net/http.ListenAndServe(":" + port, mux)
• Storage:   database/sql.Open("postgres", dsn)
• Cache:     redis.NewClient(&redis.Options{Addr: addr})
• RPC:       pb.RegisterOrderServiceServer(s, &server{})`
  },
  {
    id: "taint",
    passNum: "Pass 04",
    title: "Backward Taint Analysis",
    subtitle: "Provenance & Secret Extraction",
    intent: "Trace backward from sinks through string concatenations and struct stores to discover exact environment variables without running user code.",
    tech: "internal/analyzer/taint.go",
    details: [
      "Walks backwards through os.Getenv, os.LookupEnv, and config struct assignments.",
      "Unfolds fmt.Sprintf, strings.Join, and string concatenation.",
      "A DSN assembled from $DB_HOST, $DB_PORT, $DB_USER is captured as structured expanded_env rather than an opaque mystery string."
    ],
    snippet: `// Traced Backward from database/sql.Open sink:
DSN = fmt.Sprintf("postgres://%s:%s@%s:%s/%s",
        os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_HOST"), os.Getenv("DB_PORT"),
        os.Getenv("DB_NAME"))

// Extracted Topology:
dependencies: ["DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME"]`
  },
  {
    id: "linker",
    passNum: "Pass 05",
    title: "Topology Linker",
    subtitle: "Deterministic Contract Synthesis",
    intent: "Bind internal microservices across repo boundaries and separate internal communication from third-party external egress.",
    tech: "internal/analyzer/linker.go ➔ anode.lock.json",
    details: [
      "Matches gRPC clients to gRPC servers via interface hashes.",
      "Matches HTTP client calls to declared router patterns (e.g. POST /v1/orders).",
      "External endpoints (api.stripe.com, s3.amazonaws.com) are cataloged as egress_rules.",
      "Produces canonical JSON and computes cryptographic SHA-256 contract hash."
    ],
    snippet: `// Output Contract: anode.lock.json
{
  "contract_hash": "sha256:7f4a9b2...",
  "services": {
    "orders-api": { "port_env": "PORT", "bindings": ["db-orders"] }
  },
  "egress_rules": ["api.stripe.com:443"]
}`
  }
];

// Runtime Modes Data
const RUNTIME_MODES = [
  {
    id: "dev",
    title: "Local Development Engine",
    command: "anode dev",
    badge: "100ms Inner Loop",
    summary: "Instant local velocity with dynamic kernel loopback ports and zero host port collisions.",
    cards: [
      {
        title: "Dynamic Loopback Allocation (127.0.0.0/8)",
        desc: "Instead of hardcoding :5432 or :8080, services and dev stores get free kernel ports (e.g., 127.0.0.1:54329). Dev stores are one container per resource name, so two checkouts with the same resource share it."
      },
      {
        title: "Ephemeral Backing Stores",
        desc: "Spawns temporary Docker/Podman instances mapped strictly to loopback sockets with project-scoped state. Runs automated Goose migrations before traffic flows."
      },
      {
        title: "Process Pool Supervisor & Hot Reload",
        desc: "Compiles and executes native binaries locally. A 300ms debounced file watcher restarts processes gracefully via SIGINT/SIGTERM without lingering orphaned child processes."
      }
    ]
  },
  {
    id: "deploy",
    title: "Production Bare-Metal Deployer",
    command: "anode deploy",
    badge: "Bare Metal VPS",
    summary: "Zero-container production orchestration: cross-compiled ELF binaries inside hardened systemd cgroups v2.",
    cards: [
      {
        title: "Static Cross-Compilation",
        desc: "Builds self-contained Linux binaries (CGO_ENABLED=0 GOOS=linux) locally. Streams them atomically over verified SSH (known_hosts enforcement) to /var/lib/anode/releases/<release>/."
      },
      {
        title: "Hardened Systemd Sandboxing",
        desc: "Synthesizes systemd service units configured with DynamicUser=yes, ProtectSystem=strict, NoNewPrivileges=true, CPUQuota=200%, and MemoryMax=1G. No root runtime daemons."
      },
      {
        title: "Automated Caddy TLS Edge",
        desc: "Provisions Caddy reverse-proxy routing public HTTP/HTTPS traffic to the service's internal loopback port, obtaining automated Let's Encrypt TLS certificates."
      }
    ]
  }
];

// Measured Benchmark Data
const MEASURED_DATA = [
  { label: "Cold start, single service (anode unit vs Docker container)", anode: "35 ms", docker: "607 ms", ratio: "17x faster" },
  { label: "Idle RAM footprint, single service (anode vs Docker daemon overhead)", anode: "5.5 MB", docker: "~104 MB", ratio: "95% less" },
  { label: "Marketplace cold start, 32 microservices on GCE e2-standard-8", anode: "3.3 s", docker: "5.6 s", ratio: "41% faster" },
  { label: "Two services + PostgreSQL ready-to-serve latency", anode: "2.4 s", docker: "1.6 s", ratio: "Docker pre-cached" },
  { label: "P99 latency under 500 RPS via Caddy edge proxy", anode: "2.5 ms", docker: "2.5 ms", ratio: "Parity" },
  { label: "Full SSA Analyzer pass time (32 services, 35 backing stores)", anode: "8.8 s", docker: "N/A", ratio: "Deterministic" }
];

export function ArchitectureView() {
  const [activePass, setActivePass] = useState(0);
  const [activeRuntime, setActiveRuntime] = useState<"dev" | "deploy">("dev");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 space-y-24">
      {/* Header */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-mono-code">
          <Workflow className="w-3.5 h-3.5" />
          <span>System Blueprint</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          How Anode Works: Proof-of-Topology Architecture
        </h1>
        <p className="text-lg text-neutral-400 max-w-3xl leading-relaxed">
          Anode decouples your infrastructure definition from proprietary YAML and runtime SDKs. By analyzing unmodified Go source code, it derives an immutable topology contract and executes it on bare metal without Docker daemons.
        </p>
      </header>

      {/* 1. High-Level Blueprint Diagram */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Mental Model</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">The Two Halves of Anode</h2>
          </div>
          <span className="text-xs font-mono-code text-neutral-500">Zero-SDK • Deterministic Contract</span>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Box 1: Compiler */}
            <div className="p-5 rounded-xl border border-white/[0.1] bg-black/60 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Static Compiler
                  </span>
                  <Code2 className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white">Go Source Code</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Raw Go standard library calls: <code className="text-neutral-300">database/sql</code>, <code className="text-neutral-300">net/http</code>, <code className="text-neutral-300">os.Getenv</code>. Zero custom imports.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono-code text-neutral-500">
                CLI: <span className="text-neutral-300">anode inspect</span>
              </div>
            </div>

            {/* Box 2: Contract */}
            <div className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/[0.04] relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    Immutable Contract
                  </span>
                  <FileJson className="w-4 h-4 text-orange-400" />
                </div>
                <h3 className="text-base font-bold text-white">anode.lock.json</h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  Cryptographically hashed topology graph: microservice bindings, ports, auto-provisioned databases, and secret dependencies.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-500/20 text-[11px] font-mono-code text-orange-300/80">
                Committed to Git (PR reviewable)
              </div>
            </div>

            {/* Box 3: Execution */}
            <div className="p-5 rounded-xl border border-white/[0.1] bg-black/60 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Execution Runtimes
                  </span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">Target Environment</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Consumes the lockfile directly. Local dev provisions ephemeral loopbacks; production orchestrates Linux systemd + Caddy TLS.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono-code text-neutral-500">
                CLI: <span className="text-neutral-300">anode dev / deploy</span>
              </div>
            </div>
          </div>

          {/* Flow Indicator Banner */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono-code text-neutral-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Single source of truth: If it is not in the Go source code, it does not exist in infrastructure.</span>
            </span>
            <Link href="/limitations" className="text-neutral-300 hover:text-white underline underline-offset-4 hidden sm:inline">
              Analyzer Support Matrix &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Interactive Compiler Pipeline (The 5 Passes) */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Deep Dive 01</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">The 5-Pass SSA Compiler Engine</h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
            How Anode extracts infrastructure topology from raw Go AST without running your application or evaluating dynamic reflection.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {COMPILER_PASSES.map((pass, idx) => {
            const isActive = activePass === idx;
            return (
              <button
                key={pass.id}
                onClick={() => setActivePass(idx)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-white/[0.08] border-white/30 text-white shadow-lg"
                    : "bg-[#0a0a0c] border-white/[0.06] text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                }`}
              >
                <div className="text-[10px] font-mono-code text-neutral-500 uppercase">{pass.passNum}</div>
                <div className="text-xs font-bold mt-1 truncate">{pass.title}</div>
              </button>
            );
          })}
        </div>

        {/* Active Pass Card */}
        <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono-code text-orange-400 mb-1">
                <span>{COMPILER_PASSES[activePass].passNum}</span>
                <span>•</span>
                <span>{COMPILER_PASSES[activePass].subtitle}</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{COMPILER_PASSES[activePass].title}</h3>
            </div>
            <div className="text-xs font-mono-code px-3 py-1.5 rounded-lg bg-black border border-white/[0.1] text-neutral-400">
              Tech: <span className="text-neutral-200">{COMPILER_PASSES[activePass].tech}</span>
            </div>
          </div>

          {/* Intent Callout */}
          <div className="p-4 rounded-xl bg-orange-500/[0.05] border border-orange-500/20 text-sm text-neutral-300">
            <span className="font-bold text-orange-400">Intent: </span>
            {COMPILER_PASSES[activePass].intent}
          </div>

          {/* Details & Code Snippet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Mechanics & Guarantees</h4>
              <ul className="space-y-2.5">
                {COMPILER_PASSES[activePass].details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 mb-2">Compiler Intermediate Representation</h4>
              <pre className="p-4 rounded-xl bg-black/80 border border-white/[0.08] text-xs font-mono-code text-neutral-300 leading-relaxed overflow-x-auto">
                {COMPILER_PASSES[activePass].snippet}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dev Engine vs. Production Deployer */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Deep Dive 02</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Runtime Execution Architectures</h2>
            <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
              Anode applies different execution strategies depending on whether you are iterating on a laptop or running in production.
            </p>
          </div>

          {/* Runtime Mode Selector */}
          <div className="inline-flex p-1 rounded-xl bg-[#0a0a0c] border border-white/[0.1] text-xs font-mono-code">
            <button
              onClick={() => setActiveRuntime("dev")}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeRuntime === "dev" ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              anode dev (Local)
            </button>
            <button
              onClick={() => setActiveRuntime("deploy")}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeRuntime === "deploy" ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
              }`}
            >
              anode deploy (VPS)
            </button>
          </div>
        </div>

        {/* Active Runtime View */}
        {(() => {
          const mode = RUNTIME_MODES.find((m) => m.id === activeRuntime)!;
          return (
            <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div>
                  <div className="text-xs font-mono-code text-emerald-400 mb-1">{mode.badge}</div>
                  <h3 className="text-2xl font-bold text-white">{mode.title}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{mode.summary}</p>
                </div>
                <div className="text-xs font-mono-code px-3 py-1.5 rounded-lg bg-black border border-white/[0.1] text-white">
                  $ {mode.command}
                </div>
              </div>

              {/* 3 Architecture Pillars for this mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mode.cards.map((card, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-black/50 space-y-2">
                    <h4 className="text-sm font-bold text-neutral-200">{card.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>

              {/* Visual Architecture Diagram for Selected Mode */}
              <div className="mt-6 p-5 rounded-xl border border-white/[0.08] bg-black/70 space-y-4">
                <span className="text-xs font-mono-code uppercase text-neutral-400">
                  {mode.id === "dev" ? "Local Port Collision-Free Loopback Architecture" : "Linux Bare-Metal Systemd Sandbox Architecture"}
                </span>

                {mode.id === "dev" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-code">
                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-neutral-500 mb-1">Developer Code</div>
                      <div className="text-white font-bold">shop-api</div>
                      <div className="text-emerald-400 mt-2">Binds: 127.0.0.1:54123</div>
                    </div>
                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-neutral-500 mb-1">Ephemeral Store</div>
                      <div className="text-white font-bold">postgres (docker)</div>
                      <div className="text-emerald-400 mt-2">Binds: 127.0.0.1:54329</div>
                    </div>
                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-neutral-500 mb-1">Environment Injection</div>
                      <div className="text-white font-bold">Auto-Wired DSN</div>
                      <div className="text-neutral-400 mt-2">DB_PORT=54329</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono-code">
                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-neutral-500 mb-1">Edge Ingress</div>
                      <div className="text-white font-bold">Caddy TLS (:443)</div>
                      <div className="text-blue-400 mt-2">Let&apos;s Encrypt Auto</div>
                    </div>
                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-neutral-500 mb-1">Loopback Proxy</div>
                      <div className="text-white font-bold">Internal Socket</div>
                      <div className="text-neutral-300 mt-2">127.0.0.1:21040</div>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04]">
                      <div className="text-neutral-500 mb-1">systemd Sandbox</div>
                      <div className="text-emerald-400 font-bold">DynamicUser=yes</div>
                      <div className="text-neutral-300 mt-2">ProtectSystem=strict</div>
                    </div>
                    <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="text-neutral-500 mb-1">cgroups v2 Ceilings</div>
                      <div className="text-white font-bold">Resource Caps</div>
                      <div className="text-neutral-300 mt-2">CPU=200% Mem=1G</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </section>

      {/* 4. The 4 Non-Negotiable Architectural Invariants */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Guarantees</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Four Invariant Pillars</h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
            These rules are enforced by the compiler AST sweep, not by team convention or discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Migration-Driven Provenance</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              A database store is marked <code className="text-neutral-200">auto_provision</code> only when migration assets exist (<code className="text-neutral-300">migrations/*.sql</code> or Goose). Without migrations, it is classified as an external unmanaged dependency. Anode never guesses.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Typed Interface Linking</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              gRPC client constructors (<code className="text-neutral-200">NewOrderClient</code>) match server registrations (<code className="text-neutral-200">RegisterOrderServer</code>) by concrete protobuf interface type. HTTP calls bind to exact route paths (e.g. <code className="text-neutral-200">POST /v1/orders</code>).
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Commit-Backed Contract Lockfile</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              <code className="text-neutral-200">anode inspect</code> writes an immutable, human-readable <code className="text-neutral-200">anode.lock.json</code>. Runtime execution runs against this lockfile exclusively. Infrastructure alterations appear directly in Git pull request diffs.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="text-lg font-bold text-white">Build-Time Diagnostics</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ambiguous connection strings, circular dependencies, and unmatched service endpoints fail with precise <code className="text-neutral-200">file:line</code> provenance during the static inspect pass, never during runtime traffic handling.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Measured Numbers & Empirical Benchmarks */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Verification</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Measured Empirical Benchmarks</h2>
            <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
              Recorded comparisons between Anode bare-metal systemd units and standard Docker containerized deployments.
            </p>
          </div>
          <Link
            href="/benchmarks"
            className="text-xs font-mono-code text-orange-400 hover:text-orange-300 underline underline-offset-4"
          >
            Full Benchmark Raw Data &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0a0a0c]">
          <table className="w-full text-left text-xs font-mono-code">
            <thead className="bg-white/[0.03] text-neutral-400 uppercase tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-3 font-medium">Metric / Scenario</th>
                <th className="px-5 py-3 font-medium text-emerald-400">Anode (systemd)</th>
                <th className="px-5 py-3 font-medium text-neutral-400">Docker (containerd)</th>
                <th className="px-5 py-3 font-medium text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {MEASURED_DATA.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.01]">
                  <td className="px-5 py-3.5 text-neutral-300">{row.label}</td>
                  <td className="px-5 py-3.5 text-white font-bold">{row.anode}</td>
                  <td className="px-5 py-3.5 text-neutral-400">{row.docker}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-400">{row.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Honest Technical Limitations (What Anode Does Not Do) */}
      <section className="p-6 sm:p-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Transparent Engineering: What Anode Does NOT Do Yet</span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Anode replaces container daemons with pure Go static analysis and Linux systemd. We maintain total transparency on our current technical roadmap:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-300 leading-relaxed font-mono-code">
          <div className="p-3 rounded-lg bg-black/40 border border-amber-500/10 flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>No Zero-Downtime Rollouts:</strong> A changed service restarts in place. Caddy holds requests for up to 15 s while it restarts; a running request finishes only if the app drains on SIGTERM.</span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-amber-500/10 flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>No Host DB Provisioning:</strong> Production PostgreSQL must exist on the host; Anode does not run apt-get install postgresql.</span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-amber-500/10 flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Outbound Firewall Policy:</strong> Generated nftables firewall restricts inbound and forward chains; egress is not restricted.</span>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-amber-500/10 flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Polyglot Apps Unsupported:</strong> Anode is strictly engineered for Go backends. Python, Node, and Ruby belong in Docker.</span>
          </div>
        </div>
        <div className="pt-2">
          <Link
            href="/limitations"
            className="text-xs font-mono-code text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            Review the complete 42-item Analyzer Support Matrix &rarr;
          </Link>
        </div>
      </section>

      {/* CTA Footer Card */}
      <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Experience Proof-of-Topology Locally</h3>
        <p className="text-sm text-neutral-400 max-w-xl mx-auto">
          Run <code className="text-neutral-200">anode inspect</code> on your own Go backend to view your SSA dependency graph without writing a single line of YAML.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <div className="px-4 py-2 rounded-xl bg-black border border-white/[0.1] font-mono-code text-xs text-neutral-200">
            brew install abhiudayg/tap/anode
          </div>
          <Link
            href="/docs/quickstart"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs font-mono-code font-bold transition-all"
          >
            <span>Read Quickstart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
