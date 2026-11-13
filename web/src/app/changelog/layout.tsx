import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Releases & Architecture Updates | Anode",
  description:
    "Explore the architectural evolution of Anode: 4-pillar Proof-of-Topology engine, whole-program Go SSA static analysis, bare-metal Linux systemd synthesis, and zero-collision dev orchestration.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Anode Changelog — Bare-Metal Go Orchestration Releases",
    description:
      "Track every release and update to Anode: Proof-of-Topology engine, Go SSA static analysis, systemd unit generation, and zero-Docker deployment.",
    url: "https://anode.abhiudayg.dev/changelog",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anode Changelog — Releases & Architecture Updates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anode Changelog — Bare-Metal Go Orchestration Releases",
    description:
      "Track every release and update to Anode: Proof-of-Topology engine, Go SSA static analysis, systemd unit generation, and zero-Docker deployment.",
    images: ["/og-image.png"],
  },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
