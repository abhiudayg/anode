"use client";

import Link from "next/link";
import { Layers, BookOpen, Newspaper, ExternalLink, Terminal, FileCode2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { GithubIcon } from "./Icons";

export function Footer() {
  return (
    <footer id="footer" className="border-t border-white/[0.08] bg-[#000000] pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Pre-Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="py-24 text-center border-b border-white/[0.08]"
        >
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-5">
            Start with Anode.
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Unmodified Go code directly onto bare-metal Linux. Zero Docker daemon, zero Kubernetes YAML.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/docs"
              className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-neutral-200 text-sm font-semibold transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Read the docs →
            </Link>
          </div>
        </motion.div>

        {/* Main Grid: 5 Clean Responsive Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-6 py-12 border-b border-white/[0.06]">
          {/* Col 1: Brand & Topology */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
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
                <Link href="/guides/deploy-go-without-docker" className="hover:text-white transition-colors">
                  Deploy Go Without Docker
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-gin-without-docker" className="hover:text-white transition-colors">
                  Deploy Gin API (Systemd)
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-chi-without-docker" className="hover:text-white transition-colors">
                  Deploy Chi Router
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-fiber-without-docker" className="hover:text-white transition-colors">
                  Deploy Fiber
                </Link>
              </li>
              <li>
                <Link href="/guides/deploy-go-postgres-vps" className="hover:text-white transition-colors">
                  Go + PostgreSQL on VPS
                </Link>
              </li>
              <li>
                <Link href="/deploy/hetzner-vps" className="hover:text-white transition-colors">
                  Hetzner VPS Guide
                </Link>
              </li>
              <li>
                <Link href="/deploy/digitalocean-droplet" className="hover:text-white transition-colors">
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
                <Link href="/vs/docker-compose" className="hover:text-white transition-colors">
                  Docker Compose vs Anode
                </Link>
              </li>
              <li>
                <Link href="/vs/systemd" className="hover:text-white transition-colors">
                  Raw Systemd vs Anode
                </Link>
              </li>
              <li>
                <Link href="/docs#overview" className="hover:text-white transition-colors">
                  Architecture Deep Dive
                </Link>
              </li>
              <li>
                <Link href="/docs#tradeoffs" className="hover:text-white transition-colors">
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
                <Link href="/tools/ssa-visualizer" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>SSA Call Graph Visualizer</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.08] text-neutral-300 ml-auto font-mono-code">New</span>
                </Link>
              </li>
              <li>
                <Link href="/tools/compose-to-systemd" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Compose to Systemd</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.08] text-neutral-300 ml-auto font-mono-code">Free</span>
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  <span>CLI &amp; API Reference</span>
                </Link>
              </li>
              <li>
                <Link href="/docs#quickstart" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Quickstart Tutorial</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/abhiudayg/anode/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>GitHub Releases</span>
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
                <Link href="/changelog" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Changelog &amp; Releases</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Engineering Blog</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/abhiudayg/anode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
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
                  className="hover:text-white font-mono-code text-[11px] transition-colors flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>/llms.txt</span>
                </a>
              </li>
              <li>
                <a
                  href="/llms-full.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white font-mono-code text-[11px] transition-colors flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>/llms-full.txt</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-mono-code">
          <div>
            © 2026 Anode. Open source under Apache 2.0 license.
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-neutral-300 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Compiled with Go 1.27+ SSA • Bare-Metal Linux Native</span>
          </div>
        </div>

        {/* Giant Watermark Logo */}
        <div id="watermark" className="pt-20 pb-4 overflow-hidden select-none pointer-events-none text-center">
          <span className="text-[130px] sm:text-[190px] lg:text-[250px] font-black tracking-tighter bg-gradient-to-b from-white/[0.22] via-white/[0.09] to-white/[0.02] bg-clip-text text-transparent leading-none block font-sans">
            Anode
          </span>
        </div>
      </div>
    </footer>
  );
}
