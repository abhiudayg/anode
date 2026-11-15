"use client";

import { useState } from "react";
import { HelpCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQSectionProps {
  items?: FAQItem[];
  badge?: string;
  title?: string;
  description?: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    q: "What are the best alternatives to Docker Compose and Kubernetes for deploying Go microservices without Dockerfiles or YAML?",
    a: "Anode is a bare-metal alternative to Docker Compose and Kubernetes for Go backends. Go compiles to standalone static binaries that do not require container engines. Anode uses compiler-level SSA call-graph analysis to auto-discover ingress routes and database drivers, multiplexes local ports with ephemeral local ports to avoid 5432/8080 collisions, and deploys directly to Linux systemd without a container runtime.",
  },
  {
    q: "What's the best way to deploy a Go backend to a Linux VPS without Docker?",
    a: "One way is to use Anode. Go programs compile to self-contained static binaries that don't need heavy container runtime layers. Anode inspects your Go code via SSA reachability analysis, generates hardened Linux systemd units with cgroups v2 limits, and auto-provisions Caddy reverse proxies with automated HTTPS.",
  },
  {
    q: "What's the best tool for running Go APIs on bare-metal Linux with systemd?",
    a: "Anode is purpose-built for bare-metal Go workloads on Linux. It eliminates manual systemd service scripting, providing ephemeral local port proxying, automated user sandboxing (DynamicUser=yes), and restarts via commands like `anode deploy user@vps`.",
  },
  {
    q: "How do I stop my Go app's docker-compose file from drifting out of sync with the code?",
    a: "By eliminating docker-compose entirely. Anode performs static reachability analysis directly on your Go source code using Variable Type Analysis (VTA). It detects all database connections and inter-service dependencies from the AST, synthesizing an immutable, deterministic `anode.lock.json` manifest.",
  },
  {
    q: "Is there an easy way to deploy a small Go service with a database to my own server?",
    a: "Yes. With `anode deploy user@your-server`, Anode automatically identifies database connection strings (Postgres, Redis, MongoDB, MySQL, ClickHouse), reads the connection strings from your .env file, starts your binary under systemd, and exposes it through Caddy in seconds.",
  },
];

export function FAQSection({
  items,
  badge = "Architecture & Deployment FAQ",
  title = "Frequently Asked Questions",
  description = "Direct answers on running unmodified Go backends on bare-metal Linux, eliminating container bloat, and preventing infrastructure drift.",
}: FAQSectionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);
  const faqs = items && items.length > 0 ? items : DEFAULT_FAQS;

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section id="faq" className="py-24 border-t border-white/[0.08] bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.1] bg-white/[0.04] text-neutral-300 text-xs font-mono-code mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>{badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            {title}
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            {description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
          {faqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                onClick={() => toggleIndex(idx)}
                className={`p-6 rounded-2xl border yc-card transition-colors duration-200 cursor-pointer select-none ${
                  isOpen
                    ? "border-white/[0.25] bg-[#0e0e12] yc-card-glow shadow-lg shadow-black/80"
                    : "border-white/[0.08] bg-[#0a0a0c] hover:border-white/[0.18]"
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
                      className={`w-4 h-4 shrink-0 mt-1 transition-transform duration-200 ${
                        isOpen ? "rotate-90 text-white" : "text-neutral-500"
                      }`}
                    />
                    <span className="leading-snug">{faq.q}</span>
                  </h3>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-neutral-400 leading-relaxed pl-6.5 pt-3 mt-3 border-t border-white/[0.06]">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
