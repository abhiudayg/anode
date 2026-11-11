import Link from "next/link";
import { Layers, BookOpen, Newspaper, ExternalLink, Terminal, FileCode2 } from "lucide-react";
import { GithubIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: 4 Clean Responsive Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-white/[0.06]">
          {/* Col 1: Brand & Verified Pill */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Layers className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">Anode</span>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Proof-of-Topology bare-metal orchestrator for unmodified Go backends. Zero Docker, zero Kubernetes.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono-code text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4-Pillar Topology Verified</span>
            </div>
          </div>

          {/* Col 2: Documentation & Guides */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Documentation
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400">
              <li>
                <Link href="/docs" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-500/70" />
                  <span>Overview & CLI</span>
                </Link>
              </li>
              <li>
                <Link href="/docs#quickstart" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-500/70" />
                  <span>Quickstart</span>
                </Link>
              </li>
              <li>
                <Link href="/docs#overview" className="hover:text-cyan-400 transition-colors">
                  Architecture Deep Dive
                </Link>
              </li>
              <li>
                <Link href="/docs#tradeoffs" className="hover:text-cyan-400 transition-colors">
                  Tradeoffs & Limits
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Research & Code */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Research & Code
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400">
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
                  href="https://github.com/abhiudayg/homebrew-tap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Homebrew Tap</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500 ml-auto" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhiudayg/anode/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <span>v1.0.0 Release Notes</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500 ml-auto" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: For Agents & Launch Directory */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 font-mono-code mb-4">
              Machine Context & Launch
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400 font-mono-code">
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
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
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>/llms-full.txt</span>
                </a>
              </li>
            </ul>

            {/* LaunchRanked Badge */}
            <div className="pt-2">
              <a
                href="https://launchranked.com/products/site/anode.abhiudayg.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform duration-200 hover:scale-[1.02]"
              >
                <img
                  src="https://launchranked.com/badge/site/anode.abhiudayg.dev?theme=light"
                  alt="Launched on LaunchRanked"
                  width={236}
                  height={54}
                  className="h-9 w-auto rounded border border-white/[0.12] shadow-sm"
                />
              </a>
            </div>
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
