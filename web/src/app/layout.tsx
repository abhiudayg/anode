import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Anode — Deploy unmodified Go backends to Linux VPS without Docker or Kubernetes",
  description: "The 4-Pillar Proof-of-Topology Engine. Compiles call graphs directly to bare-metal systemd, cgroups v2, and ephemeral loopbacks.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#08090b] text-[#f3f4f6]">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
