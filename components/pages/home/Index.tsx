"use client";
import useLenis from "@/hooks/useLenis";
import HeroSection from "./HeroSection";
import BookShowcase from "./BookShowcase";
import FeaturesGrid from "./FeaturesGrid";
import InsideYourBook from "./InsideYourBook";
import HowItWorks from "./HowItWorks";
import TestimonialsMarquee from "./TestimonialsMarquee";
import WhyBacchanal from "./WhyBacchanal";
import QuoteSection from "./QuoteSection";
import CTASection from "./CTASection";
import Premium from "./Premium";

const Index = () => {
  // Initialize Lenis smooth scroll
  useLenis();

  return (
    <>
      <HeroSection />
      <BookShowcase />
      <FeaturesGrid />

      {/* Stacking sections - higher z-index than navbar (z-50) */}
      <div className="lg:relative lg:z-[60]">
        <section className="lg:sticky lg:top-0 z-[61]">
          <InsideYourBook />
        </section>

        <section className="lg:sticky lg:top-0 z-[62]">
          <HowItWorks />
        </section>

        <section className="lg:sticky lg:top-0 z-[63]">
          <TestimonialsMarquee />
        </section>
        <section className="lg:sticky lg:top-0 z-[64]">
          <Premium />
        </section>
        <section className="lg:sticky lg:top-0 z-[65]">
          <WhyBacchanal />
        </section>
      </div>

      <QuoteSection />
      <CTASection />
    </>
  );
};

export default Index;
