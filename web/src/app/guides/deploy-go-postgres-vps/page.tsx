import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { 
  Database, 
  ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Deploy Go + PostgreSQL Without Docker",
  description:
    "Deploy a Go REST API with PostgreSQL to a bare-metal Linux VPS using Anode. No container runtime, and automated systemd isolation.",
  alternates: {
    canonical: "/guides/deploy-go-postgres-vps",
  },
  openGraph: {
    type: "article",
    url: "https://anode.abhiudayg.dev/guides/deploy-go-postgres-vps",
    title: "Deploy Go + PostgreSQL Without Docker",
    description:
      "Run your Go backend and PostgreSQL natively on bare metal with zero Docker container overhead and automated systemd management.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Deploy Go and PostgreSQL with Anode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Go + PostgreSQL Without Docker",
    description:
      "Run your Go backend and PostgreSQL natively on bare metal with zero Docker container overhead.",
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
      "item": "https://anode.abhiudayg.dev/guides/deploy-go-postgres-vps"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Go + PostgreSQL on Bare-Metal VPS",
      "item": "https://anode.abhiudayg.dev/guides/deploy-go-postgres-vps"
    }
  ]
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Deploy a Go Application with PostgreSQL to a Linux VPS Without Docker",
  "description": "Step-by-step instructions to connect Go to PostgreSQL and deploy natively to Linux VPS using Anode bare-metal orchestration.",
  "totalTime": "PT4M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Connect Go to PostgreSQL via standard pgx",
      "text": "Use standard database/sql or pgx/v5 in your Go code reading DATABASE_URL from the environment.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-go-postgres-vps#step-1"
    },
    {
      "@type": "HowToStep",
      "name": "Run Anode Inspection",
      "text": "Run 'anode inspect' locally to detect database handles and infer service topology automatically.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-go-postgres-vps#step-2"
    },
    {
      "@type": "HowToStep",
      "name": "Deploy to Linux VPS",
      "text": "Run 'anode deploy user@vps-ip' to provision least-privilege PostgreSQL credentials and start your service with systemd and Caddy TLS.",
      "url": "https://anode.abhiudayg.dev/guides/deploy-go-postgres-vps#step-3"
    }
  ]
};

export default function DeployGoPostgresPage() {
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
                <span className="text-neutral-500">Guides</span>
              </li>
              <li><span>/</span></li>
              <li className="text-neutral-200 font-medium">Go + PostgreSQL on VPS</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.12] bg-white/[0.04] text-neutral-200 text-xs font-mono-code mb-4">
              <Database className="w-3.5 h-3.5 text-white" />
              <span>Fullstack Database Guide</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deploy Go + PostgreSQL to a Linux VPS Without Docker
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-400 leading-relaxed">
              Learn how to build, bind, and deploy a Go REST service backed by PostgreSQL directly to an Ubuntu or Debian VPS using compiler-backed SSA orchestration.
            </p>
          </header>

          {/* Step 1: Standard Go Code */}
          <section id="step-1" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Write Standard Go with pgx or database/sql
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              You do NOT need any proprietary SDKs. Use standard <code>pgx/v5</code> or <code>database/sql</code>:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300 leading-relaxed overflow-x-auto">
              <span className="text-white">package</span> main<br /><br />
              <span className="text-white">import</span> (<br />
              &nbsp;&nbsp;<span className="text-white">&quot;context&quot;</span><br />
              &nbsp;&nbsp;<span className="text-white">&quot;net/http&quot;</span><br />
              &nbsp;&nbsp;<span className="text-white">&quot;os&quot;</span><br />
              &nbsp;&nbsp;<span className="text-white">&quot;github.com/jackc/pgx/v5/pgxpool&quot;</span><br />
              )<br /><br />
              <span className="text-white">func</span> <span className="text-neutral-200">main</span>() &#123;<br />
              &nbsp;&nbsp;ctx := context.Background()<br />
              &nbsp;&nbsp;db, _ := pgxpool.New(ctx, os.Getenv(<span className="text-emerald-400">&quot;DATABASE_URL&quot;</span>))<br />
              &nbsp;&nbsp;<span className="text-white">defer</span> db.Close()<br /><br />
              &nbsp;&nbsp;http.HandleFunc(<span className="text-emerald-400">&quot;/users&quot;</span>, <span className="text-white">func</span>(w http.ResponseWriter, r *http.Request) &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;w.Write([]<span className="text-white">byte</span>(<span className="text-emerald-400">&quot;&#123;\&quot;status\&quot;:\&quot;connected\&quot;&#125;&quot;</span>))<br />
              &nbsp;&nbsp;&#125;)<br /><br />
              &nbsp;&nbsp;http.ListenAndServe(<span className="text-emerald-400">&quot;:8080&quot;</span>, <span className="text-white">nil</span>)<br />
              &#125;
            </div>
          </section>

          {/* Step 2: Anode SSA Analysis */}
          <section id="step-2" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Inspect SSA Topology (Free local ports)
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Run <code className="text-neutral-200 bg-white/[0.05] px-1.5 py-0.5 rounded">anode dev</code> to start local development. Anode allocates an ephemeral ephemeral local port proxy for PostgreSQL so port 5432 is never blocked by other projects:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-300">
              $ anode dev<br />
              <span className="text-emerald-400">✔ SSA AST Resolved</span><br />
              <span className="text-white">✔ Detected Database Driver: PostgreSQL (pgx/v5)</span><br />
              <span className="text-white">✔ Dynamic Loopback Assigned: 127.0.0.1:5432 (isolated virtual socket)</span><br />
              <span className="text-emerald-400">✔ Listening: http://localhost:8080</span>
            </div>
          </section>

          {/* Step 3: Production Deployment */}
          <section id="step-3" className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.12] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Deploy to Your Production VPS in One Step
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              Deploy directly to your server over SSH:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono-code text-xs text-neutral-200">
              $ anode deploy user@your-vps.com
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              Anode automatically creates a least-privilege PostgreSQL user via its pluggable catalog, compiles your Go binary for Linux AMD64/ARM64, generates a hardened systemd unit file with cgroups v2 resource quotas, and provisions Caddy automated TLS.
            </p>
          </section>

          {/* CTA */}
          <div className="mt-16 p-8 rounded-2xl border border-white/[0.08] bg-[#0a0a0c] text-center">
            <h3 className="text-xl font-bold text-white mb-2">Build Your Next Go Backend</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Install the Anode CLI and run your first bare-metal deployment in seconds.
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
