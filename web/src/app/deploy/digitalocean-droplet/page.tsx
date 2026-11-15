import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Server, 
  Check, 
  ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deploy Go to DigitalOcean Without Docker",
  description:
    "Deploy Go microservices to DigitalOcean Droplets with bare-metal systemd execution and automated Let's Encrypt TLS.",
  alternates: {
    canonical: "/deploy/digitalocean-droplet",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/deploy/digitalocean-droplet",
    title: "Deploy Go to DigitalOcean Without Docker",
    description:
      "Run unmodified Go backends on DigitalOcean Droplets without container daemons.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deploy Go to DigitalOcean with Anode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Go to DigitalOcean Without Docker",
    description:
      "Run unmodified Go backends on DigitalOcean Droplets without container daemons.",
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
      "name": "Deploy Guides",
      "item": "https://anode.abhiudayg.dev/deploy/digitalocean-droplet"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "DigitalOcean Droplets",
      "item": "https://anode.abhiudayg.dev/deploy/digitalocean-droplet"
    }
  ]
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deploy a Go Backend to a DigitalOcean Droplet Without Docker",
  "description": "Step-by-step instructions to deploy unmodified Go applications directly to DigitalOcean Droplets using Anode bare-metal systemd orchestration.",
  "totalTime": "PT3M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Create a DigitalOcean Droplet",
      "text": "Spin up a Droplet running Ubuntu 24.04 LTS and add your SSH key.",
      "url": "https://anode.abhiudayg.dev/deploy/digitalocean-droplet#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "Inspect Codebase",
      "text": "Run 'anode inspect' locally to extract SSA topology and synthesize an immutable anode.lock.json contract.",
      "url": "https://anode.abhiudayg.dev/deploy/digitalocean-droplet#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "One-Line Deploy",
      "text": "Run 'anode deploy root@droplet-ip' to compile, sync, and activate systemd service with automated TLS.",
      "url": "https://anode.abhiudayg.dev/deploy/digitalocean-droplet#step-3"
    }
  ]
};

export default function DigitalOceanDeployPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 selection:text-white relative bg-grid-pattern">
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
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li><span>/</span></li>
              <li>
                <span className="text-neutral-500">Deploy Guides</span>
              </li>
              <li><span>/</span></li>
              <li className="text-neutral-200 font-medium">DigitalOcean Droplet</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.12] bg-white/[0.04] text-neutral-200 text-xs font-mono-code mb-4">
              <Server className="w-3.5 h-3.5 text-white" />
              <span>DigitalOcean Droplet Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deploy Go Backends to DigitalOcean Without Docker
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Run your Go APIs natively on DigitalOcean Droplets. Skip the Docker daemon, avoid fixed-port collisions, and let systemd supervise each service.
            </p>
          </header>

          {/* Step 1 */}
          <section id="step-1" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Create a Basic Droplet
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              In your DigitalOcean dashboard, launch a standard Droplet:
            </p>
            <ul className="space-y-2 text-sm text-neutral-300 mb-4">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-white mt-0.5" />
                <span><strong>Plan:</strong> any Droplet running Linux with systemd.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-white mt-0.5" />
                <span><strong>Distribution:</strong> Ubuntu 24.04 (LTS) x64.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-white mt-0.5" />
                <span><strong>Authentication:</strong> SSH Key.</span>
              </li>
            </ul>
          </section>

          {/* Step 2 */}
          <section id="step-2" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Verify Go AST Architecture
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Run <code className="text-neutral-200 bg-white/[0.05] px-1.5 py-0.5 rounded">anode inspect</code> locally:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300">
              $ anode inspect<br />
              <span className="text-emerald-400">✓ Ingress: GET /health, POST /v1/checkout</span><br />
              <span className="text-white">✓ Inferred Drivers: redis-go (Cache), pgx/v5 (Database)</span>
            </div>
          </section>

          {/* Step 3 */}
          <section id="step-3" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Deploy in One Step
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Execute deployment directly to your Droplet IP address:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-200">
              $ anode deploy root@&lt;YOUR_DROPLET_IP&gt;
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Your Go backend is instantly deployed with hardened systemd isolation, cgroups v2 resource limits, and automated Caddy TLS reverse proxying.
            </p>
          </section>

          {/* Bottom CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] text-center">
            <h3 className="text-xl font-bold text-white mb-2">Get Started in Seconds</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Install the Anode CLI via Homebrew on macOS or Linux.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/[0.1] font-mono-code text-xs text-neutral-200">
                brew install abhiudayg/tap/anode
              </div>
              <Link
                href="/docs#quickstart"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs font-mono-code font-bold transition-all"
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
