"use client";

import { useState } from "react";
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
  Zap,
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

  const categories = ["All", "CLI", "Security", "Runtime", "Networking"];

  const handleCopy = (text: string, id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Header */}
        <div className="space-y-4 pb-12 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-code text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Releases &amp; Architecture Timeline</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Changelog
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 max-w-3xl leading-relaxed">
            All notable changes and architectural updates to the Anode Proof-of-Topology orchestrator, synchronized with the repository CHANGELOG.md.
          </p>

          {/* Quick Stats / Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Current Release</div>
              <div className="text-lg font-bold text-emerald-400 font-mono-code mt-0.5">v1.1.0</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Pillars Verified</div>
              <div className="text-lg font-bold text-cyan-400 font-mono-code mt-0.5">4 / 4 Deterministic</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Docker Overhead</div>
              <div className="text-lg font-bold text-purple-400 font-mono-code mt-0.5">0 MB / 0 ms</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-xs font-mono-code text-neutral-400">Pre-Flight Speed</div>
              <div className="text-lg font-bold text-amber-400 font-mono-code mt-0.5">&lt; 100 ms</div>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs font-mono-code text-neutral-400 mr-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <span>Filter:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono-code transition-colors ${
                  selectedCategory === cat
                    ? "bg-cyan-500 text-black font-semibold"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Releases Timeline */}
        <div className="pt-12 space-y-16">
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
                className="relative pl-0 sm:pl-8 sm:border-l sm:border-white/[0.1] space-y-8"
              >
                {/* Timeline Dot */}
                <div className="hidden sm:flex absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#08090b] border-2 border-cyan-400 items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                {/* Release Header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono-code tracking-tight">
                      {release.version}
                    </h2>
                    {release.isLatest && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono-code font-semibold">
                        Latest Stable (GA)
                      </span>
                    )}
                    <span className="text-xs font-mono-code text-neutral-400">
                      {release.date}
                    </span>
                    <button
                      onClick={() => handleCopy(release.version, release.version)}
                      className="text-xs font-mono-code text-neutral-400 hover:text-white flex items-center gap-1 transition-colors ml-auto"
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

                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                    {release.summary}
                  </p>

                  {/* Highlights Bullet Box */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <div className="text-xs font-mono-code uppercase tracking-wider text-neutral-400 font-semibold">
                      Key Capabilities:
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-300">
                      {release.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Updates Cards */}
                <div className="space-y-6 pt-2">
                  {filteredUpdates.map((update, uIdx) => (
                    <div
                      key={uIdx}
                      className="p-5 sm:p-6 rounded-2xl bg-[#0b0d13] border border-white/[0.08] hover:border-cyan-500/30 transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {update.title}
                          </h3>
                          {update.badge && (
                            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                              {update.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400">
                          {update.category}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                        {update.description}
                      </p>

                      {update.codeSnippet && (
                        <div className="rounded-xl border border-white/[0.08] bg-[#050608] overflow-hidden shadow-inner">
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
        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-[#0c0f17] to-[#08090b] border border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono-code uppercase tracking-wider font-semibold">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Stay Up to Date</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Upgrade to Anode v1.1.0 in Seconds
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
            Update your local toolchain using Homebrew or standard Go tooling to unlock bare-metal process inspection (anode ps) and pre-flight diagnostics (anode doctor).
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                handleCopy("brew update && brew upgrade anode", "cta-brew")
              }
              className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] text-xs font-mono-code text-white flex items-center gap-2 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>brew upgrade anode</span>
              {copiedId === "cta-brew" ? (
                <Check className="w-3 h-3 text-emerald-400 ml-1" />
              ) : (
                <Copy className="w-3 h-3 text-neutral-400 ml-1" />
              )}
            </button>

            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono-code font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Explore CLI Documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <a
              href="https://github.com/abhiudayg/anode/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-transparent hover:bg-white/[0.05] text-neutral-400 hover:text-white text-xs font-mono-code transition-colors flex items-center gap-1.5"
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
