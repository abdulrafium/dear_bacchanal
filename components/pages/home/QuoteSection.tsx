'use client';
import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const QuoteSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Quote fade in with scale
      gsap.fromTo(
        quoteRef.current,
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: quoteRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={quoteRef} className="max-w-4xl mx-auto text-center">
          {/* Star Decoration */}
          <Star className="w-10 h-10 text-accent mx-auto mb-8 fill-accent" />

          {/* Quote */}
          <blockquote className="quote-large text-black mb-8">
            "Me and carnival have a contract. Every year we go hard like nail."
          </blockquote>

          {/* Attribution */}
          <p className="font-body text-black/60">
            — Trini Proverb
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuoteSection;
