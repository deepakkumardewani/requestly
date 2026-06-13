import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { TrustStrip } from "./TrustStrip";
import { FeatureShowcase } from "./FeatureShowcase";
import { ComparisonTable } from "./ComparisonTable";
import { HowItWorks } from "./HowItWorks";
import { ScreenshotGallery } from "./ScreenshotGallery";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <>
      <Nav />
      <main id="app-main">
        <Hero />
        <TrustStrip />
        <FeatureShowcase />
        <ScreenshotGallery />
        <ComparisonTable />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
