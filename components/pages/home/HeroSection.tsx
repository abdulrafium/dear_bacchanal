"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleWordsRef = useRef<HTMLSpanElement[]>([]);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image zoom effect on scroll
      gsap.fromTo(
        bgRef.current,
        { scale: 1 },
        {
          scale: 1.3,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        }
      );

      // Title words animation - staggered reveal
      const titleWords = titleWordsRef.current;
      gsap.fromTo(
        titleWords,
        {
          y: 120,
          opacity: 0,
          rotateX: -90,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1.2,
          stagger: 0.15,
          ease: "power4.out",
          delay: 0.3,
        }
      );

      // Tagline animation
      gsap.fromTo(
        taglineRef.current,
        {
          y: 50,
          opacity: 0,
          clipPath: "inset(100% 0 0 0)",
        },
        {
          y: 0,
          opacity: 1,
          clipPath: "inset(0% 0 0 0)",
          duration: 1,
          ease: "power3.out",
          delay: 1,
        }
      );

      // Description animation
      gsap.fromTo(
        descRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 1.3,
        }
      );

      // CTA animation with bounce
      gsap.fromTo(
        ctaRef.current,
        { y: 40, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: 1.5,
        }
      );

      // Fade out content on scroll
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -100,
        ease: "power2.in",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "30% top",
          end: "80% top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleWords = ["WELCOME", "TO", "BACCHANAL"];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background with Zoom Effect */}
      <div className="absolute inset-0">
        <div ref={bgRef} className="absolute inset-0 w-full h-full">
          <Image
            fill
            src="/hero-carnival.jpg"
            alt="Carnival celebration atmosphere"
            className="object-cover"
            priority
          />
        </div>

        {/* Layered Overlays for Depth */}
        {/* Dark gradient from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Blur overlay for depth */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-black/80" />

        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

        {/* Animated gradient pulse */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-pink-500/10 to-orange-500/10 animate-pulse-subtle opacity-60" />
      </div>

      {/* Floating particles with carnival colors */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${5 + Math.random() * 90}%`,
              top: `${5 + Math.random() * 90}%`,
              background: [
                "rgba(255, 107, 107, 0.4)",
                "rgba(255, 193, 7, 0.4)",
                "rgba(156, 39, 176, 0.4)",
                "rgba(3, 169, 244, 0.4)",
              ][Math.floor(Math.random() * 4)],
              animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32"
      >
        <div className="max-w-5xl mx-auto">
          {/* Date Badge */}
          {/* <div className="inline-block mb-8 overflow-hidden">
            <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-md text-white font-body text-sm font-semibold px-8 py-3 rounded-full shadow-lg shadow-purple-500/30 animate-slide-up border border-white/20">
              15 – 16 February 2026
            </span>
          </div> */}

          {/* Main Title - 3D text animation */}
          <h1
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-9xl text-white mb-8 leading-tight drop-shadow-2xl"
            style={{ perspective: "1000px" }}
          >
            {titleWords.map((word, index) => (
              <span
                key={index}
                ref={(el) => {
                  if (el) titleWordsRef.current[index] = el;
                }}
                className={`inline-block mx-2 sm:mx-3 ${word === "BACCHANAL"
                    ? "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent"
                    : ""
                  }`}
                style={{
                  transformStyle: "preserve-3d",
                  textShadow:
                    word === "BACCHANAL"
                      ? "0 0 30px rgba(255,107,107,0.5)"
                      : "0 4px 20px rgba(0,0,0,0.8)",
                }}
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Tagline */}
          <p
            ref={taglineRef}
            className="font-handwritten text-2xl sm:text-3xl md:text-4xl text-gray-100 mb-8 drop-shadow-lg"
          >
            A celebration doesn't end when the music fades.
          </p>

          {/* Description */}
          <p
            ref={descRef}
            className="font-body text-base sm:text-lg text-gray-200 max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow-md"
          >
            Bacchanal is a customizable, curated photo book designed to preserve
            the energy, color, and emotion of carnival—long after the last dance.
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="space-x-4">
            <Button
              variant="carnival"
              size="xl"
              asChild
              className="shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 transition-all duration-300"
            >
              <Link href="/editor">Customize Your Book</Link>
            </Button>
          </div>



          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce-subtle">
            <span className="font-handwritten text-gray-300 text-lg drop-shadow-md">
              Scroll to explore
            </span>
            <div className="w-px h-16 bg-gradient-to-b from-white/60 to-transparent mx-auto mt-3" />
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
    </section>
  );
};

export default HeroSection;