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
          ? "bg-[#000000]/95 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/90"
          : "bg-[#000000]/90 backdrop-blur-xl border-b border-white/[0.06]"
      }`}
    >
      {/* Top Announcement Banner */}
      <div className="border-b border-white/[0.06] bg-[#050505] py-1.5 px-4 text-center text-xs text-neutral-400">
        <Link href="/changelog" className="inline-flex items-center gap-2 hover:text-white transition-colors">
          <span className="font-mono-code text-[10px] px-1.5 py-0.2 rounded bg-white/[0.1] text-white font-medium uppercase tracking-wider">New</span>
          <span>Anode v1.6 is out: Automatic Rollback &amp; Zero Docker Daemon.</span>
          <span className="underline underline-offset-4 text-white hover:text-neutral-300 font-medium">Read changelog →</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center transition-all duration-300 group-hover:border-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Layers className="w-4 h-4 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-neutral-200 transition-colors">
              Anode
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link
              href="/architecture"
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
                  guidesOpen ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
                aria-expanded={guidesOpen}
              >
                <Compass className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Guides</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${guidesOpen ? "rotate-180 text-white" : "text-neutral-500"}`} />
              </button>

              {guidesOpen && (
                <div className="absolute top-full -left-4 w-72 pt-2 z-50">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#090a0d]/98 backdrop-blur-2xl p-2 shadow-2xl shadow-black/80 space-y-1">
                    <Link
                      href="/guides/deploy-go-without-docker"
                      onClick={() => setGuidesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:text-white transition-transform">
                        <Terminal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
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
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:text-white transition-transform">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
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
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:text-white transition-transform">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
                          Hetzner Cloud VPS Guide
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Run on Hetzner VPS
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/deploy/digitalocean-droplet"
                      onClick={() => setGuidesOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:text-white transition-transform">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
                          DigitalOcean Droplet Guide
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Deploy Go APIs to DigitalOcean droplets
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
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.1] hover:text-white text-neutral-300 transition-colors text-center"
                        >
                          Gin API
                        </Link>
                        <Link
                          href="/guides/deploy-chi-without-docker"
                          onClick={() => setGuidesOpen(false)}
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.1] hover:text-white text-neutral-300 transition-colors text-center"
                        >
                          Chi Router
                        </Link>
                        <Link
                          href="/guides/deploy-fiber-without-docker"
                          onClick={() => setGuidesOpen(false)}
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.1] hover:text-white text-neutral-300 transition-colors text-center"
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
                        <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:text-white transition-transform">
                          <GitCompare className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
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
                        <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-neutral-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:text-white transition-transform">
                          <GitCompare className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
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
                  toolsOpen ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
                aria-expanded={toolsOpen}
              >
                <Wrench className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Tools</span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-white/[0.08] border border-white/[0.12] text-neutral-300 font-semibold shrink-0">
                  Free
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${toolsOpen ? "rotate-180 text-white" : "text-neutral-500"}`} />
              </button>

              {toolsOpen && (
                <div className="absolute top-full -left-6 w-80 pt-2 z-50">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#090a0d]/98 backdrop-blur-2xl p-2 shadow-2xl shadow-black/80 space-y-1">
                    <Link
                      href="/tools/ssa-visualizer"
                      onClick={() => setToolsOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors flex items-center gap-1.5">
                          <span>SSA Call Graph Visualizer</span>
                          <span className="text-[9px] font-mono-code px-1 py-0.2 rounded bg-white/[0.1] text-white">
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
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors flex items-center gap-1.5">
                          <span>Compose to Systemd Tool</span>
                          <span className="text-[9px] font-mono-code px-1 py-0.2 rounded bg-white/[0.1] text-white">
                            Instant
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                          Convert docker-compose.yml to hardened Linux systemd units
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/docs/quickstart"
                      onClick={() => setToolsOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Terminal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-neutral-200 transition-colors">
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
              href="/docs"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Docs</span>
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Newspaper className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>Blog</span>
            </Link>
            <Link
              href="/changelog"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Changelog
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
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.2] text-neutral-400 hover:text-white text-xs font-mono-code transition-all whitespace-nowrap shrink-0"
              title="Search documentation, guides, and tools (Cmd + K)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
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
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Quickstart</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="lg:hidden mt-3 rounded-2xl border border-white/[0.08] bg-[#090a0d]/98 backdrop-blur-2xl p-4 shadow-2xl space-y-3">
            <Link
              href="/architecture"
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
            <div className="pt-2 pb-1 border-t border-white/[0.06]">
              <div className="px-3 text-[11px] font-mono-code uppercase tracking-wider text-neutral-400 font-semibold mb-1">
                Guides & Comparisons
              </div>
              <Link
                href="/guides/deploy-go-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                <span>Deploy Go Without Docker</span>
              </Link>
              <Link
                href="/guides/deploy-go-postgres-vps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Database className="w-3.5 h-3.5 text-neutral-400" />
                <span>Go + PostgreSQL on VPS</span>
              </Link>
              <Link
                href="/guides/deploy-gin-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Zap className="w-3.5 h-3.5 text-neutral-400" />
                <span>Deploy Gin Framework</span>
              </Link>
              <Link
                href="/guides/deploy-chi-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Zap className="w-3.5 h-3.5 text-neutral-400" />
                <span>Deploy Chi Router</span>
              </Link>
              <Link
                href="/guides/deploy-fiber-without-docker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Zap className="w-3.5 h-3.5 text-neutral-400" />
                <span>Deploy Fiber</span>
              </Link>
              <Link
                href="/deploy/hetzner-vps"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Server className="w-3.5 h-3.5 text-neutral-400" />
                <span>Hetzner Cloud VPS Guide</span>
              </Link>
              <Link
                href="/deploy/digitalocean-droplet"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Server className="w-3.5 h-3.5 text-neutral-400" />
                <span>DigitalOcean Droplet Guide</span>
              </Link>
              <Link
                href="/vs/docker-compose"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <GitCompare className="w-3.5 h-3.5 text-neutral-400" />
                <span>Docker Compose vs Anode</span>
              </Link>
              <Link
                href="/vs/systemd"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <GitCompare className="w-3.5 h-3.5 text-neutral-400" />
                <span>Raw Systemd vs Anode</span>
              </Link>
            </div>

            <div className="pt-2 pb-1 border-t border-white/[0.06]">
              <div className="px-3 text-[11px] font-mono-code uppercase tracking-wider text-neutral-400 font-semibold mb-1 flex items-center justify-between">
                <span>Free Developer Tools</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-white/[0.08] text-white">Free</span>
              </div>
              <Link
                href="/tools/ssa-visualizer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                <span>Live SSA Call Graph Visualizer</span>
              </Link>
              <Link
                href="/tools/compose-to-systemd"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-white/[0.04]"
              >
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span>Compose to Systemd Tool</span>
              </Link>
            </div>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/[0.06] border border-white/[0.12]"
            >
              Documentation & API Reference
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] border border-transparent"
            >
              Engineering Blog
            </Link>
            <Link
              href="/changelog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span>Changelog &amp; Releases</span>
              </div>
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
                className="text-xs text-white font-medium hover:underline"
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
