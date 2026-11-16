import Link from "next/link";

type Bar = { label: string; value: string; width: string; tone: "anode" | "muted" };

const coldStart: Bar[] = [
  { label: "Run directly, no supervisor", value: "4.7 ms", width: "1%", tone: "anode" },
  { label: "Bare systemd unit", value: "11 ms", width: "2%", tone: "anode" },
  { label: "Anode unit (as deployed)", value: "35 ms", width: "6%", tone: "anode" },
  { label: "Docker container", value: "607 ms", width: "100%", tone: "muted" },
];

const analysis = [
  { fixture: "sample-shop", services: 2, stores: 2, time: "1.10 s" },
  { fixture: "storefront", services: 3, stores: 2, time: "1.19 s" },
  { fixture: "retail-platform", services: 12, stores: 6, time: "2.21 s" },
  { fixture: "marketplace", services: 32, stores: 35, time: "8.81 s" },
];

const memory: Bar[] = [
  { label: "Anode service", value: "5.5 MB", width: "5%", tone: "anode" },
  { label: "Docker: your service", value: "5.3 MB", width: "5%", tone: "muted" },
  { label: "Docker: dockerd", value: "63.6 MB", width: "60%", tone: "muted" },
  { label: "Docker: containerd", value: "25.7 MB", width: "24%", tone: "muted" },
  { label: "Docker: containerd-shim", value: "11.8 MB", width: "11%", tone: "muted" },
];

function BarRow({ bar }: { bar: Bar }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-mono-code text-neutral-400 mb-1.5">
        <span className={bar.tone === "anode" ? "text-white font-semibold" : ""}>{bar.label}</span>
        <span className={bar.tone === "anode" ? "text-white font-bold" : "text-neutral-300 font-semibold"}>{bar.value}</span>
      </div>
      <div className="w-full h-3 rounded bg-neutral-900 border border-white/[0.06] overflow-hidden">
        <div
          className={bar.tone === "anode" ? "h-full bg-white" : "h-full bg-neutral-700"}
          style={{ width: bar.width, minWidth: "4px" }}
        />
      </div>
    </div>
  );
}

function Card({ kind, title, children, note }: { kind: string; title: string; children: React.ReactNode; note: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 sm:p-8 flex flex-col gap-6">
      <div>
        <span className="text-xs font-mono-code text-neutral-500 uppercase">{kind}</span>
        <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
      </div>
      {children}
      <p className="text-[11px] font-mono-code text-neutral-500 leading-relaxed mt-auto">{note}</p>
    </div>
  );
}

export function BenchmarkSections() {
  return (
    <section id="benchmarks" className="py-24 border-t border-white/[0.08] bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold block mb-2">
            Benchmarks
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Measured, with the method shown.</h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-400">
            Four kinds of measurement, each with its own method. Hardware: Apple Silicon Mac, OrbStack Debian 12 VM (arm64),
            Docker 20.10.24, anode 1.6.0.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card
            kind="Latency"
            title="Cold start to a healthy response"
            note="Median of 10 runs, page cache dropped before each. Same static binary in every row. The gap between the bare unit and the anode unit is DynamicUser, which anode keeps for isolation."
          >
            <div className="space-y-4">
              {coldStart.map((bar) => (
                <BarRow key={bar.label} bar={bar} />
              ))}
            </div>
          </Card>

          <Card
            kind="Footprint"
            title="Idle resident memory"
            note="One service, 20 s after its health check passes, host networking. The Docker total was 102 to 106 MB across two runs. Anode has no runtime daemon; its only process is the service."
          >
            <div className="space-y-4">
              {memory.map((bar) => (
                <BarRow key={bar.label} bar={bar} />
              ))}
            </div>
          </Card>

          <Card
            kind="Throughput"
            title="Static analysis time (anode inspect)"
            note="Median of 5 runs per fixture. Analyzer peak memory was 0.7 to 2.8 GB; that is build-time memory, not service memory."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono-code">
                <thead className="text-neutral-500 border-b border-white/[0.08]">
                  <tr>
                    <th className="py-2 text-left font-normal">Fixture</th>
                    <th className="py-2 text-right font-normal">Services</th>
                    <th className="py-2 text-right font-normal">Stores</th>
                    <th className="py-2 text-right font-normal">Time</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  {analysis.map((row) => (
                    <tr key={row.fixture} className="border-b border-white/[0.05]">
                      <td className="py-2">{row.fixture}</td>
                      <td className="py-2 text-right">{row.services}</td>
                      <td className="py-2 text-right">{row.stores}</td>
                      <td className="py-2 text-right text-white font-semibold">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            kind="Reproducibility"
            title="Same source, same lockfile"
            note="The lockfile hash is SHA-256 over canonical JSON. Each fixture was analyzed 5 times; every run produced the same hash, for all four fixtures (20 of 20 runs)."
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-3xl font-black text-white">20 / 20</div>
                <div className="text-[11px] font-mono-code text-neutral-400 mt-1">runs with identical lockfile hash</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-3xl font-black text-white">4</div>
                <div className="text-[11px] font-mono-code text-neutral-400 mt-1">fixtures from the repo&apos;s examples</div>
              </div>
            </div>
          </Card>
          <Card
            kind="Multi-service"
            title="Two services and PostgreSQL 15"
            note="sample-shop: orders and payments with one PostgreSQL server holding two databases. Median of 10 interleaved runs to ready (both health checks and pg_isready). Idle memory 20 s after ready. The anode cold start is dominated by Debian's PostgreSQL startup (2.4 s alone, against 0.6 s for the container)."
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-[11px] font-mono-code text-neutral-400">Cold start to ready</div>
                <div className="text-2xl font-black text-white mt-1">2.4 s</div>
                <div className="text-[11px] font-mono-code text-neutral-500">anode, apt PostgreSQL</div>
                <div className="text-2xl font-black text-neutral-300 mt-3">1.6 s</div>
                <div className="text-[11px] font-mono-code text-neutral-500">Docker, postgres:15 container</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <div className="text-[11px] font-mono-code text-neutral-400">Idle memory, whole stack</div>
                <div className="text-2xl font-black text-white mt-1">88 MB</div>
                <div className="text-[11px] font-mono-code text-neutral-500">anode, no daemon</div>
                <div className="text-2xl font-black text-neutral-300 mt-3">202 MB</div>
                <div className="text-[11px] font-mono-code text-neutral-500">Docker, incl. 120 MB daemons</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-neutral-400 max-w-2xl mx-auto">
            Not measured yet: a remote VPS host, and the Caddy route-swap time. The method and the raw results for every
            card are in the docs.
          </p>
          <Link href="/docs" className="inline-block mt-4 text-sm font-mono-code text-white underline underline-offset-4">
            Read the benchmark method
          </Link>
        </div>
      </div>
    </section>
  );
}
