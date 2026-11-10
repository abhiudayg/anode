"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, Github, ArrowRight, Sparkles, Layers } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#08090b]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/50 py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 via-cyan-500/10 to-transparent border border-cyan-500/30 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,173,216,0.4)]">
              <Layers className="w-4 h-4 text-cyan-400 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                Anode
              </span>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium">
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#topology"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Proof-of-Topology
            </a>
            <a
              href="#interactive-terminal"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Live CLI
            </a>
            <a
              href="#pillars"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              The 4 Pillars
            </a>
            <a
              href="#drift"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Comparison
            </a>
            <a
              href="#benchmarks"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Benchmarks
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/abhiudayg/anode"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-neutral-300 hover:text-white text-xs font-mono-code transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Star on GitHub</span>
              <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] text-neutral-400">
                1.4k
              </span>
            </a>

            <a
              href="#quickstart"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-medium rounded-lg group bg-gradient-to-br from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(0,173,216,0.3)] transition-all"
            >
              <span className="relative px-3.5 py-1.5 transition-all ease-in duration-75 bg-[#08090b] rounded-[6px] group-hover:bg-opacity-0 flex items-center gap-1.5">
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
