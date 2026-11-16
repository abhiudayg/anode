import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { EcosystemBar } from "@/components/EcosystemBar";
import { Benchmarks } from "@/components/Benchmarks";
import { DriftComparison } from "@/components/DriftComparison";
import { BentoPillars } from "@/components/BentoPillars";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { MainOrangeArrow } from "@/components/MainOrangeArrow";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#000000] text-white selection:bg-white/20 selection:text-white relative bg-grid-pattern">
      <Navbar />
      <MainOrangeArrow />
      <Hero />
      <EcosystemBar />
      <Benchmarks />
      <DriftComparison />
      <BentoPillars />
      <FAQSection />
      <Footer />
    </main>
  );
}
