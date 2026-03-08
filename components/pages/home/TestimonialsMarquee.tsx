'use client';
import { useEffect, useRef } from "react";
import gsap from "gsap";

const testimonials = [
  {
    quote: "Finally, a place for all my carnival memories!",
    author: "Keisha M.",
    location: "Port of Spain",
  },
  {
    quote: "The quality is incredible. Worth every penny.",
    author: "Marcus J.",
    location: "Brooklyn",
  },
  {
    quote: "My friends and I made one together. Best decision ever!",
    author: "Aaliyah R.",
    location: "London",
  },
  {
    quote: "This book captures the energy perfectly.",
    author: "Devon T.",
    location: "Toronto",
  },
  {
    quote: "A beautiful keepsake for generations.",
    author: "Natasha W.",
    location: "Miami",
  },
  {
    quote: "The lay-flat binding is chef's kiss!",
    author: "Andre B.",
    location: "Trinidad",
  },
];

const cardColors = [
  "bg-[hsl(70_45%_50%)] text-[hsl(0_0%_10%)]",   // Olive
  "bg-[hsl(48_95%_55%)] text-[hsl(0_0%_10%)]",   // Yellow
  "bg-[hsl(174_42%_45%)] text-[hsl(0_0%_100%)]", // Teal
  "bg-[hsl(30_90%_55%)] text-[hsl(0_0%_10%)]",   // Orange
  "bg-[hsl(210_50%_50%)] text-[hsl(0_0%_100%)]", // Blue
  "bg-[hsl(270_60%_55%)] text-[hsl(0_0%_100%)]", // Purple
];



const TestimonialsMarquee = () => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // First row - scroll left
      gsap.to(row1Ref.current, {
        xPercent: -50,
        duration: 35,
        ease: "none",
        repeat: -1,
      });

      // Second row - scroll right
      gsap.fromTo(
        row2Ref.current,
        { xPercent: -50 },
        {
          xPercent: 0,
          duration: 35,
          ease: "none",
          repeat: -1,
        }
      );
    }, marqueeRef);

    return () => ctx.revert();
  }, []);

  const TestimonialCard = ({ 
    testimonial, 
    colorClass,
  }: { 
    testimonial: typeof testimonials[0];
    colorClass: string;
  }) => (
    <div className={`flex-shrink-0 w-[320px] sm:w-[380px] mx-3 p-6 sm:p-8 rounded-2xl ${colorClass} shadow-lg`}>
      <p className="font-body text-lg sm:text-xl mb-6 leading-relaxed">
        "{testimonial.quote}"
      </p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
          <span className="font-display text-lg">
            {testimonial.author.charAt(0)}
          </span>
        </div>
        <div>
          <p className="font-body font-semibold">
            {testimonial.author}
          </p>
          <p className="font-body text-sm opacity-70">
            {testimonial.location}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section ref={marqueeRef} className="py-24 bg-coral overflow-hidden">
      <div className="text-center mb-16">
        <span className="font-handwritten text-2xl text-coral-foreground/80">
          What People Say
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-coral-foreground mt-2">
          REVELERS LOVE IT
        </h2>
      </div>

      {/* Row 1 */}
      <div className="mb-6 overflow-hidden">
        <div ref={row1Ref} className="flex w-fit">
          {[...testimonials, ...testimonials].map((t, i) => (
            <TestimonialCard 
              key={i} 
              testimonial={t} 
              colorClass={cardColors[i % cardColors.length]} 
            />
          ))}
        </div>
      </div>

      {/* Row 2 */}
      <div className="overflow-hidden">
        <div ref={row2Ref} className="flex w-fit">
          {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((t, i) => (
            <TestimonialCard 
              key={i} 
              testimonial={t} 
              colorClass={cardColors[(i + 3) % cardColors.length]} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsMarquee;