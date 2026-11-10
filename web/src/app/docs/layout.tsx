import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Proof-of-Topology Architecture & CLI Reference",
  description:
    "Comprehensive guide to Anode's Go SSA call graph analysis, systemd unit generation, cgroups v2 resource quotas, and dynamic loopback proxying.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Anode Documentation — Bare-Metal Go Orchestration",
    description:
      "Learn how Anode compiles unmodified Go backends directly to Linux systemd and cgroups without Docker or Kubernetes.",
    url: "https://anode.abhiudayg.dev/docs",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anode Documentation — Proof-of-Topology Bare-Metal Orchestrator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anode Documentation — Bare-Metal Go Orchestration",
    description:
      "Learn how Anode compiles unmodified Go backends directly to Linux systemd and cgroups without Docker or Kubernetes.",
    images: ["/og-image.png"],
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
