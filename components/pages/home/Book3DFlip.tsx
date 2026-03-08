import { useRef, useEffect } from "react";
import gsap from "gsap";

const Book3DFlip = () => {
  const bookRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const book = bookRef.current;
    if (!container || !book) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate rotation based on mouse position
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateY = ((x - centerX) / centerX) * 15; // Max 15deg rotation
      const rotateX = ((centerY - y) / centerY) * 10; // Max 10deg rotation
      
      gsap.to(book, {
        rotateY: rotateY,
        rotateX: rotateX,
        duration: 0.5,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(book, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative p-16 cursor-pointer" 
      style={{ perspective: "1500px" }}
    >
      {/* 3D Book Container */}
      <div
        ref={bookRef}
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Book Cover */}
        <div
          className="relative w-[280px] h-[380px] sm:w-[350px] sm:h-[470px] rounded-lg shadow-2xl overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Front Cover */}
          <img
            src="/book-cover.jpg"
            alt="Bacchanal book cover"
            className="w-full h-full object-cover"
          />
          
          {/* Shine effect on hover */}
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{ transform: "translateZ(1px)" }}
          />
          
          {/* Book spine shadow */}
          <div
            className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-foreground/30 to-transparent"
          />
        </div>

        {/* Book spine (3D effect) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-6 bg-coral rounded-l-sm"
          style={{
            transform: "rotateY(-90deg) translateX(-12px)",
            transformOrigin: "left center",
          }}
        />

        {/* Book shadow */}
        <div 
          className="absolute -bottom-6 left-4 right-4 h-8 bg-foreground/10 blur-xl rounded-full"
          style={{ transform: "translateZ(-20px) rotateX(90deg)" }}
        />
      </div>

      
    </div>
  );
};

export default Book3DFlip;