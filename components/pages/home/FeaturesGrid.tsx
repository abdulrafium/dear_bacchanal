"use client";
import { useRef } from "react";
import { Camera, Heart, Sparkles, Users, BookOpen, Palette } from "lucide-react";
import SplitText from "@/components/layout/SplitText";

const features = [
  {
    icon: Camera,
    title: "Capture Everything",
    description: "Every costume, every jump, every moment worth remembering.",
    image: "/hero-carnival.jpg",
  },
  {
    icon: Heart,
    title: "Made with Love",
    description: "Handcrafted layouts that honor your carnival journey.",
    image: "/spread-1.jpg",
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "Lay-flat binding, vibrant prints, built to last generations.",
    image: "/spread-2.jpg",
  },
  {
    icon: Users,
    title: "Collective Memories",
    description: "Include photos from your whole crew in one beautiful book.",
    image: "/spread-3.jpg",
  },
  {
    icon: BookOpen,
    title: "Your Story",
    description: "Personalize every page to tell your unique carnival tale.",
    image: "/spread-1.jpg",
  },
  {
    icon: Palette,
    title: "Vibrant Colors",
    description: "True-to-life color reproduction that captures the energy.",
    image: "/book-cover.jpg",
  },
];

const FeatureCard = ({ 
  feature, 
  className, 
  subtle = false 
}: { 
  feature: typeof features[0]; 
  className?: string;
  subtle?: boolean;
}) => {
  const Icon = feature.icon;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // More subtle tilt - increased divisor (was 15, now 30 for normal, 50 for subtle)
    const divisor = subtle ? 50 : 30;
    const rotateX = (y - centerY) / divisor;
    const rotateY = (centerX - x) / divisor;
    const scale = subtle ? 1.01 : 1.02;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-2xl overflow-hidden transition-transform duration-300 ease-out ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 ${subtle ? 'group-hover:scale-103' : 'group-hover:scale-105'}`}
        style={{ backgroundImage: `url(${feature.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      <div className="relative z-10 h-full flex flex-col justify-end p-5" style={{ transform: "translateZ(15px)" }}>
        <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-display text-lg text-white mb-1">{feature.title}</h3>
        <p className="font-body text-white/70 text-sm line-clamp-2">{feature.description}</p>
      </div>
    </div>
  );
};

const FeaturesGrid = () => {
  return (
    <section className="py-32 bg-olive relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-handwritten text-2xl text-accent">Why Choose Us</span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mt-2">
            <SplitText animation="words" stagger={0.08}>
              EVERY DETAIL MATTERS
            </SplitText>
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="max-w-6xl mx-auto">
          {/* Row 1 */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <FeatureCard feature={features[0]} className="h-80 md:w-[55%]" />
            <FeatureCard feature={features[1]} className="h-80 md:w-[45%]" />
          </div>

          {/* Row 2 */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <FeatureCard feature={features[2]} className="h-64 md:w-[35%]" />
            <FeatureCard feature={features[3]} className="h-64 md:w-[40%]" />
            <FeatureCard feature={features[4]} className="h-64 md:w-[25%]" />
          </div>

          {/* Row 3 - Vibrant Colors with subtle animation */}
          <div className="flex flex-col md:flex-row gap-4">
            <FeatureCard feature={features[5]} className="h-72 md:w-full" subtle />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
