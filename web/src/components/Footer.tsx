import Link from "next/link";
import { Layers, Heart, BookOpen, Newspaper } from "lucide-react";
import { GithubIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050608] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Anode</span>
              <span className="text-neutral-500 text-xs ml-2">
                — Bare-metal Go orchestration engine
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400 font-mono-code">
            <Link
              href="/docs"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Docs</span>
            </Link>
            <Link
              href="/blog"
              className="hover:text-purple-400 transition-colors flex items-center gap-1"
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>Blog</span>
            </Link>
            <Link
              href="/docs"
              className="hover:text-cyan-400 transition-colors"
            >
              Architecture Deep Dive
            </Link>
            <a
              href="https://github.com/abhiudayg/anode/blob/main/docs/tradeoffs.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Tradeoffs & Limits
            </a>
            <a
              href="https://github.com/abhiudayg/anode"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              MIT License
            </a>
          </div>

          {/* Verification Badge */}
          <div className="text-[11px] font-mono-code text-neutral-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>4-Pillar Topology Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
