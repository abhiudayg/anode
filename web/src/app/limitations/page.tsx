import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import support from "@/data/support.json";

export const metadata: Metadata = {
  title: "Limitations — What Anode Recognizes, and What It Does Not",
  description:
    "Anode's analyzer support matrix: routers, database and cache clients, config patterns, ORMs, migrations, and deploy targets, with the evidence for each.",
  alternates: { canonical: "/limitations" },
};

const STATUS_LABEL: Record<string, string> = {
  supported: "Supported",
  partial: "Partial",
  not_supported: "Not supported",
  not_verified: "Not verified",
};

const STATUS_CLASS: Record<string, string> = {
  supported: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  partial: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  not_supported: "text-red-300 border-red-500/30 bg-red-500/10",
  not_verified: "text-neutral-300 border-white/20 bg-white/[0.04]",
};

export default function LimitationsPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-neutral-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 space-y-12">
        <header className="space-y-4">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Analyzer support matrix</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">What Anode recognizes, and what it does not.</h1>
          <p className="text-neutral-400 leading-relaxed">
            The analyzer reads your code for a fixed set of calls. If a call is not in the list below, anode does not
            bind it, and the deploy will not know about it. A missing binding means &quot;not verified&quot;, not &quot;absent&quot;.
          </p>
          <p className="text-xs font-mono-code text-neutral-500">{support.source_commit_note}</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <span key={k} className={`px-2.5 py-1 rounded-full border text-xs font-mono-code ${STATUS_CLASS[k]}`}>
              {label}: {support.statuses[k as keyof typeof support.statuses]}
            </span>
          ))}
        </div>

        {support.areas.map((area) => (
          <section key={area.name} className="space-y-4">
            <h2 className="text-2xl font-bold text-white">{area.name}</h2>
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs font-mono-code uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pattern</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Evidence</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {area.rows.map((r) => (
                    <tr key={r.item} className="border-t border-white/[0.06] align-top">
                      <td className="px-4 py-3 text-neutral-100">{r.item}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono-code whitespace-nowrap ${STATUS_CLASS[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 leading-relaxed">{r.evidence}</td>
                      <td className="px-4 py-3 font-mono-code text-xs text-neutral-500">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
