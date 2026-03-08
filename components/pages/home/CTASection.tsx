'use client';

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const CTASection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Content scale up animation
      gsap.fromTo(
        contentRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 85%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-32 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(174 50% 35%) 0%, hsl(180 40% 25%) 100%)",
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={contentRef} className="max-w-3xl mx-auto text-center">
          <span className="font-handwritten text-2xl text-secondary-foreground/70">
            Don't let the memories fade
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-secondary-foreground mt-4 mb-6">
            READY TO
            <br />
            <span className="text-accent">PRESERVE YOUR MEMORIES?</span>
          </h2>
          <p className="font-body text-secondary-foreground/70 mb-10 max-w-xl mx-auto">
            It's time to turn your carnival photos into a beautiful keepsake that lasts forever.
          </p>

          <Button variant="accent" size="xl" asChild>
            <Link href="/editor">Start Customizing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
