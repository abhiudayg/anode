"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Cpu, FileJson, Laptop, Server, ChevronRight, CheckCircle2, ArrowRight } from "lucide-react";

interface PipelineStep {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  details: {
    description: string;
    points: string[];
    snippet: string;
  };
}

export function TopologyPipeline() {
  const [activeStep, setActiveStep] = useState<string>("core");

  const steps: PipelineStep[] = [
    {
      id: "code",
      title: "Unmodified Go Source",
      subtitle: "Pure Go stdlib. No custom SDKs.",
      icon: Code2,
      badge: "Input",
      details: {
        description: "Write normal idiomatic Go. Listen on standard env vars, call database/sql, and register net/http or gRPC handlers.",
        points: [
          "Zero proprietary runtime imports",
          "Works with existing monorepos or multi-service projects",
          "No Dockerfile or docker-compose.yml required"
        ],
        snippet: `// cmd/api/main.go
db, err := sql.Open("postgres", cfg.DatabaseURL)
mux := http.NewServeMux()
mux.HandleFunc("POST /v1/orders", handlers.CreateOrder)
http.ListenAndServe(":" + cfg.Port, mux)`
      }
    },
    {
      id: "core",
      title: "SSA / VTA Engine",
      subtitle: "Static Single Assignment analysis",
      icon: Cpu,
      badge: "Engine",
      details: {
        description: "Anode parses the abstract syntax tree and builds a Variable Type Analysis (VTA) call graph rooted at func main(). It statically pinpoints network choke points and dependencies.",
        points: [
          "Mathematical proof of topology in ~18ms",
          "Static tracing through configuration structs and wrappers",
          "Dead-code pruning eliminates false positives"
        ],
        snippet: `// Anode Static Analysis Output:
• Root: github.com/user/shop/cmd/api.main
• Detected Outbound: database/sql.Open(driver="postgres")
• Migration Asset Provenance: ./migrations/*.sql (goose)
• Inbound Interfaces: HTTP on :PORT (POST /v1/orders)`
      }
    },
    {
      id: "lock",
      title: "anode.lock.json",
      subtitle: "Commit-backed immutable contract",
      icon: FileJson,
      badge: "Contract",
      details: {
        description: "Every inspect pass synthesizes an immutable, human-readable lockfile committed directly to Git. Review infrastructure topology changes in pull requests alongside code.",
        points: [
          "PR reviewable architecture diffs",
          "Cryptographically hashed dependency graph",
          "Eliminates infrastructure drift forever"
        ],
        snippet: `{
  "schema_version": "1.0",
  "services": [{
    "name": "api-gateway",
    "routes": [{ "method": "POST", "path": "/v1/orders" }],
    "dependencies": [{ "type": "database", "engine": "postgres" }]
  }]
}`
      }
    },
    {
      id: "exec",
      title: "Bare-Metal Execution",
      subtitle: "Dynamic Dev & Production VPS",
      icon: Server,
      badge: "Runtime",
      details: {
        description: "Local dev runs isolated ephemeral containers on dynamic ports without host collisions. Production generates hardened Linux systemd units and cgroups v2.",
        points: [
          "Zero port collisions (Postgres on 54329, Redis on 63792)",
          "systemd supervisor with automatic crash restarts",
          "Zero-downtime port swap with automated Caddy TLS"
        ],
        snippet: `# /etc/systemd/system/shop-api.service
[Unit]
Description=Anode Managed: shop-api
After=network.target

[Service]
ExecStart=/opt/anode/bin/shop-api
MemoryMax=512M
CPUQuota=200%
Restart=always`
      }
    }
  ];

  const currentStep = steps.find((s) => s.id === activeStep) || steps[1];

  return (
    <section id="topology" className="py-24 relative overflow-hidden border-t border-white/[0.06] bg-[#07080b]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-full inline-block mb-3">
            Proof of Topology
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            How Anode Eliminates Infrastructure Drift
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Click through the pipeline to see how raw Go code compiles into an immutable topology contract and deploys to bare-metal primitives.
          </p>
        </div>

        {/* Interactive Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`relative p-5 rounded-xl cursor-pointer transition-all duration-300 text-left border ${
                  isSelected
                    ? "bg-[#11141d] border-cyan-500/50 shadow-[0_0_30px_rgba(0,173,216,0.2)]"
                    : "bg-[#0b0d13]/60 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#0e111a]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-white/[0.05] text-neutral-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? "bg-cyan-950/80 border-cyan-700/50 text-cyan-300"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500"
                    }`}
                  >
                    {step.badge}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <span>{step.title}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{step.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="rounded-2xl border border-white/[0.1] bg-[#0c0e14] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left description */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-code px-2.5 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/40">
                  Stage Details
                </span>
                <span className="text-neutral-500 font-mono-code text-xs">
                  {currentStep.title}
                </span>
              </div>

              <h4 className="text-2xl font-bold text-white tracking-tight">
                {currentStep.title}
              </h4>

              <p className="text-sm text-neutral-300 leading-relaxed">
                {currentStep.details.description}
              </p>

              <div className="space-y-2.5 pt-2">
                {currentStep.details.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right code artifact */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-white/[0.08] bg-[#06070a] p-4 overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs font-mono-code text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                    Pipeline Provenance Output
                  </span>
                  <span className="text-neutral-600">Deterministic</span>
                </div>
                <pre className="text-xs font-mono-code text-neutral-200 leading-relaxed overflow-x-auto">
                  <code>{currentStep.details.snippet}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
