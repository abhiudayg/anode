import Link from "next/link";
import { Layers, BookOpen, Newspaper, ExternalLink, Terminal, FileCode2, Sparkles, Server, GitCompare, Database } from "lucide-react";
import { GithubIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: 5 Clean Responsive Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-6 pb-12 border-b border-white/[0.06]">
          {/* Col 1: Brand & Topology */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">Anode</span>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Proof-of-Topology bare-metal orchestrator for unmodified Go backends. Zero Docker, zero Kubernetes.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono-code text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4-Pillar Topology Verified</span>
            </div>
          </div>

          {/* Col 2: Guides & Tutorials */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Guides
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/guides/deploy-go-without-docker" className="hover:text-cyan-400 transition-colors">
                  Deploy Go Without Docker
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-gin-without-docker" className="hover:text-cyan-400 transition-colors">
                  Deploy Gin API (Systemd)
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-chi-without-docker" className="hover:text-cyan-400 transition-colors">
                  Deploy Chi Router
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-fiber-without-docker" className="hover:text-cyan-400 transition-colors">
                  Deploy Fiber (8ms Boot)
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-go-postgres-vps" className="hover:text-cyan-400 transition-colors">
                  Go + PostgreSQL on VPS
                </Link>
              </li>
              <li>
                <Link href="/deploy/hetzner-vps" className="hover:text-cyan-400 transition-colors">
                  Hetzner VPS Guide
                </Link>
              </li>
              <li>
                <Link href="/deploy/digitalocean-droplet" className="hover:text-cyan-400 transition-colors">
                  DigitalOcean Droplet Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Comparisons */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Comparisons
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/vs/docker-compose" className="hover:text-cyan-400 transition-colors">
                  Docker Compose vs Anode
                </Link>
              </li>
              <li>
                <Link href="/vs/systemd" className="hover:text-cyan-400 transition-colors">
                  Raw Systemd vs Anode
                </Link>
              </li>
              <li>
                <Link href="/docs#overview" className="hover:text-cyan-400 transition-colors">
                  Architecture Deep Dive
                </Link>
              </li>
              <li>
                <Link href="/docs#tradeoffs" className="hover:text-cyan-400 transition-colors">
                  Honest Tradeoffs &amp; Limits
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Developer Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Developer Tools
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/tools/compose-to-systemd" className="hover:text-amber-300 text-amber-400 font-medium transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compose to Systemd</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 ml-auto">Free</span>
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-500/70" />
                  <span>CLI &amp; API Reference</span>
                </Link>
              </li>
              <li>
                <Link href="/docs#quickstart" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-500/70" />
                  <span>Quickstart Tutorial</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/abhiudayg/homebrew-tap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Homebrew Tap</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500 ml-auto" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Ecosystem & Context */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Context &amp; Specs
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/blog" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-purple-400/70" />
                  <span>Benchmark Matrix</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/abhiudayg/anode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <GithubIcon className="w-3.5 h-3.5 text-neutral-400" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500 ml-auto" />
                </a>
              </li>
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 font-mono-code text-[11px] transition-colors flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>/llms.txt</span>
                </a>
              </li>
              <li>
                <a
                  href="/llms-full.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 font-mono-code text-[11px] transition-colors flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>/llms-full.txt</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono-code">
          <div>
            © 2026 Anode. Open source under Apache 2.0 license.
          </div>
          <div>
            Compiled with Go 1.22+ SSA • Bare-Metal Linux Native
          </div>
        </div>
      </div>
    </footer>
  );
}
