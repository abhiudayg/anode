"use client";

import { motion } from "motion/react";
import { Zap, Gauge, HardDrive, Cpu } from "lucide-react";

export function BenchmarkSection() {
  const benchmarks = [
    {
      metric: "Cold-Boot Startup",
      anode: "8ms",
      traditional: "1,420ms",
      advantage: "177x faster",
      description: "Direct Linux systemd execution vs Docker containerd engine initialization.",
      icon: Zap,
    },
    {
      metric: "Process Memory Overhead",
      anode: "4.8 MB",
      traditional: "186 MB",
      advantage: "97% reduction",
      description: "Zero virtualization runtime daemon overhead per service on your VPS.",
      icon: HardDrive,
    },
    {
      metric: "Topology Static Sweep",
      anode: "18ms",
      traditional: "Manual YAML",
      advantage: "Sub-second",
      description: "SSA and Variable Type Analysis resolves entire multi-service monorepos instantly.",
      icon: Cpu,
    },
    {
      metric: "Local Port Collisions",
      anode: "0%",
      traditional: "Frequent",
      advantage: "Dynamic Loopback",
      description: "Dynamic ephemeral loopback proxying keeps host ports 5432, 6379, and 8080 free.",
      icon: Gauge,
    },
  ];

  return (
    <section id="benchmarks" className="py-24 relative overflow-hidden bg-[#08090b] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full inline-block mb-3">
            Performance Metrics
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Bare-Metal Primitives Win Every Time
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            By compiling directly to Linux systemd, cgroups v2, and ephemeral loopback proxies, Anode delivers near-zero runtime latency and memory footprints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benchmarks.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="relative rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono-code text-neutral-400">
                      {b.metric}
                    </span>
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-extrabold text-white font-mono-code tracking-tight">
                      {b.anode}
                    </div>
                    <div className="text-xs font-mono-code text-neutral-500 flex items-center gap-1.5">
                      <span>vs {b.traditional}</span>
                      <span className="text-emerald-400 font-semibold">• {b.advantage}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-xs text-neutral-400 leading-relaxed border-t border-white/[0.06] pt-4">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
