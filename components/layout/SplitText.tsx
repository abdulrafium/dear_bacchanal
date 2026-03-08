'use client';
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  animation?: "chars" | "words" | "lines";
  stagger?: number;
  delay?: number;
  triggerStart?: string;
}

const SplitText = ({
  children,
  className = "",
  as: Tag = "span",
  animation = "chars",
  stagger = 0.03,
  delay = 0,
  triggerStart = "top 85%",
}: SplitTextProps) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const text = children;
    let elements: string[] = [];

    if (animation === "chars") {
      elements = text.split("");
    } else if (animation === "words") {
      elements = text.split(" ");
    } else {
      elements = [text];
    }

    // Create HTML with spans
    container.innerHTML = elements
      .map((el, i) => {
        const content = animation === "words" && i < elements.length - 1 ? el + "&nbsp;" : el;
        return `<span class="inline-block overflow-hidden"><span class="split-char inline-block">${content === " " ? "&nbsp;" : content}</span></span>`;
      })
      .join("");

    const chars = container.querySelectorAll(".split-char");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        chars,
        {
          y: "100%",
          opacity: 0,
        },
        {
          y: "0%",
          opacity: 1,
          duration: 0.8,
          stagger: stagger,
          delay: delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: triggerStart,
            toggleActions: "play none none reverse",
          },
        }
      );
    }, container);

    return () => ctx.revert();
  }, [children, animation, stagger, delay, triggerStart]);

  return (
    <Tag ref={containerRef as any} className={className}>
      {children}
    </Tag>
  );
};

export default SplitText;
