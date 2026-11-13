import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Journal & Engineering Essays",
  description:
    "Deep dives into compiler-backed infrastructure, static single assignment (SSA) for distributed systems, and bare-metal Linux isolation primitives.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Anode Technical Journal — Architecture & Engineering",
    description:
      "Read engineering essays on eliminating Docker daemons, compile-time topology verification, and 8ms cold-boot systemd orchestration.",
    url: "https://anode.abhiudayg.dev/blog",
    type: "article",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anode Technical Journal — Architecture & Engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anode Technical Journal — Architecture & Engineering",
    description:
      "Read engineering essays on eliminating Docker daemons, compile-time topology verification, and 8ms cold-boot systemd orchestration.",
    images: ["/og-image.png"],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
