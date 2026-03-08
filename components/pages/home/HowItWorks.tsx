'use client';


import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Upload, Palette, Truck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "COLLECT PHOTOS",
      description: "Gather your best carnival moments from your phone and friends",
      color: "bg-coral",
    },
    {
      number: "02",
      icon: Palette,
      title: "CHOOSE LAYOUT",
      description: "Pick from beautiful pre-designed templates or create your own",
      color: "bg-secondary",
    },
    {
      number: "03",
      icon: Truck,
      title: "RECEIVE BOOK",
      description: "We print and ship your premium photo book right to your door",
      color: "bg-accent",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
          },
        }
      );

      // Animate connecting line
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: stepsRef.current,
            start: "top 70%",
          },
        }
      );

      // Steps animation with bounce
      const stepElements = stepsRef.current?.querySelectorAll(".step-item");
      if (stepElements) {
        stepElements.forEach((step, index) => {
          const icon = step.querySelector(".step-icon");
          const content = step.querySelector(".step-content");
          
          // Icon bounces in
          gsap.fromTo(
            icon,
            { scale: 0, rotate: -180 },
            {
              scale: 1,
              rotate: 0,
              duration: 0.8,
              delay: index * 0.2,
              ease: "back.out(2)",
              scrollTrigger: {
                trigger: stepsRef.current,
                start: "top 75%",
              },
            }
          );

          // Content slides up
          gsap.fromTo(
            content,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: index * 0.2 + 0.3,
              ease: "power2.out",
              scrollTrigger: {
                trigger: stepsRef.current,
                start: "top 75%",
              },
            }
          );
        });
      }

      // Hover animations
      const icons = sectionRef.current?.querySelectorAll(".step-icon");
      icons?.forEach((icon) => {
        icon.addEventListener("mouseenter", () => {
          gsap.to(icon, { 
            scale: 1.1, 
            rotate: 10, 
            duration: 0.3,
            ease: "power2.out",
          });
        });
        icon.addEventListener("mouseleave", () => {
          gsap.to(icon, { 
            scale: 1, 
            rotate: 0, 
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-accent relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-coral rounded-full opacity-50" />
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary rounded-full opacity-40" />
      <div className="absolute top-1/2 right-10 w-16 h-16 bg-olive rounded-full opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-24">
          <span className="font-handwritten text-black/70 text-2xl ">Simple Process</span>
          <h2 className="font-display text-black text-4xl sm:text-5xl md:text-6xl  mt-2">
            HOW IT WORKS
          </h2>
        </div>

        {/* Steps */}
        <div ref={stepsRef} className="relative max-w-5xl mx-auto">
          {/* Connecting Line */}
          <div 
            ref={lineRef}
            className="hidden md:block absolute top-16 left-[15%] right-[15%] h-1 bg-foreground/20 origin-left"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="step-item  text-center relative">
                  {/* Icon Circle */}
                  <div 
                    className={`step-icon ${step.color} w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg cursor-pointer`}
                  >
                    <Icon className="w-14 h-14 text-black" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="step-content">
                    <span className="font-display text-5xl  text-black/20">
                      {step.number}
                    </span>
                    <h3 className="font-display text-xl text-black mt-2 mb-3">
                      {step.title}
                    </h3>
                    <p className="font-body text-black/70 text-sm leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;