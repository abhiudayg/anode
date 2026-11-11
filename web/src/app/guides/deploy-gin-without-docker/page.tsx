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
  Lock,
  Sparkles
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deploy Gin Framework to Linux VPS Without Docker | Anode",
  description:
    "Complete tutorial on deploying a high-performance Gin (gin-gonic) Go REST API directly to a Linux VPS with systemd, cgroups v2, and automated Caddy TLS.",
  alternates: {
    canonical: "/guides/deploy-gin-without-docker",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/guides/deploy-gin-without-docker",
    title: "Deploy Gin Framework to Linux VPS Without Docker | Anode",
    description:
      "Run your Gin Go REST API natively on Linux bare metal with 8ms cold starts and zero Docker container daemons.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deploy Gin to Linux Without Docker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Gin Framework to Linux VPS Without Docker | Anode",
    description:
      "Run your Gin Go REST API natively on Linux bare metal with 8ms cold starts.",
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
      "item": "https://anode.abhiudayg.dev/guides/deploy-gin-without-docker"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Deploy Gin Without Docker",
      "item": "https://anode.abhiudayg.dev/guides/deploy-gin-without-docker"
    }
  ]
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deploy a Gin (gin-gonic) Go App to Linux Without Docker",
  "description": "Step-by-step instructions to compile and run a Gin REST API directly on Linux systemd with automated TLS and cgroups v2 sandboxing using Anode.",
  "totalTime": "PT3M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Write standard Gin handlers",
      "text": "Initialize gin.Default() and bind routes using standard gin-gonic API handlers.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-gin-without-docker#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "Inspect SSA Call Graph",
      "text": "Run 'anode inspect' locally to resolve Gin ingress routes and synthesis lockfile in ~60ms.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-gin-without-docker#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "Deploy to Bare-Metal VPS",
      "text": "Run 'anode deploy user@vps-ip' to provision systemd units, cgroups v2 quotas, and Caddy TLS.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-gin-without-docker#step-3"
    }
  ]
};

export default function DeployGinGuide() {
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
              <li className="text-cyan-300 font-medium">Deploy Gin Without Docker</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono-code mb-4">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Framework Deployment Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deploy Gin (Go) to a Linux VPS Without Docker
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Gin is one of the fastest HTTP web frameworks in Go. Wrapping it in Docker adds 200MB of daemon memory overhead and slows cold starts from 8ms to 450ms. Here is how to run Gin natively on Linux bare metal with automated systemd and HTTPS.
            </p>
          </header>

          {/* Efficiency Metric Callout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-xs font-mono-code text-neutral-400">Cold Boot Latency</div>
              <div className="text-xl font-bold text-cyan-300 font-mono-code mt-1">8.2 ms</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">vs ~450ms Docker containerd</div>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-xs font-mono-code text-neutral-400">Idle RAM Footprint</div>
              <div className="text-xl font-bold text-emerald-400 font-mono-code mt-1">4.8 MB</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">vs 186MB+ container overhead</div>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0c0e14]">
              <div className="text-xs font-mono-code text-neutral-400">Port Conflicts</div>
              <div className="text-xl font-bold text-purple-300 font-mono-code mt-1">0% Clashes</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Dynamic loopback proxying</div>
            </div>
          </div>

          {/* Step 1: Write Gin App */}
          <section id="step-1" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Standard Gin Application Code
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Write standard Gin handlers without any proprietary vendor wrappers. Anode uses compiler-backed Static Single Assignment (SSA) to resolve routes directly from the AST:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300 leading-relaxed overflow-x-auto">
              <span className="text-purple-400">package</span> main<br /><br />
              <span className="text-purple-400">import</span> (<br />
              &nbsp;&nbsp;<span className="text-cyan-400">&quot;net/http&quot;</span><br />
              &nbsp;&nbsp;<span className="text-cyan-400">&quot;os&quot;</span><br />
              &nbsp;&nbsp;<span className="text-cyan-400">&quot;github.com/gin-gonic/gin&quot;</span><br />
              )<br /><br />
              <span className="text-purple-400">func</span> <span className="text-cyan-300">main</span>() &#123;<br />
              &nbsp;&nbsp;gin.SetMode(gin.ReleaseMode)<br />
              &nbsp;&nbsp;r := gin.Default()<br /><br />
              &nbsp;&nbsp;r.GET(<span className="text-emerald-400">&quot;/health&quot;</span>, <span className="text-purple-400">func</span>(c *gin.Context) &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;c.JSON(http.StatusOK, gin.H&#123;<span className="text-emerald-400">&quot;status&quot;</span>: <span className="text-emerald-400">&quot;healthy&quot;</span>, <span className="text-emerald-400">&quot;runtime&quot;</span>: <span className="text-emerald-400">&quot;bare-metal systemd&quot;</span>&#125;)<br />
              &nbsp;&nbsp;&#125;)<br /><br />
              &nbsp;&nbsp;port := os.Getenv(<span className="text-emerald-400">&quot;PORT&quot;</span>)<br />
              &nbsp;&nbsp;<span className="text-purple-400">if</span> port == <span className="text-emerald-400">&quot;&quot;</span> &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;port = <span className="text-emerald-400">&quot;8080&quot;</span><br />
              &nbsp;&nbsp;&#125;<br />
              &nbsp;&nbsp;r.Run(<span className="text-emerald-400">&quot;:&quot;</span> + port)<br />
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
                Inspect Gin Routes via SSA AST Sweep
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Run <code className="text-cyan-300 bg-white/[0.05] px-1.5 py-0.5 rounded">anode inspect</code>. Anode traces Gin handlers starting from <code className="text-neutral-300">func main()</code> and synthesizes an immutable lockfile in ~60ms:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300">
              $ anode inspect .<br />
              <span className="text-emerald-400">✔ SSA AST Resolved in 54ms</span><br />
              <span className="text-cyan-400">✔ Detected Router: gin-gonic/gin (GET /health)</span><br />
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
                Deploy to Linux VPS via Systemd
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Deploy directly over SSH with zero Docker dependencies:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-cyan-300">
              $ anode deploy user@your-vps.com --domain api.example.com
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Anode cross-compiles your Gin binary for Linux AMD64/ARM64, generates a hardened systemd unit file with <code className="text-neutral-300">DynamicUser=yes</code> and cgroups v2 resource quotas, and provisions Caddy automated TLS.
            </p>
          </section>

          {/* Systemd Unit Preview */}
          <section className="mb-12 p-6 rounded-2xl border border-white/[0.08] bg-[#0c0e14]">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Generated Production Systemd Unit</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Written automatically to <code className="text-neutral-300">/etc/systemd/system/gin-api.service</code>:
            </p>
            <div className="p-4 rounded-xl bg-black/70 border border-white/[0.06] font-mono-code text-xs text-neutral-300 overflow-x-auto">
              [Unit]<br />
              Description=gin-api - Anode Bare-Metal Service<br />
              After=network.target<br /><br />
              [Service]<br />
              Type=simple<br />
              DynamicUser=yes<br />
              ExecStart=/usr/local/bin/gin-api<br />
              Restart=always<br />
              ProtectSystem=strict<br />
              ProtectHome=yes<br />
              NoNewPrivileges=yes<br />
              CPUQuota=200%<br />
              MemoryMax=512M<br /><br />
              [Install]<br />
              WantedBy=multi-user.target
            </div>
          </section>

          {/* CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.08] bg-[#0c0e14] text-center">
            <h3 className="text-xl font-bold text-white mb-2">Deploy Your Gin App to Bare Metal</h3>
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
