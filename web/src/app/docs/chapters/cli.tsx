"use client";

import { useState } from "react";
import {
  Terminal,
  Check,
  Copy
} from "lucide-react";

export default function ChapterCli() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [cmdType, setCmdType] = useState<"deploy" | "logs" | "ps" | "doctor" | "dev" | "inspect" | "cluster" | "catalog">("deploy");
  const [cliHost, setCliHost] = useState("root@my-vps.com");
  const [cliDomain, setCliDomain] = useState("");
  const [cliDryRun, setCliDryRun] = useState(false);
  const [cliArch, setCliArch] = useState<"amd64" | "arm64">("amd64");
  const [cliDeployPath, setCliDeployPath] = useState("");
  const [cliDeployAlias, setCliDeployAlias] = useState(false);
  const [logsTargetMode, setLogsTargetMode] = useState<"remote" | "local">("remote");
  const [logsTarget, setLogsTarget] = useState("root@my-vps.com");
  const [logsService, setLogsService] = useState("");
  const [logsFollow, setLogsFollow] = useState(true);
  const [logsLines, setLogsLines] = useState("100");
  const [logsTimestamps, setLogsTimestamps] = useState(false);
  const [logsSince, setLogsSince] = useState("");
  const [logsEdge, setLogsEdge] = useState(false);
  const [logsJson, setLogsJson] = useState(false);
  const [psTargetMode, setPsTargetMode] = useState<"remote" | "local">("remote");
  const [psTarget, setPsTarget] = useState("root@my-vps.com");
  const [psAll, setPsAll] = useState(false);
  const [psJson, setPsJson] = useState(false);
  const [psVerbose, setPsVerbose] = useState(false);
  const [psAlias, setPsAlias] = useState(false);
  const [doctorTargetMode, setDoctorTargetMode] = useState<"remote" | "local">("remote");
  const [doctorTarget, setDoctorTarget] = useState("root@my-vps.com");
  const [doctorPath, setDoctorPath] = useState("");
  const [doctorStrict, setDoctorStrict] = useState(false);
  const [doctorVerbose, setDoctorVerbose] = useState(false);
  const [devPath, setDevPath] = useState("");
  const [inspectPath, setInspectPath] = useState("");
  const [clusterMode, setClusterMode] = useState<"plan" | "firewall" | "init">("plan");
  const [clusterPath, setClusterPath] = useState("");
  const [clusterInventory, setClusterInventory] = useState("");
  const [clusterJson, setClusterJson] = useState(false);
  const [catalogDriver, setCatalogDriver] = useState("");
  const [catalogPath, setCatalogPath] = useState("");
  const [catalogJson, setCatalogJson] = useState(false);

  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Command Line Interface
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    CLI Reference
                  </h2>
                  <p className="text-sm text-neutral-300">
                    The Anode CLI is engineered with intuitive, POSIX-compliant Docker-style commands, self-documenting syntax, and sub-command help trees.
                  </p>

                  {/* Docker-Style Global Synopsis */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#07080a] p-5 space-y-3 font-mono-code text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-neutral-400">
                      <span className="text-white font-bold">$ anode --help</span>
                      <span className="text-[11px] text-neutral-500">Docker-Style Syntax</span>
                    </div>
                    <pre className="text-neutral-300 leading-relaxed overflow-x-auto whitespace-pre">
  {`Usage:  anode [OPTIONS] COMMAND [ARG...]

  Proof-of-Topology Bare-Metal Orchestrator for Unmodified Go Backends

  Options:
    -v, --verbose          Print verbose trace logs and contract JSON
        --version          Print version information and exit
    -h, --help             Print usage information

  Management Commands:
    cluster                Manage multi-node placement pools and zero-trust firewalls
    catalog                Inspect pluggable stateful catalog drivers and image matrix
    doctor [TARGET] [PATH] Pre-flight verification of compiler, toolchain, loopback and VPS

  Commands:
    inspect [PATH]         Extract whole-program SSA topology and write anode.lock.json
    dev [PATH]             Start local hot-reload daemon with ephemeral local port ports
    deploy TARGET [PATH]   Deploy release to bare-metal Linux host via systemd & Caddy
    run TARGET [PATH]      Alias for deploy (Docker CLI parity)
    ps [TARGET] [PATH]     List running processes, cgroup v2 memory/CPU, and Caddy routes
    status [TARGET] [PATH] Alias for ps (process and topology status)
    logs [TARGET] [SVC]    Stream aggregated journald and local supervisor logs
    version                Show the Anode version information

  Run 'anode COMMAND --help' for more information on a command.`}
                    </pre>
                  </div>

                  {/* Enhanced Interactive CLI Command Generator */}
                  {(() => {
                    let generatedCommand = "";
                    let commandExplanation = "";

                    if (cmdType === "deploy") {
                      const base = cliDeployAlias ? "anode run" : "anode deploy";
                      const parts = [base, cliHost.trim() || "root@my-vps.com"];
                      if (cliDeployPath.trim()) parts.push(cliDeployPath.trim());
                      if (cliDomain.trim()) parts.push(`--domain ${cliDomain.trim()}`);
                      if (cliArch !== "amd64") parts.push(`--arch=${cliArch}`);
                      if (cliDryRun) parts.push("--dry-run");
                      generatedCommand = parts.join(" ");
                      commandExplanation = cliDryRun
                        ? "Synthesizes systemd unit files and Caddyfile in dry-run preview mode without live SSH deployment."
                        : `Cross-compiles Linux static ELF binaries, enforces cgroups v2 quotas, and deploys to ${cliHost.trim() || "remote VPS"}.`;
                    } else if (cmdType === "logs") {
                      const parts = ["anode logs"];
                      if (logsFollow) parts.push("-f");
                      if (logsLines && logsLines !== "100") parts.push(`-n ${logsLines}`);
                      if (logsTimestamps) parts.push("-t");
                      if (logsSince.trim()) parts.push(`--since ${logsSince.trim()}`);
                      if (logsEdge) parts.push("--edge");
                      if (logsJson) parts.push("--json");
                      if (logsTargetMode === "remote") {
                        parts.push(logsTarget.trim() || "root@my-vps.com");
                      }
                      if (logsService.trim()) parts.push(logsService.trim());
                      generatedCommand = parts.join(" ");
                      commandExplanation = logsTargetMode === "remote"
                        ? (logsFollow
                            ? `Streams real-time journald logs from ${logsTarget.trim() || "remote VPS"} over SSH multiplexed across services.`
                            : `Fetches recent journald log snapshot from ${logsTarget.trim() || "remote VPS"} over SSH.`)
                        : (logsFollow
                            ? "Follows real-time local supervisor logs (.verify/logs/) with color-coded service prefixes."
                            : "Inspects static snapshot of recent local supervisor logs across services.");
                    } else if (cmdType === "ps") {
                      const base = psAlias ? "anode status" : "anode ps";
                      const parts = [base];
                      if (psTargetMode === "remote") {
                        parts.push(psTarget.trim() || "root@my-vps.com");
                      }
                      if (psAll) parts.push("-a");
                      if (psJson) parts.push("--json");
                      if (psVerbose) parts.push("-v");
                      generatedCommand = parts.join(" ");
                      commandExplanation = psTargetMode === "remote"
                        ? `Queries systemd D-Bus and cgroup v2 controller on ${psTarget.trim() || "remote VPS"} for process health, CPU/RAM, and Caddy routing.`
                        : "Queries local dev supervisor status, active ephemeral local port port allocations, and service uptimes.";
                    } else if (cmdType === "doctor") {
                      const parts = ["anode doctor"];
                      if (doctorTargetMode === "remote") {
                        parts.push(doctorTarget.trim() || "root@my-vps.com");
                      }
                      if (doctorPath.trim()) parts.push(doctorPath.trim());
                      if (doctorStrict) parts.push("--strict");
                      if (doctorVerbose) parts.push("-v");
                      generatedCommand = parts.join(" ");
                      commandExplanation = doctorTargetMode === "remote"
                        ? `Performs pre-flight diagnosis of Go toolchain, local ports, and executes 3s TCP/SSH handshake with ${doctorTarget.trim() || "remote VPS"}.`
                        : "Runs 5-pillar local pre-flight checks (Go compiler, cross-compile CGO_ENABLED=0, ephemeral local ports, and container engine).";
                    } else if (cmdType === "dev") {
                      const parts = ["anode dev"];
                      if (devPath.trim()) parts.push(devPath.trim());
                      generatedCommand = parts.join(" ");
                      commandExplanation = "Starts local dev supervisor with ephemeral local sockets (127.0.0.1:0) and sub-second hot reload.";
                    } else if (cmdType === "inspect") {
                      const parts = ["anode inspect"];
                      if (inspectPath.trim()) parts.push(inspectPath.trim());
                      generatedCommand = parts.join(" ");
                      commandExplanation = "Compiles whole-program SSA and VTA call graphs, resolves HTTP/gRPC choke points, and generates anode.lock.json.";
                    } else if (cmdType === "cluster") {
                      if (clusterMode === "init") {
                        const parts = ["anode cluster init"];
                        if (clusterPath.trim()) parts.push(clusterPath.trim());
                        generatedCommand = parts.join(" ");
                        commandExplanation = "Scaffolds an annotated starter anode.cluster.yaml fleet inventory in the project root.";
                      } else {
                        const parts = ["anode cluster"];
                        if (clusterPath.trim()) parts.push(clusterPath.trim());
                        if (clusterInventory.trim()) parts.push(`--inventory=${clusterInventory.trim()}`);
                        if (clusterMode === "firewall") parts.push("--firewall");
                        if (clusterJson) parts.push("--json");
                        generatedCommand = parts.join(" ");
                        commandExplanation = clusterMode === "firewall"
                          ? "Synthesizes atomic zero-trust Linux nftables packet filter rules for every node in the cluster fleet."
                          : "Loads cluster fleet inventory, bin-packs microservices based on RAM/CPU limits, and calculates utilization.";
                      }
                    } else if (cmdType === "catalog") {
                      const parts = ["anode catalog"];
                      if (catalogDriver.trim()) parts.push(catalogDriver.trim());
                      if (catalogPath.trim()) parts.push(catalogPath.trim());
                      if (catalogJson) parts.push("--json");
                      generatedCommand = parts.join(" ");
                      commandExplanation = catalogDriver.trim()
                        ? `Inspects runtime container specs, injected connection variables, and readiness probes for ${catalogDriver.trim()}.`
                        : "Lists all 26+ built-in pre-audited stateful drivers with image tags, ports, and override provenance.";
                    }

                    return (
                      <div className="rounded-xl border border-white/[0.15] bg-white/[0.04] p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-mono-code text-neutral-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-white" />
                            <span>Interactive Command Generator</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.1] text-neutral-200 font-mono-code font-semibold self-start sm:self-auto">
                            Live Builder &amp; Flag Configurator
                          </span>
                        </div>

                        {/* Command Selector Tabs */}
                        <div className="flex flex-wrap gap-1.5 border-b border-white/[0.08] pb-3">
                          {[
                            { id: "deploy" as const, label: "deploy", badge: "VPS" },
                            { id: "logs" as const, label: "logs", badge: "Stream" },
                            { id: "ps" as const, label: "ps", badge: "Metrics" },
                            { id: "doctor" as const, label: "doctor", badge: "Diagnostics" },
                            { id: "dev" as const, label: "dev", badge: "Local" },
                            { id: "inspect" as const, label: "inspect", badge: "SSA" },
                            { id: "cluster" as const, label: "cluster", badge: "Fleet" },
                            { id: "catalog" as const, label: "catalog", badge: "Drivers" },
                          ].map((tab) => {
                            const isActive = cmdType === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCmdType(tab.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-code font-semibold transition-all flex items-center gap-1.5 ${
                                  isActive
                                    ? "bg-white/[0.1] text-neutral-200 border border-white/[0.15] shadow-sm shadow-none"
                                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-transparent"
                                }`}
                              >
                                <span>anode {tab.label}</span>
                                <span className={`text-[9px] px-1 py-0.5 rounded font-mono-code ${
                                  isActive ? "bg-white/[0.1] text-white" : "bg-white/[0.06] text-neutral-500"
                                }`}>
                                  {tab.badge}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Tab Specific Controls */}
                        {cmdType === "deploy" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                                <input
                                  type="text"
                                  value={cliHost}
                                  onChange={(e) => setCliHost(e.target.value)}
                                  placeholder="user@your-vps.com"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Custom Domain (TLS):</label>
                                <input
                                  type="text"
                                  value={cliDomain}
                                  onChange={(e) => setCliDomain(e.target.value)}
                                  placeholder="api.example.com (optional)"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                                <input
                                  type="text"
                                  value={cliDeployPath}
                                  onChange={(e) => setCliDeployPath(e.target.value)}
                                  placeholder=". or ./examples/sample-shop"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                              <div className="flex items-end">
                                <div className="flex items-center gap-2">
                                  <span className="text-neutral-400 text-xs font-mono-code">Target Arch:</span>
                                  <button
                                    type="button"
                                    onClick={() => setCliArch(cliArch === "amd64" ? "arm64" : "amd64")}
                                    className="px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-neutral-200 text-xs font-mono-code border border-white/[0.1]"
                                  >
                                    linux/{cliArch}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={cliDryRun}
                                  onChange={(e) => setCliDryRun(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--dry-run (preview only)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={cliDeployAlias}
                                  onChange={(e) => setCliDeployAlias(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>Docker alias (&apos;anode run&apos;)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {cmdType === "logs" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 text-xs font-mono-code">Target Mode:</span>
                              <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                                <button
                                  type="button"
                                  onClick={() => setLogsTargetMode("remote")}
                                  className={`px-2.5 py-0.5 rounded-md ${logsTargetMode === "remote" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Remote VPS (SSH)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLogsTargetMode("local")}
                                  className={`px-2.5 py-0.5 rounded-md ${logsTargetMode === "local" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Local Dev Engine
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {logsTargetMode === "remote" && (
                                <div>
                                  <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                                  <input
                                    type="text"
                                    value={logsTarget}
                                    onChange={(e) => setLogsTarget(e.target.value)}
                                    placeholder="root@my-vps.com"
                                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                  />
                                </div>
                              )}
                              <div className={logsTargetMode === "local" ? "sm:col-span-2" : ""}>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Service Filter (Optional):</label>
                                <input
                                  type="text"
                                  value={logsService}
                                  onChange={(e) => setLogsService(e.target.value)}
                                  placeholder="e.g. orders, payments, caddy (empty for all)"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">History Lines (-n):</label>
                                <div className="flex items-center gap-1.5">
                                  {["50", "100", "500"].map((lines) => (
                                    <button
                                      key={lines}
                                      type="button"
                                      onClick={() => setLogsLines(lines)}
                                      className={`px-2 py-1 rounded text-xs font-mono-code border ${
                                        logsLines === lines
                                          ? "bg-white/[0.1] text-neutral-200 border-white/[0.15]"
                                          : "bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:text-white"
                                      }`}
                                    >
                                      {lines}
                                    </button>
                                  ))}
                                  <input
                                    type="text"
                                    value={logsLines}
                                    onChange={(e) => setLogsLines(e.target.value)}
                                    placeholder="custom"
                                    className="w-20 px-2 py-1 rounded bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Since Window (--since):</label>
                                <input
                                  type="text"
                                  value={logsSince}
                                  onChange={(e) => setLogsSince(e.target.value)}
                                  placeholder="e.g. 15m, 1h, 2026-11-14"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={logsFollow}
                                  onChange={(e) => setLogsFollow(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>-f, --follow (live streaming)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={logsTimestamps}
                                  onChange={(e) => setLogsTimestamps(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>-t, --timestamps (RFC3339)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={logsEdge}
                                  onChange={(e) => setLogsEdge(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--edge (include Caddy logs)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={logsJson}
                                  onChange={(e) => setLogsJson(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--json (ndjson)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {cmdType === "ps" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 text-xs font-mono-code">Target Mode:</span>
                              <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                                <button
                                  type="button"
                                  onClick={() => setPsTargetMode("remote")}
                                  className={`px-2.5 py-0.5 rounded-md ${psTargetMode === "remote" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Remote VPS (SSH)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPsTargetMode("local")}
                                  className={`px-2.5 py-0.5 rounded-md ${psTargetMode === "local" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Local Dev Engine
                                </button>
                              </div>
                            </div>

                            {psTargetMode === "remote" && (
                              <div className="text-xs">
                                <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                                <input
                                  type="text"
                                  value={psTarget}
                                  onChange={(e) => setPsTarget(e.target.value)}
                                  placeholder="root@my-vps.com"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={psAll}
                                  onChange={(e) => setPsAll(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>-a, --all (show stopped units)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={psJson}
                                  onChange={(e) => setPsJson(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--json (raw cgroups v2 telemetry)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={psVerbose}
                                  onChange={(e) => setPsVerbose(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>-v, --verbose</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={psAlias}
                                  onChange={(e) => setPsAlias(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>Docker alias (&apos;anode status&apos;)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {cmdType === "doctor" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 text-xs font-mono-code">Target Mode:</span>
                              <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                                <button
                                  type="button"
                                  onClick={() => setDoctorTargetMode("remote")}
                                  className={`px-2.5 py-0.5 rounded-md ${doctorTargetMode === "remote" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Remote VPS (SSH)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDoctorTargetMode("local")}
                                  className={`px-2.5 py-0.5 rounded-md ${doctorTargetMode === "local" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Local Workspace
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {doctorTargetMode === "remote" && (
                                <div>
                                  <label className="text-neutral-400 block mb-1 font-mono-code">SSH Target Server:</label>
                                  <input
                                    type="text"
                                    value={doctorTarget}
                                    onChange={(e) => setDoctorTarget(e.target.value)}
                                    placeholder="root@my-vps.com"
                                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                  />
                                </div>
                              )}
                              <div className={doctorTargetMode === "local" ? "sm:col-span-2" : ""}>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                                <input
                                  type="text"
                                  value={doctorPath}
                                  onChange={(e) => setDoctorPath(e.target.value)}
                                  placeholder=". or ./examples/sample-shop"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={doctorStrict}
                                  onChange={(e) => setDoctorStrict(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--strict (treat warnings as errors)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={doctorVerbose}
                                  onChange={(e) => setDoctorVerbose(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>-v, --verbose</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {cmdType === "dev" && (
                          <div className="space-y-3">
                            <div className="text-xs">
                              <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                              <input
                                type="text"
                                value={devPath}
                                onChange={(e) => setDevPath(e.target.value)}
                                placeholder=". (current repo) or ./examples/storefront"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                            <p className="text-neutral-400 text-xs font-mono-code">
                              Allocates ephemeral local port sockets on 127.0.0.1:0 to avoid port collisions, spins up ephemeral databases, and checks for source changes every 300 ms.
                            </p>
                          </div>
                        )}

                        {cmdType === "inspect" && (
                          <div className="space-y-3">
                            <div className="text-xs">
                              <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                              <input
                                type="text"
                                value={inspectPath}
                                onChange={(e) => setInspectPath(e.target.value)}
                                placeholder=". (current repo) or ./examples/marketplace"
                                className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                              />
                            </div>
                            <p className="text-neutral-400 text-xs font-mono-code">
                              Runs SSA and Variable Type Analysis (VTA) call graph sweep, resolves HTTP/gRPC choke points, and outputs immutable <code className="text-neutral-200">anode.lock.json</code>.
                            </p>
                          </div>
                        )}

                        {cmdType === "cluster" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 text-xs font-mono-code">Operation Mode:</span>
                              <div className="inline-flex rounded-lg border border-white/[0.1] bg-black/60 p-0.5 text-xs font-mono-code">
                                <button
                                  type="button"
                                  onClick={() => setClusterMode("plan")}
                                  className={`px-2.5 py-0.5 rounded-md ${clusterMode === "plan" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Placement Matrix
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClusterMode("firewall")}
                                  className={`px-2.5 py-0.5 rounded-md ${clusterMode === "firewall" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  nftables Firewall
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClusterMode("init")}
                                  className={`px-2.5 py-0.5 rounded-md ${clusterMode === "init" ? "bg-white/[0.1] text-neutral-200 font-bold" : "text-neutral-400 hover:text-white"}`}
                                >
                                  Init Fleet Inventory
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                                <input
                                  type="text"
                                  value={clusterPath}
                                  onChange={(e) => setClusterPath(e.target.value)}
                                  placeholder=". or ./examples/sample-shop"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                              {clusterMode !== "init" && (
                                <div>
                                  <label className="text-neutral-400 block mb-1 font-mono-code">Custom Inventory (Optional):</label>
                                  <input
                                    type="text"
                                    value={clusterInventory}
                                    onChange={(e) => setClusterInventory(e.target.value)}
                                    placeholder="anode.cluster.yaml"
                                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                  />
                                </div>
                              )}
                            </div>

                            {clusterMode !== "init" && (
                              <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                                <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                  <input
                                    type="checkbox"
                                    checked={clusterJson}
                                    onChange={(e) => setClusterJson(e.target.checked)}
                                    className="rounded bg-black border-white/20 text-white focus:ring-0"
                                  />
                                  <span>--json (structured placement &amp; firewall metrics)</span>
                                </label>
                              </div>
                            )}
                          </div>
                        )}

                        {cmdType === "catalog" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Driver Kind (Optional):</label>
                                <input
                                  type="text"
                                  value={catalogDriver}
                                  onChange={(e) => setCatalogDriver(e.target.value)}
                                  placeholder="e.g. postgres, redis, kafka (empty for all)"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                              <div>
                                <label className="text-neutral-400 block mb-1 font-mono-code">Project Path (Optional):</label>
                                <input
                                  type="text"
                                  value={catalogPath}
                                  onChange={(e) => setCatalogPath(e.target.value)}
                                  placeholder=". or ./my-custom-project"
                                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white font-mono-code text-xs focus:outline-none focus:border-white"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code pt-1 border-t border-white/[0.04]">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={catalogJson}
                                  onChange={(e) => setCatalogJson(e.target.checked)}
                                  className="rounded bg-black border-white/20 text-white focus:ring-0"
                                />
                                <span>--json (structured driver specification)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Generated Command Box */}
                        <div className="space-y-2 pt-1">
                          <div className="p-3.5 rounded-lg bg-black/90 border border-white/[0.15] flex items-center justify-between font-mono-code text-xs text-neutral-200 shadow-inner">
                            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                              <span className="text-white select-none font-bold">$</span>
                              <span className="text-white font-medium whitespace-nowrap">{generatedCommand}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedCommand);
                                setCopiedCode("cli-builder");
                                setTimeout(() => setCopiedCode(null), 2000);
                              }}
                              className="ml-3 px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 hover:text-white shrink-0 flex items-center gap-1.5 text-[11px] transition-colors"
                              title="Copy command to clipboard"
                            >
                              {copiedCode === "cli-builder" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-sans text-[11px]">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="font-sans text-[11px]">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono-code px-1">
                            <span className="text-white font-bold">ℹ</span>
                            <span>{commandExplanation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-6">
                    {/* anode inspect */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-white font-mono-code">anode inspect [PATH]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Static Compilation Pass</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Compiles whole-program SSA and VTA call graphs rooted strictly at <code className="text-neutral-200">func main()</code>. Traces environment variable dataflow backwards to choke points (<code className="text-neutral-200">database/sql.Open</code>, <code className="text-neutral-200">net.Listen</code>, <code className="text-neutral-200">grpc.NewServer</code>), proves migration asset existence, and writes an immutable <code className="text-neutral-200">anode.lock.json</code>.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode inspect .</div>
                        <div className="pl-4 text-emerald-400">anode inspect ./examples/marketplace</div>
                        <div className="pl-4 text-emerald-400">anode inspect ./examples/realworld_benchmarks/glance</div>
                      </div>
                    </div>

                    {/* anode dev */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-emerald-400 font-mono-code">anode dev [PATH]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Local Orchestrator</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Starts the local development engine. Operates strictly against <code className="text-neutral-200">anode.lock.json</code> (or auto-compiles if missing), binds ephemeral loopback sockets (<code className="text-neutral-200">127.0.0.1:0</code>), provisions isolated database containers, applies pending Goose migrations, and supervises sub-second live recompilation.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-emerald-300">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode dev</div>
                        <div className="pl-4 text-emerald-400">anode dev ./examples/storefront</div>
                      </div>
                    </div>

                    {/* anode deploy / run */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-white font-mono-code">anode deploy &lt;user@host&gt; [PATH] [OPTIONS]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Bare-Metal VPS Release</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Cross-compiles statically linked Linux ELF executables (<code className="text-neutral-200">CGO_ENABLED=0</code>), SSHs to the remote target, bootstraps the unprivileged <code className="text-neutral-200">anode</code> user, executes pre-traffic database migrations, writes hardened systemd unit files with cgroups v2 quotas (<code className="text-neutral-200">CPUQuota=200%</code>, <code className="text-neutral-200">MemoryMax=1G</code>), and reloads Caddy with zero downtime.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-neutral-200">--dry-run</span> : Synthesize and validate systemd units & Caddyfile without live SSH</div>
                        <div className="pl-4"><span className="text-neutral-200">--domain &lt;domain&gt;</span> : Custom FQDN for automated Let&apos;s Encrypt TLS reverse proxy</div>
                        <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode deploy root@my-vps.com .</div>
                        <div className="pl-4 text-emerald-400">anode deploy root@192.168.1.50 ./examples/storefront --domain api.example.com</div>
                        <div className="pl-4 text-emerald-400">anode deploy root@my-vps.com --dry-run</div>
                        <div className="pl-4 text-neutral-400"># Docker CLI Parity: &apos;anode run&apos; is a drop-in alias for deploy</div>
                        <div className="pl-4 text-emerald-400">anode run root@my-vps.com ./examples/marketplace</div>
                      </div>
                    </div>

                    {/* anode ps / status */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-teal-400 font-mono-code">anode ps [OPTIONS] [TARGET_OR_PATH] [PATH]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Process &amp; Cgroups Monitoring</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Inspects running Go microservices, cgroups v2 memory consumption (<code className="text-neutral-200">memory.current / memory.max</code> with smaps PSS/RSS fallback), task thread counts, flapping/crashloop detection (<code className="text-neutral-200">NRestarts</code> and exit status codes), and Caddy reverse-proxy upstream route bindings over SSH or locally.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-teal-300">-a, --all</span> : Show all units (including inactive/stopped services)</div>
                        <div className="pl-4"><span className="text-teal-300">--json</span> : Output complete process, cgroup, and edge metrics as structured JSON</div>
                        <div className="pl-4"><span className="text-teal-300">--target &lt;user@host&gt;</span> : Remote VPS to inspect over SSH</div>
                        <div className="pl-4"><span className="text-teal-300">-v, --verbose</span> : Print verbose trace logs</div>
                        <div className="pl-4"><span className="text-teal-300">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode ps</div>
                        <div className="pl-4 text-emerald-400">anode ps root@my-vps.com</div>
                        <div className="pl-4 text-emerald-400">anode ps root@192.168.1.50 --all</div>
                        <div className="pl-4 text-emerald-400">anode ps root@my-vps.com --json</div>
                        <div className="pl-4 text-neutral-400"># Docker CLI Parity: &apos;anode status&apos; is a drop-in alias for ps</div>
                        <div className="pl-4 text-emerald-400">anode status root@my-vps.com</div>
                      </div>
                    </div>

                    {/* anode logs */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-orange-400 font-mono-code">anode logs [OPTIONS] [TARGET] [SERVICE]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Log Streaming &amp; Multiplexing</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Aggregates and multiplexes real-time logs across microservices with deterministic color-coded prefixes (<code className="text-neutral-200">[orders]</code>, <code className="text-neutral-200">[payments]</code>). Seamlessly streams from local dev engine log files (<code className="text-neutral-200">.verify/logs/&lt;svc&gt;.log</code>) or remote VPS instances via <code className="text-neutral-200">journalctl -u anode-*.service -o json</code> over SSH, with optional Caddy edge reverse-proxy streaming and line-delimited JSON for log forwarders.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-orange-300">-f, --follow</span> : Follow log output (stream live updates in real time)</div>
                        <div className="pl-4"><span className="text-orange-300">-n, --lines, --tail &lt;N&gt;</span> : Number of lines to show from history (default: 100)</div>
                        <div className="pl-4"><span className="text-orange-300">-t, --timestamps</span> : Show RFC3339 timestamps for each log entry</div>
                        <div className="pl-4"><span className="text-orange-300">--since &lt;TIME&gt;</span> : Show logs more recent than a relative duration (e.g. 10m, 1h) or ISO date</div>
                        <div className="pl-4"><span className="text-orange-300">--until &lt;TIME&gt;</span> : Show logs older than a specific date or relative time</div>
                        <div className="pl-4"><span className="text-orange-300">--edge</span> : Include Caddy reverse-proxy access and edge logs in the stream</div>
                        <div className="pl-4"><span className="text-orange-300">--json</span> : Output structured log records as line-delimited JSON (for Vector, Datadog, Fluentbit)</div>
                        <div className="pl-4"><span className="text-orange-300">--target &lt;user@host&gt;</span> : Remote VPS to stream over SSH</div>
                        <div className="pl-4"><span className="text-orange-300">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode logs</div>
                        <div className="pl-4 text-emerald-400">anode logs -f</div>
                        <div className="pl-4 text-emerald-400">anode logs orders -f</div>
                        <div className="pl-4 text-emerald-400">anode logs root@my-vps.com -f</div>
                        <div className="pl-4 text-emerald-400">anode logs root@my-vps.com api -n 50 --timestamps</div>
                        <div className="pl-4 text-emerald-400">anode logs root@my-vps.com --edge -f</div>
                        <div className="pl-4 text-emerald-400">anode logs root@my-vps.com --since 1h --json</div>
                      </div>
                    </div>

                    {/* anode doctor */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-white font-mono-code">anode doctor [TARGET_OR_PATH] [PATH] [OPTIONS]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Pre-Flight &amp; Topology Linter</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Performs deep pre-flight sanity checks across 5 core pillars: Go toolchain (<code className="text-neutral-200">go &gt;= 1.27</code>), Linux cross-compilation capability (<code className="text-neutral-200">CGO_ENABLED=0</code>), ephemeral local port subnet allocation (<code className="text-neutral-200">127.0.0.0/8</code>), container daemon socket readiness for ephemeral DBs, migration asset verification, and hardened remote SSH/cgroups v2/systemd pre-flight with strict 3-second timeout root-cause triage.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-neutral-200">--target &lt;user@host&gt;</span> : Remote VPS to perform 3s pre-flight SSH diagnosis</div>
                        <div className="pl-4"><span className="text-neutral-200">--strict</span> : Fail on warnings as well as fatal errors</div>
                        <div className="pl-4"><span className="text-neutral-200">-v, --verbose</span> : Print verbose trace logs</div>
                        <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode doctor</div>
                        <div className="pl-4 text-emerald-400">anode doctor ./examples/sample-shop</div>
                        <div className="pl-4 text-emerald-400">anode doctor root@my-vps.com</div>
                        <div className="pl-4 text-emerald-400">anode doctor root@192.168.1.50 ./examples/marketplace --strict</div>
                      </div>
                    </div>

                    {/* anode catalog */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-amber-400 font-mono-code">anode catalog [OPTIONS] [DRIVER] [PATH]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Pluggable Stateful Catalog</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Inspects the built-in catalog of 26+ pre-audited stateful infrastructure drivers (PostgreSQL, MySQL, Redis, Kafka, ScyllaDB, MinIO, Temporal, Qdrant, etc.) and audit override provenance from repo-level <code className="text-neutral-200">anode.catalog.yaml</code>. Supports deep inspection cards for individual drivers and structured JSON export.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Options:</div>
                        <div className="pl-4"><span className="text-amber-300">--json</span> : Output catalog specification or individual driver spec as structured JSON</div>
                        <div className="pl-4"><span className="text-amber-300">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode catalog</div>
                        <div className="pl-4 text-emerald-400">anode catalog postgres</div>
                        <div className="pl-4 text-emerald-400">anode catalog redis ./my-custom-project</div>
                        <div className="pl-4 text-emerald-400">anode catalog postgres --json</div>
                        <div className="pl-4 text-emerald-400">anode catalog --json</div>
                      </div>
                    </div>

                    {/* anode cluster */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-white font-mono-code">anode cluster [COMMAND / OPTIONS] [PATH]</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Multi-Node Fleet Placement</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Orchestrates bare-metal and Linux VPS node pools defined in <code className="text-neutral-200">anode.cluster.yaml</code>. Performs greedy Best-Fit Decreasing (BFD) bin-packing against <code className="text-neutral-200">anode.lock.json</code> based on service ingress roles and cgroups v2 RAM limits, and synthesizes atomic zero-trust Linux <code className="text-neutral-200">nftables</code> packet filter rules.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Commands:</div>
                        <div className="pl-4"><span className="text-neutral-200">init</span> : Scaffold a starter annotated anode.cluster.yaml fleet inventory in the project root</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Options:</div>
                        <div className="pl-4"><span className="text-neutral-200">--inventory &lt;PATH&gt;</span> : Custom path to cluster fleet inventory YAML</div>
                        <div className="pl-4"><span className="text-neutral-200">--firewall</span> : Synthesize and display atomic Linux nftables packet filter rules for every node</div>
                        <div className="pl-4"><span className="text-neutral-200">--json</span> : Output placement plan, node capacity, and firewall rules as JSON</div>
                        <div className="pl-4"><span className="text-neutral-200">-h, --help</span> : Print command usage and syntax</div>
                        <div className="text-neutral-300 font-semibold mt-2 mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode cluster</div>
                        <div className="pl-4 text-emerald-400">anode cluster init</div>
                        <div className="pl-4 text-emerald-400">anode cluster --firewall</div>
                        <div className="pl-4 text-emerald-400">anode cluster ./examples/sample-shop</div>
                        <div className="pl-4 text-emerald-400">anode cluster --inventory=/etc/anode/prod-cluster.yaml --json</div>
                      </div>
                    </div>

                    {/* anode version */}
                    <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-bold text-neutral-300 font-mono-code">anode version</code>
                        <span className="text-[11px] font-mono-code text-neutral-500">Release &amp; Metadata</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Displays the current Anode release version, Git commit SHA, compiler build tag, and supported Go toolchain target.
                      </p>
                      <div className="text-xs font-mono-code text-neutral-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                        <div className="text-neutral-300 font-semibold mb-1">Examples:</div>
                        <div className="pl-4 text-emerald-400">anode version</div>
                        <div className="pl-4 text-emerald-400">anode --version</div>
                      </div>
                    </div>
                  </div>
                </div>
  );
}
