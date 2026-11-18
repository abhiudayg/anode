import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArchitectureView } from "./ArchitectureView";

export const metadata: Metadata = {
  title: "Architecture | Anode Proof-of-Topology",
  description:
    "How Anode uses Go SSA compiler analysis to extract infrastructure topology into a deterministic contract lockfile and bare-metal systemd runtime without Docker.",
  alternates: {
    canonical: "/architecture",
  },
};

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-[#000000] text-white relative">
      <Navbar />
      <ArchitectureView />
      <Footer />
    </main>
  );
}
