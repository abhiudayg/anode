import {
  Terminal,
  Cpu,
  Layers,
  Database,
  ShieldCheck,
  Server,
  Zap,
  FileCode,
  Gauge,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

export const SECTION_ALIASES: Record<string, string> = {
  benchmarks: "benchmarks-analysis",
  benchmark: "benchmarks-analysis",
  verification: "benchmarks-analysis",
  numbers: "benchmarks-analysis",
  empirical: "benchmarks-analysis",
  methodology: "benchmarks-analysis",
  security: "security-hardening",
  hardening: "security-hardening",
  catalog: "catalog-drivers",
  drivers: "catalog-drivers",
  stateful: "catalog-drivers",
  systemd: "systemd-vps",
  vps: "systemd-vps",
  cgroups: "systemd-vps",
  ports: "dev-engine",
  port: "dev-engine",
  dev: "dev-engine",
  lockfile: "lockfile-spec",
  spec: "lockfile-spec",
  lock: "lockfile-spec",
  ssa: "ssa-vta",
  vta: "ssa-vta",
  compiler: "ssa-vta",
  chokepoints: "choke-points",
  chokepoint: "choke-points",
  infra: "infra-automation",
  terraform: "infra-automation",
  ansible: "infra-automation",
  vm: "infra-automation",
  tradeoff: "tradeoffs",
  limits: "tradeoffs",
  troubleshooting: "troubleshooting",
  error: "troubleshooting",
  errors: "troubleshooting",
  fix: "troubleshooting",
  start: "quickstart",
  guide: "quickstart",
  logs: "cli",
  log: "cli",
  ps: "cli",
  status: "cli",
  doctor: "cli",
  deploy: "cli",
  inspect: "cli",
};

export const docSections = [
  {
    category: "Getting Started",
    items: [
      { id: "overview", title: "Anode Overview", icon: Layers },
      { id: "quickstart", title: "Quickstart Guide", icon: Terminal },
      { id: "cli", title: "CLI Reference", icon: FileCode },
    ],
  },
  {
    category: "Compiler & SSA Core",
    items: [
      { id: "ssa-vta", title: "SSA & VTA Call Graph", icon: Cpu },
      { id: "choke-points", title: "Stdlib Choke Points", icon: Zap },
      { id: "lockfile-spec", title: "anode.lock.json Spec", icon: ShieldCheck },
    ],
  },
  {
    category: "Runtime & Production",
    items: [
      { id: "dev-engine", title: "Dynamic Port Allocator", icon: Database },
      { id: "systemd-vps", title: "Bare-Metal Systemd & Cgroups", icon: Server },
      { id: "catalog-drivers", title: "Pluggable Stateful Catalog", icon: Layers },
      { id: "security-hardening", title: "Least-Privilege Security Boundary", icon: ShieldCheck },
      { id: "infra-automation", title: "Ansible & Terraform VM Setup", icon: Terminal },
      { id: "benchmarks-analysis", title: "Empirical Numbers & Verification", icon: Gauge },
    ],
  },
  {
    category: "Architecture & Limits",
    items: [
      { id: "tradeoffs", title: "Tradeoffs & Limits", icon: AlertTriangle },
      { id: "troubleshooting", title: "Troubleshooting & Edge Cases", icon: HelpCircle },
    ],
  },
];

export const allValidIds = new Set(docSections.flatMap((s) => s.items.map((i) => i.id)));

export function hrefFor(id: string): string {
  return id === "overview" ? "/docs" : `/docs/${id}`;
}

export function resolveSectionId(raw: string): string | null {
  const resolved = SECTION_ALIASES[raw] || raw;
  return allValidIds.has(resolved) ? resolved : null;
}
