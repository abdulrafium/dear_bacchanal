"use client"
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Book3DFlip from "./Book3DFlip";
import SplitText from "@/components/layout/SplitText";

gsap.registerPlugin(ScrollTrigger);

const BookShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            end: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Book entrance animation
      gsap.fromTo(
        bookRef.current,
        { y: 100, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bookRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Subtle parallax on book
      gsap.to(bookRef.current, {
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-coral relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Text Content */}
          <div ref={titleRef} className="text-center lg:text-left">
            <span className="font-handwritten text-2xl text-coral-foreground/70">
              Interactive Preview
            </span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-coral-foreground mt-2">
              <SplitText animation="words" stagger={0.1} className="inline">
                FLIP THROUGH YOUR MEMORIES
              </SplitText>
            </h2>
            <p className="font-body text-coral-foreground/60 mt-4 max-w-xl mx-auto lg:mx-0">
              Hover over the book to see the 3D effect, click to open and browse through the pages.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              {[
                { label: "Lay-Flat Binding", desc: "Seamless spreads" },
                { label: "Premium Paper", desc: "Vibrant colors" },
                { label: "Hardcover", desc: "Built to last" },
                { label: "Custom Layouts", desc: "Your way" },
              ].map((item, index) => (
                <div 
                  key={item.label} 
                  className="text-coral-foreground text-center lg:text-left"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <p className="font-display text-lg mb-1">{item.label}</p>
                  <p className="font-body text-sm opacity-70">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - 3D Book */}
          <div ref={bookRef} className="flex justify-center lg:justify-end">
            <Book3DFlip />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookShowcase;
