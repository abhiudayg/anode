"use client";

import {
  Zap,
  AlertTriangle,
  ShieldAlert
} from "lucide-react";

export default function ChapterTroubleshooting() {
  return (
              <div className="block space-y-6 leading-relaxed">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    Operations &amp; Edge Cases
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Troubleshooting &amp; Common Issues
                </h2>
                <p className="text-sm text-neutral-300">
                  Actionable solutions for common server configuration errors, port clashes, and compilation edge cases.
                </p>

                <div className="space-y-4">
                  {/* Issue 1 */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-mono-code font-bold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Error: Failed to bind to :80 or :443 (Address already in use)</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      <strong>Cause:</strong> An existing HTTP web server (such as legacy Apache, Nginx, or an old Docker port-forward) is currently listening on ports 80/443 on the remote Linux host.
                    </p>
                    <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-neutral-200">
                      # Disable conflicting legacy web servers on your VPS:

                      sudo systemctl stop nginx apache2 2&gt;/dev/null

                      sudo systemctl disable nginx apache2 2&gt;/dev/null

                      # Re-run Anode deployment:

                      anode deploy root@your-vps.com
                    </div>
                  </div>

                  {/* Issue 2 */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Warning: /sys/fs/cgroup/cgroup.controllers not found (Legacy cgroups v1)</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      <strong>Cause:</strong> Anode requires Linux cgroups v2 for fine-grained process isolation and memory pressure limits. Distributions older than Ubuntu 22.04 or Debian 11 default to v1.
                    </p>
                    <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-emerald-300">
                      <div># Enable cgroups v2 on Debian/Ubuntu:</div>
                      <div className="mt-2 text-white">
                        {`sudo sed -i 's/GRUB_CMDLINE_LINUX="$/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=1 /' /etc/default/grub`}
                      </div>
                      <div className="mt-1 text-neutral-400">sudo update-grub &amp;&amp; sudo reboot</div>
                    </div>
                  </div>

                  {/* Issue 3 */}
                  <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-2">
                    <div className="flex items-center gap-2 text-white text-xs font-mono-code font-bold">
                      <Zap className="w-4 h-4" />
                      <span>Diagnostics: 0 Ingress Interfaces Detected during &apos;anode inspect&apos;</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      <strong>Cause:</strong> If your HTTP handlers are dynamically registered through complex runtime reflection or untyped map lookups, static Single Static Assignment (SSA) cannot trace the path from `func main()`.
                    </p>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      <strong>Solution:</strong> Ensure your router registration calls (`http.HandleFunc`, `r.Get` in Chi, `app.POST` in Gin, or `app.Listen` in Fiber) are directly accessible from package main or referenced initializers.
                    </p>
                  </div>
                </div>
              </div>
  );
}
