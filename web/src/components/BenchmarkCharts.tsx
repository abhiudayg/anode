"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber } from "./AnimatedNumber";

export function BenchmarkCharts() {
  return (
    <section id="benchmarks" className="py-24 border-t border-white/[0.08] bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold block mb-2">
            Empirical Verification
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            The numbers don&apos;t lie.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Microservice benchmark comparing Anode static ELF systemd execution against Docker Compose on Debian 12.
          </p>
        </motion.div>

        {/* Side-by-side comparison charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Chart 1: Memory Footprint */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] yc-card p-6 sm:p-8 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <span className="text-xs font-mono-code text-neutral-500 uppercase">Memory Footprint</span>
                <h3 className="text-xl font-bold text-white mt-1">Idle RAM Usage</h3>
                <p className="text-xs text-neutral-400 mt-1">3 Go microservices + PostgreSQL 16</p>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedNumber value={98} suffix="%" duration={1.2} />
                </span>
                <span className="block text-[11px] font-mono-code text-emerald-400 font-medium">less memory</span>
              </div>
            </div>

            {/* Visual Bars */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              {/* Docker Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono-code text-neutral-400 mb-1.5">
                  <span>Docker Compose</span>
                  <span className="text-neutral-300 font-mono-code font-semibold">
                    <AnimatedNumber value={850} suffix=" MB" duration={1.0} />
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-neutral-900 border border-white/[0.06] overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-md bg-neutral-700 w-full flex items-center px-2"
                  >
                    <span className="text-[10px] font-mono-code text-neutral-300 font-semibold">container engine overhead</span>
                  </motion.div>
                </div>
              </div>

              {/* Anode Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono-code text-neutral-400 mb-1.5">
                  <span className="text-white font-semibold">Anode (systemd native)</span>
                  <span className="text-white font-bold font-mono-code">
                    <AnimatedNumber value={14} suffix=" MB" duration={1.0} delay={0.15} />
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-neutral-900 border border-white/[0.06] overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "5%" }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-md bg-white min-w-[48px] flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  >
                    <span className="text-[10px] font-mono-code text-black font-bold">
                      <AnimatedNumber value={14} suffix=" MB" duration={1.0} delay={0.15} />
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-mono-code text-neutral-500 mt-6">
              Measured using <code className="text-neutral-300">systemd-cgtop</code> vs <code className="text-neutral-300">docker stats</code> at steady state.
            </p>
          </motion.div>

          {/* Chart 2: Cold Boot Time */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] yc-card p-6 sm:p-8 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <span className="text-xs font-mono-code text-neutral-500 uppercase">Process Startup</span>
                <h3 className="text-xl font-bold text-white mt-1">Cold Boot to Listen</h3>
                <p className="text-xs text-neutral-400 mt-1">Invocation to accepting HTTP requests</p>
              </div>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedNumber value={350} suffix="x" duration={1.2} />
                </span>
                <span className="block text-[11px] font-mono-code text-emerald-400 font-medium">faster startup</span>
              </div>
            </div>

            {/* Visual Bars */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              {/* Docker Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono-code text-neutral-400 mb-1.5">
                  <span>Docker Container</span>
                  <span className="text-neutral-300 font-mono-code font-semibold">
                    <AnimatedNumber value={4200} formatCommas suffix=" ms" duration={1.1} />
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-neutral-900 border border-white/[0.06] overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-md bg-neutral-700 w-full flex items-center px-2"
                  >
                    <span className="text-[10px] font-mono-code text-neutral-300 font-semibold">daemon bridge + namespace init</span>
                  </motion.div>
                </div>
              </div>

              {/* Anode Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono-code text-neutral-400 mb-1.5">
                  <span className="text-white font-semibold">Anode Static ELF</span>
                  <span className="text-white font-bold font-mono-code">
                    <AnimatedNumber value={12} suffix=" ms" duration={1.0} delay={0.15} />
                  </span>
                </div>
                <div className="w-full h-8 rounded-lg bg-neutral-900 border border-white/[0.06] overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: "4%" }}
                    viewport={{ once: false, amount: 0.2 }}
                    transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-md bg-white min-w-[48px] flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  >
                    <span className="text-[10px] font-mono-code text-black font-bold">
                      <AnimatedNumber value={12} suffix=" ms" duration={1.0} delay={0.15} />
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-mono-code text-neutral-500 mt-6">
              Zero namespace virtualization or iptables NAT overhead.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="text-center mt-12"
        >
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-xs font-mono-code text-neutral-400 hover:text-white transition-colors"
          >
            <span>Explore the architecture and specifications in the docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
