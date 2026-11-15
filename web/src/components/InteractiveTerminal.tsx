"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Copy, Check, Play, RefreshCw, FileCode, CheckCircle2, Server } from "lucide-react";

export function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState<"inspect" | "dev" | "lock" | "deploy">("inspect");
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
      ✓ Determinism proof verified (4/4 Pillars satisfied)
`.trim();

  const devOutput = `
$ anode dev

[anode:dev] 🚀 Starting Local Orchestrator (Free local ports)
[anode:dev] 📦 Allocating isolated ephemeral resources:
            • postgres:16-alpine ──> ephemeral local port 127.0.0.1:54329 (host: free)
            • redis:7-alpine     ──> ephemeral local port 127.0.0.1:63792 (host: free)
[anode:dev] 💉 Injected runtime configuration:
            • DATABASE_URL = "postgres://anode:secret@127.0.0.1:54329/shop_dev?sslmode=disable"
            • PORT         = "8080"
[anode:dev] ⚡ Running migration job: 4 pending migrations applied
[anode:dev] 🔄 Go app compiled & listening on http://127.0.0.1:8080
[anode:dev] 📡 Loopback reverse-proxy active:
            ↳ http://localhost:8080 ──> :8080 (Process ID: 41892)
[anode:dev] ✨ Watching for Go source changes (sub-second hot-reload enabled)...
`.trim();

  const deployOutput = `
$ anode deploy root@my-vps.com --domain api.example.com

[anode:deploy] 🔨 Cross-compiling static Linux ELF binary (GOOS=linux GOARCH=amd64)...
[anode:deploy] 🚀 Uploading release bundle (SHA256: 4f9a2b8e...) to /opt/anode/releases/v14
[anode:deploy] 🛡️ Configuring systemd unit with cgroups v2:
               • User: DynamicUser=yes (No root daemon, isolated UID)
               • Memory: MemoryMax=512M (Enforced by Linux kernel cgroup)
               • CapabilityBoundingSet: CAP_NET_BIND_SERVICE
[anode:deploy] 🔒 Automated Reverse Proxy:
               • Caddy v2 reverse proxy mapped to localhost:8080
               • Automatic Let's Encrypt TLS certificate provisioned
[anode:deploy] 🔄 Zero-downtime atomic symlink switch: /opt/anode/current ──> releases/v14
[anode:deploy] ✓ Health check PASSED on https://api.example.com/healthz (200 OK in 42ms)
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
    <div className="w-full max-w-5xl mx-auto my-6">
      <div className="relative rounded-2xl p-1 bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)]">
        {/* Terminal Shell */}
        <div className="rounded-[14px] bg-[#08080a] border border-white/[0.1] overflow-hidden backdrop-blur-2xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#050507]">
            {/* macOS Dots */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]/80 border border-[#e0443e]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/80 border border-[#dea123]/50 inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]/80 border border-[#1aab29]/50 inline-block" />
              <span className="ml-3 text-xs font-mono-code text-neutral-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-neutral-300" />
                <span>anode-orchestration-shell</span>
              </span>
            </div>

            {/* Interactive Mode Tabs with Sliding Spring Pill */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/[0.06] mt-2 sm:mt-0 relative">
              {[
                { id: "inspect" as const, label: "01 inspect", icon: Play },
                { id: "dev" as const, label: "02 dev", icon: RefreshCw },
                { id: "lock" as const, label: "03 lockfile", icon: FileCode },
                { id: "deploy" as const, label: "04 deploy", icon: Server },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative px-3 py-1 text-xs font-mono-code transition-colors rounded-md focus:outline-none"
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="terminal-active-pill"
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span
                      className={`relative z-10 flex items-center gap-1.5 font-medium transition-colors ${
                        isSelected ? "text-black font-semibold" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Copy Action */}
            <button
              onClick={() => {
                const text =
                  activeTab === "inspect"
                    ? inspectOutput
                    : activeTab === "dev"
                    ? devOutput
                    : activeTab === "lock"
                    ? lockOutput
                    : deployOutput;
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
                    <span className="text-white font-bold select-none">~</span>
                    <span className="text-white">anode inspect ./testdata/sample-shop</span>
                    <span className="ml-auto text-[11px] px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.12] text-neutral-300 font-mono-code">
                      SSA Static Pass
                    </span>
                  </div>

                  <div className="text-neutral-400 space-y-1">
                    <p className="text-neutral-200 font-semibold flex items-center gap-2">
                      <span className="text-white font-bold">[1/4]</span>
                      <span>Initializing SSA &amp; Variable Type Analysis Core...</span>
                    </p>
                    <p className="pl-6 text-neutral-400">• Rooted at <span className="text-white font-mono-code">main.go (func main)</span></p>
                    <p className="pl-6 text-neutral-400">• Package graph resolved: <span className="text-neutral-200">48 pkgs, 312 functions</span></p>

                    <p className="text-neutral-200 font-semibold pt-2 flex items-center gap-2">
                      <span className="text-white font-bold">[2/4]</span>
                      <span>Call graph choke-point inspection</span>
                    </p>
                    <p className="pl-6 text-emerald-400 font-medium">✓ Detected sql.Open(&quot;postgres&quot;, cfg.DatabaseURL)</p>
                    <p className="pl-6 text-neutral-400">• Verified migration assets: <span className="text-neutral-200">./migrations/*.sql (4 files)</span></p>
                    <p className="pl-6 text-neutral-300">• Provenance guarantee: Schema-backed PostgreSQL engine</p>

                    <p className="text-neutral-200 font-semibold pt-2 flex items-center gap-2">
                      <span className="text-white font-bold">[3/4]</span>
                      <span>Interface &amp; route table extraction</span>
                    </p>
                    <p className="pl-6 text-neutral-300">• Discovered HTTP endpoints:</p>
                    <p className="pl-10 text-emerald-400">↳ POST /v1/orders <span className="text-neutral-500">(orders.Handler.CreateOrder)</span></p>
                    <p className="pl-10 text-emerald-400">↳ GET  /v1/orders/:id <span className="text-neutral-500">(orders.Handler.GetOrder)</span></p>

                    <p className="text-neutral-200 font-semibold pt-2 flex items-center gap-2">
                      <span className="text-white font-bold">[4/4]</span>
                      <span>Synthesizing immutable contract</span>
                    </p>
                    <p className="pl-6 text-emerald-400 font-medium">✓ Generated anode.lock.json (SHA256: 8e4b7a1...)</p>
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
                    <span className="text-emerald-400 font-bold select-none">~</span>
                    <span className="text-white">anode dev</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Reload Active
                    </span>
                  </div>

                  <div className="text-neutral-400 space-y-1">
                    <p className="text-neutral-200 font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-white" />
                      <span>Starting Local Orchestrator (Free local ports)</span>
                    </p>

                    <p className="pl-6 text-neutral-300 font-medium">📦 Allocating isolated ephemeral resources:</p>
                    <p className="pl-10 text-neutral-300">
                      • postgres:16-alpine ──&gt; <span className="text-emerald-400 font-mono-code font-bold">127.0.0.1:54329</span> <span className="text-neutral-500">(host:5432 free)</span>
                    </p>
                    <p className="pl-10 text-neutral-300">
                      • redis:7-alpine     ──&gt; <span className="text-emerald-400 font-mono-code font-bold">127.0.0.1:63792</span> <span className="text-neutral-500">(host:6379 free)</span>
                    </p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">💉 Injected decomposed environment variables:</p>
                    <p className="pl-10 text-neutral-400">DATABASE_URL = <span className="text-neutral-200 font-mono-code">&quot;postgres://anode:secret@127.0.0.1:54329/shop_dev&quot;</span></p>
                    <p className="pl-10 text-neutral-400">PORT = <span className="text-neutral-200 font-mono-code">&quot;8080&quot;</span></p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">⚡ Running migration job:</p>
                    <p className="pl-10 text-emerald-400 font-medium">✓ 4 pending SQL migrations applied</p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">📡 Loopback reverse-proxy active:</p>
                    <p className="pl-10 text-white font-bold">↳ Ready at <span className="text-white underline underline-offset-4">http://localhost:8080</span></p>
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
                      <FileCode className="w-3.5 h-3.5 text-white" />
                      <span className="text-neutral-200">anode.lock.json (Immutable Provenance Contract)</span>
                    </div>
                    <span className="text-[11px] text-neutral-300 font-mono-code bg-white/[0.08] px-2 py-0.5 rounded border border-white/[0.12]">
                      Commit to Git
                    </span>
                  </div>

                  <pre className="text-neutral-300 overflow-x-auto text-xs leading-relaxed font-mono-code">
                    <code>
                      {`{
  "`}<span className="text-white font-semibold">schema_version</span>{`": "`}<span className="text-neutral-300">1.0</span>{`",
  "`}<span className="text-white font-semibold">project</span>{`": "`}<span className="text-neutral-200">sample-shop</span>{`",
  "`}<span className="text-white font-semibold">services</span>{`": [
    {
      "`}<span className="text-white font-semibold">name</span>{`": "`}<span className="text-neutral-200">api-gateway</span>{`",
      "`}<span className="text-white font-semibold">entrypoint</span>{`": "`}<span className="text-neutral-200">./cmd/api</span>{`",
      "`}<span className="text-white font-semibold">routes</span>{`": [
        { "`}<span className="text-neutral-400">method</span>{`": "`}<span className="text-emerald-400">POST</span>{`", "`}<span className="text-neutral-400">path</span>{`": "`}<span className="text-emerald-400">/v1/orders</span>{`" }
      ],
      "`}<span className="text-white font-semibold">dependencies</span>{`": [
        {
          "`}<span className="text-neutral-400">type</span>{`": "`}<span className="text-neutral-200">database</span>{`",
          "`}<span className="text-neutral-400">engine</span>{`": "`}<span className="text-neutral-200">postgres</span>{`",
          "`}<span className="text-neutral-400">migrations_dir</span>{`": "`}<span className="text-neutral-200">./migrations</span>{`",
          "`}<span className="text-neutral-400">env_mapping</span>{`": "`}<span className="text-neutral-200">DATABASE_URL</span>{`"
        }
      ]
    }
  ],
  "`}<span className="text-white font-semibold">verification</span>{`": {
    "`}<span className="text-neutral-400">engine</span>{`": "`}<span className="text-neutral-200">SSA-VTA-Proof-of-Topology</span>{`",
    "`}<span className="text-neutral-400">status</span>{`": "`}<span className="text-emerald-400 font-bold">PASS</span>{`"
  }
}`}
                    </code>
                  </pre>
                </motion.div>
              )}

              {activeTab === "deploy" && (
                <motion.div
                  key="deploy"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 leading-relaxed"
                >
                  <div className="flex items-center gap-2 text-neutral-400 mb-4 pb-2 border-b border-white/[0.04]">
                    <span className="text-white font-bold select-none">~</span>
                    <span className="text-white">anode deploy root@my-vps.com --domain api.example.com</span>
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Atomic Symlink Rollout
                    </span>
                  </div>

                  <div className="text-neutral-400 space-y-1">
                    <p className="text-neutral-200 font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-white" />
                      <span>Cross-compiling static Linux ELF binary (GOOS=linux GOARCH=amd64)</span>
                    </p>

                    <p className="pl-6 text-neutral-300 font-medium">🚀 Uploading release bundle:</p>
                    <p className="pl-10 text-neutral-400">
                      • Bundle SHA256: <span className="text-neutral-200 font-mono-code">4f9a2b8e19c02d...</span> ──&gt; <span className="text-white">/opt/anode/releases/v14</span>
                    </p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">🛡️ Configuring systemd unit with cgroups v2:</p>
                    <p className="pl-10 text-emerald-400">• DynamicUser=yes (Zero root daemon, isolated sandbox UID)</p>
                    <p className="pl-10 text-neutral-300">• MemoryMax=512M · CPUWeight=100 (Kernel-enforced cgroups v2)</p>
                    <p className="pl-10 text-neutral-400">• CapabilityBoundingSet=CAP_NET_BIND_SERVICE</p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">🔒 Automated Reverse Proxy:</p>
                    <p className="pl-10 text-emerald-400">✓ Caddy reverse proxy configured for api.example.com</p>
                    <p className="pl-10 text-neutral-400">✓ Let&apos;s Encrypt automated TLS certificate provisioned</p>

                    <p className="pl-6 text-neutral-300 font-medium pt-2">🔄 Zero-downtime atomic symlink switch:</p>
                    <p className="pl-10 text-white font-bold">↳ /opt/anode/current ──&gt; releases/v14</p>
                    <p className="pl-10 text-emerald-400 font-semibold">✓ Health check PASSED on https://api.example.com/healthz (200 OK in 42ms)</p>
                  </div>
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
            <div className="text-neutral-300 font-medium">
              Bare Metal systemd + cgroups v2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
