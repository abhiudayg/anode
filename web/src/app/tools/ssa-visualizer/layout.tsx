import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Go SSA Topology Visualizer — Free Tool",
  description:
    "Live browser-based Static Single Assignment (SSA) visualizer. Paste Go code and see instant architecture topologies and systemd units.",
  alternates: {
    canonical: "/tools/ssa-visualizer",
  },
  openGraph: {
    title: "Go SSA Topology Visualizer | Anode",
    description:
      "Live browser-based Static Single Assignment (SSA) visualizer for Go backends.",
    url: "https://anode.abhiudayg.dev/tools/ssa-visualizer",
  },
};

export default function SSAVisualizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
