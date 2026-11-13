import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Releases & Architecture Updates | Anode",
  description:
    "Explore the evolution of Anode: anode doctor pre-flight checks, anode ps bare-metal process inspection, Linux cgroups v2 resource accounting, and anti-jailbreak systemd confinement.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Anode Changelog — Bare-Metal Go Orchestration Releases",
    description:
      "Track every release and update to Anode: pre-flight diagnostics, process monitoring, cgroups v2 isolation, and zero-Docker systemd deployment.",
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
      "Track every release and update to Anode: pre-flight diagnostics, process monitoring, cgroups v2 isolation, and zero-Docker systemd deployment.",
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
