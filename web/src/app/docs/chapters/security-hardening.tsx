"use client";

import {
  ShieldCheck
} from "lucide-react";

export default function ChapterSecurityHardening() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    Security Hardening
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Least-Privilege Security Boundary
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Anode enforces defense-in-depth security on bare-metal and VPS instances. No microservice ever runs as root, and stateful databases are protected from runaway application leaks.
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        1. Dedicated Unprivileged anode User
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Bootstrap creates the system user <code className="text-neutral-300">anode</code> with no interactive login (<code className="text-neutral-300">/bin/false</code>). All service binaries run under this isolated user.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        2. Deterministic POSIX 0700 File Permissions
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Data directories at <code className="text-neutral-300">/var/lib/anode/data/</code> are initialized with mode <code className="text-neutral-300">0700</code> mapped to database engine UIDs (e.g. 999 for Postgres), blocking host tampering.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        3. Kernel OOM Score Priority Tiering
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Stateful databases receive <code className="text-white">--oom-score-adj=-900</code>, ensuring the Linux kernel never terminates databases during application memory pressure. Stateless services run with <code className="text-amber-400">+500</code> and are sacrificed first.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        4. Strict Loopback Binding (127.0.0.1)
                      </h3>
                      <p className="text-xs text-neutral-400">
                        All stateful database and broker ports bind strictly to loopback (<code className="text-neutral-300">127.0.0.1</code>). Zero database ports are exposed to the public internet interface.
                      </p>
                    </div>
                  </div>
                </div>
  );
}
