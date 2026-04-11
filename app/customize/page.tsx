"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera,
  FolderHeart,
  Users,
  Sparkles,
  ArrowRight,
  Play,
  Star,
  Book,
  Globe,
  Calendar as CalendarIcon,
  Search,
  Loader2,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

interface GlobalTemplate {
  _id: string;
  name: string;
  description: string;
  country: string;
  year: string;
  thumbnail: string;
  active?: boolean;
}

const CustomizeRitual = () => {
  const heroRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const tipsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { isAuthenticated } = useAuth();
  const { openModal } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingTemplates && !isAuthenticated) {
      router.push("/");
      openModal("signin");
    }
  }, [isAuthenticated, isLoadingTemplates, router, openModal]);

  useEffect(() => {
    const fetchGlobalTemplates = async () => {
      try {
        const res = await fetch("/api/templates/global");
        if (res.ok) {
          const data = await res.json();
          // Filter only active templates as requested
          const activeTemplates = (data.templates || []).filter((t: any) => t.active !== false);
          setTemplates(activeTemplates);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Failed to load templates");
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchGlobalTemplates();
  }, []);

  const handleHeroAction = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTemplateSelect = (templateName: string) => {
    if (!isAuthenticated) {
      openModal("signup");
      return;
    }
    router.push(`/editor?templateName=${encodeURIComponent(templateName)}`);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.year.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      // Tag slides in
      heroTl.fromTo(
        ".hero-tag",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );

      // Title words reveal
      heroTl.fromTo(
        ".hero-title-main span",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power4.out",
        },
        0.4
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
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-background overflow-x-hidden">
      {/* HERO SECTION - REVERTED STYLE */}
      <section
        ref={heroRef}
        className="relative pt-20 min-h-screen flex items-center overflow-hidden bg-background"
      >
        {/* Colorful decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between py-12 lg:py-24">
            {/* Left Content Column */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-10 animate-slide-up self-center">
              {/* Tag */}
              <div className="hero-tag inline-flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="font-body text-[11px] tracking-[0.5em] uppercase text-primary font-black">
                  The Premium Keep-Sake
                </span>
              </div>

              {/* Title - responsive sizing */}
              <div className="space-y-2 hero-title-main">
                <h1 className="font-display leading-[0.95] tracking-tighter">
                  <span className="block text-6xl sm:text-7xl md:text-8xl xl:text-[100px] text-foreground uppercase">
                    Your
                  </span>
                  <span className="block text-6xl sm:text-7xl md:text-8xl xl:text-[100px] text-primary uppercase">
                    Carnival
                  </span>
                  <span className="block text-6xl sm:text-7xl md:text-8xl xl:text-[100px] text-foreground underline decoration-primary/20 uppercase">
                    Story
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="hero-desc font-body text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed lg:pr-8">
                Transform your carnival memories into a beautiful photo book
                keepsake that lasts forever. Each page captures the rhythm of your street.
              </p>

              {/* CTAs */}
              <div className="hero-cta flex flex-col sm:flex-row items-center gap-6 pt-4 w-full sm:w-auto">
                <Button
                  variant="carnival"
                  size="xl"
                  onClick={handleHeroAction}
                  className="hero-cta-btn w-full sm:w-auto text-xl px-12 py-9 shadow-2xl hover:scale-105 transition-all uppercase"
                >
                  <span className="flex items-center gap-4">
                    Create Your Book
                    <ArrowRight className="w-6 h-6" />
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  asChild
                  className="hero-cta-btn w-full sm:w-auto border-2 border-primary/20 hover:bg-white/5 text-xl py-9"
                >
                  <Link href="/templates" className="flex items-center justify-center gap-3">
                    <Play className="w-5 h-5 fill-primary" />
                    Watch Preview
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="w-full lg:w-1/2 relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[350px] sm:max-w-[400px] lg:max-w-[480px] aspect-[4/5] lg:aspect-square flex items-center justify-center">
                <div className="absolute w-[140%] h-[140%] bg-primary/20 rounded-full blur-[100px] animate-pulse-subtle" />
                <div className="relative w-full h-[85%] lg:h-full flex items-center justify-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-[60%] -translate-y-[55%] w-[80%] h-[80%] rounded-3xl bg-secondary/30 shadow-2xl skew-y-3 -rotate-6 backdrop-blur-sm border border-white/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-[55%] -translate-y-[50%] w-[80%] h-[80%] rounded-3xl bg-accent/20 shadow-2xl skew-y-2 -rotate-3 border border-white/10" />
                  <div className="relative w-[85%] h-[85%] lg:w-[90%] lg:h-[90%] rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.6)] border-2 border-white/10 group">
                    <img
                      src="/book-cover.jpg"
                      alt="Carnival Photo Book"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/20 to-transparent opacity-80" />
                    <div className="absolute bottom-10 left-10 right-10 text-left">
                      <div className="space-y-2">
                        <span className="font-handwritten text-4xl sm:text-6xl text-accent block">Your Story</span>
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-px bg-white/40" />
                          <p className="font-body text-xs sm:text-sm text-white font-bold tracking-[0.4em] uppercase">Carnival 2026</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES GALLERY - NEW SECTION */}
      <section id="templates" ref={galleryRef} className="py-24 bg-background relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Premium Designs</span>
              </div>
              <h2 className="font-display text-5xl text-foreground uppercase">CHOOSE YOUR <span className="text-primary italic">THEME</span></h2>
            </div>
            
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search styles, countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {isLoadingTemplates ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow animate-pulse" />
              </div>
              <p className="text-muted-foreground font-body tracking-widest uppercase text-xs animate-pulse">Loading artist-curated templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredTemplates.map((template) => (
                <div 
                  key={template._id}
                  className="group relative bg-white/5 rounded-[40px] overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                >
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-primary/20 backdrop-blur-[2px]">
                       <Button 
                         variant="carnival" 
                         size="lg"
                         onClick={() => handleTemplateSelect(template.name)}
                         className="shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500 uppercase px-8"
                        >
                         START CREATING
                       </Button>
                    </div>

                    <div className="absolute top-6 left-6 flex gap-2">
                       <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
                         <Globe className="w-3 h-3 text-teal" />
                         {template.country}
                       </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-display text-2xl text-white group-hover:text-primary transition-colors uppercase">{template.name}</h3>
                      <span className="text-primary font-display text-xl">/ {template.year}</span>
                    </div>
                    <p className="text-sm text-muted-foreground/80 font-body leading-relaxed">{template.description}</p>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          <CalendarIcon className="w-3 h-3" />
                          Limited Release
                       </div>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTemplateSelect(template.name)}
                        className="text-primary hover:text-white hover:bg-primary/20 transition-all rounded-full px-6 flex items-center gap-2"
                       >
                         SELECT <ArrowRight className="w-3 h-3" />
                       </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-white/5 rounded-[40px] border border-dashed border-white/20">
               <Search className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
               <p className="text-muted-foreground font-display text-xl mb-4">NO MATCHING THEMES</p>
               <Button variant="outline" onClick={() => setSearchQuery("")} className="border-primary/20 text-primary hover:bg-primary/10 rounded-full">Explore All Styles</Button>
            </div>
          )}
        </div>
      </section>

      {/* THE RITUAL - Marketing Section */}
      <section className="py-32 bg-olive relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="font-display text-6xl md:text-8xl text-black tracking-tight uppercase">THE RITUAL</h2>
            <p className="font-handwritten text-2xl text-black/60 mt-4">Four steps to immortalize your carnival spirit</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.num}
                className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center flex-shrink-0 relative shadow-xl">
                  <span className="font-display text-6xl text-gray-800">{step.num}</span>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className={`text-center ${index % 2 !== 0 ? "md:text-right" : "md:text-left"} flex-1`}>
                  <h3 className="font-display text-4xl text-black mb-4 uppercase">{step.title}</h3>
                  <p className="text-black/70 text-lg leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECRETS SECTION */}
      <section className="py-32 bg-accent relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-7xl text-black mb-16 uppercase">SECRETS</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {tips.map((tip, i) => (
              <div key={i} className="bg-background rounded-full px-8 py-5 shadow-2xl border border-white/5 hover:scale-105 transition-transform">
                <p className="font-body text-foreground font-bold uppercase tracking-widest text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomizeRitual;
