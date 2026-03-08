"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, ArrowUpRight, Search, Sparkles } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

type Category = "all" | "about" | "customization" | "ordering" | "shipping";

interface FAQ {
  question: string;
  answer: string;
  category: Category;
}

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  

  const faqs: FAQ[] = [
    {
      question: "What is Bacchanal?",
      answer:
        "Bacchanal is a premium, customizable photo book designed specifically for carnival lovers. It's a curated keepsake that preserves the energy, color, and emotion of your carnival experience in a beautiful, tangible format.",
      category: "about",
    },
    {
      question: "How do I customize my book?",
      answer:
        "First, collect and organize your carnival photos from your phone, camera, and friends. Then use our online customization tool to arrange your photos, add captions, and design your perfect layout. Once you're happy with your design, place your order and we'll print and ship your book to you.",
      category: "customization",
    },
    {
      question: "What's included in the Bacchanal book?",
      answer:
        "Each Bacchanal book includes premium hardcover binding, thick photo paper, lay-flat binding for seamless panoramic spreads, and professionally designed templates. You'll also get pre-designed carnival-themed pages that you can customize with your photos.",
      category: "about",
    },
    {
      question: "Can I include photos from friends?",
      answer:
        "Absolutely! We encourage it. Carnival is a collective experience, and your Bacchanal book can include photos from everyone in your crew. Just gather the photos from group chats, shared albums, and photographer sessions.",
      category: "customization",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Standard delivery typically takes 2-3 weeks after you finalize your design. We offer express shipping options for faster delivery. All books are printed with care to ensure the highest quality.",
      category: "shipping",
    },
    {
      question: "What photo formats do you accept?",
      answer:
        "We accept all common image formats including JPEG, PNG, and HEIC. For best results, we recommend using high-resolution photos (at least 300 DPI or 2MB+ file size).",
      category: "customization",
    },
    {
      question: "Can I preview my book before ordering?",
      answer:
        "Yes! Our customization tool includes a full preview feature where you can flip through your book digitally before placing your order. You can make unlimited changes until you're completely satisfied.",
      category: "ordering",
    },
    {
      question: "What if I'm not satisfied with my book?",
      answer:
        "We stand behind the quality of our products. If there's a printing defect or damage during shipping, we'll reprint and reship your book at no additional cost. Contact our support team within 14 days of receiving your order.",
      category: "ordering",
    },
    {
      question: "Do you ship internationally?",
      answer:
        "Yes, we ship to most countries worldwide. International shipping times vary by location, typically 3-4 weeks. Customs fees may apply depending on your country.",
      category: "shipping",
    },
    {
      question: "Can I track my order?",
      answer:
        "Absolutely! Once your book ships, you'll receive a tracking number via email. You can use this to monitor your package's journey right to your doorstep.",
      category: "shipping",
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

 

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll(".hero-animate"),
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.15,
            ease: "power4.out",
          }
        );
      }

      // Floating elements
      gsap.to(".float-1", {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".float-2", {
        y: 20,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5,
      });
      gsap.to(".float-3", {
        y: -15,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });
    });

    return () => ctx.revert();
  }, []);


  return (
    <>
    
      <section
        ref={heroRef}
        className="relative min-h-[80vh] flex items-center overflow-hidden bg-background"
      >
        {/* Colorful decorative blobs (SAME AS FIRST HERO) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-5xl">
            {/* Tag */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-[1px] bg-primary" />
              <span className="font-body text-sm tracking-[0.3em] uppercase text-primary">
                Help Center
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-8 tracking-tight text-foreground">
              GOT
              <br />
              <span className="text-primary">QUESTIONS?</span>
            </h1>

            {/* Description */}
            <p className="font-body text-xl text-muted-foreground max-w-xl mb-12">
              Everything you need to know about creating your carnival photo
              book. We've got answers.
            </p>

            {/* Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Type to search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenIndex(null);
                }}
                className="w-full pl-16 pr-6 py-5 rounded-full bg-background/80 border border-border focus:border-primary outline-none font-body text-foreground placeholder:text-muted-foreground transition-all backdrop-blur"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter - Dramatic */}

      {/* FAQ List - Dramatic */}
      <section className="py-24 bg-olive">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={faqRef} className="max-w-4xl mx-auto">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-0">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={`${activeCategory}-${index}`}
                    className="faq-item group border-b border-border"
                  >
                    <button
                      onClick={() =>
                        setOpenIndex(openIndex === index ? null : index)
                      }
                      className="w-full py-8 flex items-start justify-between gap-8 text-left"
                    >
                      <div className="flex items-start gap-6">
                        {/* Number */}
                        <span
                          className={`font-display text-5xl sm:text-6xl transition-colors duration-300 ${
                            openIndex === index
                              ? "text-primary"
                              : "text-black/20 group-hover:text-black/40"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {/* Question */}
                        <h3
                          className={`font-display text-xl sm:text-3xl pt-3 transition-colors duration-300 ${
                            openIndex === index
                              ? "text-primary"
                              : "text-foreground group-hover:text-primary"
                          }`}
                        >
                          {faq.question}
                        </h3>
                      </div>
                      {/* Toggle */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 mt-2 ${
                          openIndex === index
                            ? "border-primary bg-primary rotate-180"
                            : "border-black/30 group-hover:border-primary"
                        }`}
                      >
                        <ChevronDown
                          className={`w-5 h-5 transition-colors ${
                            openIndex === index
                              ? "text-primary-foreground"
                              : "text-black group-hover:text-primary"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-out ${
                        openIndex === index ? "max-h-[500px] pb-8" : "max-h-0"
                      }`}
                    >
                      <div className="pl-20 sm:pl-24 pr-20">
                        <p className="font-body text-lg text-black leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="font-display text-2xl text-muted-foreground mb-6">
                  No questions found
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                    setOpenIndex(null);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dramatic CTA */}
      <section className="relative py-32 bg-secondary overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary-foreground/5 rounded-full blur-3xl" />

        {/* Sparkle decorations */}
        <Sparkles className="absolute top-12 right-[15%] w-8 h-8 text-primary-foreground/20" />
        <Sparkles className="absolute bottom-16 left-[20%] w-6 h-6 text-primary-foreground/15" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <span className="font-handwritten text-3xl text-primary-foreground/60 mb-6 block">
              Still curious?
            </span>
            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-primary-foreground mb-12 leading-[0.9]">
              LET'S TALK
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6"
                asChild
              >
                <Link href="mailto:hello@bacchanal.com" className="gap-3">
                  Contact Support
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-8 py-6"
                asChild
              >
                <Link href="/book" className="gap-3">
                  Start Creating
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQs;
