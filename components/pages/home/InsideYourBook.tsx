"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const InsideYourBook = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);

  const images = [
    { src: "/spread-1.jpg", title: "Capturing the Dance", subtitle: "Monday | Parade" },
    { src: "/spread-2.jpg", title: "The Street Party", subtitle: "Tuesday | Celebrations" },
    { src: "/spread-3.jpg", title: "Jouvert Morning", subtitle: "Paint | Powder | Joy" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title fade in
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

      // Images animation with responsive adjustments
      const imageItems = imagesRef.current?.querySelectorAll(".image-item");
      if (imageItems) {
        const isMobile = window.innerWidth < 768;

        imageItems.forEach((item, index) => {
          if (isMobile) {
            // Simple slide-in from bottom on mobile
            gsap.fromTo(
              item,
              { 
                y: 50,
                opacity: 0,
              },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: item,
                  start: "top 90%",
                },
              }
            );
          } else {
            // Left-to-right animation on desktop
            const direction = index % 2 === 0 ? -50 : 50;
            
            gsap.fromTo(
              item,
              { 
                x: direction,
                opacity: 0,
                rotate: index % 2 === 0 ? -5 : 5,
              },
              {
                x: 0,
                opacity: 1,
                rotate: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: item,
                  start: "top 85%",
                },
              }
            );
          }

          // Parallax on images - less movement on mobile
          const imgElement = item.querySelector("img");
          if (imgElement) {
            gsap.to(imgElement, {
              yPercent: isMobile ? -8 : -15,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            });
          }
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-secondary py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-secondary-foreground leading-tight">
            INSIDE YOUR BOOK
          </h2>
          <p className="font-body text-sm sm:text-base md:text-lg text-secondary-foreground/80 mt-3 sm:mt-4 max-w-xl mx-auto px-4">
            The best moments from your carnival, beautifully laid out across premium pages
          </p>
        </div>

        {/* Responsive Gallery */}
        <div
          ref={imagesRef}
          className="flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-6 max-w-7xl mx-auto"
        >
          {images.map((image, index) => (
            <div
              key={index}
              className={`image-item flex-1 group ${
                index === 1 ? "md:mt-0 lg:-mt-8" : ""
              }`}
            >
              <div className="relative aspect-square sm:aspect-[4/5] md:aspect-[5/5] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-[120%] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 sm:from-foreground/60 via-transparent to-transparent" />
                
                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                  <h3 className="font-display text-xl sm:text-2xl md:text-2xl lg:text-3xl text-black leading-tight">
                    {image.title}
                  </h3>
                  <p className="font-handwritten text-base sm:text-lg md:text-xl text-black/80 mt-1">
                    {image.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InsideYourBook;