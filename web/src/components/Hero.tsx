"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Copy, Check, ArrowRight, ShieldCheck, Zap, GitBranch } from "lucide-react";
import confetti from "canvas-confetti";
import { InteractiveTerminal } from "./InteractiveTerminal";

export function Hero() {
  const [copied, setCopied] = useState(false);
  const [installMethod, setInstallMethod] = useState<"brew" | "curl" | "go">("brew");

  const installCmd = installMethod === "brew"
    ? "brew install abhiudayg/tap/anode"
    : installMethod === "curl"
    ? "curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/master/install.sh | bash"
    : "go install github.com/abhiudayg/anode/cmd/anode@latest";

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#00ADD8", "#8B5CF6", "#10B981"],
    });
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      {/* Background Radial Glow & Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-purple-600/15 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-cyan-400/10 blur-[90px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/#topology"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-md mb-8 group hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,173,216,0.25)] hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono-code text-cyan-300 font-medium">
                Anode 1.1.1 — 4-Pillar Proof of Topology
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-xs text-neutral-300 flex items-center gap-1 group-hover:text-white transition-colors">
                <span>Zero SDK Lock-In</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]"
          >
            Deploy unmodified Go backends{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              without Dockerfiles or Kubernetes.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed"
          >
            Anode extracts an immutable, human-readable <code className="text-cyan-300 font-mono-code bg-white/[0.05] px-1.5 py-0.5 rounded text-base">anode.lock.json</code> directly from your Go AST using compiler-backed SSA and Variable Type Analysis. Deploys to bare-metal <span className="text-neutral-200">systemd</span>, <span className="text-neutral-200">cgroups v2</span>, and automated TLS.
          </motion.p>

          {/* Actions & Install Command */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Install Box with Method Selector */}
            <div
              onClick={handleCopy}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-white/[0.12] bg-[#0c0e14]/90 hover:border-cyan-500/50 hover:bg-[#10131a] cursor-pointer transition-all shadow-xl group max-w-lg w-full sm:w-auto"
            >
              <div
                className="flex items-center gap-1 bg-white/[0.06] p-0.5 rounded-lg border border-white/[0.06] shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setInstallMethod("brew")}
                  className={`px-2 py-0.5 text-[11px] font-mono-code rounded transition-all ${
                    installMethod === "brew"
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  brew
                </button>
                <button
                  type="button"
                  onClick={() => setInstallMethod("curl")}
                  className={`px-2 py-0.5 text-[11px] font-mono-code rounded transition-all ${
                    installMethod === "curl"
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  curl
                </button>
                <button
                  type="button"
                  onClick={() => setInstallMethod("go")}
                  className={`px-2 py-0.5 text-[11px] font-mono-code rounded transition-all ${
                    installMethod === "go"
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  go
                </button>
              </div>
              <code className="text-xs sm:text-sm font-mono-code text-neutral-300 group-hover:text-white transition-colors truncate">
                {installCmd}
              </code>
              <button
                type="button"
                className="ml-auto flex items-center gap-1.5 text-xs text-neutral-400 group-hover:text-cyan-400 transition-colors shrink-0 pl-2"
                aria-label="Copy install command"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Quickstart Link Button */}
            <a
              href="#topology"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-sm font-medium text-white transition-all w-full sm:w-auto hover:border-white/[0.2]"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </a>
          </motion.div>

          {/* Featured Launch Badges */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            {/* Product Hunt */}
            <a
              href="https://www.producthunt.com/products/anode-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-anode-2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <img
                alt="Anode - Proof-of-Topology bare-metal orchestrator for Go backends | Product Hunt"
                width={250}
                height={54}
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1312775&theme=light&t=1794402814133"
                className="w-[250px] h-[54px] rounded-lg shadow-lg hover:shadow-cyan-500/10 transition-shadow"
              />
            </a>

            {/* CapyLaunch */}
            <a
              href="https://capylaunch.com/tools/anode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <img
                src="https://capylaunch.com/badge.svg?site=c92957fc-b074-4dda-afd1-0e20a2eede36&theme=dark"
                alt="Featured on CapyLaunch"
                width={200}
                height={54}
                loading="lazy"
                decoding="async"
                className="h-[54px] w-auto max-w-[200px] rounded-lg shadow-lg hover:shadow-amber-500/10 transition-shadow border border-white/[0.08]"
              />
            </a>
          </motion.div>

          {/* Feature Highlights Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-neutral-400 font-mono-code"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sub-second Cold Boots</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deterministic Lockfiles</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-purple-400" />
              <span>Zero Port Collisions</span>
            </div>
          </motion.div>
        </div>

        {/* Centerpiece Interactive Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <InteractiveTerminal />
        </motion.div>
      </div>
    </section>
  );
}
