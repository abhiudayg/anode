"use client";

import {
} from "lucide-react";

export default function ChapterSsaVta() {
  return (
              <div className="block space-y-6 leading-relaxed">
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Compiler pipeline
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">SSA and Variable Type Analysis (VTA)</h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Anode decides what a service can reach by looking at the code that <code className="text-neutral-200">main()</code> can actually call. Only that code can contribute infrastructure: a database driver used only by a test, or a helper nothing calls, does not appear in the lockfile. The analysis lives in <code className="text-neutral-200">internal/analyzer/</code>.
                </p>

                <h3 className="text-lg font-bold text-white mt-8">Why not class hierarchy analysis</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Class hierarchy analysis (CHA) treats any type that satisfies an interface as a possible target of every call through that interface. In a service with a production Postgres driver and a SQLite test double, CHA would count both, and the test double would appear in the topology. VTA tracks which concrete types can flow into each interface value, so the test double is excluded unless it reaches <code className="text-neutral-200">main()</code>.
                </p>
                <pre className="rounded-xl border border-white/[0.08] bg-[#050507] p-4 text-xs font-mono-code text-neutral-300 overflow-x-auto whitespace-pre">{`type Database interface { Query(...) }
  type SQLiteMock struct{ ... }     // used only by *_test.go
  type PostgresDriver struct{ ... } // used by main()
  // CHA: both types are candidates for Database.Query
  // VTA: only PostgresDriver flows from main(), so only it is kept`}</pre>

                <h3 className="text-lg font-bold text-white mt-8">What the analyzer does, in order</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
                  <li>Loads the workspace with <code className="text-neutral-200">golang.org/x/tools/go/packages</code> and builds SSA with <code className="text-neutral-200">ssa.InstantiateGenerics</code>. Expressions and branches become explicit SSA instructions such as <code className="text-neutral-200">Call</code>, <code className="text-neutral-200">Store</code> and <code className="text-neutral-200">FieldAddr</code>.</li>
                  <li>Builds a VTA call graph (<code className="text-neutral-200">golang.org/x/tools/go/callgraph/vta</code>) rooted at <code className="text-neutral-200">func main()</code>.</li>
                  <li>Runs the sink checks (the <a href="#choke-points" className="underline underline-offset-4 hover:text-white">choke points</a>) only on reachable functions.</li>
                  <li>Traces configuration values backwards from each sink (taint tracking), then links services to each other and to external hosts.</li>
                </ol>

                <h3 className="text-lg font-bold text-white mt-8">What this does not cover</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
                  <li>Go&apos;s call-graph analyses do not follow reflection or plugin-loaded code. Infrastructure reached only through those paths is not found by the analysis.</li>
                  <li>The analysis reads source, not runtime configuration. A DSN assembled from a value that only exists at runtime is traced only as far as the code shows where each part comes from.</li>
                  <li>Results depend on the Go toolchain and module versions used. Re-run <code className="text-neutral-200">anode inspect</code> after upgrading either.</li>
                </ul>
                <p className="text-xs font-mono-code text-neutral-500">Source: docs/architecture.md, section 2; internal/analyzer/</p>
              </div>
  );
}
