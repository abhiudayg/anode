import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TopologyPipeline } from "@/components/TopologyPipeline";
import { DriftComparison } from "@/components/DriftComparison";
import { BentoPillars } from "@/components/BentoPillars";
import { BenchmarkSection } from "@/components/BenchmarkSection";
import { QuickstartSection } from "@/components/QuickstartSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090b] text-[#f3f4f6] selection:bg-cyan-500/30 selection:text-white relative bg-grid-pattern">
      <Navbar />
      <Hero />
      <TopologyPipeline />
      <DriftComparison />
      <BentoPillars />
      <BenchmarkSection />
      <QuickstartSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
