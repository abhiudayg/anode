"use client";

import { useState, useRef, MouseEvent } from "react";
import { Database, Network, FileCheck2, AlertCircle, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface BentoCardProps {
  pillar: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}

function SpotlightCard({ pillar, title, description, icon: Icon, tag, children, className = "", delay = 0 }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={className}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative h-full rounded-2xl border border-white/[0.08] bg-[#090a0d] yc-card yc-card-glow p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:border-white/[0.18] flex flex-col justify-between"
      >
        {/* Spotlight cursor beam effect */}
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.08), transparent 40%)`,
          }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono-code text-emerald-400 font-bold">
                {pillar}
              </span>
            </div>
            <span className="text-[11px] font-mono-code text-neutral-400 uppercase tracking-wider">
              {tag}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-6 pt-4 border-t border-white/[0.06]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function BentoPillars() {
  return (
    <section id="pillars" className="py-24 relative overflow-hidden bg-[#000000] border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold block mb-2">
            Mathematical Determinism
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            The 4 Pillars of Topology
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Anode replaces guesswork and DSL lock-in with four foundational compiler guarantees.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Pillar 1: Database Provenance */}
          <SpotlightCard
            pillar="01"
            title="Migration-Driven DB Provenance"
            description="Anode provisions a database only when verifiable schema migrations exist alongside the service (Goose, sql-migrate). If no migrations exist, Anode treats it as an external unmanaged service—zero guessing."
            icon={Database}
            tag="Feature"
            className="lg:col-span-7"
            delay={0}
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-white/[0.05] font-mono-code text-xs text-neutral-300 overflow-x-auto">
              <span className="text-white font-semibold">provenance_check:</span>
              <div className="text-emerald-400 pl-4">✓ Found ./migrations/20261101_init.sql</div>
              <div className="text-emerald-400 pl-4">✓ Schema parser validated (Goose driver: postgres)</div>
              <div className="text-neutral-500 pl-4">↳ Provisioning isolated Postgres cluster (systemd)</div>
            </div>
          </SpotlightCard>

          {/* Pillar 2: Typed Interface Linking */}
          <SpotlightCard
            pillar="02"
            title="Typed Interface Linking"
            description="Microservice RPC connections match 1:1 via generated Protobuf descriptors and HTTP route tables. No regex guesswork, no brittle name heuristics."
            icon={Network}
            tag="Feature"
            className="lg:col-span-5"
            delay={0.1}
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-white/[0.05] font-mono-code text-xs text-neutral-300 overflow-x-auto">
              <div className="text-white font-semibold">service_link: payment.v1.PaymentService</div>
              <div className="text-neutral-400 text-[11px] pt-1">↳ Matched to upstream service :50051</div>
            </div>
          </SpotlightCard>

          {/* Pillar 3: Commit-Backed Lockfile */}
          <SpotlightCard
            pillar="03"
            title="Commit-Backed anode.lock.json"
            description="Every inspect run emits an immutable contract committed directly into version control. Platform engineers review architecture changes in GitHub Pull Requests."
            icon={FileCheck2}
            tag="Feature"
            className="lg:col-span-5"
            delay={0.15}
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-white/[0.05] font-mono-code text-xs text-neutral-300 overflow-x-auto">
              <div className="text-white font-semibold">+ anode.lock.json</div>
              <div className="text-emerald-400 text-[11px]">+ &quot;listen_port_env&quot;: &quot;PORT&quot;</div>
              <div className="text-emerald-400 text-[11px]">+ &quot;dependencies&quot;: [&quot;postgres:16&quot;]</div>
            </div>
          </SpotlightCard>

          {/* Pillar 4: Actionable Build-Time Diagnostics */}
          <SpotlightCard
            pillar="04"
            title="Actionable Build-Time Diagnostics"
            description="If a dynamic DSN or outbound target cannot be mathematically resolved by SSA, Anode emits an actionable compiler diagnostic with file:line provenance and exact fix instructions."
            icon={AlertCircle}
            tag="Feature"
            className="lg:col-span-7"
            delay={0.25}
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-yellow-500/20 font-mono-code text-xs text-neutral-300 overflow-x-auto">
              <div className="text-yellow-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span>[warn] Outbound HTTP call in service &quot;search&quot; via env &quot;SEARCH_QDRANT_URL&quot; could not be matched</span>
              </div>
              <div className="text-neutral-400 text-[11px] pt-1 pl-5">
                Calls Anode cannot match are reported with their call site and a suggested fix, not as a guessed connection.
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
