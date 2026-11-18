"use client";

import Link from "next/link";
import {
} from "lucide-react";

export default function ChapterChokePoints() {
  return (
              <div className="block space-y-6 leading-relaxed">
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Static analysis sinks
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Standard-library choke points</h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Anode does not keep a list of third-party libraries. It looks for a small set of calls that a service has to make to open a port, open a database, or reach another service. These are the sinks. Each sink in reachable code becomes a lockfile entry with a file and line.
                </p>

                <h3 className="text-lg font-bold text-white mt-8">The sinks the analyzer recognises</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono-code border border-white/[0.08] rounded-xl overflow-hidden">
                    <thead className="bg-[#07080a] text-neutral-400">
                      <tr><th className="p-3 text-left">Kind</th><th className="p-3 text-left">Calls matched</th><th className="p-3 text-left">Lockfile output</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] text-neutral-300">
                      <tr><td className="p-3">Ingress</td><td className="p-3"><code>ServeMux.HandleFunc</code> (with a method and path pattern); chi <code>Get</code>, <code>Post</code>, <code>Put</code>, <code>Delete</code></td><td className="p-3">Route patterns such as <code>POST /v1/orders</code>, and the port variable (<code>PORT</code>)</td></tr>
                      <tr><td className="p-3">Database</td><td className="p-3"><code>database/sql.Open</code>, <code>pgxpool.New</code></td><td className="p-3">A postgres resource, the DSN source, and whether migrations exist</td></tr>
                      <tr><td className="p-3">Cache</td><td className="p-3">go-redis <code>NewClient</code></td><td className="p-3">A redis resource and its address source</td></tr>
                      <tr><td className="p-3">Typed RPC</td><td className="p-3"><code>Register&lt;X&gt;Server</code> and <code>New&lt;X&gt;Client</code></td><td className="p-3">A binding from the calling service to the serving service</td></tr>
                      <tr><td className="p-3">Outbound HTTP</td><td className="p-3">Request URLs built from configuration plus a route path</td><td className="p-3">A binding to the service that serves the route, or an egress rule for an external host</td></tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-bold text-white mt-8">What it looks like in sample-shop</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  In <code className="text-neutral-200">examples/sample-shop/orders/main.go</code>, the database sink is the <code className="text-neutral-200">sql.Open</code> call at line 49 and the route sink is <code className="text-neutral-200">POST /v1/orders</code> at line 59. The lockfile records both, with the environment variable for the DSN (<code className="text-neutral-200">ORDERS_DB_URL</code>) and the port variable.
                </p>
                <pre className="rounded-xl border border-white/[0.08] bg-[#050507] p-4 text-xs font-mono-code text-neutral-300 overflow-x-auto whitespace-pre">{`db, err := sql.Open("postgres", cfg.DatabaseURL)   // sink: database
  mux.HandleFunc("POST /v1/orders", ...)             // sink: ingress route
  req, _ := http.NewRequestWithContext(ctx, "POST",
      cfg.PaymentService+"/v1/charges", nil)         // outbound: matched to payments`}</pre>

                <h3 className="text-lg font-bold text-white mt-8">Migrations decide auto-provisioning</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  A database is marked <code className="text-neutral-200">auto_provision: true</code> only when migration files exist. The analyzer looks in <code className="text-neutral-200">migrations/&lt;service&gt;/</code> first, then in a root <code className="text-neutral-200">migrations/</code> directory. Without migrations, the database is treated as an external dependency that someone else manages. The sample apps have no migration files, so both of their databases are external.
                </p>

                <h3 className="text-lg font-bold text-white mt-8">Known gaps</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
                  <li>Route detection works for <code className="text-neutral-200">ServeMux</code> methods, package-level <code className="text-neutral-200">http.HandleFunc</code>, and chi. A package-level route was missing from the lockfile until a fix in this release; the service ran but the edge had no route to it.</li>
                  <li>gin, echo and fiber routes are not recognised, so their routes will not appear in the ingress table.</li>
                </ul>
                <p className="text-xs font-mono-code text-neutral-500">Source: docs/architecture.md, section 2 (phase 3); internal/analyzer/sinks.go, client_sinks.go, taint.go; examples/sample-shop/orders/main.go</p>
              
              <p className="text-sm text-neutral-400 leading-relaxed">
                The full support matrix, with evidence for each pattern the analyzer does not read, is on{" "}
                <Link href="/limitations" className="underline underline-offset-4 hover:text-white">/limitations</Link>.
              </p>
            </div>
  );
}
