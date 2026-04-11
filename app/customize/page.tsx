"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  FolderHeart,
  Users,
  Sparkles,
  ArrowRight,
  Play,
  Star,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

const CustomizeRitual = () => {
  const heroRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuth();
  const { openModal } = useAuthModal();
  const router = useRouter();

  const handleAction = () => {
    if (isAuthenticated) {
      router.push("/editor");
    } else {
      openModal("signup");
    }
  };

  const steps = [
    {
      icon: Camera,
      num: "01",
      title: "Collect",
      subtitle: "Your Photos",
      description: "Gather your best carnival moments from every source.",
    },
    {
      icon: Users,
      num: "02",
      title: "Gather",
      subtitle: "From Friends",
      description: "The best shots are always in someone else's phone.",
    },
    {
      icon: FolderHeart,
      num: "03",
      title: "Curate",
      subtitle: "Your Favorites",
      description: "Select the moments that matter most to you.",
    },
    {
      icon: Sparkles,
      num: "04",
      title: "Create",
      subtitle: "Your Book",
      description: "Transform memories into a timeless keepsake.",
    },
  ];

  const tips = [
    "Dig through WhatsApp groups",
    "Ask fete photographers",
    "Include voice note screenshots",
    "Pre-carnival photos matter",
    "Document jouvert to last lap",
    "Save wristbands & receipts",
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ========== HERO ANIMATIONS ==========
      const heroTl = gsap.timeline({ delay: 0.3 });

      // Decorative circles scale in
      heroTl.fromTo(
        ".hero-circle",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1.5,
          stagger: 0.2,
          ease: "power2.out",
        }
      );

      // Tag slides in with line animation
      heroTl.fromTo(
        ".hero-tag-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.6, ease: "power2.inOut" },
        0.2
      );
      heroTl.fromTo(
        ".hero-tag-text",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        0.5
      );

      // Title words - dramatic clip reveal
      heroTl.fromTo(
        ".hero-title-word",
        { y: 120, opacity: 0, rotateX: -40 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power4.out",
        },
        0.4
      );

      // Divider elements
      heroTl.fromTo(
        ".hero-divider-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, stagger: 0.1, ease: "power2.inOut" },
        "-=0.3"
      );
      heroTl.fromTo(
        ".hero-divider-star",
        { scale: 0, rotate: -180 },
        { scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)" },
        "-=0.3"
      );

      // Description fade up
      heroTl.fromTo(
        ".hero-desc",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );

      // CTA buttons pop in
      heroTl.fromTo(
        ".hero-cta-btn",
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: "back.out(1.5)",
        },
        "-=0.3"
      );

      // Scroll indicator
      heroTl.fromTo(
        ".scroll-indicator",
        { opacity: 0, y: -20 },
        { opacity: 0.6, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.2"
      );

      // Parallax on hero circles during scroll
      gsap.to(".hero-circle-1", {
        y: -100,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(".hero-circle-2", {
        y: -60,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      // Video zoom on scroll
      gsap.to(".hero-video", {
        scale: 1.2,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // ========== STEPS SECTION ANIMATIONS ==========
      // Section header
      gsap.fromTo(
        ".steps-header-tag",
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".steps-section", start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".steps-header-title",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".steps-section", start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".steps-header-desc",
        { x: 50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: { trigger: ".steps-section", start: "top 80%" },
        }
      );

      // Step cards with 3D rotation
      const stepCards = stepsRef.current?.querySelectorAll(".step-card");
      if (stepCards) {
        stepCards.forEach((card, index) => {
          gsap.fromTo(
            card,
            {
              y: 100,
              opacity: 0,
              rotateY: index % 2 === 0 ? -15 : 15,
              scale: 0.9,
            },
            {
              y: 0,
              opacity: 1,
              rotateY: 0,
              scale: 1,
              duration: 1,
              delay: index * 0.15,
              ease: "power3.out",
              scrollTrigger: { trigger: stepsRef.current, start: "top 75%" },
            }
          );

          // Icon pop animation
          gsap.fromTo(
            card.querySelector(".step-icon"),
            { scale: 0, rotate: -30 },
            {
              scale: 1,
              rotate: 0,
              duration: 0.6,
              delay: 0.4 + index * 0.15,
              ease: "back.out(2)",
              scrollTrigger: { trigger: stepsRef.current, start: "top 75%" },
            }
          );
        });
      }

      // ========== TIPS SECTION ANIMATIONS ==========
      // Section header
      gsap.fromTo(
        ".tips-header",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".tips-section", start: "top 80%" },
        }
      );

      // Tips items alternating slide
      const tipCards = tipsRef.current?.querySelectorAll(".tip-card");
      if (tipCards) {
        tipCards.forEach((card, index) => {
          gsap.fromTo(
            card,
            { x: index % 2 === 0 ? -80 : 80, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              delay: index * 0.1,
              ease: "power3.out",
              scrollTrigger: { trigger: tipsRef.current, start: "top 80%" },
            }
          );
        });
      }

      // ========== CTA SECTION ANIMATIONS ==========
      // Quote mark
      gsap.fromTo(
        ".cta-quote-mark",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".cta-section", start: "top 75%" },
        }
      );

      // Quote text word reveal
      gsap.fromTo(
        ".cta-quote-line",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: { trigger: ".cta-section", start: "top 75%" },
        }
      );

      // CTA button
      gsap.fromTo(
        ".cta-button",
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          delay: 0.6,
          ease: "back.out(1.7)",
          scrollTrigger: { trigger: ".cta-section", start: "top 75%" },
        }
      );

      // Trust badges stagger
      gsap.fromTo(
        ".trust-badge",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: ".cta-section", start: "top 75%" },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* HERO - Vibrant Carnival Theme */}
      <section
        ref={heroRef}
        className="relative pt-10 min-h-screen flex items-center overflow-hidden bg-background"
      >
        {/* Colorful decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between min-h-[calc(100vh-80px)] py-12">
            {/* Left Content */}
            <div className="w-full lg:w-3/5 text-center lg:text-left order-2 lg:order-1">
              {/* Tag */}
              <div className="hero-tag inline-flex items-center gap-3 mb-6">
                <span className="w-8 h-1 bg-primary rounded-full" />
                <span className="font-body text-xs tracking-[0.3em] uppercase text-primary font-medium">
                  Bacchanal Books
                </span>
              </div>

              {/* Title */}
              <h1 className="hero-title font-display leading-[1.1] mb-8 pb-3">
                <span className="hero-title-word block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground">
                  YOUR
                </span>
                <span className="hero-title-word block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary">
                  CARNIVAL
                </span>
                <span className="hero-title-word block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground">
                  STORY
                </span>
              </h1>

              {/* Description */}
              <p className="hero-desc font-body text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0">
                Transform your carnival memories into a beautiful photo book
                keepsake that lasts forever. Expertly designed to showcase your best moments.
              </p>

              {/* CTAs */}
              <div className="hero-cta flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                  <Button
                    variant="carnival"
                    size="xl"
                    onClick={handleAction}
                    className="hero-cta-btn w-full sm:w-auto text-base px-10 py-7 shadow-carnival"
                  >
                    <span className="flex items-center gap-3">
                      Create Your Book
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                <Button
                  variant="outline"
                  size="xl"
                  asChild
                  className="hero-cta-btn w-full sm:w-auto border-2 border-foreground/20 hover:bg-foreground/5 py-7"
                >
                  <Link href="/templates" className="flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Watch Preview
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Visual - Clean Stacked Books */}
            <div className="w-full lg:w-2/5 relative flex items-center justify-center order-1 lg:order-2 mb-12 lg:mb-0">
              {/* Background shape */}
              <div className="absolute w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] bg-primary/10 rounded-full blur-3xl animate-pulse" />

              {/* Stacked book cards */}
              <div className="relative w-[240px] sm:w-[300px] h-[320px] sm:h-[400px]">
                {/* Back card */}
                <div className="absolute top-6 -left-6 w-full h-full rounded-2xl bg-secondary/20 shadow-lg rotate-[-6deg] transition-transform hover:rotate-[-8deg]" />

                {/* Middle card */}
                <div className="absolute top-3 -left-3 w-full h-full rounded-2xl bg-accent/30 shadow-lg rotate-[-3deg] transition-transform hover:rotate-[-5deg]" />

                {/* Front card - main book */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-background group cursor-pointer transition-all hover:scale-[1.02]">
                  <img
                    src="https://images.unsplash.com/photo-1544450181-29a848a25358?q=80&w=2070&auto=format&fit=crop"
                    alt="Carnival Photo Book"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Book label */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="font-handwritten text-3xl text-white block mb-1">
                      Your Story
                    </span>
                    <p className="font-body text-sm text-white/80 font-medium tracking-widest uppercase">
                      Carnival 2026
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE RITUAL - Mystical Carnival Vibes */}
      <section className="steps-section py-24 md:py-32 bg-olive relative overflow-hidden">
        {/* Mystical background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--accent)/0.08)_0%,transparent_50%)]" />

        {/* Floating mystical circles */}
        <div className="absolute top-20 left-10 w-64 h-64 border border-primary/10 rounded-full opacity-30" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border border-accent/10 rounded-full opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-background/5 rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <div className="steps-header-tag inline-flex items-center gap-4 mb-4">
              <span className="w-12 h-px bg-gradient-to-r from-transparent to-black/30" />
              <Sparkles className="w-5 h-5 text-black/70" />
              <span className="w-12 h-px bg-gradient-to-l from-transparent to-black/30" />
            </div>
            <h2 className="steps-header-title font-display text-5xl sm:text-6xl md:text-8xl text-black tracking-tight">
              THE RITUAL
            </h2>
            <p className="font-handwritten text-xl md:text-2xl text-black/60 mt-4">
              Four sacred steps to immortalize your carnival spirit
            </p>
          </div>

          {/* Ritual Steps - Vertical Stack */}
          <div ref={stepsRef} className="max-w-4xl mx-auto space-y-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={step.num}
                  className={`step-card group relative flex flex-col md:flex-row items-center gap-8 md:gap-16 py-12 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 md:left-auto md:right-1/2 bottom-0 w-px h-12 bg-gradient-to-b from-black/20 to-transparent translate-y-full" />
                  )}

                  {/* Number & Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="step-icon w-28 h-28 md:w-36 md:h-36 rounded-full  bg-white flex items-center justify-center  ">
                      <span className="font-display text-5xl md:text-7xl text-gray-700  transition-colors">
                        {step.num}
                      </span>
                    </div>
                    {/* Floating icon */}
                    <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg">
                      <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`text-center md:text-left ${
                      !isEven ? "md:text-right" : ""
                    } flex-1`}
                  >
                    <span className="font-body text-xs tracking-[0.3em] uppercase text-black/50 mb-2 block">
                      Step {step.num}
                    </span>
                    <h3 className="font-display text-3xl md:text-4xl text-black mb-3">
                      {step.title}
                    </h3>
                    <p className="font-body text-black/70 text-base md:text-lg leading-relaxed max-w-md">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom mystical CTA */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="w-16 h-px bg-gradient-to-r from-transparent to-black/20" />
              <Star className="w-4 h-4 text-black/40" />
              <span className="w-16 h-px bg-gradient-to-l from-transparent to-black/20" />
            </div>
            <p className="font-handwritten text-xl text-black/50 mb-6">
              Begin your transformation
            </p>
            <Button variant="default" size="xl" onClick={handleAction} className="shadow-xl">
              <span className="flex items-center gap-3">
                Start The Ritual
                <Sparkles className="w-5 h-5" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* SECRETS - Scattered Pills on Accent */}
      <section className="tips-section py-24 md:py-32 bg-accent relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header - Centered */}
          <div className="tips-header text-center mb-16">
            <span className="inline-block font-body text-xs tracking-[0.4em] uppercase text-black/40 mb-4">
              Insider Knowledge
            </span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-7xl text-black">
              SECRETS
            </h2>
            <p className="font-handwritten text-xl md:text-2xl text-black/50 mt-4">
              from carnival veterans
            </p>
          </div>

          {/* Scattered Pills */}
          <div
            ref={tipsRef}
            className="relative max-w-5xl mx-auto
             flex flex-col gap-4
             lg:block
             min-h-[auto] lg:min-h-[500px]"
          >
            {tips.map((tip, index) => {
              // Positions ONLY for lg+
              const positions = [
                "lg:top-0 lg:left-10",
                "lg:top-4 lg:right-20",
                "lg:top-40 lg:left-32",
                "lg:top-44 lg:right-0",
                "lg:bottom-20 lg:left-16",
                "lg:bottom-0 lg:right-32",
              ];

              const rotations = [
                "lg:rotate-[-3deg]",
                "lg:rotate-[2deg]",
                "lg:rotate-[-2deg]",
                "lg:rotate-[3deg]",
                "lg:rotate-[-1deg]",
                "lg:rotate-[2deg]",
              ];

              const sizes = [
                "text-sm md:text-base",
                "text-base md:text-lg",
                "text-sm md:text-base",
                "text-base md:text-lg",
                "text-sm",
                "text-sm md:text-base",
              ];

              return (
                <div
                  key={index}
                  className={`
          tip-card
          relative lg:absolute
          flex justify-center
          ${positions[index]}
          ${rotations[index]}
        `}
                >
                  <div className="bg-background rounded-full px-6 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-border/50 max-w-xs md:max-w-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-display text-sm text-primary">
                          {index + 1}
                        </span>
                      </span>
                      <p
                        className={`font-body text-foreground ${sizes[index]} leading-snug`}
                      >
                        {tip}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA - Bold Statement */}
      <section className="cta-section py-32 bg-secondary  relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="cta-content container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Quote */}
            <blockquote className="relative">
              <span className="cta-quote-mark absolute -top-16 left-1/2 -translate-x-1/2 font-display text-[12rem] text-gray-200/20 leading-none">
                "
              </span>
              <p className="font-handwritten text-4xl sm:text-5xl md:text-6xl text-white leading-tight overflow-hidden">
                <span className="cta-quote-line block">
                  Bacchanal isn't just a book—
                </span>
                <span className="cta-quote-line block text-primary">
                  it's how we remember.
                </span>
              </p>
            </blockquote>

            {/* CTA */}
            <div className="mt-16">
              <Button
                variant="accent"
                size="xl"
                onClick={handleAction}
                className="cta-button group text-lg px-10 py-7"
              >
                <div className="flex items-center gap-3">
                  Create Your Book
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-background/40">
              <div className="trust-badge text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-body text-sm">Premium Quality</span>
              </div>
              <div className="trust-badge text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-body text-sm">Fast Delivery</span>
              </div>
              <div className="trust-badge text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-body text-sm">100% Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CustomizeRitual;
