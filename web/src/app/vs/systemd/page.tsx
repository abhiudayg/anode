import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  ArrowRight, 
  GitCompare,
  AlertTriangle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Anode vs Raw Systemd: Units vs Automation",
  description:
    "Systemd is the gold standard for Linux process management. See how Anode automates unit generation, cgroups v2, dynamic loopbacks, and zero-downtime Caddy TLS.",
  alternates: {
    canonical: "/vs/systemd",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/vs/systemd",
    title: "Anode vs Raw Systemd: Units vs Automation",
    description:
      "Systemd is great, but manual unit management is brittle. See how Anode automates cgroups v2, dynamic loopbacks, and Caddy TLS.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anode vs Raw Systemd",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anode vs Raw Systemd: Units vs Automation",
    description:
      "Systemd is great, but manual unit management is brittle. See how Anode automates cgroups v2, dynamic loopbacks, and Caddy TLS.",
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
      "item": "https://anode.abhiudayg.dev/vs/systemd"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Anode vs Raw Systemd",
      "item": "https://anode.abhiudayg.dev/vs/systemd"
    }
  ]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why shouldn't I just write systemd unit files by hand?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Systemd is an excellent process supervisor, but manual unit files only manage execution on the server. They don't solve local development port collisions (5432, 8080), environment variable drift between code and server, database user provisioning, or automated Caddy reverse proxy TLS setup. Anode uses systemd as its bare-metal runtime engine while generating and verifying everything automatically from your Go SSA call graph."
      }
    },
    {
      "@type": "Question",
      "name": "Does Anode replace systemd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Anode does NOT replace systemd—it leverages systemd. Anode compiles your Go code, calculates least-privilege cgroups v2 sandboxing directives, writes production systemd units, and reloads systemd automatically over SSH without manual sysadmin work."
      }
    }
  ]
};

export default function AnodeVsSystemdPage() {
  const comparisonRows = [
    {
      feature: "Local Port Collisions",
      anode: "0% (Dynamic ephemeral loopbacks)",
      manual: "Manual port coordination or clashes",
    },
    {
      feature: "Local Development Workflow",
      anode: "anode dev with <15ms hot reload",
      manual: "Must run manual background processes",
    },
    {
      feature: "Reverse Proxy & TLS",
      anode: "Auto-provisioned Caddy with Let's Encrypt",
      manual: "Manual Nginx/Caddy config files",
    },
    {
      feature: "Architecture Drift",
      anode: "Impossible (compiler verified lockfile)",
      manual: "Frequent when env vars or ports change",
    },
    {
      feature: "Sandboxing & Security",
      anode: "DynamicUser, ProtectSystem=strict auto-set",
      manual: "Often omitted due to configuration complexity",
    },
    {
      feature: "Database User Provisioning",
      anode: "Pluggable catalog handles credentials",
      manual: "Manual psql user & grant scripts",
    },
  ];

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
              </li>
              <li><span>/</span></li>
              <li>
                <span className="text-neutral-500">Comparisons</span>
              </li>
              <li><span>/</span></li>
              <li className="text-cyan-300 font-medium">Anode vs Raw Systemd</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono-code mb-6">
              <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Architecture Comparison</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Anode vs Raw Systemd:{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Why Not Write Units Manually?
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Systemd is the gold standard for Linux process management. Anode does not replace systemd—it turns your Go compiler into the orchestrator that writes, secures, and verifies systemd units automatically.
            </p>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Raw Systemd */}
            <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-xs font-mono-code text-neutral-400 uppercase tracking-wider mb-2">
                The Manual Approach
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Writing Systemd Units by Hand</h2>
              <ul className="space-y-3 text-sm text-neutral-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">⚠</span>
                  <span><strong>Zero Local Parity:</strong> Systemd runs on Linux, but many developers develop on macOS or Windows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">⚠</span>
                  <span><strong>No Port Multiplexing:</strong> Manual services conflict on local ports (5432, 8080) when running multiple branches.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">⚠</span>
                  <span><strong>Manual Ingress Plumbing:</strong> You still have to configure Nginx/Caddy, DNS, and TLS certificates manually.</span>
                </li>
              </ul>
            </div>

            {/* Anode */}
            <div className="p-8 rounded-2xl border border-cyan-500/30 bg-cyan-950/10">
              <div className="text-xs font-mono-code text-cyan-400 uppercase tracking-wider mb-2">
                The Compiler-Backed Approach
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Anode Compiler Orchestration</h2>
              <ul className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Cross-Platform Development:</strong> <code>anode dev</code> runs seamlessly on macOS, Linux, and WSL with dynamic loopbacks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Zero Port Clashes:</strong> Dynamic socket proxies allocate conflict-free ephemeral addresses (<code>127.0.0.1:0</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><strong>Automated Systemd Synthesis:</strong> Emits hardened units with <code>DynamicUser=yes</code> and cgroups v2 quotas over SSH.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e14] overflow-hidden mb-16 shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="py-4 px-6 text-xs font-mono-code uppercase text-neutral-400">Capability</th>
                  <th className="py-4 px-6 text-xs font-mono-code uppercase text-cyan-400 bg-cyan-500/5">Anode Orchestration</th>
                  <th className="py-4 px-6 text-xs font-mono-code uppercase text-neutral-400">Manual Systemd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {comparisonRows.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{r.feature}</td>
                    <td className="py-4 px-6 text-cyan-300 font-semibold bg-cyan-500/5">{r.anode}</td>
                    <td className="py-4 px-6 text-neutral-400">{r.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gap 1: When NOT to use Anode (Trust Multiplier) */}
          <div className="p-8 rounded-2xl border border-amber-500/30 bg-amber-950/10 mb-16">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono-code uppercase tracking-wider font-bold mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>Honest Tradeoffs: When NOT to Use Anode</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">
              Where You Should Stick with Traditional Tools
            </h2>
            <ul className="space-y-2.5 text-sm text-neutral-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Polyglot Monoliths:</strong> If your project mixes Python, Ruby, and Node.js into a single runtime environment, use Docker Compose. Anode is specialized for Go.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Dynamic String-Interpolated RPC Handlers:</strong> If your HTTP or gRPC routes are constructed dynamically via reflection at runtime, static SSA analysis cannot trace them.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span><strong>Ancient Linux Kernels (&lt; 4.15):</strong> Anode requires modern cgroups v2 resource limits and systemd socket activation.</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0c0e14] text-center">
            <h2 className="text-xl font-bold text-white mb-2">Automate Your Linux Systemd Services</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Install the Anode CLI and run your first bare-metal deployment in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/[0.1] font-mono-code text-xs text-cyan-300">
                brew install abhiudayg/tap/anode
              </div>
              <Link
                href="/docs#quickstart"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono-code font-bold transition-all"
              >
                <span>Read Quickstart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
