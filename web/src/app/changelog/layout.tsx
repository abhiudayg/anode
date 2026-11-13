import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Releases & System Updates",
  description:
    "Track releases and architectural updates to Anode: Proof of Topology, Go SSA static analysis, bare-metal systemd synthesis, and dev orchestration.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Anode Changelog — Bare-Metal Go Releases",
    description:
      "Track releases and updates to Anode: Proof of Topology, Go SSA static analysis, systemd unit generation, and zero-Docker deployment.",
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
    title: "Anode Changelog — Bare-Metal Go Releases",
    description:
      "Track releases and updates to Anode: Proof of Topology, Go SSA static analysis, systemd unit generation, and zero-Docker deployment.",
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
