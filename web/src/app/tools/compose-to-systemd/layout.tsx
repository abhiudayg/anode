import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compose to Systemd Converter — Free Tool",
  description:
    "Convert docker-compose.yml files directly into hardened Linux systemd service unit files with cgroups v2 quotas.",
  alternates: {
    canonical: "/tools/compose-to-systemd",
  },
  openGraph: {
    title: "Compose to Systemd Converter — Free Tool | Anode",
    description:
      "Convert docker-compose.yml into production-ready systemd unit files.",
    url: "https://anode.abhiudayg.dev/tools/compose-to-systemd",
  },
};

export default function ComposeToSystemdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
