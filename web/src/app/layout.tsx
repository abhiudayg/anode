import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://anode.abhiudayg.dev"),
  title: {
    default: "Anode — Deploy unmodified Go backends to Linux VPS without Docker or Kubernetes",
    template: "%s | Anode",
  },
  description:
    "The 4-Pillar Proof-of-Topology Engine. Compiles Go SSA call graphs directly to bare-metal systemd, cgroups v2, and ephemeral loopbacks with 8ms cold boots and 97% lower memory overhead.",
  keywords: [
    "Go",
    "Golang",
    "orchestrator",
    "bare metal",
    "VPS",
    "systemd",
    "cgroups v2",
    "static single assignment",
    "SSA",
    "Docker alternative",
    "Kubernetes alternative",
    "Hetzner",
    "DigitalOcean",
    "infrastructure from code",
    "DevOps",
    "cloud alternative",
    "compile time verification",
  ],
  authors: [{ name: "Abhiuday", url: "https://github.com/abhiudayg" }],
  creator: "Abhiuday",
  publisher: "Anode",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anode.abhiudayg.dev",
    siteName: "Anode",
    title: "Anode — Deploy unmodified Go backends to Linux VPS without Docker or Kubernetes",
    description:
      "The 4-Pillar Proof-of-Topology Engine. Compiles Go SSA call graphs directly to bare-metal systemd, cgroups v2, and ephemeral loopbacks with 8ms cold-boots.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anode — Proof-of-Topology Bare-Metal Orchestrator for Go",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anode — Deploy unmodified Go backends to Linux VPS without Docker or Kubernetes",
    description:
      "The 4-Pillar Proof-of-Topology Engine. Zero Docker. Zero Kubernetes. 8ms cold boot, 4.8MB RAM, 100% deterministic SSA static topology.",
    images: ["/og-image.png"],
    creator: "@abhiudayg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Anode",
  "operatingSystem": "Linux",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description":
    "Compiler-backed Go bare-metal VPS orchestrator. Zero Docker, zero Kubernetes. Compiles SSA call graphs to systemd & cgroups v2.",
  "url": "https://anode.abhiudayg.dev",
  "downloadUrl": "https://github.com/abhiudayg/anode",
  "softwareVersion": "1.0.0",
  "author": {
    "@type": "Person",
    "name": "Abhiuday",
    "url": "https://github.com/abhiudayg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#08090b] text-[#f3f4f6] min-h-screen">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
