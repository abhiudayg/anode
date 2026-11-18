"use client";


export default function ChapterOverview() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                      Core Concepts
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Anode Overview & The 4 Pillars
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-300">
                    Every time you build a Go backend, you declare your architecture twice: once in Go (invoking <code className="text-neutral-200 font-mono-code">sql.Open</code>, listening on ports, registering routes), and again in YAML (multi-stage Dockerfiles, 50-line compose files, port maps, env lists).
                  </p>
                  <p className="text-sm text-neutral-300">
                    <strong>Anode</strong> eliminates configuration drift by analyzing your Go source code using compiler-backed <strong>Static Single Assignment (SSA)</strong> and <strong>Variable Type Analysis (VTA)</strong> call graphs rooted at <code className="text-neutral-200 font-mono-code">func main()</code>. It extracts an immutable, human-readable <code className="text-neutral-200 font-mono-code">anode.lock.json</code> and deploys directly to Linux VPS bare-metal primitives: <strong>systemd</strong>, <strong>cgroups v2</strong>, loopback proxies, and automated Let&apos;s Encrypt TLS.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="p-5 rounded-xl border border-white/[0.06] bg-[#07080a]">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Zero Proprietary SDKs
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Write idiomatic Go with stdlib <code className="text-neutral-300">database/sql</code>, <code className="text-neutral-300">net/http</code>, and official drivers. Never import vendor-locked libraries.
                      </p>
                    </div>
                    <div className="p-5 rounded-xl border border-white/[0.06] bg-[#07080a]">
                      <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Bare-Metal Performance
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Deploys to Linux systemd without a container runtime.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-white/[0.15] bg-white/[0.04] space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-200">
                      The 4 Pillars of Topology Engine
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-300">
                      <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                        <strong className="text-white block mb-1">1. Migration-Driven Provenance</strong>
                        Databases are auto-provisioned only when verified migration assets (e.g. Goose SQL files) exist alongside the service.
                      </div>
                      <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                        <strong className="text-white block mb-1">2. Typed Interface Linking</strong>
                        gRPC stubs (<code className="text-neutral-200">NewPaymentServiceClient</code>) and HTTP routes match 1:1 without naming heuristics.
                      </div>
                      <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                        <strong className="text-emerald-400 block mb-1">3. Commit-Backed Lockfile</strong>
                        Every inspect run synthesizes an immutable contract committed to Git and reviewed in pull requests.
                      </div>
                      <div className="p-3 rounded-lg bg-[#07080a]/80 border border-white/[0.05]">
                        <strong className="text-amber-400 block mb-1">4. Actionable Build Diagnostics</strong>
                        Ambiguous connection strings trigger compiler warnings with exact line numbers and concrete fix suggestions.
                      </div>
                    </div>
                  </div>
                </div>
  );
}
