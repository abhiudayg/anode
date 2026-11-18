import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import security from "@/data/security.json";

export const metadata: Metadata = {
  title: "Security — Unit Hardening and the Denial Matrix",
  description:
    "The systemd hardening every Anode service runs under, and the denial tests that prove each control, with the commands to run them.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-neutral-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 space-y-14">
        <header className="space-y-4">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Security</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">What a service cannot do.</h1>
          <p className="text-neutral-400 leading-relaxed">{security.note}</p>
          <p className="text-sm text-neutral-400">
            Source: <span className="font-mono-code">internal/deployer/systemd.go</span>. The audit for the supported
            profile is in <span className="font-mono-code">docs/security-audit.md</span>.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Unit directives</h2>
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs font-mono-code uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Directive</th>
                  <th className="px-4 py-3 font-medium">Effect</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {security.directives.map((d) => (
                  <tr key={d.name} className="border-t border-white/[0.06] align-top">
                    <td className="px-4 py-3 font-mono-code text-xs text-neutral-100">{d.name}</td>
                    <td className="px-4 py-3 leading-relaxed">{d.effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Denial matrix</h2>
          <div className="space-y-3">
            {security.denials.map((d) => (
              <div key={d.test} className="rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{d.test}</h3>
                  <span className="text-xs font-mono-code text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded-full px-2 py-0.5">
                    {d.status}
                  </span>
                </div>
                <pre className="overflow-x-auto text-xs font-mono-code text-neutral-300 bg-black/50 rounded-lg p-3">{d.command}</pre>
                <p className="text-sm text-neutral-400">Expected: {d.expect}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
