"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Layers,
  Search,
  ChevronDown,
} from "lucide-react";
import { docSections, allValidIds, hrefFor, resolveSectionId } from "./nav";

// Shared chrome for every docs chapter: navigation, search, and the chapter frame.
export function DocsShell({ activeId, children }: { activeId: string; children: React.ReactNode }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDocsNavOpen, setMobileDocsNavOpen] = useState(false);

  const effectiveDoc = allValidIds.has(activeId) ? activeId : "overview";
  const currentItem = docSections.flatMap((s) => s.items).find((i) => i.id === effectiveDoc);
  const currentTitle = currentItem?.title || "Anode Overview";

  // Old links used #section or ?section=. Send them to the chapter's own URL.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "").toLowerCase().trim();
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("section") || "").toLowerCase().trim() || hash;
    if (!raw) return;
    const resolved = resolveSectionId(raw);
    if (resolved && resolved !== activeId) {
      router.replace(hrefFor(resolved));
    }
  }, [activeId, router]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#f3f4f6] relative bg-grid-pattern">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Mobile Collapsible Docs Directory Accordion */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setMobileDocsNavOpen(!mobileDocsNavOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.1] bg-[#0a0a0c] px-4 py-3 text-xs font-mono-code text-neutral-200 transition-colors hover:bg-white/[0.04]"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <span>Section: <strong className="text-white">{currentTitle}</strong></span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileDocsNavOpen ? "rotate-180 text-white" : "text-neutral-400"}`} />
          </button>

          {mobileDocsNavOpen && (
            <div className="mt-2 rounded-xl border border-white/[0.08] bg-[#090a0d] p-4 space-y-4 shadow-2xl">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#050507] border border-white/[0.08] text-xs font-mono-code text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {docSections.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="text-[10px] font-mono-code uppercase tracking-wider text-neutral-500 font-semibold px-2">
                      {sec.category}
                    </div>
                    <div className="space-y-1">
                      {sec.items
                        .filter((item) =>
                          item.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => {
                          const Icon = item.icon;
                          const isActive = effectiveDoc === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                router.push(hrefFor(item.id));
                                setMobileDocsNavOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono-code transition-all text-left ${
                                isActive
                                  ? "bg-white/[0.08] text-white font-semibold border-l-2 border-white"
                                  : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Docs Sidebar: Hidden on mobile/tablet (< lg), sticky on desktop */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0a0a0c] border border-white/[0.08] text-xs font-mono-code text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Navigation tree */}
              <div className="space-y-6">
                {docSections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-[11px] font-mono-code uppercase tracking-wider text-neutral-400 font-semibold px-2">
                      {sec.category}
                    </div>
                    <div className="space-y-1">
                      {sec.items
                        .filter((item) =>
                          item.title.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => {
                          const Icon = item.icon;
                          const isActive = effectiveDoc === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                router.push(hrefFor(item.id));
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                                isActive
                                  ? "bg-white/[0.08] text-white border border-white/[0.15] font-semibold shadow-sm"
                                  : "text-neutral-400 hover:text-white hover:bg-white/[0.03]"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-neutral-500"}`} />
                              <span>{item.title}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          {/* Docs Content Area */}
          <article className="lg:col-span-9 bg-[#0a0a0c]/90 rounded-2xl border border-white/[0.08] p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
            {/* Accessible Main Page Heading */}
            <h1 className="sr-only">Anode Technical Documentation &amp; CLI Reference</h1>

            {children}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

