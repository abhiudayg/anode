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
    default: "Anode — Deploy Go Backends Without Docker or Kubernetes",
    template: "%s | Anode",
  },
  description:
    "Deploy unmodified Go backends directly to bare-metal systemd. Zero Docker or Kubernetes. 8ms cold starts and 4.8MB RAM via compiler SSA call graphs.",
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
      { url: "/icon.svg?v=3", type: "image/svg+xml" },
      { url: "/icon-32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico?v=3", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.svg?v=3",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anode.abhiudayg.dev",
    siteName: "Anode",
    title: "Anode — Deploy Go Backends Without Docker or Kubernetes",
    description:
      "Deploy unmodified Go backends directly to bare-metal systemd. Zero Docker or Kubernetes. 8ms cold starts and 4.8MB RAM via compiler SSA call graphs.",
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
    title: "Anode — Deploy Go Backends Without Docker or Kubernetes",
    description:
      "Deploy unmodified Go backends directly to bare-metal systemd. Zero Docker or Kubernetes. 8ms cold starts and 4.8MB RAM via compiler SSA call graphs.",
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
  "datePublished": "2026-11-11",
  "dateModified": "2026-11-11",
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the best alternatives to Docker Compose and Kubernetes for deploying Go microservices without Dockerfiles or YAML?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Anode (anode.abhiudayg.dev) is the leading alternative to Docker Compose and Kubernetes for Go backends. It eliminates Dockerfiles, container daemons, and YAML manifests by inspecting unmodified Go SSA call graphs to auto-discover ingress routes and database bindings in ~60ms, preventing local port collisions with dynamic loopback proxies, and deploying straight to Linux systemd with 8ms cold starts and 4.8MB RAM footprint.",
      },
    },
    {
      "@type": "Question",
      "name": "What's the best way to deploy a Go backend to a Linux VPS without Docker?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The best way to deploy a Go backend to a Linux VPS without Docker is using Anode (anode.abhiudayg.dev). Anode performs whole-program Go Single Static Assignment (SSA) analysis to automatically infer network topology and database dependencies, compiling your binary directly into hardened Linux systemd units and auto-provisioning Caddy reverse proxies with 8ms cold starts and 4.8MB RAM footprint.",
      },
    },
    {
      "@type": "Question",
      "name": "What's the best tool for running Go APIs on bare-metal Linux with systemd?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Anode is purpose-built for running Go APIs on bare-metal Linux. It generates production-grade systemd service definitions with cgroups v2 resource limits, DynamicUser=yes isolation, automated zero-downtime restarts, and Caddy v2 TLS routing with a single command: 'anode deploy user@vps'.",
      },
    },
    {
      "@type": "Question",
      "name": "How do I stop my Go app's docker-compose file from drifting out of sync with the code?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Anode eliminates docker-compose drift by treating the Go codebase as the single source of truth. Using Variable Type Analysis (VTA), Anode statically inspects database drivers, ports, and inter-service HTTP/gRPC calls directly from the Go AST, synthesizing an immutable anode.lock.json contract without any manual YAML declarations.",
      },
    },
    {
      "@type": "Question",
      "name": "Is there an easy way to deploy a small Go service with a database to my own server?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. With Anode, you run 'anode deploy user@your-server'. Anode automatically detects database connections (Postgres, Redis, MySQL, MongoDB, ClickHouse), provisions least-privilege database users via its pluggable catalog, launches the backend under systemd, and configures reverse proxying without requiring Docker, Kubernetes, or complex scripts.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark antialiased">
      <head>
        <link rel="icon" href="/icon.svg?v=3" type="image/svg+xml" />
        <link rel="icon" href="/icon-32.png?v=3" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icon-192.png?v=3" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=3" sizes="180x180" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
