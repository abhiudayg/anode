"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Calendar,
  Clock,
  ArrowRight,
  User,
  Layers,
  Cpu,
  Server,
  ShieldCheck,
  Terminal,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Share2,
  Bookmark,
  Check
} from "lucide-react";
import { BLOG_POSTS, BlogPost } from "@/data/blogPosts";

export default function BlogPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resolveSlug = () => {
      const hash = window.location.hash.replace("#", "").trim();
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get("post") || hash;

      if (querySlug && BLOG_POSTS.some((p) => p.slug === querySlug)) {
        setSelectedSlug(querySlug);
      } else {
        setSelectedSlug(null);
      }
    };

    resolveSlug();
    window.addEventListener("hashchange", resolveSlug);
    return () => window.removeEventListener("hashchange", resolveSlug);
  }, []);

  const currentPost = selectedSlug
    ? BLOG_POSTS.find((p) => p.slug === selectedSlug)
    : null;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090b] text-[#f3f4f6]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {currentPost ? (
          /* Single Article Detail View */
          <article className="space-y-8">
            {/* Back Button & Share */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <button
                onClick={() => {
                  setSelectedSlug(null);
                  if (typeof window !== "undefined") {
                    window.history.pushState(null, "", "/blog");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono-code text-cyan-400 hover:text-cyan-300 transition-colors py-1 px-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Journal</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs font-mono-code text-neutral-400 hover:text-white transition-colors py-1 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Essay</span>
                  </>
                )}
              </button>
            </div>

            {/* Article Header */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono-code">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 font-semibold">
                  {currentPost.category}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  {currentPost.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  {currentPost.readTime}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {currentPost.title}
              </h1>

              <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
                {currentPost.subtitle}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  {currentPost.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{currentPost.author}</div>
                  <div className="text-xs text-neutral-500 font-mono-code">{currentPost.authorRole}</div>
                </div>
              </div>
            </div>

            {/* Long-form Article Body */}
            <div className="space-y-10 text-neutral-300 pt-4">
              {currentPost.sections.map((sec, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-2xl font-bold text-white tracking-tight pt-4">
                    {sec.heading}
                  </h2>

                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-sm sm:text-base leading-relaxed text-neutral-300">
                      {p}
                    </p>
                  ))}

                  {sec.callout && (
                    <div
                      className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed my-4 ${
                        sec.callout.type === "warning"
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                          : sec.callout.type === "tip"
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                          : "bg-cyan-950/20 border-cyan-500/30 text-cyan-200"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>{sec.callout.text}</div>
                      </div>
                    </div>
                  )}

                  {sec.codeBlock && (
                    <div className="rounded-xl border border-white/[0.08] bg-[#06070a] overflow-hidden my-6 shadow-inner">
                      <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono-code text-neutral-400">
                        <span>{sec.codeBlock.title}</span>
                        <span className="uppercase text-[10px] text-neutral-500 font-semibold">
                          {sec.codeBlock.language}
                        </span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-xs font-mono-code text-neutral-200 leading-relaxed">
                        <code>{sec.codeBlock.code}</code>
                      </pre>
                    </div>
                  )}
                </section>
              ))}

              {/* End of article CTA */}
              <div className="p-8 rounded-2xl bg-[#07090e] border border-cyan-500/30 mt-12 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <span>Try Anode On Your Go Codebase</span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Inspect your existing Go microservices in under 20ms and deploy directly to any Linux VPS without Dockerfiles or YAML.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/docs#quickstart"
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold font-mono-code transition-colors"
                  >
                    Read Quickstart →
                  </Link>
                  <a
                    href="https://github.com/abhiudayg/anode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono-code text-white transition-colors"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </article>
        ) : (
          /* Essay Listing View */
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono-code uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full inline-block font-semibold">
                Engineering &amp; Systems Research
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                Anode Technical Journal
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                Deep architectural breakdowns into compiler theory, Static Single Assignment (SSA), Linux kernel socket splicing, and bare-metal systemd orchestration.
              </p>
            </div>

            <div className="space-y-6">
              {BLOG_POSTS.map((post) => (
                <div
                  key={post.slug}
                  onClick={() => {
                    setSelectedSlug(post.slug);
                    if (typeof window !== "undefined") {
                      window.history.pushState(null, "", `#${post.slug}`);
                    }
                  }}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c0e14]/90 p-6 sm:p-8 hover:border-cyan-500/40 transition-all duration-300 cursor-pointer group shadow-xl hover:shadow-[0_0_30px_rgba(0,173,216,0.1)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs text-neutral-400 font-mono-code">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 font-semibold">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>{post.date}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {post.title}
                  </h2>

                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                    {post.subtitle}
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs font-mono-code text-neutral-500">
                      By {post.author} • {post.authorRole}
                    </span>
                    <span className="text-xs font-mono-code text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-medium">
                      <span>Read Architectural Essay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
