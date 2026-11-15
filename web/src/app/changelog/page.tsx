"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import releasesJson from "@/data/changelog.json";
import { Footer } from "@/components/Footer";
import {
  Terminal,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Filter
} from "lucide-react";

interface ReleaseUpdate {
  title: string;
  category: "CLI" | "Security" | "Runtime" | "Networking";
  description: string;
  badge?: string;
  codeSnippet?: {
    title: string;
    code: string;
  };
}

interface Release {
  version: string;
  date: string;
  tag: string;
  isLatest?: boolean;
  summary: string;
  highlights: string[];
  updates: ReleaseUpdate[];
}

const RELEASES: Release[] = releasesJson as unknown as Release[];

export default function ChangelogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [indicatorY, setIndicatorY] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const categories = ["All", "CLI", "Security", "Runtime", "Networking"];

  useEffect(() => {
    const updateScroll = () => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const focusY = window.innerHeight * 0.35;
      const relativeY = focusY - rect.top;
      const maxH = Math.max(0, rect.height - 36);
      setIndicatorY(Math.max(0, Math.min(relativeY, maxH)));
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getTagBadge = (badge?: string) => {
    const b = (badge || "ADDED").toUpperCase();
    if (b.includes("SEC")) {
      return (
        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded border border-neutral-700 bg-white/[0.04] text-neutral-300 font-semibold uppercase tracking-wider">
          Security
        </span>
      );
    }
    if (b.includes("FIX")) {
      return (
        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded border border-yellow-500/40 bg-yellow-950/20 text-yellow-400 font-semibold uppercase tracking-wider">
          Fixed
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/20 text-emerald-400 font-semibold uppercase tracking-wider">
        Added
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white/20 selection:text-white relative bg-grid-pattern">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24">
        {/* Header */}
        <div className="space-y-4 pb-12 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono-code text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Architecture &amp; Release Timeline</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Changelog
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
            Every notable compiler pass, runtime update, and systemd automation guarantee for the Anode orchestrator.
          </p>

          {/* Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-white/[0.08]">
              <div className="text-xs font-mono-code text-neutral-500">Current Release</div>
              <div className="text-base sm:text-lg font-bold text-white font-mono-code mt-0.5 flex items-center gap-1.5">
                <span>v1.6.0</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-white/[0.08]">
              <div className="text-xs font-mono-code text-neutral-500">Pillars Verified</div>
              <div className="text-base sm:text-lg font-bold text-white font-mono-code mt-0.5">
                4 / 4 Deterministic
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-white/[0.08]">
              <div className="text-xs font-mono-code text-neutral-500">Container Overhead</div>
              <div className="text-base sm:text-lg font-bold text-white font-mono-code mt-0.5">
                0 MB (No Daemon)
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-white/[0.08]">
              <div className="text-xs font-mono-code text-neutral-500">License</div>
              <div className="text-base sm:text-lg font-bold text-white font-mono-code mt-0.5">
                Apache 2.0
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs font-mono-code text-neutral-500 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span>Filter:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-mono-code transition-all ${
                  selectedCategory === cat
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Releases Timeline with Scroll-Tracking Progress Rail */}
        <div ref={timelineRef} className="relative pt-12 space-y-16">
          {/* Static Background Rail Line */}
          <div className="pointer-events-none hidden sm:block absolute left-[15px] top-12 bottom-6 w-[1px] bg-white/[0.12]" />

          {/* Animated Traveling Glowing Emerald Indicator Dot */}
          <div
            className="pointer-events-none hidden sm:block absolute left-[10px] top-12 z-20 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.9)] ring-4 ring-[#000000]"
            style={{ transform: `translateY(${indicatorY}px)`, transition: "transform 0.08s linear" }}
          />

          {RELEASES.map((release) => {
            const filteredUpdates =
              selectedCategory === "All"
                ? release.updates
                : release.updates.filter((u) => u.category === selectedCategory);

            if (selectedCategory !== "All" && filteredUpdates.length === 0) {
              return null;
            }

            return (
              <section
                key={release.version}
                id={release.version}
                data-version={release.version}
                className="relative pl-0 sm:pl-12 space-y-6"
              >
                {/* Release Header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono-code tracking-tight">
                      {release.version}
                    </h2>
                    {release.isLatest && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono-code font-semibold">
                        Latest Stable (GA)
                      </span>
                    )}
                    <span className="text-xs font-mono-code text-neutral-500">
                      {release.date}
                    </span>
                    <button
                      onClick={() => handleCopy(release.version, release.version)}
                      className="text-xs font-mono-code text-neutral-500 hover:text-white flex items-center gap-1 transition-colors ml-auto"
                      title="Copy release anchor"
                    >
                      {copiedId === release.version ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span>#{release.version}</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-sans">
                    {release.summary}
                  </p>

                  {/* Highlights Bullet Box */}
                  <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/[0.08] space-y-2">
                    <div className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold">
                      Key Highlights:
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-300">
                      {release.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Updates Cards */}
                <div className="space-y-4 pt-2">
                  {filteredUpdates.map((update, uIdx) => (
                    <div
                      key={uIdx}
                      className="p-5 sm:p-6 rounded-2xl bg-[#0a0a0c] yc-card border border-white/[0.08] hover:border-white/[0.2] transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {update.title}
                          </h3>
                          {getTagBadge(update.badge || update.category)}
                        </div>
                        <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400">
                          {update.category}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                        {update.description}
                      </p>

                      {update.codeSnippet && (
                        <div className="rounded-xl border border-white/[0.08] bg-[#050507] overflow-hidden">
                          <div className="px-4 py-2 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono-code text-neutral-400">
                            <span>{update.codeSnippet.title}</span>
                            <button
                              onClick={() =>
                                handleCopy(
                                  update.codeSnippet!.code,
                                  `${release.version}-${uIdx}`
                                )
                              }
                              className="hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                            >
                              {copiedId === `${release.version}-${uIdx}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs font-mono-code text-neutral-200 leading-relaxed">
                            <code>{update.codeSnippet.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Upgrade / Installation Call to Action */}
        <div className="mt-20 p-8 rounded-2xl bg-[#0a0a0c] yc-card border border-white/[0.1] space-y-4">
          <div className="flex items-center gap-2 text-white text-xs font-mono-code uppercase tracking-wider font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Stay Up to Date</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Upgrade to Anode v1.6.0 in Seconds
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Update your local toolchain using Homebrew or standard Go tooling to unlock bare-metal process inspection (<code>anode ps</code>) and pre-flight diagnostics (<code>anode doctor</code>).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                handleCopy("brew update && brew upgrade anode", "cta-brew")
              }
              className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-mono-code text-white flex items-center gap-2 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-neutral-300" />
              <span>brew upgrade anode</span>
              {copiedId === "cta-brew" ? (
                <Check className="w-3 h-3 text-emerald-400 ml-1" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400 ml-1" />
              )}
            </button>

            <Link
              href="/docs"
              className="px-5 py-2 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>Explore CLI Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="https://github.com/abhiudayg/anode/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-transparent hover:bg-white/[0.05] text-neutral-400 hover:text-white text-xs font-mono-code transition-colors flex items-center gap-1.5"
            >
              <span>GitHub Releases</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
