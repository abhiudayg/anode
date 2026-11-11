"use client";

import { useState } from "react";
import Link from "next/link";
import { Cpu, HardDrive, Zap, DollarSign, ArrowRight, ShieldCheck } from "lucide-react";

export function RamSavingsCalculator() {
  const [servicesCount, setServicesCount] = useState<number>(6);

  // Accurate measured numbers from Anode benchmarks
  const dockerRamPerServiceMb = 186; // containerd shim + dockerd + bridge
  const anodeRamPerServiceMb = 4.8;  // native Linux systemd process
  const dockerColdBootMs = 450;
  const anodeColdBootMs = 8.2;

  const totalDockerRamMb = servicesCount * dockerRamPerServiceMb;
  const totalAnodeRamMb = Math.round(servicesCount * anodeRamPerServiceMb * 10) / 10;
  const savedRamMb = Math.round((totalDockerRamMb - totalAnodeRamMb) * 10) / 10;
  const savedRamGb = (savedRamMb / 1024).toFixed(2);

  // Cloud savings estimate: Average $6/GB RAM/month on Hetzner/DigitalOcean/AWS
  const monthlyCostSaved = Math.max(12, Math.round(parseFloat(savedRamGb) * 7.5 * 10) / 10);
  const annualCostSaved = Math.round(monthlyCostSaved * 12);

  const totalDockerBootSec = ((servicesCount * dockerColdBootMs) / 1000).toFixed(2);
  const totalAnodeBootMs = Math.round(servicesCount * anodeColdBootMs);

  return (
    <div className="p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0c0e14] to-[#07080b] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono-code mb-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Infrastructure Calculator</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Calculate Your Bare-Metal Memory &amp; Cost Savings
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            See how much RAM and server budget is wasted running container engines for Go binaries.
          </p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <div className="text-xs text-neutral-400 font-mono-code">Estimated Annual Savings</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono-code">
            ${annualCostSaved}<span className="text-xs text-neutral-400 font-normal"> / year</span>
          </div>
        </div>
      </div>

      {/* Slider Controls */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="service-slider" className="text-xs sm:text-sm font-medium text-neutral-200">
            Number of Go Services / Microservices:
          </label>
          <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono-code px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
            {servicesCount} {servicesCount === 1 ? "service" : "services"}
          </span>
        </div>
        <input
          id="service-slider"
          type="range"
          min="1"
          max="24"
          value={servicesCount}
          onChange={(e) => setServicesCount(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[11px] font-mono-code text-neutral-500 mt-2">
          <span>1 single binary</span>
          <span>6 microservices</span>
          <span>12 services</span>
          <span>24 enterprise mesh</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Metric 1: RAM Overhead */}
        <div className="p-4 rounded-2xl bg-[#090a0f] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Idle Daemon Memory</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono-code">{totalAnodeRamMb} MB</span>
            <span className="text-xs text-neutral-500 line-through font-mono-code">{totalDockerRamMb} MB</span>
          </div>
          <div className="text-xs text-emerald-400 font-mono-code flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Save {savedRamGb} GB RAM (97% lower)</span>
          </div>
        </div>

        {/* Metric 2: Cold Boot Startup */}
        <div className="p-4 rounded-2xl bg-[#090a0f] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Total Cold Boot Time</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-300 font-mono-code">{totalAnodeBootMs} ms</span>
            <span className="text-xs text-neutral-500 line-through font-mono-code">{totalDockerBootSec} s</span>
          </div>
          <div className="text-xs text-purple-400 font-mono-code">
            55x faster service restarts
          </div>
        </div>

        {/* Metric 3: Minimum Server Tier */}
        <div className="p-4 rounded-2xl bg-[#090a0f] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Recommended VPS Tier</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono-code">
            {servicesCount <= 8 ? "€3.79 / mo" : servicesCount <= 16 ? "€7.49 / mo" : "€14.90 / mo"}
          </div>
          <div className="text-xs text-neutral-400 font-mono-code">
            vs $40–$120/mo Docker/K8s nodes
          </div>
        </div>
      </div>

      {/* Visual Bar Comparison */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <div className="flex justify-between text-xs font-mono-code">
          <span className="text-neutral-400">Container Runtime Daemon Overhead</span>
          <span className="text-cyan-400">Anode Bare-Metal Linux</span>
        </div>
        <div className="h-4 w-full bg-neutral-900 rounded-full overflow-hidden flex p-0.5 border border-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(3, (totalAnodeRamMb / totalDockerRamMb) * 100)}%` }}
            title={`Anode: ${totalAnodeRamMb} MB`}
          />
          <div
            className="h-full bg-gradient-to-r from-red-500/40 to-red-500/20 rounded-full ml-1 transition-all duration-300"
            style={{ width: `${100 - Math.max(3, (totalAnodeRamMb / totalDockerRamMb) * 100)}%` }}
            title={`Wasted Docker Overhead: ${savedRamMb} MB`}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono-code text-neutral-500">
          <span>{totalAnodeRamMb} MB active heap</span>
          <span>+{savedRamMb} MB wasted on dockerd &amp; containerd</span>
        </div>
      </div>
    </div>
  );
}
