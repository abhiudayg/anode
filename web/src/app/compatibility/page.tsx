import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import compat from "@/data/compatibility.json";

export const metadata: Metadata = {
  title: "Docker Compatibility — Feature-by-Feature Gap List",
  description:
    "Where Anode matches Docker for a single Linux host, and where it has gaps: health checks, limits, volumes, exec, signals, networking, and rolling deploys.",
  alternates: { canonical: "/compatibility" },
};

export default function CompatibilityPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-neutral-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 space-y-8">
        <header className="space-y-4">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Docker parity</span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">The gap list, not the feature grid.</h1>
          <p className="text-neutral-400 leading-relaxed">{compat.note}</p>
        </header>

        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs font-mono-code uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium">Docker</th>
                <th className="px-4 py-3 font-medium">Anode today</th>
                <th className="px-4 py-3 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {compat.rows.map((r) => (
                <tr key={r.feature} className="border-t border-white/[0.06] align-top">
                  <td className="px-4 py-3 text-neutral-100 whitespace-nowrap">{r.feature}</td>
                  <td className="px-4 py-3 text-neutral-400 leading-relaxed">{r.docker}</td>
                  <td className="px-4 py-3 text-neutral-300 leading-relaxed">{r.anode}</td>
                  <td className="px-4 py-3">
                    {r.gap ? (
                      <span className="text-xs font-mono-code text-amber-300">gap</span>
                    ) : (
                      <span className="text-xs font-mono-code text-emerald-300">covered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-mono-code text-neutral-500">
          Gap means a Docker user will notice the difference. &quot;Covered&quot; means the same job is done, by a different mechanism.
        </p>
      </main>
      <Footer />
    </div>
  );
}
