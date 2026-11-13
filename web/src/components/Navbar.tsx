"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Terminal, ArrowRight, Sparkles, Layers, Menu, X, BookOpen, Newspaper, ChevronDown, Compass, GitCompare, Server, Database, Wrench, Search, Cpu, Zap } from "lucide-react";
import { GithubIcon } from "./Icons";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const guidesDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (guidesDropdownRef.current && !guidesDropdownRef.current.contains(e.target as Node)) {
        setGuidesOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#08090b]/95 backdrop-blur-2xl border-b border-white/[0.1] shadow-2xl shadow-black/80 py-3"
          : "bg-[#08090b]/90 backdrop-blur-xl border-b border-white/[0.06] py-3.5 sm:py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
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
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link
              href="/#topology"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Architecture
            </Link>

            {/* Guides Dropdown */}
            <div
              ref={guidesDropdownRef}
              className="relative shrink-0"
              onMouseEnter={() => setGuidesOpen(true)}
              onMouseLeave={() => setGuidesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setGuidesOpen(!guidesOpen)}
                className={`text-sm font-medium transition-colors flex items-center gap-1 py-1 whitespace-nowrap ${
                  guidesOpen ? "text-cyan-400" : "text-neutral-400 hover:text-white"
                }`}
                aria-expanded={guidesOpen}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Guides</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${guidesOpen ? "rotate-180 text-cyan-400" : "text-neutral-500"}`} />
              </button>

              {guidesOpen && (
                <div className="absolute top-full -left-4 w-72 pt-2 z-50">
                  <div className="rounded-2xl border border-white/[0.1] bg-[#0c0e14]/95 backdrop-blur-2xl p-2 shadow-2xl shadow-black/80 space-y-1">
                    <Link
                      href="/guides/deploy-go-without-docker"
                      onClick={() => setGuidesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Terminal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                          Deploy Go Without Docker
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          3-minute bare-metal systemd tutorial
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/guides/deploy-go-postgres-vps"
                      onClick={() => setGuidesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          Go + PostgreSQL on VPS
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Fullstack database binding &amp; systemd
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/deploy/hetzner-vps"
                      onClick={() => setGuidesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          Hetzner Cloud VPS Guide
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Run on €3.79/mo servers (8ms cold starts)
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/deploy/digitalocean-droplet"
                      onClick={() => setGuidesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                          DigitalOcean Droplet Guide
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Deploy Go APIs to $4/mo droplets
                        </div>
                      </div>
                    </Link>

                    {/* Framework Sub-Links */}
                    <div className="border-t border-white/[0.06] pt-2 px-1">
                      <div className="text-[10px] font-mono-code uppercase text-neutral-400 font-semibold mb-1 px-1">
                        Go Framework Deploy Guides
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono-code">
                        <Link
                          href="/guides/deploy-gin-without-docker"
                          onClick={() => setGuidesOpen(false)}
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-cyan-500/15 hover:text-cyan-300 text-neutral-300 transition-colors text-center"
                        >
                          Gin API
                        </Link>
                        <Link
                          href="/guides/deploy-chi-without-docker"
                          onClick={() => setGuidesOpen(false)}
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-cyan-500/15 hover:text-cyan-300 text-neutral-300 transition-colors text-center"
                        >
                          Chi Router
                        </Link>
                        <Link
                          href="/guides/deploy-fiber-without-docker"
                          onClick={() => setGuidesOpen(false)}
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-cyan-500/15 hover:text-cyan-300 text-neutral-300 transition-colors text-center"
                        >
                          Fiber
                        </Link>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.06] my-1 pt-1">
                      <Link
                        href="/vs/docker-compose"
                        onClick={() => setGuidesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <GitCompare className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            Docker Compose vs Anode
                          </div>
                          <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                            Bare-metal architecture &amp; migration
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/vs/systemd"
                        onClick={() => setGuidesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <GitCompare className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                            Raw Systemd vs Anode
                          </div>
                          <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                            Why not write unit files manually?
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Free Tools Dropdown */}
            <div
              ref={toolsDropdownRef}
              className="relative shrink-0"
              onMouseEnter={() => setToolsOpen(true)}
              onMouseLeave={() => setToolsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setToolsOpen(!toolsOpen)}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 py-1 whitespace-nowrap ${
                  toolsOpen ? "text-amber-400" : "text-neutral-400 hover:text-white"
                }`}
                aria-expanded={toolsOpen}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tools</span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold shrink-0">
                  Free
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${toolsOpen ? "rotate-180 text-amber-400" : "text-neutral-500"}`} />
              </button>

              {toolsOpen && (
                <div className="absolute top-full -left-6 w-80 pt-2 z-50">
                  <div className="rounded-2xl border border-white/[0.1] bg-[#0c0e14]/95 backdrop-blur-2xl p-2 shadow-2xl shadow-black/80 space-y-1">
                    <Link
                      href="/tools/ssa-visualizer"
                      onClick={() => setToolsOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          <span>SSA Call Graph Visualizer</span>
                          <span className="text-[9px] font-mono-code px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                            New Mini-Tool
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Paste Go code to live-synthesize contracts &amp; systemd
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/tools/compose-to-systemd"
                      onClick={() => setToolsOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          <span>Compose to Systemd Tool</span>
                          <span className="text-[9px] font-mono-code px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                            Instant
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Convert docker-compose.yml to hardened Linux systemd units
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/docs#quickstart"
                      onClick={() => setToolsOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Terminal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          CLI Analyzer &amp; Inspect
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Run <code>anode inspect</code> on your Go repository
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/#benchmarks"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Benchmarks
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-neutral-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Docs</span>
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-neutral-400 hover:text-purple-400 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Newspaper className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Blog</span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 xl:gap-3 shrink-0">
            {/* Quick Search Cmd + K Button */}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open-command-palette"));
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-500/30 text-neutral-400 hover:text-white text-xs font-mono-code transition-all whitespace-nowrap shrink-0"
              title="Search documentation, guides, and tools (Cmd + K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] text-neutral-400">
                ⌘K
              </kbd>
            </button>

            <a
              href="https://github.com/abhiudayg/anode"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-2.5 xl:px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-neutral-300 hover:text-white text-xs font-mono-code transition-all whitespace-nowrap shrink-0"
              title="GitHub Repository"
            >
              <GithubIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">GitHub</span>
            </a>

            <Link
              href="/#quickstart"
              className="hidden sm:inline-flex relative items-center justify-center p-0.5 overflow-hidden text-xs font-medium rounded-lg group bg-gradient-to-br from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(0,173,216,0.3)] transition-all whitespace-nowrap shrink-0"
            >
              <span className="relative px-3.5 py-1.5 transition-all ease-in duration-75 bg-[#08090b] rounded-[6px] group-hover:bg-opacity-0 flex items-center gap-1.5 whitespace-nowrap">
                <span>Quickstart</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
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
            <div className="pt-2 pb-1 border-t border-white/[0.06]">
              <div className="px-3 text-[11px] font-mono-code uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                Guides & Comparisons
              </div>
              <Link
                href="/guides/deploy-go-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-purple-300 hover:bg-white/[0.04]"
              >
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>Deploy Go Without Docker</span>
              </Link>
              <Link
                href="/guides/deploy-go-postgres-vps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-indigo-300 hover:bg-white/[0.04]"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Go + PostgreSQL on VPS</span>
              </Link>
              <Link
                href="/guides/deploy-gin-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-cyan-300 hover:bg-white/[0.04]"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deploy Gin Framework</span>
              </Link>
              <Link
                href="/guides/deploy-chi-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-cyan-300 hover:bg-white/[0.04]"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deploy Chi Router</span>
              </Link>
              <Link
                href="/guides/deploy-fiber-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-cyan-300 hover:bg-white/[0.04]"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deploy Fiber (8ms Boot)</span>
              </Link>
              <Link
                href="/deploy/hetzner-vps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-emerald-300 hover:bg-white/[0.04]"
              >
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hetzner Cloud VPS Guide</span>
              </Link>
              <Link
                href="/deploy/digitalocean-droplet"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-sky-300 hover:bg-white/[0.04]"
              >
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>DigitalOcean Droplet Guide</span>
              </Link>
              <Link
                href="/vs/docker-compose"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-cyan-300 hover:bg-white/[0.04]"
              >
                <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Docker Compose vs Anode</span>
              </Link>
              <Link
                href="/vs/systemd"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-amber-300 hover:bg-white/[0.04]"
              >
                <GitCompare className="w-3.5 h-3.5 text-amber-400" />
                <span>Raw Systemd vs Anode</span>
              </Link>
            </div>

            <div className="pt-2 pb-1 border-t border-white/[0.06]">
              <div className="px-3 text-[11px] font-mono-code uppercase tracking-wider text-amber-400 font-semibold mb-1 flex items-center justify-between">
                <span>Free Developer Tools</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">Free</span>
              </div>
              <Link
                href="/tools/ssa-visualizer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-white/[0.04]"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live SSA Call Graph Visualizer</span>
              </Link>
              <Link
                href="/tools/compose-to-systemd"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-white/[0.04]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Compose to Systemd Tool</span>
              </Link>
            </div>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-cyan-400 bg-cyan-950/30 border border-cyan-800/40"
            >
              Documentation & API Reference
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-400 bg-purple-950/30 border border-purple-800/40"
            >
              Engineering Blog
            </Link>
            <Link
              href="/changelog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-800/40"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Changelog &amp; Releases</span>
              </div>
              <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                v1.0.0
              </span>
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
