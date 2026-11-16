import Link from "next/link";

type Stat = { label: string; value: string; detail: string };

const stats: Stat[] = [
  {
    label: "Cold start",
    value: "733 ms",
    detail: "12 services on a GCE VM. Docker takes 2.0 s for the same binaries.",
  },
  {
    label: "Idle memory",
    value: "5.5 MB",
    detail: "One service with no runtime daemon. Docker needs about 102 MB, including its daemons.",
  },
  {
    label: "Redeploy under load",
    value: "0.028%",
    detail: "Failed requests while 32 services were redeployed under 50 clients. All failures fell in a 299 ms window.",
  },
  {
    label: "Analysis time",
    value: "8.8 s",
    detail: "Static analysis of the 32-service marketplace example. Lockfile hashes matched in 20 of 20 runs.",
  },
];

export function Benchmarks() {
  return (
    <section id="benchmarks" className="py-24 border-t border-white/[0.08] bg-[#000000]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Benchmarks</span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight text-white">Measured, not estimated.</h2>
          <p className="mt-4 text-base text-neutral-400 leading-relaxed">
            Recorded runs on a local OrbStack VM and on Google Cloud. Every figure has its raw data in the repository.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-7">
              <div className="text-xs font-mono-code uppercase tracking-wider text-neutral-500">{s.label}</div>
              <div className="mt-3 text-5xl font-black tracking-tight text-white">{s.value}</div>
              <p className="mt-4 text-sm text-neutral-400 leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/docs#benchmarks"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white hover:text-black transition-colors"
          >
            See the full results and method
          </Link>
        </div>
      </div>
    </section>
  );
}
