"use client";

import { useState, useRef, MouseEvent } from "react";
import { Database, Network, FileCheck2, AlertCircle, ShieldAlert } from "lucide-react";

interface BentoCardProps {
  pillar: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  children?: React.ReactNode;
  className?: string;
}

function SpotlightCard({ pillar, title, description, icon: Icon, tag, children, className = "" }: BentoCardProps) {
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
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:border-white/[0.18] flex flex-col justify-between ${className}`}
    >
      {/* Spotlight cursor beam effect */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 173, 216, 0.12), transparent 40%)`,
        }}
      />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-code text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
              {pillar}
            </span>
            <span className="text-[11px] font-mono-code text-neutral-400">
              {tag}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cyan-400">
            <Icon className="w-4 h-4" />
          </div>
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
  );
}

export function BentoPillars() {
  return (
    <section id="pillars" className="py-24 relative overflow-hidden bg-[#07080a] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-full inline-block mb-3">
            Mathematical Determinism
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            The 4 Pillars of Topology
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Anode replaces guesswork and DSL lock-in with four foundational compiler guarantees.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Pillar 1: Database Provenance */}
          <SpotlightCard
            pillar="Pillar 01"
            title="Migration-Driven DB Provenance"
            description="Anode provisions a database only when verifiable schema migrations exist alongside the service (Goose, sql-migrate). If no migrations exist, Anode treats it as an external unmanaged service—zero guessing."
            icon={Database}
            tag="Zero-Guess Engine"
            className="lg:col-span-7"
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-white/[0.05] font-mono-code text-xs text-neutral-300">
              <span className="text-cyan-400">provenance_check:</span>
              <div className="text-emerald-400 pl-4">✓ Found ./migrations/20261101_init.sql</div>
              <div className="text-emerald-400 pl-4">✓ Schema parser validated (Goose driver: postgres)</div>
              <div className="text-neutral-500 pl-4">↳ Provisioning isolated Postgres container</div>
            </div>
          </SpotlightCard>

          {/* Pillar 2: Typed Interface Linking */}
          <SpotlightCard
            pillar="Pillar 02"
            title="Typed Interface Linking"
            description="Microservice RPC connections match 1:1 via generated Protobuf descriptors and HTTP route tables. No regex guesswork, no brittle name heuristics."
            icon={Network}
            tag="Protobuf & HTTP"
            className="lg:col-span-5"
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-white/[0.05] font-mono-code text-xs text-neutral-300">
              <div className="text-purple-400 font-semibold">service_link: payment.v1.PaymentService</div>
              <div className="text-neutral-400 text-[11px] pt-1">↳ Matched to upstream service :50051</div>
            </div>
          </SpotlightCard>

          {/* Pillar 3: Commit-Backed Lockfile */}
          <SpotlightCard
            pillar="Pillar 03"
            title="Commit-Backed anode.lock.json"
            description="Every inspect run emits an immutable contract committed directly into version control. Platform engineers review architecture changes in GitHub Pull Requests."
            icon={FileCheck2}
            tag="Git Reviewable"
            className="lg:col-span-5"
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-white/[0.05] font-mono-code text-xs text-neutral-300">
              <div className="text-cyan-400 font-semibold">+ anode.lock.json</div>
              <div className="text-emerald-400 text-[11px]">+ &quot;listen_port_env&quot;: &quot;PORT&quot;</div>
              <div className="text-emerald-400 text-[11px]">+ &quot;dependencies&quot;: [&quot;postgres:16&quot;]</div>
            </div>
          </SpotlightCard>

          {/* Pillar 4: Actionable Build-Time Diagnostics */}
          <SpotlightCard
            pillar="Pillar 04"
            title="Actionable Build-Time Diagnostics"
            description="If a dynamic DSN or outbound target cannot be mathematically resolved by SSA, Anode emits an actionable compiler diagnostic with file:line provenance and exact fix instructions."
            icon={AlertCircle}
            tag="Compile-Time Proof"
            className="lg:col-span-7"
          >
            <div className="bg-[#050608] rounded-xl p-3 border border-red-500/20 font-mono-code text-xs text-neutral-300">
              <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>diagnostic [ANODE_WARN_02] at cmd/worker/main.go:42:11</span>
              </div>
              <div className="text-neutral-400 text-[11px] pt-1 pl-5">
                Dynamic DSN string concatenation detected. Declare standard env var `DATABASE_URL` for 100% deterministic binding.
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
