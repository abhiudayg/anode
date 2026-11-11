"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Terminal, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  FileCode2, 
  RefreshCw,
  Download,
  AlertCircle,
  HelpCircle
} from "lucide-react";

const PRESET_DOCKER_COMPOSE = `version: "3.8"

services:
  go-api:
    image: my-go-backend:latest
    command: /app/server
    working_dir: /opt/go-api
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - ENV=production
      - DATABASE_URL=postgres://user:pass@127.0.0.1:5432/db
    restart: always
    deploy:
      resources:
        limits:
          memory: 256M`;

function parseComposeToSystemd(composeText: string): { serviceName: string; unitContent: string } {
  try {
    const lines = composeText.split("\n");
    let currentService = "go-service";
    let command = "/opt/app/server";
    let workingDir = "/opt/app";
    const envVars: string[] = [];
    let restartPolicy = "always";
    let memoryLimit = "512M";

    // Lightweight parsing of key directives
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for service name
      if (line.endsWith(":") && !line.startsWith("#") && !line.startsWith("services:") && !line.startsWith("version:") && !line.startsWith("networks:") && !line.startsWith("volumes:") && !line.startsWith("environment:") && !line.startsWith("ports:") && !line.startsWith("deploy:") && !line.startsWith("resources:") && !line.startsWith("limits:")) {
        const potentialService = line.replace(":", "").trim();
        if (potentialService && !potentialService.includes(" ")) {
          currentService = potentialService;
        }
      }

      if (line.startsWith("command:")) {
        command = line.replace("command:", "").trim().replace(/['"]/g, "");
      }
      if (line.startsWith("working_dir:")) {
        workingDir = line.replace("working_dir:", "").trim().replace(/['"]/g, "");
      }
      if (line.startsWith("restart:")) {
        restartPolicy = line.replace("restart:", "").trim().replace(/['"]/g, "");
      }
      if (line.startsWith("memory:")) {
        memoryLimit = line.replace("memory:", "").trim().replace(/['"]/g, "");
      }
      if (line.startsWith("- ") && line.includes("=") && !line.includes(":")) {
        const envPair = line.replace("- ", "").trim();
        envVars.push(envPair);
      }
    }

    const envLines = envVars.length > 0 
      ? envVars.map(e => `Environment="${e}"`).join("\n") 
      : `Environment="PORT=8080"\nEnvironment="GO_ENV=production"`;

    const unit = `[Unit]
Description=${currentService} (Converted from docker-compose)
Documentation=https://anode.abhiudayg.dev
After=network.target time-sync.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${workingDir}
ExecStart=${command}
Restart=${restartPolicy === "unless-stopped" ? "on-failure" : "always"}
RestartSec=3s
KillMode=mixed
TimeoutStopSec=15s

# Environment Variables
${envLines}

# Linux Bare-Metal Hardening & Sandboxing
DynamicUser=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictNamespaces=yes
LockPersonality=yes
NoNewPrivileges=yes

# cgroups v2 Resource Isolation
MemoryMax=${memoryLimit}
TasksMax=1024

[Install]
WantedBy=multi-user.target`;

    return { serviceName: currentService, unitContent: unit };
  } catch (err) {
    return {
      serviceName: "app",
      unitContent: "# Error parsing compose file. Please check syntax.",
    };
  }
}

export default function ComposeToSystemdTool() {
  const [composeInput, setComposeInput] = useState(PRESET_DOCKER_COMPOSE);
  const [copied, setCopied] = useState(false);

  const { serviceName, unitContent } = parseComposeToSystemd(composeInput);

  const handleCopy = () => {
    navigator.clipboard.writeText(unitContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([unitContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${serviceName}.service`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
              </li>
              <li><span>/</span></li>
              <li>
                <span className="text-neutral-500">Free Tools</span>
              </li>
              <li><span>/</span></li>
              <li className="text-cyan-300 font-medium">Docker Compose to Systemd Converter</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono-code mb-6">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free Developer Utility • 100% Client-Side</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Docker Compose to Systemd Converter
            </h1>

            <p className="mt-4 text-base sm:text-lg text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Convert your <code className="text-cyan-300 font-mono-code bg-white/[0.05] px-1.5 py-0.5 rounded">docker-compose.yml</code> into production-ready, hardened Linux <span className="text-neutral-200">systemd unit files</span> with native cgroups v2 resource limits and sandboxing.
            </p>
          </div>

          {/* Converter Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Input Panel */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2 text-xs font-mono-code text-neutral-300">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span>Paste docker-compose.yml</span>
                </div>
                <button
                  type="button"
                  onClick={() => setComposeInput(PRESET_DOCKER_COMPOSE)}
                  className="text-xs font-mono-code text-neutral-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Sample</span>
                </button>
              </div>

              <textarea
                value={composeInput}
                onChange={(e) => setComposeInput(e.target.value)}
                rows={18}
                aria-label="Docker Compose Input YAML"
                className="w-full flex-1 bg-black/60 border border-white/[0.06] rounded-xl p-4 font-mono-code text-xs text-neutral-200 focus:outline-none focus:border-cyan-500/50 resize-y leading-relaxed"
                placeholder="Paste your docker-compose.yml here..."
              />
            </div>

            {/* Output Panel */}
            <div className="rounded-2xl border border-cyan-500/30 bg-[#0c0e14] p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
                <div className="flex items-center gap-2 text-xs font-mono-code text-cyan-300 font-semibold">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Generated {serviceName}.service</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono-code text-neutral-200 hover:text-white flex items-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-mono-code text-black font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="w-full flex-1 bg-black/60 border border-white/[0.06] rounded-xl p-4 font-mono-code text-xs text-neutral-300 overflow-x-auto leading-relaxed">
                {unitContent}
              </pre>
            </div>
          </div>

          {/* Anode Automated Alternative Callout */}
          <div className="mt-12 max-w-6xl mx-auto p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-[#0c0e14] to-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Want to eliminate writing systemd files and Docker Compose entirely?
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  <strong>Anode</strong> automatically traces your Go SSA call graphs to auto-discover network routes and database bindings in ~60ms, deploying straight to Linux systemd with 8ms cold starts.
                </p>
              </div>
            </div>

            <Link
              href="/#quickstart"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono-code font-bold flex items-center gap-2 shrink-0 transition-all shadow-[0_0_20px_rgba(0,173,216,0.3)]"
            >
              <span>Try Anode Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* FAQ & Guide Context for Search Engines */}
          <div className="mt-20 max-w-4xl mx-auto border-t border-white/[0.08] pt-16">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Why Convert Docker Compose to Systemd?
            </h2>

            <div className="space-y-6 text-sm text-neutral-400 leading-relaxed">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0e14]">
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>56x Lower Latency &amp; 97% Lower Memory</span>
                </h3>
                <p>
                  Compiled Go binaries do not require container runtimes like Docker Engine or containerd. When running natively under Linux systemd, cold boots drop from 450ms to 8.2ms, and idle RAM overhead drops from 210MB to just 4.8MB.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0e14]">
                <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Native Linux Sandboxing Without Root Daemons</span>
                </h3>
                <p>
                  The generated unit file includes <code>DynamicUser=yes</code>, <code>ProtectSystem=strict</code>, and <code>NoNewPrivileges=yes</code>, giving you enterprise-grade process isolation without running a root daemon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
