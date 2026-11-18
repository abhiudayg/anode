import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Check, 
  X, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Sparkles,
  GitCompare,
  AlertTriangle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Docker Compose Alternative for Go Backends",
  description:
    "Looking for a Docker Compose alternative for Go? See how Anode replaces Dockerfiles & YAML drift with compiler SSA call-graph analysis and fast systemd boot.",
  alternates: {
    canonical: "/vs/docker-compose",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/vs/docker-compose",
    title: "Docker Compose Alternative for Go Backends",
    description:
      "Go compiles to static binaries. Why wrap them in container engines? Compare Anode's Proof-of-Topology with Docker Compose for Go microservices.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anode vs Docker Compose Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Docker Compose Alternative for Go Backends",
    description:
      "Go compiles to static binaries. Why wrap them in container engines? Compare Anode with Docker Compose.",
    images: ["/og-image.png"],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://anode.abhiudayg.dev"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Comparisons",
      "item": "https://anode.abhiudayg.dev/vs/docker-compose"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Docker Compose Alternative for Go",
      "item": "https://anode.abhiudayg.dev/vs/docker-compose"
    }
  ]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why use Anode instead of Docker Compose for Go backends?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Go compiles to self-contained, statically linked machine code. Running it inside Docker Compose introduces container daemon overhead, slow image builds, and fragile YAML manifests that drift from code. Anode inspects your Go SSA call graph directly to infer service topology, eliminates port collisions via ephemeral local ports, and executes natively on Linux systemd with fast cold starts and small RAM footprint."
      }
    },
    {
      "@type": "Question",
      "name": "How does Anode prevent local port collisions without Docker?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Docker Compose binds containers to fixed host ports (e.g. 5432 or 8080), leading to clashes when multiple projects run concurrently. Anode uses ephemeral local port multiplexing (127.0.0.1:0) and ephemeral socket proxies to ensure every service and database binding has an isolated, conflict-free virtual address."
      }
    },
    {
      "@type": "Question",
      "name": "Can I migrate from Docker Compose to Anode without rewriting Go code?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, 100%. Anode requires zero proprietary SDK imports, code modifications, or annotations. It statically inspects standard net/http, database/sql, pgx, redis-go, and gRPC drivers straight from your existing AST."
      }
    }
  ]
};

export default function DockerComposeVsAnodePage() {
  const comparisonRows = [
    {
      feature: "Container Runtime",
      anode: "None (systemd runs the binary)",
      docker: "A container engine runs and wires each service",
      winner: "anode",
    },
    {
      feature: "Daemon Overhead",
      anode: "No container daemon",
      docker: "dockerd, containerd, shim-v2",
      winner: "anode",
    },
    {
      feature: "Config Maintenance",
      anode: "anode.toml plus a generated anode.lock.json",
      docker: "Dockerfile + docker-compose.yml (2+ files)",
      winner: "anode",
    },
    {
      feature: "Local Port Collisions",
      anode: "Ephemeral local ports",
      docker: "Frequent clashes on 5432, 6379, 8080",
      winner: "anode",
    },
    {
      feature: "Local Dev Hot Reload",
      anode: "Polls for source changes every 300 ms",
      docker: "Slow image rebuilds or volume bind-mount lag",
      winner: "anode",
    },
    {
      feature: "Production Deployment",
      anode: "Hardened systemd + cgroups v2 in 1 step",
      docker: "Requires remote Docker daemon or registry push",
      winner: "anode",
    },
    {
      feature: "Security Boundary",
      anode: "DynamicUser=yes, ProtectSystem=strict",
      docker: "Root daemon attack surface",
      winner: "anode",
    },
    {
      feature: "Architecture Drift",
      anode: "Lockfile regenerated from the code on inspect",
      docker: "Common when code & compose.yml diverge",
      winner: "anode",
    },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 selection:text-white relative bg-grid-pattern">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li><span>/</span></li>
              <li>
                <span className="text-neutral-500">Comparisons</span>
              </li>
              <li><span>/</span></li>
              <li className="text-neutral-200 font-medium">Docker Compose vs Anode</li>
            </ol>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] text-neutral-200 text-xs font-mono-code mb-6">
              <GitCompare className="w-3.5 h-3.5 text-white" />
              <span>Technical Architecture Comparison</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              The Docker Compose Alternative for{" "}
              <span className="text-white">
                Go Backends.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Go compiles to self-contained static machine code. Anode replaces heavy container daemons and drifted YAML files with compiler-backed SSA call-graph analysis and bare-metal Linux execution.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono-code">
              <div className="px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.12] text-neutral-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-white" />
                <span>No Container Runtime</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.12] text-neutral-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-white" />
                <span>Less Memory Overhead</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Free local ports</span>
              </div>
            </div>
          </div>

          {/* Quick Problem Statement */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Docker Way */}
            <div className="p-8 rounded-2xl border border-red-500/20 bg-red-950/10 relative overflow-hidden">
              <div className="text-xs font-mono-code text-red-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <X className="w-4 h-4 text-red-400" />
                <span>The Traditional Docker Way</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">You Declare Architecture Twice</h2>
              <ul className="space-y-3 text-sm text-neutral-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1 font-bold">✕</span>
                  <span><strong>Drift Trap:</strong> Update an environment variable in Go, and your <code>docker-compose.yml</code> immediately drifts out of sync.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1 font-bold">✕</span>
                  <span><strong>Port Collisions:</strong> Two microservices or projects cannot both listen on <code>:8080</code> or <code>:5432</code> without tedious port re-mapping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1 font-bold">✕</span>
                  <span><strong>Resource Tax:</strong> Docker Desktop and containerd shims use memory before serving a single HTTP request. On a Debian VM, one idle service costs about 102 MB under Docker and 5.5 MB under anode (<a href="/benchmarks" className="underline">method and caveats</a>).</span>
                </li>
              </ul>
            </div>

            {/* The Anode Way */}
            <div className="p-8 rounded-2xl border border-white/[0.12] bg-white/[0.04] relative overflow-hidden">
              <div className="text-xs font-mono-code text-white font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-white" />
                <span>The Anode Bare-Metal Way</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">The Compiler Is The Orchestrator</h2>
              <ul className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1 font-bold">✓</span>
                  <span><strong>Zero YAML:</strong> Anode extracts routes and database drivers directly from Go AST using SSA call graphs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1 font-bold">✓</span>
                  <span><strong>Local ports:</strong> Backing services get ephemeral local port proxy (<code>127.0.0.1:0</code>). Run 10 copies safely.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-1 font-bold">✓</span>
                  <span><strong>Bare-Metal:</strong> Native Linux systemd units with cgroups v2 quotas and automated Caddy reverse proxying.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Detailed Head-to-Head Table */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Head-to-Head Feature Comparison
              </h2>
              <p className="mt-2 text-sm text-neutral-400">
                Detailed architectural breakdown: Docker Compose vs Anode Proof-of-Topology
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/80 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                      <th className="py-4 px-6 text-xs font-mono-code uppercase tracking-wider text-neutral-400">
                        Feature / Capability
                      </th>
                      <th className="py-4 px-6 text-xs font-mono-code uppercase tracking-wider text-white bg-white/[0.08]">
                        Anode (Bare Metal)
                      </th>
                      <th className="py-4 px-6 text-xs font-mono-code uppercase tracking-wider text-neutral-400">
                        Docker Compose
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-sm">
                    {comparisonRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-medium text-white">
                          {row.feature}
                        </td>
                        <td className="py-4 px-6 text-neutral-200 font-semibold bg-white/[0.08]">
                          {row.anode}
                        </td>
                        <td className="py-4 px-6 text-neutral-400">
                          {row.docker}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Migration in 3 Steps */}
          <div className="mt-24 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                How to Migrate from Docker Compose in 60 Seconds
              </h2>
              <p className="mt-2 text-sm text-neutral-400">
                No code changes. No SDK imports. Just run Anode against your existing repository.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Delete or ignore your <code>docker-compose.yml</code>
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    You don&apos;t need to write service declarations, environment lists, or port mappings. Anode reads your Go AST directly.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Run local development without fixed port numbers
                  </h3>
                  <div className="mt-2 p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-neutral-200">
                    $ anode dev
                  </div>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                    Anode inspects the SSA call graph, provisions backing databases via ephemeral local ports, and starts your backend with hot-reload.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Deploy to any bare-metal Linux VPS with 1 command
                  </h3>
                  <div className="mt-2 p-3 rounded-lg bg-black/60 border border-white/[0.06] font-mono-code text-xs text-neutral-200">
                    $ anode deploy user@your-vps.com
                  </div>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                    Generates hardened Linux systemd units, configures cgroups v2 resource quotas, drops root privileges, and provisions automated Caddy TLS reverse proxies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Tool Callout */}
          <div className="mt-16 max-w-4xl mx-auto p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-[#0c0e14] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono-code font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Free Migration Tool</span>
              </div>
              <p className="text-lg font-bold text-white">
                Have an existing docker-compose.yml?
              </p>
              <p className="text-xs sm:text-sm text-neutral-400">
                Paste your YAML into our free client-side converter to generate hardened Linux systemd units in real-time.
              </p>
            </div>
            <Link
              href="/tools/compose-to-systemd"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono-code font-bold transition-all shrink-0 shadow-lg shadow-amber-500/20"
            >
              <span>Convert YAML to Systemd</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Gap 1: When NOT to use Anode (Trust Multiplier) */}
          <div className="mt-16 max-w-4xl mx-auto p-8 rounded-2xl border border-amber-500/30 bg-amber-950/10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-wider font-bold mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Honest Tradeoffs: When NOT to Use Anode</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">
              Where You Should Stick with Docker Compose
            </h2>
            <ul className="space-y-2.5 text-sm text-neutral-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Polyglot Monoliths:</strong> If your project mixes Python, Ruby, and Node.js into a single runtime environment, use Docker Compose. Anode is specialized for Go backends.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Dynamic String-Interpolated RPC Handlers:</strong> If your HTTP or gRPC routes are constructed dynamically via reflection at runtime, static SSA analysis cannot trace them without explicit type hints.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Non-Linux Production Targets:</strong> Anode targets standard Linux bare metal (Ubuntu, Debian, Fedora, Arch) utilizing kernel cgroups v2 and systemd. For Windows Server, use Docker.</span>
              </li>
            </ul>
          </div>

          {/* CTA Box */}
          <div className="mt-20 max-w-4xl mx-auto p-10 rounded-2xl border border-white/[0.1] bg-[#0a0a0c] yc-card text-center relative overflow-hidden">
            <h2 className="text-3xl font-black text-white mb-3">
              Ready to Ditch Dockerfile &amp; YAML Drift?
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Install Anode via Homebrew and run your first bare-metal Go deployment directly to Linux systemd.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="px-4 py-2.5 rounded-full bg-black/60 border border-white/[0.1] font-mono-code text-xs text-neutral-300">
                brew install abhiudayg/tap/anode
              </div>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <span>Read the docs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
