"use client";


export default function ChapterBenchmarksAnalysis() {
  return (
              <div className="block space-y-6 leading-relaxed" id="benchmarks">
                <div>
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Benchmarks
                  </span>
                  <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Results at a glance</h2>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-2xl">
                    Every figure below comes from a recorded run. Summaries, tables, and scripts are in the repository, under benchmarks/2026-11-16 and benchmarks/2026-11-18. Raw per-request logs (about 1 GB for 2026-11-18) are not committed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
                    <div className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500">Cold start, 12 services</div>
                    <div className="mt-2 text-4xl font-black text-white">733 ms</div>
                    <div className="mt-1 text-xs font-mono-code text-neutral-400">anode, vs 2.00 s for Docker. GCE e2-standard-4.</div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
                    <div className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500">Idle memory, one service</div>
                    <div className="mt-2 text-4xl font-black text-white">5.5 MB</div>
                    <div className="mt-1 text-xs font-mono-code text-neutral-400">anode, vs about 102 MB for Docker with its daemons. About 95% less.</div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
                    <div className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500">Redeploy under load</div>
                    <div className="mt-2 text-4xl font-black text-white">0.026%</div>
                    <div className="mt-1 text-xs font-mono-code text-neutral-400">2,743 of 10.58 million requests failed, all within 300 ms (anode, 2026-11-18).</div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
                    <div className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-500">Analysis, 32 services</div>
                    <div className="mt-2 text-4xl font-black text-white">8.8 s</div>
                    <div className="mt-1 text-xs font-mono-code text-neutral-400">Lockfile hashes matched in 20 of 20 runs.</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">anode against Docker</h3>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#07080a] text-xs font-mono-code uppercase text-neutral-500">
                        <tr>
                          <th className="p-3 text-left font-normal">Host</th>
                          <th className="p-3 text-right font-normal">anode</th>
                          <th className="p-3 text-right font-normal">Docker</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05] text-neutral-300">
                        <tr><td className="p-3" colSpan={3}><span className="text-xs font-mono-code text-neutral-500">Cold start, retail-platform (12 services)</span></td></tr>
                        <tr><td className="p-3">GCE e2-standard-4</td><td className="p-3 text-right text-white">733 ms</td><td className="p-3 text-right">2.00 s</td></tr>
                        <tr><td className="p-3">OrbStack, local</td><td className="p-3 text-right text-white">175 ms</td><td className="p-3 text-right">5.65 s</td></tr>
                        <tr><td className="p-3" colSpan={3}><span className="text-xs font-mono-code text-neutral-500">Idle memory, retail-platform services</span></td></tr>
                        <tr><td className="p-3">GCE e2-standard-4</td><td className="p-3 text-right text-white">90 MB</td><td className="p-3 text-right">96 MB, plus 193 MB of daemons</td></tr>
                        <tr><td className="p-3">OrbStack, local</td><td className="p-3 text-right text-white">70 MB</td><td className="p-3 text-right">73 MB, plus 132 MB of daemons</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">Details</h3>
                  <p className="text-sm text-neutral-400">Open a section for the full numbers and the conditions behind them.</p>
                  <div className="space-y-3">
                    <details className="group rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-5 open:bg-[#0c0c0f]">
                      <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-white">
                        Cold start and idle memory on one service
                        <span className="text-neutral-500 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="mt-4 space-y-3 text-sm text-neutral-300">
                        <p>On a local OrbStack VM, median of 10 cold starts to a 200 on /healthz, page cache dropped before each.</p>
                        <table className="w-full text-xs font-mono-code">
                          <tbody className="divide-y divide-white/[0.05]">
                            <tr><td className="py-2">Run directly, no supervisor</td><td className="py-2 text-right text-white">4.7 ms</td></tr>
                            <tr><td className="py-2">anode systemd unit</td><td className="py-2 text-right text-white">35 ms</td></tr>
                            <tr><td className="py-2">Docker container</td><td className="py-2 text-right text-white">607 ms</td></tr>
                          </tbody>
                        </table>
                        <p>Most of the anode time is <code className="text-neutral-200">DynamicUser=yes</code>, about 20 ms. Anode keeps it because its isolation model requires it.</p>
                      </div>
                    </details>

                    <details className="group rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-5 open:bg-[#0c0c0f]">
                      <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-white">
                        Two services with PostgreSQL 15
                        <span className="text-neutral-500 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="mt-4 space-y-3 text-sm text-neutral-300">
                        <p>sample-shop: two services and one PostgreSQL server with two databases. Ready means both health checks pass and pg_isready succeeds.</p>
                        <table className="w-full text-xs font-mono-code">
                          <tbody className="divide-y divide-white/[0.05]">
                            <tr><td className="py-2">Ready, local VM (anode / Docker)</td><td className="py-2 text-right text-white">2.4 s / 1.6 s</td></tr>
                            <tr><td className="py-2">Ready, GCE (anode / Docker)</td><td className="py-2 text-right text-white">4.46 s / 4.13 s</td></tr>
                            <tr><td className="py-2">Idle, GCE (anode / Docker incl. daemons)</td><td className="py-2 text-right text-white">84 MB / 274 MB</td></tr>
                          </tbody>
                        </table>
                        <p>Most of the time is PostgreSQL&apos;s own start-up, which is why the two arms are close on GCE.</p>
                      </div>
                    </details>

                    <details className="group rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-5 open:bg-[#0c0c0f]">
                      <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-white">
                        Redeploy under load
                        <span className="text-neutral-500 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="mt-4 space-y-3 text-sm text-neutral-300">
                        <p>The whole project is redeployed while clients keep requesting. Each service restarts in place; traffic is not moved to the new version first.</p>
                        <table className="w-full text-xs font-mono-code">
                          <thead className="text-neutral-500"><tr><th className="py-2 text-left font-normal">Setup</th><th className="py-2 text-right font-normal">Requests</th><th className="py-2 text-right font-normal">Failed</th><th className="py-2 text-right font-normal">Window</th></tr></thead>
                          <tbody className="divide-y divide-white/[0.05]">
                            <tr><td className="py-2">1 service, 1 client</td><td className="py-2 text-right">625 to 909</td><td className="py-2 text-right">1 per redeploy</td><td className="py-2 text-right">143 to 152 ms</td></tr>
                            <tr><td className="py-2">1 service, 10 clients</td><td className="py-2 text-right">6,100</td><td className="py-2 text-right">5</td><td className="py-2 text-right">247 ms</td></tr>
                            <tr><td className="py-2">1 service, 50 clients</td><td className="py-2 text-right">117,692</td><td className="py-2 text-right">330</td><td className="py-2 text-right">160 ms</td></tr>
                            <tr><td className="py-2">32 services, 50 clients, 15 min, anode</td><td className="py-2 text-right">10,581,205</td><td className="py-2 text-right">2,743</td><td className="py-2 text-right">300 ms</td></tr>
                            <tr><td className="py-2">32 services, 50 clients, 15 min, Docker (batched swap script)</td><td className="py-2 text-right">10,913,805</td><td className="py-2 text-right">20,487</td><td className="py-2 text-right">2.33 s</td></tr>
                          </tbody>
                        </table>
                        <p>No connection errors in any run. Every failure falls inside the restart window. The Docker row uses our own stop-and-start script, not Docker&apos;s best swap method, so its window measures that script.</p>
                      </div>
                    </details>

                    <details className="group rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-5 open:bg-[#0c0c0f]">
                      <summary className="cursor-pointer list-none flex items-center justify-between text-sm font-semibold text-white">
                        Marketplace: 32 services, 35 stores
                        <span className="text-neutral-500 group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <div className="mt-4 space-y-3 text-sm text-neutral-300">
                        <p>Run on a GCE e2-standard-8 with 32 GB, anode and Docker on the same stores, routes and binaries, in both orders. Seven stores are marked external in the example; we started those by hand, as 4 containers. Store containers run in both arms.</p>
                        <table className="w-full text-xs font-mono-code">
                          <thead className="text-neutral-500"><tr><th className="py-2 text-left font-normal">Measure</th><th className="py-2 text-right font-normal">anode</th><th className="py-2 text-right font-normal">Docker</th></tr></thead>
                          <tbody className="divide-y divide-white/[0.05]">
                            <tr><td className="py-2">Cold start, 32 services (median of 5 per run)</td><td className="py-2 text-right text-white">3.3 s</td><td className="py-2 text-right text-white">5.6 s</td></tr>
                            <tr><td className="py-2">Services memory, cgroup, idle</td><td className="py-2 text-right text-white">526 to 533 MB</td><td className="py-2 text-right text-white">504 to 511 MB</td></tr>
                            <tr><td className="py-2">Daemon memory, idle (includes the 32 store containers)</td><td className="py-2 text-right text-white">696 to 897 MB</td><td className="py-2 text-right text-white">1,173 to 1,295 MB</td></tr>
                            <tr><td className="py-2">Functional smoke, 85 routes</td><td className="py-2 text-right text-white">identical status codes</td><td className="py-2 text-right text-white">identical status codes</td></tr>
                            <tr><td className="py-2">Load p50 / p99, 50 clients, 15 min</td><td className="py-2 text-right text-white">3.6 to 3.7 ms / 11.8 to 12.0 ms</td><td className="py-2 text-right text-white">3.6 ms / 11.7 to 11.8 ms</td></tr>
                          </tbody>
                        </table>
                        <p>Daemon memory is the runtime overhead the arms differ on. Services themselves use about the same memory in both arms. The earlier 908 MB Docker figure was removed: it had no matching run.</p>
                        <p>Caveats: the load test hits a static health route, so it does not exercise the databases; the database routes were checked for status codes only.</p>
                      </div>
                    </details>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">Steady state, failures, and sizing (2026-11-18)</h3>
                  <p className="text-sm text-neutral-400">One DB-backed route, <code className="text-neutral-200">GET /v1/orders/&#123;id&#125;</code>, through Caddy from a separate load VM in the same zone. One run per cell.</p>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                    <table className="w-full text-xs font-mono-code">
                      <thead className="bg-[#07080a] text-neutral-500"><tr><th className="p-3 text-left font-normal">Rate, anode / bare unit / Docker</th><th className="p-3 text-right font-normal">p50 ms</th><th className="p-3 text-right font-normal">p99 ms</th><th className="p-3 text-right font-normal">Service CPU</th></tr></thead>
                      <tbody className="divide-y divide-white/[0.05] text-neutral-300">
                        <tr><td className="p-3">100 RPS</td><td className="p-3 text-right">2.3 to 2.5</td><td className="p-3 text-right">3.0 to 3.1</td><td className="p-3 text-right">4 to 7%</td></tr>
                        <tr><td className="p-3">500 RPS</td><td className="p-3 text-right">1.8 to 2.0</td><td className="p-3 text-right">2.5 to 2.6</td><td className="p-3 text-right">15 to 15%</td></tr>
                        <tr><td className="p-3">1,000 RPS target</td><td className="p-3 text-right" colSpan={3}>all three arms top out near 920 RPS, so this point measures the load path, not the arms</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-neutral-400">At 100 and 500 RPS the three arms are within run-to-run noise. Orchestration adds no measurable latency on this route.</p>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                    <table className="w-full text-xs font-mono-code">
                      <thead className="bg-[#07080a] text-neutral-500"><tr><th className="p-3 text-left font-normal">Failure</th><th className="p-3 text-left font-normal">Observed</th></tr></thead>
                      <tbody className="divide-y divide-white/[0.05] text-neutral-300">
                        <tr><td className="p-3">SIGTERM under 50 clients</td><td className="p-3">3.4 s of connection errors, one window; services exit at once, with no graceful shutdown</td></tr>
                        <tr><td className="p-3">Postgres down for 10 s</td><td className="p-3">500s for the outage, recovered as soon as the database returned; no service restart needed</td></tr>
                        <tr><td className="p-3">Port already in use</td><td className="p-3">bind error in the journal; the unit restarts until the port is free</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-neutral-400">Not run: OOM under the 1G memory limit (the template sets `MemoryMax=1G`, but the run did not record the installed unit), crash-loop, bad migration, a non-compiling deploy, and a full disk.</p>
                  <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
                    <table className="w-full text-xs font-mono-code">
                      <thead className="bg-[#07080a] text-neutral-500"><tr><th className="p-3 text-left font-normal">Sizing, orders route at 500 RPS, p99 SLO 10 ms</th><th className="p-3 text-right font-normal">e2-standard-2 ($0.0670/h)</th></tr></thead>
                      <tbody className="divide-y divide-white/[0.05] text-neutral-300">
                        <tr><td className="p-3">anode unit</td><td className="p-3 text-right">p99 6.25 ms, 0 errors</td></tr>
                        <tr><td className="p-3">bare unit</td><td className="p-3 text-right">p99 3.84 ms, 0 errors</td></tr>
                        <tr><td className="p-3">Docker</td><td className="p-3 text-right">p99 3.74 ms, 0 errors</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-neutral-400">Prices from the Cloud Billing Catalog API, effective 2026-11-17. e2-small was not measured: its price is not in the catalog results. The anode p99 is one run and higher than the other arms on this host.</p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-6">
                  <h3 className="text-sm font-bold text-white">What these numbers do not cover</h3>
                  <ul className="mt-3 list-disc list-inside space-y-2 text-sm text-neutral-400">
                    <li>Two hosts: a local OrbStack VM, and Google Cloud VMs (on-demand, us-central1). The sizes differ, so compare within a host.</li>
                    <li>External API calls are placeholders in the marketplace run. The services start, but those paths are not exercised.</li>
                    <li>Not measured: a public VPS, Caddy&apos;s route-swap time on the largest example, and service counts above 32.</li>
                  </ul>
                </div>
              </div>
  );
}
