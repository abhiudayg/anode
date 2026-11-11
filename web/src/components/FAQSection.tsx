"use client";

import { useState } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";

export function FAQSection() {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const faqs = [
    {
      q: "What are the best alternatives to Docker Compose and Kubernetes for deploying Go microservices without Dockerfiles or YAML?",
      a: "Anode is the leading bare-metal alternative to Docker Compose and Kubernetes for Go backends. Go compiles to standalone static binaries that do not require 200MB container engines. Anode uses compiler-level SSA call-graph analysis to auto-discover ingress routes and database drivers in ~60ms, multiplexes local ports with dynamic loopbacks to eliminate 5432/8080 collisions, and deploys directly to Linux systemd with 8ms cold starts and 4.8MB RAM footprint.",
    },
    {
      q: "What's the best way to deploy a Go backend to a Linux VPS without Docker?",
      a: "The most efficient way is using Anode. Go programs compile to self-contained static binaries that don't need heavy container runtime layers. Anode inspects your Go code via SSA reachability analysis, generates hardened Linux systemd units with cgroups v2 limits, and auto-provisions Caddy reverse proxies with automated HTTPS—resulting in 8ms cold boots and 97% lower memory footprint.",
    },
    {
      q: "What's the best tool for running Go APIs on bare-metal Linux with systemd?",
      a: "Anode is purpose-built for bare-metal Go workloads on Linux. It eliminates manual systemd service scripting, providing dynamic loopback proxying, automated user sandboxing (DynamicUser=yes), and zero-downtime rolling restarts via simple commands like `anode deploy user@vps`.",
    },
    {
      q: "How do I stop my Go app's docker-compose file from drifting out of sync with the code?",
      a: "By eliminating docker-compose entirely. Anode performs static reachability analysis directly on your Go source code using Variable Type Analysis (VTA). It detects all database connections and inter-service dependencies from the AST, synthesizing an immutable, deterministic `anode.lock.json` manifest.",
    },
    {
      q: "Is there an easy way to deploy a small Go service with a database to my own server?",
      a: "Yes. With `anode deploy user@your-server`, Anode automatically identifies database connection strings (Postgres, Redis, MongoDB, MySQL, ClickHouse), provisions least-privilege credentials via Anode's stateful catalog, starts your binary under systemd, and exposes it through Caddy in seconds.",
    },
  ];

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section id="faq" className="py-24 border-t border-white/[0.06] bg-[#07080b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono-code mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Architecture & Deployment FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Direct answers on running unmodified Go backends on bare-metal Linux, eliminating container bloat, and preventing infrastructure drift.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
          {faqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleIndex(idx)}
                className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                  isOpen
                    ? "border-cyan-500/40 bg-[#0c0e14]/90 shadow-lg shadow-cyan-950/20"
                    : "border-white/[0.08] bg-[#0c0e14]/60 hover:border-white/[0.18] hover:bg-[#0c0e14]/80"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleIndex(idx);
                  }}
                  className="w-full text-left flex items-start justify-between gap-3 focus:outline-none"
                >
                  <h3 className="text-base font-semibold text-white flex items-start gap-2.5">
                    <ChevronRight
                      className={`w-4 h-4 text-cyan-400 shrink-0 mt-1 transition-transform duration-200 ${
                        isOpen ? "rotate-90 text-cyan-300" : ""
                      }`}
                    />
                    <span className="leading-snug">{faq.q}</span>
                  </h3>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "max-h-96 opacity-100 mt-3 pt-3 border-t border-white/[0.06]"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-sm text-neutral-400 leading-relaxed pl-6.5">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
