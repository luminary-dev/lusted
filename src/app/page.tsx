import Hero from "@/components/Hero";
import SaleSection from "@/components/SaleSection";
import Collections from "@/components/Collections";
import BestSellers from "@/components/BestSellers";
import About from "@/components/About";
import SizeGuide from "@/components/SizeGuide";
import HowItWorks from "@/components/HowItWorks";
import Ordering from "@/components/Ordering";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <SaleSection />
      <Collections />
      <BestSellers />
      <SizeGuide />
      <About />
      <HowItWorks />
      <Ordering />
      <Contact />
    </main>
  );
}
