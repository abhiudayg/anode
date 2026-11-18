import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import benchmarks from "@/data/benchmarks.json";

export const metadata: Metadata = {
  title: "Benchmarks — Methods, Runs, and Where Anode Loses",
  description:
    "Every anode benchmark run: machine, sample size, method, results, and the cases where anode loses or ties.",
  alternates: { canonical: "/benchmarks" },
};

const GITHUB = "https://github.com/abhiudayg/anode/blob/master/";

export default function BenchmarksPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-neutral-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24 space-y-16">
        <header className="space-y-4">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">
            Benchmarks · method {benchmarks.method_version}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Measured runs, with the losses included.</h1>
          <p className="text-neutral-400 leading-relaxed">
            Each run lists its machine, sample size, and the places where anode loses or ties. Summaries and scripts
            are in the repository. The raw per-request logs (about 1 GB for 2026-11-18) are not committed.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Headline numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benchmarks.headlines.map((h) => (
              <a key={h.label} href={h.link} className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-5 hover:border-white/20">
                <div className="text-xs font-mono-code uppercase tracking-wider text-neutral-500">{h.label}</div>
                <div className="mt-2 text-3xl font-black text-white">
                  {h.value}
                  {h.compare && <span className="ml-3 text-sm font-mono-code text-neutral-400">vs {h.compare}</span>}
                </div>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{h.method}</p>
              </a>
            ))}
          </div>
        </section>

        {benchmarks.runs.map((run) => (
          <section key={run.id} id={run.id} className="space-y-5 scroll-mt-32">
            <div className="space-y-2 border-t border-white/[0.08] pt-10">
              <div className="text-xs font-mono-code text-neutral-500">{run.date}</div>
              <h2 className="text-2xl font-bold text-white">{run.title}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1 text-sm text-neutral-400">
                <dt className="font-mono-code text-neutral-500">Machine</dt>
                <dd>{run.machine}</dd>
                <dt className="font-mono-code text-neutral-500">Sample</dt>
                <dd>{run.n}</dd>
                <dt className="font-mono-code text-neutral-500">Record</dt>
                <dd>
                  <a href={GITHUB + run.readme} className="underline hover:text-white">{run.readme}</a>
                </dd>
              </dl>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs font-mono-code uppercase tracking-wider text-neutral-500">
                  <tr>
                    {run.columns.map((c) => (
                      <th key={c} className="px-4 py-3 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono-code text-neutral-300">
                  {run.rows.map((row, i) => (
                    <tr key={i} className="border-t border-white/[0.06]">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <h3 className="text-sm font-bold text-amber-300">Where anode loses, or the run does not show a win</h3>
              <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-neutral-300 leading-relaxed">
                {run.loses.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
