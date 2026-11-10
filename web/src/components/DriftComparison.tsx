"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, XCircle, ArrowRightLeft, Layers, FileCode } from "lucide-react";

export function DriftComparison() {
  const [view, setView] = useState<"side-by-side" | "diff">("side-by-side");

  return (
    <section id="drift" className="py-24 relative overflow-hidden bg-[#08090b] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full inline-block mb-3">
            Architecture Without Drift
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Stop Writing Your Architecture Twice
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Every time you build a Go backend with Docker, your Go code and your configuration drift apart. Anode computes the infrastructure contract directly from source.
          </p>
        </div>

        {/* Side-by-side comparison cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Status Quo: Brittle Docker & Compose */}
          <div className="relative rounded-2xl border border-red-500/20 bg-[#0d0f14]/80 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code bg-red-950/60 text-red-400 border border-red-800/40">
                <XCircle className="w-3.5 h-3.5" />
                The Docker / Compose Trap
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-neutral-200">
                Fragile Dual-Declaration
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                You declare dependencies in Go (`sql.Open`), then duplicate them in a multi-stage Dockerfile and a 60-line docker-compose.yml.
              </p>

              {/* Code Snippet: Docker drift */}
              <div className="rounded-xl bg-[#07080a] p-4 border border-white/[0.06] font-mono-code text-xs text-neutral-400 space-y-2 overflow-x-auto">
                <div className="text-neutral-500 pb-2 border-b border-white/[0.04] flex items-center justify-between">
                  <span>docker-compose.yml (Manually Maintained)</span>
                  <span className="text-red-400">Prone to Drift</span>
                </div>
                <p className="text-red-300">services:</p>
                <p className="pl-4 text-neutral-400">api:</p>
                <p className="pl-8 text-neutral-400">build: .</p>
                <p className="pl-8 text-red-300">ports: [&quot;8080:8080&quot;] <span className="text-neutral-600"># Collision if already used</span></p>
                <p className="pl-4 text-neutral-400">db:</p>
                <p className="pl-8 text-neutral-400">image: postgres:16</p>
                <p className="pl-8 text-red-300">ports: [&quot;5432:5432&quot;] <span className="text-neutral-600"># Crashes if local PG runs!</span></p>
              </div>

              {/* Drawbacks checklist */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Port collisions on 5432/6379 break multi-project dev</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Env variable renames in Go silently break compose definitions</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Heavy container daemon memory footprint (200MB+ idle)</span>
                </div>
              </div>
            </div>
          </div>

          {/* The Anode Way: Proof-of-Topology */}
          <div className="relative rounded-2xl border border-cyan-500/30 bg-[#0e121a]/90 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_-15px_rgba(0,173,216,0.2)] flex flex-col justify-between">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-code bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                The Anode Way
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Compiler-Backed Single Truth</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Your Go code is the sole specification. Anode extracts the exact topology, assigns collision-free dynamic ephemeral ports, and commits the contract to Git.
              </p>

              {/* Code Snippet: Anode inspect */}
              <div className="rounded-xl bg-[#06070a] p-4 border border-cyan-500/20 font-mono-code text-xs text-neutral-300 space-y-2 overflow-x-auto">
                <div className="text-cyan-400/80 pb-2 border-b border-cyan-500/10 flex items-center justify-between">
                  <span>anode inspect (Auto-derived from Go AST)</span>
                  <span className="text-emerald-400 font-bold">Zero YAML</span>
                </div>
                <p className="text-cyan-300">// 100% Deterministic SSA Call Graph Pass</p>
                <p className="text-neutral-300">
                  Detected: <span className="text-emerald-300">sql.Open(&quot;postgres&quot;)</span> + <span className="text-emerald-300">./migrations/*.sql</span>
                </p>
                <p className="text-neutral-400">
                  Local Dev: <span className="text-yellow-300 font-bold">127.0.0.1:54329</span> <span className="text-emerald-400">(Dynamic loopback)</span>
                </p>
                <p className="text-neutral-400">
                  Production: <span className="text-purple-300 font-bold">systemd + cgroups v2</span> <span className="text-neutral-500">(Native Linux)</span>
                </p>
              </div>

              {/* Benefits checklist */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zero port collisions: run 10 services on one machine simultaneously</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>No proprietary SDKs: standard `database/sql` and `net/http`</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cross-compiles single static binary with systemd supervision</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
