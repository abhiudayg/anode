"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Copy, Check, Play, RefreshCw, FileCode, CheckCircle2, Server, Database, Network } from "lucide-react";

export function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState<"inspect" | "dev" | "lock">("inspect");
  const [copied, setCopied] = useState(false);

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inspectOutput = `
$ anode inspect ./testdata/sample-shop

[1/4] 🔍 Initializing SSA & VTA Choke-Point Engine...
      • Rooted at main.go (func main)
      • Package graph resolved: 48 pkgs, 312 functions
[2/4] 🧬 Variable Type Analysis (VTA) call graph constructed
      • Detected sql.Open("postgres", cfg.DatabaseURL)
      • Verified migration assets at ./migrations/*.sql (4 schema files)
      • Provenance guarantee: Schema-backed PostgreSQL instance
[3/4] 🌐 Interface & gRPC route extraction
      • Registered HTTP routes:
        ↳ POST /v1/orders (orders.Handler.CreateOrder)
        ↳ GET  /v1/orders/:id (orders.Handler.GetOrder)
      • Discovered upstream RPC: payment.v1.PaymentService via dialContext()
[4/4] 🔒 Synthesizing immutable contract...
      ✓ Generated anode.lock.json (Schema v1.0, SHA256: 8e4b7a1...)
      ✓ Determinism proof verified (4/4 Pillars satisfied in 18ms)
`.trim();

  const devOutput = `
$ anode dev

[anode:dev] 🚀 Starting Local Orchestrator (Zero Port Collisions)
[anode:dev] 📦 Allocating isolated ephemeral resources:
            • postgres:16-alpine ──> dynamic loopback 127.0.0.1:54329 (host: free)
            • redis:7-alpine     ──> dynamic loopback 127.0.0.1:63792 (host: free)
[anode:dev] 💉 Injected runtime configuration:
            • DATABASE_URL = "postgres://anode:secret@127.0.0.1:54329/shop_dev?sslmode=disable"
            • PORT         = "8080"
[anode:dev] ⚡ Running migration job: 4 pending migrations applied (3.4ms)
[anode:dev] 🔄 Go app compiled & listening on http://127.0.0.1:8080
[anode:dev] 📡 Loopback reverse-proxy active:
            ↳ http://localhost:8080 ──> :8080 (Process ID: 41892)
[anode:dev] ✨ Watching for Go source changes (sub-second hot-reload enabled)...
`.trim();

  const lockOutput = `{
  "schema_version": "1.0",
  "project": "sample-shop",
  "generated_at": "2026-11-10T16:32:00Z",
  "services": [
    {
      "name": "api-gateway",
      "entrypoint": "./cmd/api",
      "type": "http",
      "listen_port_env": "PORT",
      "default_port": 8080,
      "routes": [
        { "method": "POST", "path": "/v1/orders" },
        { "method": "GET", "path": "/v1/orders/:id" }
      ],
      "dependencies": [
        {
          "type": "database",
          "engine": "postgres",
          "version": "16",
          "migrations_dir": "./migrations",
          "env_mapping": "DATABASE_URL"
        }
      ]
    }
  ],
  "verification": {
    "engine": "SSA-VTA-Proof-of-Topology",
    "status": "PASS",
    "strict_determinism": true
  }
}`;

  return (
    <div id="interactive-terminal" className="w-full max-w-5xl mx-auto my-12">
      <div className="relative rounded-2xl p-1 bg-gradient-to-b from-white/[0.15] via-white/[0.05] to-transparent shadow-[0_0_80px_-20px_rgba(0,173,216,0.3)]">
        {/* Terminal Shell */}
        <div className="rounded-[14px] bg-[#0c0e14] border border-white/[0.08] overflow-hidden backdrop-blur-2xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#090a0f]/90">
            {/* macOS Dots */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]/80 border border-[#e0443e]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/80 border border-[#dea123]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]/80 border border-[#1aab29]/50 inline-block" />
              <span className="ml-3 text-xs font-mono-code text-neutral-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>anode-orchestration-shell</span>
              </span>
            </div>

            {/* Interactive Mode Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/[0.06] mt-2 sm:mt-0">
              <button
                onClick={() => setActiveTab("inspect")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono-code transition-all ${
                  activeTab === "inspect"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,173,216,0.2)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Play className="w-3 h-3" />
                <span>anode inspect</span>
              </button>

              <button
                onClick={() => setActiveTab("dev")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono-code transition-all ${
                  activeTab === "dev"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                <span>anode dev</span>
              </button>

              <button
                onClick={() => setActiveTab("lock")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono-code transition-all ${
                  activeTab === "lock"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                    : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>anode.lock.json</span>
              </button>
            </div>

            {/* Copy Action */}
            <button
              onClick={() => {
                const text =
                  activeTab === "inspect"
                    ? inspectOutput
                    : activeTab === "dev"
                    ? devOutput
                    : lockOutput;
                copyContent(text);
              }}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] transition-colors font-mono-code"
              title="Copy terminal contents"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal Body */}
          <div className="p-5 font-mono-code text-xs md:text-sm overflow-x-auto min-h-[340px] bg-[#07080b]/95">
            <AnimatePresence mode="wait">
              {activeTab === "inspect" && (
                <motion.div
                  key="inspect"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 leading-relaxed"
                >
                  <div className="flex items-center gap-2 text-neutral-400 mb-4 pb-2 border-b border-white/[0.04]">
                    <span className="text-cyan-400 font-bold">~</span>
                    <span className="text-white">anode inspect ./testdata/sample-shop</span>
                    <span className="ml-auto text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                      SSA Static Pass • 18ms
                    </span>
                  </div>

                  <div className="text-neutral-400 space-y-1">
                    <p className="text-neutral-300 font-semibold flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">[1/4]</span>
                      <span>Initializing SSA & Variable Type Analysis Core...</span>
                    </p>
                    <p className="pl-6 text-neutral-400">• Rooted at <span className="text-cyan-300">main.go (func main)</span></p>
                    <p className="pl-6 text-neutral-400">• Package graph resolved: <span className="text-neutral-200">48 pkgs, 312 functions</span></p>

                    <p className="text-neutral-300 font-semibold pt-2 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">[2/4]</span>
                      <span>Call graph choke-point inspection</span>
                    </p>
                    <p className="pl-6 text-emerald-400 font-medium">✓ Detected sql.Open(&quot;postgres&quot;, cfg.DatabaseURL)</p>
                    <p className="pl-6 text-neutral-400">• Verified migration assets: <span className="text-neutral-200">./migrations/*.sql (4 files)</span></p>
                    <p className="pl-6 text-cyan-300/80">• Provenance guarantee: Schema-backed PostgreSQL engine</p>

                    <p className="text-neutral-300 font-semibold pt-2 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">[3/4]</span>
                      <span>Interface & route table extraction</span>
                    </p>
                    <p className="pl-6 text-neutral-300">• Discovered HTTP endpoints:</p>
                    <p className="pl-10 text-emerald-400">↳ POST /v1/orders <span className="text-neutral-500">(orders.Handler.CreateOrder)</span></p>
                    <p className="pl-10 text-emerald-400">↳ GET  /v1/orders/:id <span className="text-neutral-500">(orders.Handler.GetOrder)</span></p>

                    <p className="text-neutral-300 font-semibold pt-2 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">[4/4]</span>
                      <span>Synthesizing immutable contract</span>
                    </p>
                    <p className="pl-6 text-cyan-400 font-medium">✓ Generated anode.lock.json (SHA256: 8e4b7a1...)</p>
                    <p className="pl-6 text-neutral-400">✓ Determinism proof verified: <span className="text-emerald-400 font-bold">4/4 Pillars satisfied</span></p>
                  </div>
                </motion.div>
              )}

              {activeTab === "dev" && (
                <motion.div
                  key="dev"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 leading-relaxed"
                >
                  <div className="flex items-center gap-2 text-neutral-400 mb-4 pb-2 border-b border-white/[0.04]">
                    <span className="text-emerald-400 font-bold">~</span>
                    <span className="text-white">anode dev</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Reload Active
                    </span>
                  </div>

                  <div className="text-neutral-400 space-y-1">
                    <p className="text-neutral-300 font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-400" />
                      <span>Starting Local Orchestrator (Zero Port Collisions)</span>
                    </p>

                    <p className="pl-6 text-neutral-300 font-medium">📦 Allocating isolated ephemeral resources:</p>
                    <p className="pl-10 text-emerald-300">
                      • postgres:16-alpine ──&gt; <span className="text-yellow-300 font-bold">127.0.0.1:54329</span> <span className="text-neutral-500">(host:5432 free)</span>
                    </p>
                    <p className="pl-10 text-emerald-300">
                      • redis:7-alpine     ──&gt; <span className="text-yellow-300 font-bold">127.0.0.1:63792</span> <span className="text-neutral-500">(host:6379 free)</span>
                    </p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">💉 Injected decomposed environment variables:</p>
                    <p className="pl-10 text-neutral-400">DATABASE_URL = <span className="text-cyan-300">&quot;postgres://anode:secret@127.0.0.1:54329/shop_dev&quot;</span></p>
                    <p className="pl-10 text-neutral-400">PORT = <span className="text-cyan-300">&quot;8080&quot;</span></p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">⚡ Running migration job:</p>
                    <p className="pl-10 text-emerald-400 font-medium">✓ 4 pending SQL migrations applied in 3.4ms</p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">📡 Loopback reverse-proxy active:</p>
                    <p className="pl-10 text-white font-bold">↳ Ready at <span className="text-cyan-400 underline underline-offset-4">http://localhost:8080</span></p>
                    <p className="pl-10 text-neutral-500">Watching Go source changes (sub-second hot-reload)...</p>
                  </div>
                </motion.div>
              )}

              {activeTab === "lock" && (
                <motion.div
                  key="lock"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-neutral-400 mb-3 pb-2 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-neutral-200">anode.lock.json (Immutable Provenance Contract)</span>
                    </div>
                    <span className="text-[11px] text-purple-400 font-mono-code bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                      Commit to Git
                    </span>
                  </div>

                  <pre className="text-neutral-300 overflow-x-auto text-xs leading-relaxed font-mono-code">
                    <code>
                      {`{
  "`}<span className="text-purple-400">schema_version</span>{`": "`}<span className="text-emerald-300">1.0</span>{`",
  "`}<span className="text-purple-400">project</span>{`": "`}<span className="text-neutral-200">sample-shop</span>{`",
  "`}<span className="text-purple-400">services</span>{`": [
    {
      "`}<span className="text-cyan-400">name</span>{`": "`}<span className="text-neutral-200">api-gateway</span>{`",
      "`}<span className="text-cyan-400">entrypoint</span>{`": "`}<span className="text-neutral-200">./cmd/api</span>{`",
      "`}<span className="text-cyan-400">routes</span>{`": [
        { "`}<span className="text-purple-300">method</span>{`": "`}<span className="text-emerald-300">POST</span>{`", "`}<span className="text-purple-300">path</span>{`": "`}<span className="text-emerald-300">/v1/orders</span>{`" }
      ],
      "`}<span className="text-cyan-400">dependencies</span>{`": [
        {
          "`}<span className="text-amber-300">type</span>{`": "`}<span className="text-emerald-300">database</span>{`",
          "`}<span className="text-amber-300">engine</span>{`": "`}<span className="text-emerald-300">postgres</span>{`",
          "`}<span className="text-amber-300">migrations_dir</span>{`": "`}<span className="text-neutral-200">./migrations</span>{`",
          "`}<span className="text-amber-300">env_mapping</span>{`": "`}<span className="text-cyan-300">DATABASE_URL</span>{`"
        }
      ]
    }
  ],
  "`}<span className="text-purple-400">verification</span>{`": {
    "`}<span className="text-neutral-400">engine</span>{`": "`}<span className="text-neutral-200">SSA-VTA-Proof-of-Topology</span>{`",
    "`}<span className="text-neutral-400">status</span>{`": "`}<span className="text-emerald-400 font-bold">PASS</span>{`"
  }
}`}
                    </code>
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Terminal Footer Info Strip */}
          <div className="px-4 py-2 bg-[#090a0f] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono-code text-neutral-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Proof of Topology: Validated
              </span>
              <span className="hidden sm:inline-block text-neutral-600">|</span>
              <span className="hidden sm:inline-block text-neutral-400">Zero SDK imports required</span>
            </div>
            <div className="text-cyan-400/80 font-medium">
              Bare Metal systemd + cgroups v2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
