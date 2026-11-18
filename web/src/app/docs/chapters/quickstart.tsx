"use client";


export default function ChapterQuickstart() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Getting Started
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Quickstart Guide
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Get up and running with Anode in under 2 minutes. Works with any standard Go repo.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Step 1: Install Anode CLI</h3>
                      <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                        <code>{`# Official Homebrew Tap (macOS & Linux)
  brew install abhiudayg/tap/anode

  # Or one-line automated installer
  curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/master/install.sh | bash

  # Or build from source via Go toolchain
  go install github.com/abhiudayg/anode/cmd/anode@latest`}</code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Step 2: Inspect Any Go Project</h3>
                      <p className="text-xs text-neutral-400 mb-2">
                        Point Anode at any single service, multi-service, or Go monorepo:
                      </p>
                      <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-emerald-300 overflow-x-auto">
                        <code>{`anode inspect ./testdata/sample-shop`}</code>
                      </pre>
                      <p className="text-xs text-neutral-400 mt-2">
                        Anode analyzes the package graph, executes VTA dead-code elimination, and writes <code className="text-neutral-200">anode.lock.json</code>.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Step 3: Run Local Development</h3>
                      <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-yellow-300 overflow-x-auto">
                        <code>{`anode dev`}</code>
                      </pre>
                      <p className="text-xs text-neutral-400 mt-2">
                        Anode automatically allocates free local ports (e.g. 127.0.0.1:54329 for Postgres), executes schema migrations, injects environment variables, and starts the sub-second reload loop.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white mb-2">Step 4: Deploy to Any Linux VPS</h3>
                      <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                        <code>{`anode deploy root@198.51.100.42 --domain api.example.com`}</code>
                      </pre>
                      <p className="text-xs text-neutral-400 mt-2">
                        Anode cross-compiles static Linux executables, configures systemd services with cgroups v2 resource quotas, and synthesizes Caddy reverse-proxy rules with automatic Let&apos;s Encrypt TLS.
                      </p>
                    </div>
                  </div>
                </div>
  );
}
