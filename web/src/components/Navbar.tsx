"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, ArrowRight, Sparkles, Layers, Menu, X, BookOpen, Newspaper } from "lucide-react";
import { GithubIcon } from "./Icons";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          ? "bg-[#08090b]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/50 py-3.5"
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
          <nav className="hidden lg:flex items-center gap-7">
            <Link
              href="/#topology"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Proof-of-Topology
            </Link>
            <Link
              href="/#pillars"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              The 4 Pillars
            </Link>
            <Link
              href="/#benchmarks"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Benchmarks
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-neutral-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Docs</span>
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-neutral-400 hover:text-purple-400 transition-colors flex items-center gap-1.5"
            >
              <Newspaper className="w-3.5 h-3.5 text-purple-400" />
              <span>Blog</span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/abhiudayg/anode"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-neutral-300 hover:text-white text-xs font-mono-code transition-all"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            <Link
              href="/#quickstart"
              className="hidden sm:inline-flex relative items-center justify-center p-0.5 overflow-hidden text-xs font-medium rounded-lg group bg-gradient-to-br from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(0,173,216,0.3)] transition-all"
            >
              <span className="relative px-3.5 py-1.5 transition-all ease-in duration-75 bg-[#08090b] rounded-[6px] group-hover:bg-opacity-0 flex items-center gap-1.5">
                <span>Quickstart</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-neutral-300 hover:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 rounded-2xl border border-white/[0.1] bg-[#0c0e14]/95 backdrop-blur-2xl p-4 shadow-2xl space-y-3">
            <Link
              href="/#topology"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.05]"
            >
              Proof-of-Topology
            </Link>
            <Link
              href="/#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.05]"
            >
              The 4 Pillars
            </Link>
            <Link
              href="/#benchmarks"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.05]"
            >
              Benchmarks & Numbers
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-800/40"
            >
              Documentation & Guides
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-400 bg-purple-950/30 border border-purple-800/40"
            >
              Engineering Blog
            </Link>
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
              <a
                href="https://github.com/abhiudayg/anode"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-mono-code text-neutral-400 hover:text-white"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub Repository</span>
              </a>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-cyan-400 font-medium"
              >
                Get Started →
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
