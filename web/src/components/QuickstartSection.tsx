"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, ArrowRight, BookOpen, Terminal, CheckCircle2, Play, Server } from "lucide-react";
import { GithubIcon } from "./Icons";
import confetti from "canvas-confetti";

export function QuickstartSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const steps = [
    {
      num: "01",
      badge: "Step 01",
      title: "Install",
      desc: "Install the CLI binary via official Homebrew tap or curl.",
      cmd: "brew install abhiudayg/tap/anode",
      icon: Terminal,
    },
    {
      num: "02",
      badge: "Step 02",
      title: "Inspect",
      desc: "Extract proof of topology directly from Go AST and emit anode.lock.json.",
      cmd: "anode inspect ./cmd/api",
      icon: CheckCircle2,
    },
    {
      num: "03",
      badge: "Step 03",
      title: "Dev",
      desc: "Services on dynamic ephemeral loopback ports, with sub-second reload. Dev databases run in one Docker or Podman container per store.",
      cmd: "anode dev",
      icon: Play,
    },
    {
      num: "04",
      badge: "Step 04",
      title: "Deploy",
      desc: "Synthesize systemd units, DynamicUser sandboxing, and automated Caddy TLS.",
      cmd: "anode deploy user@vps",
      icon: Server,
    },
  ];

  const handleCopy = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#00ADD8", "#8B5CF6", "#10B981"],
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="quickstart" className="py-24 relative overflow-hidden bg-[#000000] border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold block mb-2">
            02 / Execution Loop
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Four steps. Each one leaves evidence.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            A complete bare-metal lifecycle with compiler-verified topology.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] yc-card yc-card-glow p-5 sm:p-6 flex flex-col justify-between hover:border-white/[0.18] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono-code text-white font-semibold bg-white/[0.08] border border-white/[0.12] px-2 py-0.5 rounded">
                      {s.badge}
                    </span>
                    <Icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-6">{s.desc}</p>
                </div>

                <div
                  onClick={() => handleCopy(s.cmd, idx)}
                  className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[#050507] border border-white/[0.08] hover:border-white/[0.2] cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="text-emerald-400 font-bold select-none font-mono-code">$</span>
                    <code className="text-[11px] font-mono-code text-neutral-300 truncate group-hover:text-white">
                      {s.cmd}
                    </code>
                  </div>
                  {copiedIndex === idx ? (
                    <span className="text-[10px] font-mono-code font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      Copied
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Links Banner */}
        <div className="mt-16 text-center flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://github.com/abhiudayg/anode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono-code text-white transition-all"
          >
            <GithubIcon className="w-4 h-4 text-neutral-400" />
            <span>View Source on GitHub</span>
          </a>

          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono-code text-cyan-300 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Read Architecture Deep Dive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
