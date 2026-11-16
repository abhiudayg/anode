import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type Section = {
  id: string;
  title: string;
  intro: string;
  points: string[];
  code?: string;
  source: string;
};

const sections: Section[] = [
  {
    id: "pillars",
    title: "1. Four pillars",
    intro:
      "Anode reads infrastructure from Go source instead of asking you to restate it in YAML. Four rules keep that reading honest. They are enforced by the analyzer, not by convention.",
    points: [
      "Migration-driven database provenance. A database is marked auto_provision only when migration files exist for it (migrations/<service>/*.sql, or Goose). Without migrations, the database is treated as an external, unmanaged dependency. Anode does not guess.",
      "Typed interface linking. gRPC client constructors (New<X>Client) are matched to server registrations (Register<X>Server) by interface. HTTP client calls are matched to router patterns, such as POST /v1/charges.",
      "Commit-backed anode.lock.json. anode inspect writes an immutable lockfile. anode dev and anode deploy run against that lockfile only, so an infrastructure change shows up as a diff in a pull request.",
      "Build-time diagnostics. Ambiguous connection strings and unmatched service calls are reported with file:line provenance at inspect time, not discovered at runtime.",
    ],
    source: "docs/architecture.md, section 1",
  },
  {
    id: "pipeline",
    title: "2. Analysis pipeline",
    intro:
      "The static extraction lives in internal/analyzer/ and runs five passes. Each pass is deterministic: the same source produces the same lockfile, and we checked that for every example app.",
    points: [
      "Pass 1, SSA construction. go/packages loads the workspace with ssa.InstantiateGenerics. Expressions, nested calls and branches are lowered to explicit SSA instructions (Call, Alloc, FieldAddr, Store, BinOp).",
      "Pass 2, reachability. A Variable Type Analysis call graph (golang.org/x/tools/go/callgraph/vta) is rooted at func main(). Functions unreachable from main are excluded. VTA is used instead of class hierarchy analysis because CHA would pull in every type that implements an interface, including test-only database helpers.",
      "Pass 3, choke points. Instead of a catalogue of third-party libraries, the analyzer watches a fixed set of standard-library and foundation calls: net/http.ListenAndServe and net.Listen (ingress), database/sql.Open and pgxpool.New (databases), go-redis NewClient (cache), and generated Register<X>Server / New<X>Client (typed RPC).",
      "Pass 4, backward taint tracking. internal/analyzer/taint.go walks backwards from a sink. It follows os.Getenv and os.LookupEnv, struct field stores, string concatenation, and fmt.Sprintf or strings.Join arguments. A DSN assembled from DB_HOST, DB_PORT, DB_USER and DB_NAME is recorded as expanded_env, not as one opaque string.",
      "Pass 5, linker. Outbound calls are matched to internal services (gRPC by interface, HTTP by route table). Calls to external hosts, such as api.stripe.com, become egress_rules rather than service bindings.",
    ],
    code: `[Go source] -> SSA -> VTA call graph from main() -> choke points -> taint trace -> linker -> anode.lock.json`,
    source: "docs/architecture.md, section 2; internal/analyzer/",
  },
  {
    id: "lockfile",
    title: "3. The lockfile",
    intro:
      "anode.lock.json is the only contract between the analyzer and the runtime. Its schema lives in internal/iag/schema.go. Commit it: it is what dev and deploy read.",
    points: [
      "resources: one entry per store, with kind, lifecycle (for example stateful_retain), auto_provision, provenance file:line, and migrations metadata when present.",
      "services: name, entrypoint, ingress (protocol, port_env, routes), bindings (to a store or to another service), and secrets (env var names and where they are read).",
      "egress_rules: outbound hosts that are not internal services.",
      "diagnostics: anything the analyzer could not resolve, with its location.",
      "The SHA-256 of the canonical JSON is the contract hash. Running inspect twice on the same source yields the same hash.",
    ],
    code: `"db-orders": { "kind": "postgres", "lifecycle": "stateful_retain", "auto_provision": true, ... }
"orders":    { "ingress": [{ "protocol": "http", "port_env": "PORT", "routes": ["POST /v1/orders"] }], ... }`,
    source: "docs/architecture.md, section 3; internal/iag/schema.go",
  },
  {
    id: "dev",
    title: "4. Local engine: anode dev",
    intro:
      "anode dev runs the services on your machine against the stores declared in the lockfile. It is built for a fast loop, not for production parity.",
    points: [
      "Free-port allocation. Each service and each database container gets a loopback port asked from the OS (127.0.0.1:0). Nothing reserves the port after the check, so the value is only as current as the moment it was read. Redis is the exception: dev uses the fixed address 127.0.0.1:6379.",
      "Credentials. Local DSNs use fixed development credentials (postgres:postgres). Do not reuse them outside dev.",
      "Service wiring. The dynamic loopback URL of each service is injected into the environment variable of every service that binds to it.",
    ],
    source: "docs/architecture.md, section 4; internal/devengine/engine.go",
  },
  {
    id: "deploy",
    title: "5. Production deploy: anode deploy",
    intro:
      "anode deploy builds static binaries, uploads them over SSH, and runs each service as a hardened systemd unit behind Caddy. The steps below are the ones the deployer runs, in order.",
    points: [
      "Build. CGO_ENABLED=0 GOOS=linux go build produces a self-contained binary per service.",
      "Upload. The binaries are streamed over SSH into a release directory (/var/lib/anode/releases/<release>/). Host keys are checked against known_hosts; a new host must be trusted explicitly.",
      "Units. Each service gets /etc/systemd/system/anode-<service>.service with Restart=always, RestartSec=3, CPUQuota=200%, MemoryMax=1G, DynamicUser=yes, and kernel hardening (ProtectSystem=strict, NoNewPrivileges, PrivateTmp, CapabilityBoundingSet empty, and more).",
      "Edge. A Caddy configuration maps public routes to each service's loopback port. With --domain, Caddy obtains a Let's Encrypt certificate. An IP address gets plain HTTP only with --plain-http.",
      "Restart in place. Each unit is restarted with the new binary and checked on its loopback port. Old and new versions do not run side by side, so requests in flight during a restart can fail. Zero-downtime rollout is not implemented.",
      "Stores. Stores declared as runtime = binary are expected to exist already; the deploy does not install PostgreSQL on the host. This is a known gap.",
    ],
    code: `$ anode deploy root@<host> . --domain api.example.com
  ✓ Cross-compiled orders -> orders
  ✓ Uploaded orders -> /var/lib/anode/releases/<release>/orders
  ✓ Service orders running on 127.0.0.1:21040
  ✓ Caddy reverse proxy configured`,
    source: "docs/architecture.md, section 4; internal/deployer/systemd.go",
  },
  {
    id: "cluster",
    title: "6. Multi-node placement and firewall: anode cluster",
    intro:
      "anode cluster places services across several registered nodes and generates firewall rules for them. The placement and firewall pieces exist; the rules are narrower than a full egress policy.",
    points: [
      "Placement. A greedy least-loaded bin-packer assigns services to nodes using their declared load and memory limits (internal/cluster/pool.go).",
      "Firewall. The generated nftables rules default to drop on input and forward. Loopback, DNS, the declared ingress ports, and service ports from the cluster's private subnets are allowed.",
      "Not enforced: the output chain accepts all outbound traffic. The egress_rules in the lockfile are not turned into firewall rules, so outbound connections are not restricted by the generated policy.",
    ],
    source: "docs/architecture.md, section 4; internal/cluster/pool.go",
  },
  {
    id: "state",
    title: "7. Stateful resources",
    intro:
      "Anode is designed so that removing a line of code does not destroy data. The design is in the schema; some of the enforcement is still to come.",
    points: [
      "Stateful stores (postgres, redis, persistent storage) carry lifecycle: stateful_retain in the lockfile.",
      "The deploy never drops a database or deletes a data directory. Pruning removes old releases, their env and config files, and the units of services that are no longer deployed.",
      "An orphaned lifecycle value exists in the schema, but no code sets it, and there is no anode prune command yet.",
    ],
    source: "docs/architecture.md, section 5",
  },
];

const measured = [
  ["Analyzer time, marketplace (32 services, 35 stores)", "8.8 s median of 5"],
  ["Cold start, one service: anode unit / Docker container", "35 ms / 607 ms"],
  ["DynamicUser cost inside the anode unit", "about 20 ms"],
  ["Idle memory, one service: anode / Docker with daemons", "5.5 MB / about 102 to 106 MB"],
  ["Two services plus PostgreSQL 15 to ready: anode / Docker", "2.4 s / 1.6 s"],
];

export const metadata = {
  title: "Architecture | Anode",
  description: "How Anode turns Go source into a lockfile, a systemd deployment, and a Caddy edge.",
};

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-[#000000] text-white relative">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <span className="text-xs font-mono-code uppercase tracking-wider text-neutral-400">Architecture</span>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">How Anode works, end to end</h1>
        <p className="mt-6 text-base text-neutral-300 leading-relaxed">
          Anode has two halves. The compiler side reads your Go source and produces a lockfile. The runtime side turns that
          lockfile into local processes (anode dev) or systemd units behind Caddy (anode deploy). This page explains each
          part, what it does, and what it does not do yet. The same material, with the code references, is in{" "}
          <code className="text-neutral-200">docs/architecture.md</code> in the repository.
        </p>

        <nav className="mt-10 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
          <div className="text-xs font-mono-code uppercase text-neutral-500 mb-3">On this page</div>
          <ol className="grid sm:grid-cols-2 gap-2 text-sm text-neutral-300">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hover:text-white underline-offset-4 hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#measured" className="hover:text-white underline-offset-4 hover:underline">
                Measured numbers
              </a>
            </li>
          </ol>
        </nav>

        <div className="mt-16 space-y-20">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{s.title}</h2>
              <p className="mt-4 text-neutral-300 leading-relaxed">{s.intro}</p>
              <ul className="mt-6 space-y-4">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-3 text-sm text-neutral-300 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {s.code && (
                <pre className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#050507] p-4 text-xs font-mono-code text-neutral-300 whitespace-pre">
                  {s.code}
                </pre>
              )}
              <p className="mt-4 text-xs font-mono-code text-neutral-500">Source: {s.source}</p>
            </section>
          ))}

          <section id="measured" className="scroll-mt-28">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Measured numbers</h2>
            <p className="mt-4 text-neutral-300 leading-relaxed">
              These are from recorded runs on an Apple Silicon Mac and an OrbStack Debian 12 VM. The scripts and raw results are
              in <code className="text-neutral-200">benchmarks/2026-11-16</code>, and the method is in the{" "}
              <Link href="/docs#benchmarks-analysis" className="underline underline-offset-4 hover:text-white">
                docs
              </Link>
              .
            </p>
            <table className="mt-6 w-full text-sm font-mono-code border border-white/[0.08] rounded-xl overflow-hidden">
              <tbody>
                {measured.map(([label, value]) => (
                  <tr key={label} className="border-b border-white/[0.05]">
                    <td className="p-3 text-neutral-300">{label}</td>
                    <td className="p-3 text-right text-white font-semibold">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="scroll-mt-28">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What Anode does not do yet</h2>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300 leading-relaxed list-disc list-inside">
              <li>No zero-downtime rollout: services restart in place.</li>
              <li>No host PostgreSQL install from anode deploy; stores must exist already.</li>
              <li>Outbound traffic is not restricted by the generated firewall.</li>
              <li>No anode prune command; the orphaned lifecycle is unused.</li>
              <li>Application services run as systemd units only; Docker is not supported for app services.</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
