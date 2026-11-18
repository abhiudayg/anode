"use client";


export default function ChapterTradeoffs() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    Architectural Honesty
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Tradeoffs, Limits & Non-Goals
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Honest engineering requires being explicit about what a tool <strong>refuses to do</strong>, where it excels, and the fundamental tradeoffs inherent in its architecture.
                  </p>

                  {/* Comparison Matrix Table */}
                  <div className="overflow-x-auto my-6">
                    <table className="w-full text-xs font-mono-code border border-white/[0.08] rounded-xl overflow-hidden">
                      <thead className="bg-[#07080a] text-neutral-400 border-b border-white/[0.08]">
                        <tr>
                          <th className="p-3 text-left">Capability</th>
                          <th className="p-3 text-left text-white">Anode</th>
                          <th className="p-3 text-left">Kubernetes</th>
                          <th className="p-3 text-left">Docker Compose</th>
                          <th className="p-3 text-left">Encore.dev</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05] bg-[#0a0a0c]/50">
                        <tr>
                          <td className="p-3 font-semibold text-white">Code Invasiveness</td>
                          <td className="p-3 text-emerald-400 font-bold">Zero SDK (Stdlib Go)</td>
                          <td className="p-3 text-neutral-400">Zero SDK</td>
                          <td className="p-3 text-neutral-400">Zero SDK</td>
                          <td className="p-3 text-red-400">High (Proprietary SDK)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Config Overhead</td>
                          <td className="p-3 text-emerald-400 font-bold">Zero YAML (Auto-Lock)</td>
                          <td className="p-3 text-red-400">Heavy (400+ lines)</td>
                          <td className="p-3 text-yellow-400">Medium (Compose YAML)</td>
                          <td className="p-3 text-emerald-400">Zero YAML</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Dead-Code Pruning</td>
                          <td className="p-3 text-emerald-400 font-bold">Yes (Mathematical VTA)</td>
                          <td className="p-3 text-neutral-500">No</td>
                          <td className="p-3 text-neutral-500">No</td>
                          <td className="p-3 text-emerald-400">Yes</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Hardware Efficiency</td>
                          <td className="p-3 text-emerald-400 font-bold">Native systemd</td>
                          <td className="p-3 text-red-400">Low (Kubelet/etcd tax)</td>
                          <td className="p-3 text-yellow-400">Medium (Daemon tax)</td>
                          <td className="p-3 text-neutral-400">Cloud Micro-VMs</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-white">Hosting Economics</td>
                          <td className="p-3 text-neutral-200 font-bold">Linux VPS</td>
                          <td className="p-3 text-red-400">Managed Kubernetes (EKS/GKE)</td>
                          <td className="p-3 text-neutral-300">Any VPS</td>
                          <td className="p-3 text-neutral-400">Encore Cloud / AWS</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
                      <h3 className="text-sm font-bold text-emerald-300">When to Use Anode</h3>
                      <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                        <li>Building standard Go services (<code className="text-neutral-200">net/http</code>, <code className="text-neutral-200">chi</code>, <code className="text-neutral-200">gin</code>, <code className="text-neutral-200">pgx</code>, gRPC).</li>
                        <li>Hosting on a Linux VPS from Hetzner, OVH, or DigitalOcean.</li>
                        <li>Tired of multi-stage Dockerfiles and compose port collisions.</li>
                        <li>Want automated Let&apos;s Encrypt TLS through Caddy.</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-xl border border-red-500/20 bg-red-950/10 space-y-2">
                      <h3 className="text-sm font-bold text-red-300">When NOT to Use Anode</h3>
                      <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                        <li>Operating a 5,000-node cluster across 4 AWS regions with GPU autoscaling (keep Kubernetes).</li>
                        <li>Architecture relies exclusively on proprietary AWS managed services (DynamoDB, SQS, Step Functions).</li>
                        <li>Codebase written in non-Go languages (Python & TypeScript extractors are planned for Phase 5).</li>
                      </ul>
                    </div>
                  </div>
                </div>
  );
}
