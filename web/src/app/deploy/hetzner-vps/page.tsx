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
  title: "Deploy Go to Hetzner Cloud Without Docker",
  description:
    "Complete guide to deploying Go microservices to Hetzner Cloud Linux VPS using bare-metal systemd and automated TLS. 10x cheaper and faster than Kubernetes.",
  alternates: {
    canonical: "/deploy/hetzner-vps",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/deploy/hetzner-vps",
    title: "Deploy Go to Hetzner Cloud Without Docker",
    description:
      "Run unmodified Go backends on Hetzner VPS instances without a container runtime.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deploy Go to Hetzner Cloud with Anode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Go to Hetzner Cloud Without Docker",
    description:
      "Run unmodified Go backends on Hetzner VPS instances without a container runtime.",
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
      "item": "https://anode.abhiudayg.dev/deploy/hetzner-vps"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Hetzner Cloud VPS",
      "item": "https://anode.abhiudayg.dev/deploy/hetzner-vps"
    }
  ]
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deploy a Go Backend to Hetzner Cloud VPS Without Docker",
  "description": "Step-by-step instructions to deploy unmodified Go applications directly to Hetzner Cloud servers using Anode bare-metal systemd orchestration.",
  "totalTime": "PT4M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Spin up a Hetzner Cloud Server",
      "text": "Create an Ubuntu 24.04 or Debian 12 server on Hetzner Cloud (a 2 vCPU, 4 GB server) and add your SSH public key.",
      "url": "https://anode.abhiudayg.dev/deploy/hetzner-vps#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "Install Anode CLI",
      "text": "Install Anode on your local workstation via Homebrew: brew install abhiudayg/tap/anode",
      "url": "https://anode.abhiudayg.dev/deploy/hetzner-vps#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "Deploy Over SSH",
      "text": "Run 'anode deploy root@your-hetzner-ip' to compile, sync, synthesize systemd units, and configure automated Caddy HTTPS reverse proxying.",
      "url": "https://anode.abhiudayg.dev/deploy/hetzner-vps#step-3"
    }
  ]
};

export default function HetznerDeployPage() {
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
              <li className="text-neutral-200 font-medium">Hetzner Cloud VPS</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.12] bg-white/[0.04] text-neutral-200 text-xs font-mono-code mb-4">
              <Server className="w-3.5 h-3.5 text-white" />
              <span>Hetzner Cloud Deployment Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deploy Go Backends to Hetzner VPS Without Docker
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              A 2 vCPU, 4 GB Hetzner Cloud server can run a Go backend without a container runtime. Here is how to deploy one with Anode.
            </p>
          </header>

          {/* Cost Comparison Callout */}
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 mb-14">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-mono-code uppercase text-emerald-400 font-bold tracking-wider">
                  Cost &amp; Efficiency Breakdown
                </div>
                <div className="text-xl font-bold text-white mt-1">
                  Hetzner Bare-Metal vs Managed Kubernetes
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono-code">
                2 vCPU · 4 GB <span className="text-xs font-normal text-neutral-400">Hetzner Cloud VPS</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              Kubernetes nodes run control-plane components (kubelet, coredns, containerd) next to your workloads. Anode installs no control plane on the host, so each service runs under systemd by itself.
            </p>
          </div>

          {/* Step 1 */}
          <section id="step-1" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Launch an Ubuntu 24.04 Server on Hetzner
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Open the Hetzner Cloud Console and create a new server:
            </p>
            <ul className="space-y-2 text-sm text-neutral-300 mb-4">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-white mt-0.5" />
                <span><strong>Server Type:</strong> any Hetzner Cloud server with 2 vCPU and 2 GB RAM or more, such as CPX11.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-white mt-0.5" />
                <span><strong>OS:</strong> Ubuntu 24.04 LTS (AMD64 or ARM64) or Debian 12.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-white mt-0.5" />
                <span><strong>SSH Key:</strong> Add your local public key (<code>~/.ssh/id_ed25519.pub</code>).</span>
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
                Inspect Local Architecture with Anode
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              In your Go project folder, run <code className="text-neutral-200 bg-white/[0.05] px-1.5 py-0.5 rounded">anode inspect</code>:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300">
              $ anode inspect<br />
              <span className="text-neutral-500">→ SSA static sweep: done</span><br />
              <span className="text-emerald-400">✓ Ingress: POST /orders (:8080)</span><br />
              <span className="text-white">✓ Inferred Drivers: pgx/v5 (Postgres)</span>
            </div>
          </section>

          {/* Step 3 */}
          <section id="step-3" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                One-Command Deployment to Hetzner
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Deploy directly to your Hetzner server over SSH:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-200">
              $ anode deploy root@&lt;YOUR_HETZNER_IP&gt;
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Anode automatically compiles your Go binary, establishes a hardened systemd unit with cgroups v2 resource limits, configures Caddy reverse proxying with automatic SSL, and starts the service.
            </p>
          </section>

          {/* Bottom CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to Deploy?</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Install Anode via Homebrew and deploy your Go microservice to Hetzner today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="px-4 py-2 rounded-xl bg-black/60 border border-white/[0.1] font-mono-code text-xs text-neutral-200">
                brew install abhiudayg/tap/anode
              </div>
              <Link
                href="/vs/docker-compose"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs font-mono-code font-bold transition-all"
              >
                <span>Compare vs Docker Compose</span>
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
