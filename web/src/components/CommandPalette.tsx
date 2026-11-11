"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Terminal,
  FileCode2,
  Compass,
  Cpu,
  Server,
  BookOpen,
  GitCompare,
  Sparkles,
  Zap,
  ArrowRight,
  X,
  Copy,
  Check,
  ShieldCheck,
  Database
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: "Documentation" | "Tools" | "Guides" | "Blog" | "Commands" | "Comparisons";
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const searchItems: SearchItem[] = [
    // Commands & Quick Actions
    {
      id: "cmd-brew",
      title: "brew install abhiudayg/tap/anode",
      description: "Install Anode CLI via Homebrew Tap",
      category: "Commands",
      icon: Terminal,
      badge: "Quick Copy",
      action: () => copyText("brew install abhiudayg/tap/anode", "cmd-brew"),
    },
    {
      id: "cmd-inspect",
      title: "anode inspect [path]",
      description: "Extract whole-program SSA topology and write anode.lock.json",
      category: "Commands",
      icon: Terminal,
      badge: "CLI",
      action: () => copyText("anode inspect .", "cmd-inspect"),
    },
    {
      id: "cmd-dev",
      title: "anode dev",
      description: "Start local zero-collision hot reload daemon with dynamic loopbacks",
      category: "Commands",
      icon: Terminal,
      badge: "CLI",
      action: () => copyText("anode dev", "cmd-dev"),
    },

    // Interactive Developer Tools
    {
      id: "tool-ssa-visualizer",
      title: "Go SSA Call Graph & Topology Visualizer",
      description: "Live browser AST simulator: paste Go code, see instant contract & systemd unit",
      category: "Tools",
      href: "/tools/ssa-visualizer",
      icon: Cpu,
      badge: "New Mini-Tool",
    },
    {
      id: "tool-compose-to-systemd",
      title: "Compose to Systemd Converter",
      description: "Convert docker-compose.yml to hardened bare-metal Linux systemd service units",
      category: "Tools",
      href: "/tools/compose-to-systemd",
      icon: Sparkles,
      badge: "Free Tool",
    },
    {
      id: "tool-ram-calculator",
      title: "RAM & Cloud Savings Calculator",
      description: "Calculate idle RAM reduction and annual VPS hosting cost savings",
      category: "Tools",
      href: "/#benchmarks",
      icon: Zap,
    },

    // Programmatic Framework Guides
    {
      id: "guide-gin",
      title: "Deploy Gin API Without Docker",
      description: "Zero-Docker bare-metal production guide for Gin web framework",
      category: "Guides",
      href: "/guides/deploy-gin-without-docker",
      icon: Compass,
      badge: "Gin",
    },
    {
      id: "guide-chi",
      title: "Deploy Chi Router Without Docker",
      description: "Lightweight idiomatic Go routing deployment with Linux systemd",
      category: "Guides",
      href: "/guides/deploy-chi-without-docker",
      icon: Compass,
      badge: "Chi",
    },
    {
      id: "guide-fiber",
      title: "Deploy Fiber Without Docker",
      description: "High-performance Fasthttp Go framework deployment guide",
      category: "Guides",
      href: "/guides/deploy-fiber-without-docker",
      icon: Compass,
      badge: "Fiber",
    },
    {
      id: "guide-hetzner",
      title: "Hetzner Cloud VPS Deployment Guide",
      description: "Run compiled Go microservices on $4/month Hetzner CX22 instances",
      category: "Guides",
      href: "/deploy/hetzner-vps",
      icon: Server,
    },
    {
      id: "guide-do",
      title: "DigitalOcean Droplet Deployment Guide",
      description: "Deploy Go APIs directly to Ubuntu & Debian Droplets via Caddy TLS",
      category: "Guides",
      href: "/deploy/digitalocean-droplet",
      icon: Server,
    },
    {
      id: "guide-postgres",
      title: "Deploy Go + PostgreSQL to Linux VPS",
      description: "Automated schema migrations and stateful provisioning on bare metal",
      category: "Guides",
      href: "/guides/deploy-go-postgres-vps",
      icon: Database,
    },

    // Documentation
    {
      id: "doc-overview",
      title: "Documentation Overview & Architecture",
      description: "Whole-program SSA analysis, Variable Type Analysis (VTA), and the 4 pillars",
      category: "Documentation",
      href: "/docs#overview",
      icon: BookOpen,
    },
    {
      id: "doc-quickstart",
      title: "Documentation: Quickstart Tutorial",
      description: "From git clone to production deployment in under 60 seconds",
      category: "Documentation",
      href: "/docs#quickstart",
      icon: Terminal,
    },
    {
      id: "doc-cli",
      title: "Documentation: CLI Reference & Flags",
      description: "Full reference for inspect, dev, deploy, cluster, catalog, and --verbose",
      category: "Documentation",
      href: "/docs#cli",
      icon: FileCode2,
    },
    {
      id: "doc-systemd",
      title: "Documentation: Hardened Systemd Directives",
      description: "DynamicUser=yes, ProtectSystem=strict, and NoNewPrivileges execution",
      category: "Documentation",
      href: "/docs#systemd-directives",
      icon: ShieldCheck,
    },
    {
      id: "doc-cgroups",
      title: "Documentation: Cgroups v2 Resource Isolation",
      description: "MemoryHigh, MemoryMax, CPUQuota, and TasksMax quotas without root",
      category: "Documentation",
      href: "/docs#systemd-cgroups",
      icon: Cpu,
    },
    {
      id: "doc-troubleshooting",
      title: "Documentation: Troubleshooting & Error Codes",
      description: "Diagnosing dynamic handlers, missing migration paths, and loopback binds",
      category: "Documentation",
      href: "/docs#troubleshooting",
      icon: FileCode2,
    },

    // Technical Journal / Blog
    {
      id: "blog-docker",
      title: "Why We Ditched Docker for Go Backends",
      description: "Anatomy of 8ms systemd cold starts and 97% lower memory footprint",
      category: "Blog",
      href: "/blog/why-we-ditched-docker-for-go-backends",
      icon: BookOpen,
      badge: "Essay",
    },
    {
      id: "blog-ssa",
      title: "Inside the SSA Compiler Core",
      description: "How Variable Type Analysis (VTA) extracts topology from Go code in ~60ms",
      category: "Blog",
      href: "/blog/inside-the-ssa-compiler-core",
      icon: BookOpen,
      badge: "Compiler",
    },
    {
      id: "blog-loopback",
      title: "The End of Port 8080 Clashes",
      description: "Ephemeral Linux loopback proxies and zero-collision local dev orchestration",
      category: "Blog",
      href: "/blog/ephemeral-loopback-proxies-zero-port-collisions",
      icon: BookOpen,
      badge: "Networking",
    },
    {
      id: "blog-stress",
      title: "Stress-Testing Anode on 10 Famous Go Backends",
      description: "Benchmarking glance, croc, restic, and a 32-service enterprise microservice mesh",
      category: "Blog",
      href: "/blog/stress-testing-10-famous-go-backends",
      icon: BookOpen,
      badge: "Benchmark",
    },
    {
      id: "blog-restarts",
      title: "Zero-Downtime Rolling Restarts via Linux Socket Handover",
      description: "File descriptor inheritance with SO_REUSEPORT and zero dropped HTTP connections",
      category: "Blog",
      href: "/blog/zero-downtime-rolling-restarts-linux-sockets",
      icon: BookOpen,
      badge: "Systems",
    },
    {
      id: "blog-sandboxing",
      title: "DynamicUser Sandboxing without Root Daemons",
      description: "True unprivileged process isolation on bare-metal Linux",
      category: "Blog",
      href: "/blog/dynamicuser-sandboxing-without-root-daemons",
      icon: BookOpen,
      badge: "Security",
    },

    // Comparisons
    {
      id: "comp-compose",
      title: "Docker Compose vs Anode",
      description: "Deep technical comparison of developer workflows, memory, and cold boot",
      category: "Comparisons",
      href: "/vs/docker-compose",
      icon: GitCompare,
    },
    {
      id: "comp-systemd",
      title: "Raw Systemd vs Anode",
      description: "Why compiler-driven AST synthesis beats handwritten .service units",
      category: "Comparisons",
      href: "/vs/systemd",
      icon: GitCompare,
    },
  ];

  const closePalette = () => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const copyText = (text: string, id: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => {
        setCopiedCmd(null);
        closePalette();
      }, 1000);
    }
  };

  const filteredItems = searchItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Global Keyboard Listener for Cmd+K / Ctrl+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Custom Event for Triggering Search from Navbar or UI
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-command-palette", handleOpen);
    return () => window.removeEventListener("open-command-palette", handleOpen);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation within list
  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    }
  };

  const handleSelect = (item: SearchItem) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      setIsOpen(false);
      router.push(item.href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border border-white/[0.12] bg-[#0c0e14]/98 shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleItemKeyDown}
      >
        {/* Search Header Input */}
        <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, guide, tool, or doc topic..."
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none font-mono-code"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-neutral-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono-code text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono-code text-neutral-400 space-y-2">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-neutral-500">
                Try searching &ldquo;gin&rdquo;, &ldquo;systemd&rdquo;, &ldquo;ssa&rdquo;, &ldquo;inspect&rdquo;, or &ldquo;ports&rdquo;
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-white shadow-sm"
                      : "text-neutral-300 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-white/[0.04] text-neutral-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold font-mono-code flex items-center gap-2 truncate">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                              isSelected
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-700/50"
                                : "bg-white/[0.06] text-neutral-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    <span className="text-[10px] font-mono-code text-neutral-500 hidden sm:inline-block">
                      {item.category}
                    </span>
                    {item.action ? (
                      copiedCmd === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      )
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono-code text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px]">↓</kbd>
              <span className="text-neutral-500">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px]">↵</kbd>
              <span className="text-neutral-500">select</span>
            </span>
          </div>
          <div className="text-neutral-500">
            Anode Command Palette
          </div>
        </div>
      </div>
    </div>
  );
}
