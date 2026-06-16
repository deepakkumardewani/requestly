"use client";

import { AnimatedContent, BlurText } from "@/components/reactbits";
import { FEATURES } from "./data/features";
import { Footer } from "./Footer";
import { FeaturesGrid } from "./features/FeaturesGrid";
import { Nav } from "./Nav";

export function AllFeaturesPage() {
  return (
    <>
      <Nav />
      <main id="app-main" className="overflow-x-hidden pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedContent direction="up">
            <div className="mb-10 max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                <BlurText
                  text="Built for builders."
                  as="span"
                  duration={0.45}
                />{" "}
                <BlurText
                  text="Every tool included."
                  as="span"
                  className="text-muted-foreground"
                  duration={0.45}
                  delay={0.12}
                />
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                From JSON transforms to visual chains — everything you need to
                test APIs in the browser, with no install and no account.
              </p>
            </div>
          </AnimatedContent>

          <AnimatedContent direction="up" delay={0.1}>
            <FeaturesGrid features={FEATURES} />
          </AnimatedContent>
        </div>
      </main>
      <Footer />
    </>
  );
}
