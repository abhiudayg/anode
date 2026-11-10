"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Copy, Check, ArrowRight, BookOpen } from "lucide-react";
import { GithubIcon } from "./Icons";
import confetti from "canvas-confetti";

export function QuickstartSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const steps = [
    {
      num: "01",
      title: "Install Anode CLI",
      desc: "Download single static binary or install with Go.",
      cmd: "curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/main/install.sh | bash",
    },
    {
      num: "02",
      title: "Inspect Any Go Project",
      desc: "Extract proof of topology directly from your Go codebase.",
      cmd: "anode inspect ./cmd/api",
    },
    {
      num: "03",
      title: "Run Collision-Free Dev",
      desc: "Spin up isolated DBs on dynamic ephemeral ports with sub-second reload.",
      cmd: "anode dev",
    },
  ];

  const handleCopy = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#00ADD8", "#8B5CF6"],
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="quickstart" className="py-24 relative overflow-hidden bg-[#07080a] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-full inline-block mb-3">
            Get Running In 60 Seconds
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Ready to Drop Dockerfiles?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Works out of the box on standard Go backends. Zero configuration changes required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-6 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono-code text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    Step {s.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">{s.desc}</p>
              </div>

              <div
                onClick={() => handleCopy(s.cmd, idx)}
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#06070a] border border-white/[0.06] hover:border-cyan-500/40 cursor-pointer group transition-all"
              >
                <code className="text-[11px] font-mono-code text-neutral-300 truncate group-hover:text-white">
                  {s.cmd}
                </code>
                <button type="button" className="text-neutral-500 group-hover:text-cyan-400 shrink-0">
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
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
            href="/docs#overview"
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
