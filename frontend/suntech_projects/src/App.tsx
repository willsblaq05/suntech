import { Footer } from "./components/layout/Footer";
import { Navbar } from "./components/layout/Navbar";
import { Hero } from "./components/sections/Hero";
import { TrustSection } from "./components/sections/TrustSection";
import { SegmentCards } from "./components/sections/SegmentCards";
import { HowItWorks } from "./components/sections/HowItWorks";
import { FinalCta } from "./components/sections/FinalCta";

const SKIP_LINK_CLASSES =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white";

function App() {
  return (
    <>
      <a href="#main" className={SKIP_LINK_CLASSES}>
        Skip to main content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustSection />
        <SegmentCards />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
