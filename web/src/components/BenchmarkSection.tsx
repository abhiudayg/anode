"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Gauge, HardDrive, Cpu, Layers, ExternalLink, CheckCircle } from "lucide-react";

export function BenchmarkSection() {
  const [activeTab, setActiveTab] = useState<"enterprise" | "realworld">("enterprise");

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
      anode: "62–799ms",
      traditional: "Manual YAML",
      advantage: "Sub-second",
      description: "Whole-program SSA reachability resolves single services in ~60ms and scales to an entire 32-service enterprise mesh in 799ms.",
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

  const enterpriseBenchmarks = [
    {
      name: "sample-shop",
      repoUrl: "https://github.com/abhiudayg/anode/tree/master/examples/sample-shop",
      category: "Baseline Architecture",
      services: 2,
      resources: 2,
      astLoad: "460 ms",
      ssaSweep: "62.2 ms",
      backing: "PostgreSQL, HTTP Ingress",
    },
    {
      name: "hyper_mesh_12",
      repoUrl: "https://github.com/abhiudayg/anode/tree/master/examples/hyper_mesh_12",
      category: "Flagship Microservices",
      services: 12,
      resources: 7,
      astLoad: "615 ms",
      ssaSweep: "268.8 ms",
      backing: "Postgres, Redis, ClickHouse, gRPC",
    },
    {
      name: "fintech_core_20",
      repoUrl: "https://github.com/abhiudayg/anode/tree/master/examples/fintech_core_20",
      category: "Neo-Banking & Trading",
      services: 20,
      resources: 22,
      astLoad: "615 ms",
      ssaSweep: "548.8 ms",
      backing: "Kafka, TimescaleDB, ScyllaDB, Valkey",
    },
    {
      name: "health_mesh_25",
      repoUrl: "https://github.com/abhiudayg/anode/tree/master/examples/health_mesh_25",
      category: "HIPAA Hospital System",
      services: 25,
      resources: 26,
      astLoad: "680 ms",
      ssaSweep: "642.6 ms",
      backing: "MongoDB, RabbitMQ, PostgreSQL, FHIR",
    },
    {
      name: "omni_mesh_32",
      repoUrl: "https://github.com/abhiudayg/anode/tree/master/examples/omni_mesh_32",
      category: "Hyper-Scale Enterprise",
      services: 32,
      resources: 35,
      astLoad: "653 ms",
      ssaSweep: "799.0 ms",
      backing: "14 Stores: Qdrant, Temporal, MinIO, Scylla",
    },
  ];

  const realWorldBenchmarks = [
    {
      name: "glanceapp/glance",
      repoUrl: "https://github.com/glanceapp/glance",
      category: "Feed & Dashboard Server",
      services: 1,
      ssaSweep: "40.4 ms",
      backing: "In-memory cache, Open-Meteo & Reddit APIs",
    },
    {
      name: "filebrowser/filebrowser",
      repoUrl: "https://github.com/filebrowser/filebrowser",
      category: "File Management Backend",
      services: 1,
      ssaSweep: "66.7 ms",
      backing: "Embedded BoltDB / SQLite, JWT Auth",
    },
    {
      name: "chubin/wttr.in",
      repoUrl: "https://github.com/chubin/wttr.in",
      category: "Terminal Forecast Engine",
      services: 1,
      ssaSweep: "78.7 ms",
      backing: "Local Cache, Upstream Radar Ingress",
    },
    {
      name: "navidrome/navidrome",
      repoUrl: "https://github.com/navidrome/navidrome",
      category: "Music Stream & Subsonic API",
      services: 1,
      ssaSweep: "125.1 ms",
      backing: "SQLite (FTS5 indexed), Media Volumes",
    },
    {
      name: "schollz/croc",
      repoUrl: "https://github.com/schollz/croc",
      category: "P2P Rendezvous Relay",
      services: 4,
      ssaSweep: "140.6 ms",
      backing: "PAKE Key Exchange, Ephemeral Sockets",
    },
    {
      name: "cloudreve/cloudreve",
      repoUrl: "https://github.com/cloudreve/cloudreve",
      category: "Cloud Drive & Orchestrator",
      services: 1,
      ssaSweep: "152.5 ms",
      backing: "SQLite/MySQL/PostgreSQL, Redis Cache",
    },
    {
      name: "restic/restic",
      repoUrl: "https://github.com/restic/restic",
      category: "Encrypted Backup Engine",
      services: 3,
      ssaSweep: "134.1 ms",
      backing: "MinIO / S3 Object Storage, SFTP",
    },
    {
      name: "binwiederhier/ntfy",
      repoUrl: "https://github.com/binwiederhier/ntfy",
      category: "HTTP Pub-Sub Push Server",
      services: 7,
      ssaSweep: "346.1 ms",
      backing: "SQLite Message Queue, Twilio/FCM Egress",
    },
    {
      name: "netbirdio/netbird",
      repoUrl: "https://github.com/netbirdio/netbird",
      category: "Zero-Trust WireGuard Mesh",
      services: 14,
      ssaSweep: "649.4 ms",
      backing: "PostgreSQL, Coturn STUN/TURN, gRPC",
    },
  ];

  return (
    <section id="benchmarks" className="py-24 relative overflow-hidden bg-[#08090b] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full inline-block mb-3">
            Performance & Empirical Scaling
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Bare-Metal Primitives Win Every Time
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            By compiling directly to Linux systemd, cgroups v2, and ephemeral loopback proxies, Anode delivers near-zero runtime latency and sub-second static analysis.
          </p>
        </div>

        {/* 4 Core Pillars Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

        {/* Empirical Scaling Matrix Section */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Empirical Static Analysis Benchmark Matrix
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                Freshly measured SSA reachability analysis timings across enterprise topologies and open-source codebases.
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("enterprise")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
                  activeTab === "enterprise"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Enterprise Meshes
              </button>
              <button
                onClick={() => setActiveTab("realworld")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-all ${
                  activeTab === "realworld"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Open-Source Applications
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {activeTab === "enterprise" ? (
              <table className="w-full text-left border-collapse text-xs font-mono-code">
                <thead>
                  <tr className="border-b border-white/[0.06] text-neutral-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Benchmark Architecture</th>
                    <th className="py-3 px-4">Topology Scale</th>
                    <th className="py-3 px-4">Backing Infrastructure</th>
                    <th className="py-3 px-4 text-cyan-400 text-right">Anode SSA Sweep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {enterpriseBenchmarks.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <a
                          href={row.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 inline-flex items-center gap-1.5 transition-colors group/link"
                        >
                          <span>{row.name}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-500 group-hover/link:text-cyan-400 flex-shrink-0" />
                        </a>
                        <div className="text-[10px] text-neutral-400 font-sans">{row.category}</div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        <span className="text-cyan-300 font-bold">{row.services}</span> services •{" "}
                        <span className="text-purple-300 font-bold">{row.resources}</span> stores
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                        {row.backing}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold text-right">
                        {row.ssaSweep}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-mono-code">
                <thead>
                  <tr className="border-b border-white/[0.06] text-neutral-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Repository</th>
                    <th className="py-3 px-4">Application Role</th>
                    <th className="py-3 px-4">Detected Infrastructure</th>
                    <th className="py-3 px-4 text-cyan-400 text-right">Anode SSA Sweep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {realWorldBenchmarks.map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <a
                          href={row.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-cyan-400 inline-flex items-center gap-1.5 transition-colors group/link"
                        >
                          <span>{row.name}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-500 group-hover/link:text-cyan-400 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300 text-[11px]">
                        {row.category}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                        {row.backing}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold text-right">
                        {row.ssaSweep}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-neutral-400 font-sans">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Methodology:</strong> Measured with Go 1.22+ SSA and Variable Type Analysis (VTA). Anode SSA Sweep represents pure in-memory reachability and sink inspection across whole-program call graphs.
              </span>
            </div>
            <Link
              href="/docs#benchmarks-analysis"
              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 font-mono-code text-xs whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:border-cyan-500/50 hover:bg-cyan-900/30 transition-all self-start sm:self-auto"
            >
              <span>Read Full Methodology</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
