import Link from "next/link";
import benchmarks from "@/data/benchmarks.json";

export function Benchmarks() {
  return (
    <section id="benchmarks" className="py-24 border-t border-white/[0.08] bg-[#000000]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Benchmarks</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-white">Measured, not estimated.</h2>
          <p className="mt-4 text-base text-neutral-400 leading-relaxed">
            Each number states its method and links to the run. Summaries and scripts are in the repository; raw per-request logs are not.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {benchmarks.headlines.map((h) => (
            <Link
              key={h.label}
              href={h.link}
              className="group rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-7 hover:border-white/20 transition-colors"
            >
              <div className="text-xs font-mono-code uppercase tracking-wider text-neutral-500">{h.label}</div>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="text-5xl font-black tracking-tight text-white">{h.value}</span>
                {h.compare && <span className="text-sm font-mono-code text-neutral-400">vs {h.compare}</span>}
              </div>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed">{h.method}</p>
              <span className="mt-4 inline-block text-xs font-mono-code text-neutral-500 group-hover:text-white">
                See the run →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/benchmarks"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors"
          >
            All runs, methods, and where anode loses
          </Link>
        </div>
      </div>
    </section>
  );
}
