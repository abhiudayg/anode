import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Check, 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Server, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  FileCode2,
  Lock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deploy Fiber Framework to Linux VPS Without Docker | Anode",
  description:
    "Complete guide to deploying a high-throughput Go Fiber (gofiber/fiber) REST API directly to a Linux VPS with bare-metal systemd, cgroups v2, and automated TLS.",
  alternates: {
    canonical: "/guides/deploy-fiber-without-docker",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/guides/deploy-fiber-without-docker",
    title: "Deploy Fiber Framework to Linux VPS Without Docker | Anode",
    description:
      "Run your Go Fiber backend directly on Linux bare metal with 8ms cold starts and zero container overhead.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deploy Fiber Framework to Linux Without Docker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Fiber Framework to Linux VPS Without Docker | Anode",
    description:
      "Run your Go Fiber backend directly on Linux bare metal with 8ms cold starts.",
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
      "item": "https://anode.abhiudayg.dev/guides/deploy-fiber-without-docker"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Deploy Fiber Without Docker",
      "item": "https://anode.abhiudayg.dev/guides/deploy-fiber-without-docker"
    }
  ]
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deploy a Fiber Go Backend to Linux Without Docker",
  "description": "Step-by-step instructions to compile and deploy a Go Fiber application directly to Linux systemd with automated TLS using Anode.",
  "totalTime": "PT3M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Write standard Fiber app code",
      "text": "Initialize fiber.New() and register route handlers.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-fiber-without-docker#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "Inspect SSA Call Graph",
      "text": "Run 'anode inspect' to auto-detect routes and synthesize an immutable lockfile.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-fiber-without-docker#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "Deploy to Bare-Metal VPS",
      "text": "Run 'anode deploy user@vps-ip' to provision systemd units, cgroups v2 quotas, and Caddy TLS.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-fiber-without-docker#step-3"
    }
  ]
};

export default function DeployFiberGuide() {
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
              <li className="text-cyan-300 font-medium">Deploy Fiber Without Docker</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono-code mb-4">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fasthttp Router Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deploy Fiber (Go) to a Linux VPS Without Docker
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Fiber is built on Fasthttp for extreme raw throughput with zero memory allocation. Running Fiber inside a heavy Docker container undermines its performance. Anode deploys Fiber directly to bare-metal systemd with 8ms cold starts and 4.8MB RAM footprint.
            </p>
          </header>

          {/* Step 1: Write Fiber Code */}
          <section id="step-1" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Standard Fiber Application Code
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Write standard Fiber handlers using <code className="text-neutral-300">fiber.New()</code>:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300 leading-relaxed overflow-x-auto">
              <span className="text-purple-400">package</span> main<br /><br />
              <span className="text-purple-400">import</span> (<br />
              &nbsp;&nbsp;<span className="text-cyan-400">&quot;os&quot;</span><br />
              &nbsp;&nbsp;<span className="text-cyan-400">&quot;github.com/gofiber/fiber/v2&quot;</span><br />
              )<br /><br />
              <span className="text-purple-400">func</span> <span className="text-cyan-300">main</span>() &#123;<br />
              &nbsp;&nbsp;app := fiber.New()<br /><br />
              &nbsp;&nbsp;app.Get(<span className="text-emerald-400">&quot;/&quot;</span>, <span className="text-purple-400">func</span>(c *fiber.Ctx) error &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> c.JSON(fiber.Map&#123;<span className="text-emerald-400">&quot;status&quot;</span>: <span className="text-emerald-400">&quot;ok&quot;</span>, <span className="text-emerald-400">&quot;engine&quot;</span>: <span className="text-emerald-400">&quot;fiber-baremetal&quot;</span>&#125;)<br />
              &nbsp;&nbsp;&#125;)<br /><br />
              &nbsp;&nbsp;port := os.Getenv(<span className="text-emerald-400">&quot;PORT&quot;</span>)<br />
              &nbsp;&nbsp;<span className="text-purple-400">if</span> port == <span className="text-emerald-400">&quot;&quot;</span> &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;port = <span className="text-emerald-400">&quot;8080&quot;</span><br />
              &nbsp;&nbsp;&#125;<br />
              &nbsp;&nbsp;app.Listen(<span className="text-emerald-400">&quot;:&quot;</span> + port)<br />
              &#125;
            </div>
          </section>

          {/* Step 2: Anode SSA Analysis */}
          <section id="step-2" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Inspect SSA Topology
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Run <code className="text-cyan-300 bg-white/[0.05] px-1.5 py-0.5 rounded">anode inspect</code>. Anode traces Fiber routes directly into an immutable lockfile:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300">
              $ anode inspect .<br />
              <span className="text-emerald-400">✔ SSA AST Resolved in 51ms</span><br />
              <span className="text-cyan-400">✔ Detected Router: gofiber/fiber/v2 (GET /)</span><br />
              <span className="text-purple-400">✔ Port Binding: :PORT env choke point (default 8080)</span><br />
              <span className="text-emerald-400">✔ Emitted immutable contract: anode.lock.json</span>
            </div>
          </section>

          {/* Step 3: Deploy to VPS */}
          <section id="step-3" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Deploy Over SSH in One Step
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Deploy directly to your server:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-cyan-300">
              $ anode deploy user@your-vps.com --domain fiber.example.com
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Anode cross-compiles your Fiber binary, generates a hardened systemd unit file with least-privilege user sandboxing (<code className="text-neutral-300">DynamicUser=yes</code>), configures cgroups v2 resource quotas, and provisions Caddy automated TLS.
            </p>
          </section>

          {/* CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.08] bg-[#0c0e14] text-center">
            <h3 className="text-xl font-bold text-white mb-2">Deploy Your Fiber App to Bare Metal</h3>
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
