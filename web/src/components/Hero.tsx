"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { InteractiveTerminal } from "./InteractiveTerminal";
import releases from "@/data/changelog.json";

const latestRelease = releases.find((r) => r.isLatest);

export function Hero() {
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"brew" | "curl" | "go">("brew");

  const installCmd =
    installMethod === "brew"
      ? "brew install abhiudayg/tap/anode"
      : installMethod === "curl"
      ? "curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/master/install.sh | bash"
      : "go install github.com/abhiudayg/anode/cmd/anode@latest";

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ["#ffffff", "#22c55e", "#a1a1aa"],
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-36 pb-20 overflow-hidden bg-[#000000]">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Monospace Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-2 mb-8 text-xs font-mono-code text-neutral-400"
        >
          <Link href="/changelog" className="text-emerald-400 hover:underline">{latestRelease?.tag} latest release</Link>
          <span className="text-neutral-600">•</span>
          <span className="text-white font-medium">Proof-of-Topology</span>
          <span className="text-neutral-600">•</span>
          <span>Bare-Metal Go Orchestrator</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-500">MIT Open Source</span>
        </motion.div>

        {/* Two-Column Balanced Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-14">
          {/* Left Column (span 7): Giant Headline, Pitch, and Trust Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-between space-y-6"
          >
            <h1 className="text-5xl sm:text-7xl xl:text-8xl font-black tracking-tight text-white leading-[1.02]">
              Anode.
              <span className="block text-neutral-500 font-bold mt-2">
                The bare-metal Go orchestrator.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-normal max-w-xl">
              Unmodified Go code, smaller bills. Compiles directly to static Linux ELF binaries supervised by systemd with cgroups v2 quotas and automated TLS. Zero Docker daemon.
            </p>

            <p className="text-sm text-neutral-400 leading-relaxed max-w-xl">
              Built for one VPS running 1 to 10 Go services. No daemon, no rolling deploys, no multi-host scheduler. Larger fleets are better served by Docker or Kubernetes.{" "}
              <Link href="/compatibility" className="underline underline-offset-4 hover:text-white">Docker gap list</Link>
              {" · "}
              <Link href="/limitations" className="underline underline-offset-4 hover:text-white">What the analyzer supports</Link>
            </p>

            <div className="flex flex-wrap items-center gap-5 text-xs font-mono-code text-neutral-400 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero Docker daemon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>AST reachability analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Bare-metal Linux systemd</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column (span 5): Install Box, Actions & Microcopy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-4 pt-1"
          >
            {/* Install Box with Tab Switcher */}
            <div
              id="quickstart"
              onClick={handleCopy}
              className="scroll-mt-32 rounded-2xl border border-white/[0.12] bg-[#0c0c0f] hover:border-white/[0.28] transition-all p-4 shadow-2xl group cursor-pointer"
            >
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06] text-xs font-mono-code text-neutral-400">
                <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-lg border border-white/[0.06]">
                  {[
                    { id: "brew" as const, label: "brew tap" },
                    { id: "curl" as const, label: "curl" },
                    { id: "go" as const, label: "source" },
                  ].map((m) => {
                    const isSelected = installMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInstallMethod(m.id);
                        }}
                        className="relative px-2.5 py-0.5 text-[11px] font-mono-code rounded transition-colors focus:outline-none"
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="install-method-pill"
                            className="absolute inset-0 bg-white rounded shadow-sm"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span
                          className={`relative z-10 transition-colors ${
                            isSelected ? "text-black font-bold" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          {m.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-neutral-500 font-mono-code">macOS arm64 / linux amd64</span>
              </div>

              <div className="flex items-center justify-between gap-3 font-mono-code text-xs sm:text-sm">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar truncate text-neutral-200">
                  <span className="text-emerald-400 font-bold select-none">$</span>
                  <span className="truncate">{installCmd}</span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.16] text-xs font-mono-code text-neutral-200 transition-colors shrink-0"
                  aria-label="Copy install command"
                >
                  {copied ? (
                    <span className="text-emerald-400 font-bold">Copied</span>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-neutral-200 text-sm font-semibold transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Read the docs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs text-neutral-500 font-mono-code pt-1">
              Free and open source under the MIT license. Zero Docker daemon required.
            </p>
          </motion.div>
        </div>

        {/* Centerpiece Interactive Terminal */}
        <motion.div
          id="topology"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="scroll-mt-32 w-full my-8"
        >
          <InteractiveTerminal />
        </motion.div>

        {/* Animated Connector Arrow from Terminal to Pipeline */}
        <div className="flex flex-col items-center justify-center pt-6 pb-4 relative">
          <div className="h-8 w-[1px] bg-gradient-to-b from-white/20 via-emerald-400/60 to-emerald-400 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full h-4 bg-white shadow-[0_0_8px_rgba(34,197,94,1)]"
              animate={{ y: [-16, 32] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            />
          </div>
          <div className="w-5 h-5 rounded-full bg-[#0a0a0c] border border-emerald-400/40 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)] my-1">
            <span className="text-[10px] text-emerald-400 font-mono-code font-bold leading-none">↓</span>
          </div>
          <span className="text-[10px] font-mono-code text-neutral-400 uppercase tracking-widest mt-0.5">
            Deterministic Pipeline Flow
          </span>
        </div>

        {/* 3 Value Pillars Connected by Flow Arrows */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-6 pt-2"
        >
          {/* Connector Arrow 1 -> 2 (Desktop) */}
          <div className="hidden md:flex absolute left-[31%] top-1/2 -translate-y-1/2 z-20 items-center justify-center pointer-events-none">
            <svg width="36" height="18" viewBox="0 0 36 18" className="overflow-visible">
              <defs>
                <linearGradient id="flow-arrow-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <line x1="0" y1="9" x2="28" y2="9" stroke="url(#flow-arrow-1)" strokeWidth="1.5" strokeDasharray="3 3" />
              <polygon points="28,5 34,9 28,13" fill="#22c55e" />
              <motion.circle
                cx="0"
                cy="9"
                r="2"
                fill="#ffffff"
                className="filter drop-shadow-[0_0_6px_rgba(34,197,94,1)]"
                animate={{ cx: [0, 32], opacity: [0, 1, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
              />
            </svg>
          </div>

          {/* Connector Arrow 2 -> 3 (Desktop) */}
          <div className="hidden md:flex absolute left-[64.5%] top-1/2 -translate-y-1/2 z-20 items-center justify-center pointer-events-none">
            <svg width="36" height="18" viewBox="0 0 36 18" className="overflow-visible">
              <defs>
                <linearGradient id="flow-arrow-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
              <line x1="0" y1="9" x2="28" y2="9" stroke="url(#flow-arrow-2)" strokeWidth="1.5" strokeDasharray="3 3" />
              <polygon points="28,5 34,9 28,13" fill="#22c55e" />
              <motion.circle
                cx="0"
                cy="9"
                r="2"
                fill="#ffffff"
                className="filter drop-shadow-[0_0_6px_rgba(34,197,94,1)]"
                animate={{ cx: [0, 32], opacity: [0, 1, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, delay: 0.9, ease: "linear" }}
              />
            </svg>
          </div>

          {/* Stage 1: Inspect */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="p-5 rounded-2xl bg-[#08080b] border border-white/[0.08] flex flex-col justify-between hover:border-white/[0.2] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono-code font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">01</span>
                  <span>Inspect</span>
                </div>
                <span className="text-[10px] font-mono-code text-neutral-400 uppercase">Static AST</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Compiler-grade SSA and Variable Type Analysis trace network choke-points and dependencies directly from AST.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] text-[11px] font-mono-code text-emerald-400 flex items-center gap-1.5">
              <span>Zero heuristics</span>
              <span className="text-neutral-600">→</span>
            </div>
          </motion.div>

          {/* Mobile Down Arrow 1 -> 2 */}
          <div className="flex md:hidden items-center justify-center -my-2 text-neutral-600">
            <span className="text-emerald-400 font-mono-code text-xs">↓</span>
          </div>

          {/* Stage 2: Dev */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="p-5 rounded-2xl bg-[#08080b] border border-white/[0.08] flex flex-col justify-between hover:border-white/[0.2] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono-code font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">02</span>
                  <span>Dev</span>
                </div>
                <span className="text-[10px] font-mono-code text-neutral-400 uppercase">Local Ports</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sub-second reload with dynamic loopback ports. Zero port collisions across 10 microservices on one machine.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] text-[11px] font-mono-code text-emerald-400 flex items-center gap-1.5">
              <span>Ephemeral local binding</span>
              <span className="text-neutral-600">→</span>
            </div>
          </motion.div>

          {/* Mobile Down Arrow 2 -> 3 */}
          <div className="flex md:hidden items-center justify-center -my-2 text-neutral-600">
            <span className="text-emerald-400 font-mono-code text-xs">↓</span>
          </div>

          {/* Stage 3: Deploy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.26 }}
            className="p-5 rounded-2xl bg-[#08080b] border border-white/[0.08] flex flex-col justify-between hover:border-white/[0.2] transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-mono-code font-bold text-white">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">03</span>
                  <span>Deploy</span>
                </div>
                <span className="text-[10px] font-mono-code text-neutral-400 uppercase">Linux Native</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hardened Linux systemd units, DynamicUser sandboxing, cgroups v2 limits, and automated Caddy TLS.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] text-[11px] font-mono-code text-emerald-400 flex items-center gap-1.5">
              <span>Bare-metal ELF execution</span>
              <span className="text-emerald-400">✓</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
