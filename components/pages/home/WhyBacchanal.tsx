"use client"  
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WhyBacchanal = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);

  const features = [
    "40+ pages of pure memories",
    "Premium matte finish paper",
    "180° lay-flat binding",
    "Linen-textured hardcover",
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Content slide in from left
      gsap.fromTo(
        contentRef.current,
        { x: -80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          },
        }
      );

      // Image slide in from right with rotation
      gsap.fromTo(
        imageRef.current,
        { x: 80, opacity: 0, rotation: 8, scale: 0.9 },
        {
          x: 0,
          opacity: 1,
          rotation: 3,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          },
        }
      );

      // Features list stagger
      const featureItems = featuresRef.current?.children;
      if (featureItems) {
        gsap.fromTo(
          featureItems,
          { x: -30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
            },
          }
        );
      }

      // Parallax on image
      gsap.to(imageRef.current, {
        y: -50,
        rotation: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-olive relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-accent rounded-full opacity-40" />
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-secondary rounded-full opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-olive-foreground">
            WHY BACCHANAL?
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left - Content */}
          <div ref={contentRef}>
            <span className="font-handwritten text-2xl text-foreground/70">Premium Quality</span>
            <h3 className="font-display text-3xl sm:text-4xl text-foreground mt-2 mb-6">
              A COVER WORTH
              <br />
              <span className="text-coral">KEEPING</span>
            </h3>
            <p className="font-body text-foreground/80 mb-8 leading-relaxed">
              Each Bacchanal book is crafted with the same care you put into your carnival experience. 
              Premium materials ensure your memories stay vibrant for generations.
            </p>

            {/* Features List */}
            <ul ref={featuresRef} className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 group">
                  <span className="w-8 h-8 rounded-full bg-coral flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Check className="w-5 h-5 text-coral-foreground" />
                  </span>
                  <span className="font-body text-foreground/90 group-hover:text-foreground transition-colors text-lg">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Image */}
          <div ref={imageRef} className="relative">
            <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src="/book-cover.jpg"
                alt="Bacchanal book cover"
                className="w-full max-w-md mx-auto rounded-xl shadow-2xl"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-coral/30 blur-3xl -z-10 scale-90" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyBacchanal;