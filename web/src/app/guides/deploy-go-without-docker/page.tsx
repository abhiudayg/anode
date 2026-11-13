import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Check, 
  ArrowRight, 
  BookOpen
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deploy Go to Linux Without Docker",
  description:
    "Step-by-step guide to deploying Go backends to a bare-metal Linux VPS with systemd, cgroups v2, and automated TLS without Docker or Kubernetes.",
  alternates: {
    canonical: "/guides/deploy-go-without-docker",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/guides/deploy-go-without-docker",
    title: "Deploy Go to Linux Without Docker",
    description:
      "Deploy unmodified Go backends directly to Ubuntu/Debian bare metal with 8ms cold starts and zero Docker daemons.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deploy Go to Linux Without Docker Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Go to Linux Without Docker",
    description:
      "Deploy unmodified Go backends directly to Ubuntu/Debian bare metal with 8ms cold starts and zero Docker daemons.",
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
      "name": "Guides",
      "item": "https://anode.abhiudayg.dev/guides/deploy-go-without-docker"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Deploy Go to Linux Without Docker",
      "item": "https://anode.abhiudayg.dev/guides/deploy-go-without-docker"
    }
  ]
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deploy a Go Backend to a Linux VPS Without Docker",
  "description": "A comprehensive guide on deploying unmodified Go applications directly to bare-metal systemd with automated TLS and zero container daemons using Anode.",
  "totalTime": "PT3M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Install the Anode CLI",
      "text": "Install Anode on macOS or Linux using Homebrew: brew install abhiudayg/tap/anode",
      "url": "https://anode.abhiudayg.dev/guides/deploy-go-without-docker#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "Inspect Go SSA Call Graph",
      "text": "Run 'anode inspect' in your Go project repository to extract your service topology, database bindings, and lockfile in ~60ms.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-go-without-docker#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "Deploy to Bare-Metal VPS",
      "text": "Run 'anode deploy user@vps-ip' to compile your Go binary, synthesize hardened systemd units with cgroups v2, and provision automated Caddy TLS reverse proxies.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-go-without-docker#step-3"
    }
  ]
};

export default function DeployGoWithoutDockerGuide() {
  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs font-mono-code text-neutral-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
              </li>
              <li><span>/</span></li>
              <li>
                <span className="text-neutral-500">Guides</span>
              </li>
              <li><span>/</span></li>
              <li className="text-cyan-300 font-medium">Deploy Go Without Docker</li>
            </ol>
          </nav>

          {/* Guide Header */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono-code mb-4">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Production Deployment Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              How to Deploy Go to Linux Without Docker
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Go compiles to self-contained static binaries that run natively on Linux. Learn how to deploy directly to Ubuntu, Debian, or Hetzner VPS using systemd, cgroups v2, and automated TLS in under 3 minutes.
            </p>
            <div className="mt-6 flex items-center gap-4 text-xs font-mono-code text-neutral-400 border-t border-white/[0.08] pt-4">
              <span>Updated: Nov 2026</span>
              <span>•</span>
              <span>Read time: 3 min</span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">Verified for Go 1.27+</span>
            </div>
          </header>

          {/* Quick Metrics Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-2xl font-bold text-cyan-400 font-mono-code">8.2 ms</div>
              <div className="text-xs text-neutral-400 mt-1">Cold Boot Time</div>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-2xl font-bold text-purple-400 font-mono-code">4.8 MB</div>
              <div className="text-xs text-neutral-400 mt-1">RAM Footprint</div>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-2xl font-bold text-emerald-400 font-mono-code">Zero</div>
              <div className="text-xs text-neutral-400 mt-1">Container Daemons</div>
            </div>
          </div>

          {/* Step 1 */}
          <section id="step-1" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Install Anode on Your Development Machine
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Anode is available as a standalone pre-compiled binary via Homebrew or a one-line curl installer:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-cyan-300">
              # macOS & Linux via Homebrew<br />
              brew install abhiudayg/tap/anode<br /><br />
              # Or direct installer script<br />
              curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/master/install.sh | bash
            </div>
          </section>

          {/* Step 2 */}
          <section id="step-2" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Inspect Your Go Codebase Topology
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Run <code className="text-cyan-300 bg-white/[0.05] px-1.5 py-0.5 rounded">anode inspect</code> from the root of your Go project. Anode uses compiler-level Static Single Assignment (SSA) to trace call graphs starting at <code>func main()</code>:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300 space-y-1">
              <div className="text-cyan-400">$ anode inspect</div>
              <div className="text-neutral-500">→ Tracing SSA call graphs... (48ms)</div>
              <div className="text-emerald-400">✓ Ingress: POST /v1/orders (:8080)</div>
              <div className="text-emerald-400">✓ Inferred DB: pgx/v5 (PostgreSQL 16)</div>
              <div className="text-purple-300">✓ Synthesized: anode.lock.json (hash: 4f9e2b10)</div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Notice that you did not write a single line of Dockerfile or compose YAML. Anode automatically inferred your database drivers and ingress listeners.
            </p>
          </section>

          {/* Step 3 */}
          <section id="step-3" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Deploy to Your Linux VPS in One Command
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Deploy your binary directly to any bare-metal Linux server (Hetzner, DigitalOcean, OVH, AWS EC2) over SSH:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-cyan-300">
              $ anode deploy user@your-server-ip.com
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Anode performs the following zero-friction operations automatically:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Compiles the standalone static Go binary for the target architecture (AMD64 / ARM64).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Writes a production systemd service with <code>DynamicUser=yes</code> and cgroups v2 memory limits.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Configures automated Caddy reverse proxying with auto-renewing Let&apos;s Encrypt TLS certificates.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Performs zero-downtime rolling restart via systemd socket activation.</span>
              </li>
            </ul>
          </section>

          {/* Bottom Navigation & CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.08] bg-[#0c0e14] text-center">
            <h3 className="text-xl font-bold text-white mb-2">Next Steps</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Compare Anode head-to-head with Docker Compose or explore the full CLI specification.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/vs/docker-compose"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono-code text-white transition-all"
              >
                <span>Docker Compose vs Anode</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
              <Link
                href="/docs#overview"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono-code font-bold transition-all"
              >
                <span>Architecture Deep Dive</span>
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
