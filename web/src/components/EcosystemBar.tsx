"use client";

import { motion } from "motion/react";

export function EcosystemBar() {
  const technologies = [
    { name: "Go Stdlib", spec: "net/http • 1.22+" },
    { name: "PostgreSQL", spec: "v14 - v17 native" },
    { name: "Redis", spec: "v6 - v7.2 cluster" },
    { name: "systemd", spec: "cgroups v2 quotas" },
    { name: "Caddy Server", spec: "Automated ACME TLS" },
    { name: "Linux Native", spec: "x86_64 & arm64 ELF" },
    { name: "Goose", spec: "Schema migrations" },
    { name: "Hetzner / DO", spec: "Any Linux VPS" },
  ];

  return (
    <section className="py-16 border-y border-white/[0.08] bg-[#000000]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <p className="text-center text-xs font-mono-code text-neutral-500 uppercase tracking-wider mb-8">
          Works with any standard Go stack. From net/http to Gin, Chi, and Fiber.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
          {technologies.map((tech, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.03 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-3 rounded-xl border border-white/[0.06] bg-[#08080a] hover:border-white/[0.2] transition-colors text-center group cursor-default"
            >
              <div className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">
                {tech.name}
              </div>
              <div className="text-[10px] font-mono-code text-neutral-500 mt-1 truncate">
                {tech.spec}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
