"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, Save, LayoutGrid, BookOpen } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import Link from "next/link";
import { SaveBookModal } from "./SaveBookModal";
import { ShareBookModal } from "./ShareBookModal";
import { useBookData } from "./BookDataContext";

interface BookFlipProps {
  pages: React.ReactNode[];
}

export const BookFlip: React.FC<BookFlipProps> = ({ pages }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Default to spread for SSR stability, sync with media query on mount
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('spread');
  const [mounted, setMounted] = useState(false);
  
  // Sync viewMode with mobile status once mounted
  useEffect(() => {
    setMounted(true);
    if (isMobile) {
      setViewMode('single');
    } else {
      setViewMode('spread');
    }
  }, [isMobile]);
  
  // currentStep represents the individual page index (0 to pages.length * 2 - 1)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const { isReadOnly } = useBookData();
  const [showGuides, setShowGuides] = useState(false);
  const [jumpValue, setJumpValue] = useState<string>("1");

  // Prevent hydration flicker by only showing the correct mode after mount
  const effectiveViewMode = mounted ? viewMode : 'spread';

  // These spread indices are always shown as ONE full page (never split into left/right)
  // Index 0 = EigthPage (cover), last index = FirstPage (back cover)
  const fullPageIndices = useMemo(() => new Set([0, pages.length - 1]), [pages.length]);

  // Helper: check if a spread index is a full page
  const isFullPage = (spreadIndex: number) => fullPageIndices.has(spreadIndex);

  // Sync jump input with current step
  useEffect(() => {
    setJumpValue(getDisplayPageNumber().toString());
  }, [currentStep, effectiveViewMode]);

  const handleJump = () => {
    const newVal = parseInt(jumpValue);
    if (!isNaN(newVal) && newVal >= 1 && newVal <= totalDisplayPages) {
      if (effectiveViewMode === 'spread') {
        setCurrentStep((newVal - 1) * 2);
      } else {
        // Convert display page number back to internal step
        let step = 0;
        let displayCount = 0;
        while (displayCount < newVal && step < totalSteps) {
          const spreadIdx = Math.floor(step / 2);
          const iRight = step % 2 === 1;
          if (!(isFullPage(spreadIdx) && iRight)) {
            displayCount++;
          }
          if (displayCount < newVal) step++;
        }
        setCurrentStep(step);
      }
    }
    // Re-sync
    setJumpValue(getDisplayPageNumber().toString());
  };


  const totalSteps = pages.length * 2;
  const currentPageIndex = Math.floor(currentStep / 2);
  const isRightSide = currentStep % 2 === 1;

  // In single page mode, full pages count as 1 step. Calculate the display page number.
  const getDisplayPageNumber = () => {
    if (effectiveViewMode === 'spread') {
      return Math.floor(currentStep / 2) + 1;
    }
    // Count how many steps we've passed, accounting for full pages = 1 step
    let displayPage = 0;
    for (let i = 0; i <= currentStep; i++) {
      const spreadIdx = Math.floor(i / 2);
      const iRight = i % 2 === 1;
      if (isFullPage(spreadIdx) && iRight) continue; // skip right side of full pages
      displayPage++;
    }
    return displayPage;
  };

  // Total display pages in single mode
  const totalDisplayPages = useMemo(() => {
    if (effectiveViewMode === 'spread') return pages.length;
    return totalSteps - fullPageIndices.size; // subtract 1 for each full page
  }, [effectiveViewMode, totalSteps, fullPageIndices]);

  const handleSaveSuccess = () => {
    setIsShareModalOpen(true);
  };

  const flipNext = () => {
    // Prevent going past the end
    const lastSpreadIdx = pages.length - 1;
    const isOnLastFullPage = isFullPage(lastSpreadIdx) && currentPageIndex === lastSpreadIdx;
    if (isOnLastFullPage || currentStep >= totalSteps - 1 || isAnimating) return;

    // In single mode, if this is a full page, always flip to next spread (skip right side)
    if (effectiveViewMode === 'single' && isFullPage(currentPageIndex)) {
      // Jump directly to next spread's left side
      setIsAnimating(true);
      const currentPageElement = pagesRef.current[currentPageIndex];
      if (!currentPageElement) return;
      gsap.to(currentPageElement, {
        rotateY: -180,
        duration: 1.2,
        ease: "power3.inOut",
        transformOrigin: "left center",
        onComplete: () => {
          setCurrentStep((currentPageIndex + 1) * 2);
          setIsAnimating(false);
        },
      });
      return;
    }

    // In split view, if we are on Left side, we just move to Right side (no flip animation needed)
    if (effectiveViewMode === 'single' && !isRightSide) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Otherwise, we flip to the next component
    setIsAnimating(true);
    const currentPageElement = pagesRef.current[currentPageIndex];
    if (!currentPageElement) return;

    gsap.to(currentPageElement, {
      rotateY: -180,
      duration: 1.2,
      ease: "power3.inOut",
      transformOrigin: "left center",
      onComplete: () => {
        setCurrentStep(prev => prev + (effectiveViewMode === 'single' ? 1 : 2));
        setIsAnimating(false);
        currentPageElement?.scrollTo({ top: 0 });
      },
    });
  };

  const flipPrev = () => {
    if (currentStep <= 0 || isAnimating) return;

    // Check if the PREVIOUS spread is a full page
    const prevSpreadIndex = isRightSide ? currentPageIndex : currentPageIndex - 1;
    
    // In single mode on right side, just go back to left
    if (effectiveViewMode === 'single' && isRightSide && !isFullPage(currentPageIndex)) {
      setCurrentStep(prev => prev - 1);
      return;
    }

    setIsAnimating(true);
    const targetPageIndex = isRightSide ? currentPageIndex - 1 : currentPageIndex - 1;
    const prevPageElement = pagesRef.current[targetPageIndex];
    if (!prevPageElement) return;

    gsap.to(prevPageElement, {
      rotateY: 0,
      duration: 1.2,
      ease: "power3.inOut",
      transformOrigin: "left center",
      onComplete: () => {
        // If previous spread is a full page, land on its left side (step 0)
        if (isFullPage(targetPageIndex)) {
          setCurrentStep(targetPageIndex * 2);
        } else {
          // Land on the right side of the previous spread
          setCurrentStep(targetPageIndex * 2 + 1);
        }
        setIsAnimating(false);
      },
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") flipNext();
      if (e.key === "ArrowLeft") flipPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isAnimating, effectiveViewMode]);

  // Track container size for scaling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'single' ? 'spread' : 'single');
    // Align currentStep to be Even (Left side) when switching to spread
    if (effectiveViewMode === 'single') {
        setCurrentStep(prev => Math.floor(prev / 2) * 2);
    }
  };

  const getPageStyle = (index: number) => {
    const isFlipped = index < currentPageIndex;
    return {
      transformStyle: "preserve-3d" as const,
      transform: `rotateY(${isFlipped ? -180 : 0}deg)`,
      transformOrigin: "left center",
      zIndex: pages.length - index,
      backfaceVisibility: "hidden" as const,
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.1)",
    };
  };

  // Design dimensions: pages were built for these viewport sizes
  const DESIGN_W_SPREAD = 1920;
  const DESIGN_H = 1080;
  const DESIGN_W_SINGLE = 960; // half of spread

  // Full pages always show at single-page width, even in spread mode
  const currentIsFullPage = isFullPage(currentPageIndex);
  const useSpreadWidth = effectiveViewMode === 'spread' && !currentIsFullPage;
  const designW = useSpreadWidth ? DESIGN_W_SPREAD : DESIGN_W_SINGLE;
  const bookAspectRatio = designW / DESIGN_H;

  // Compute how much to scale content to fit the container
  const scaleX = containerSize.width > 0 ? containerSize.width / DESIGN_W_SPREAD : 1;
  const scaleY = containerSize.height > 0 ? containerSize.height / DESIGN_H : 1;
  const contentScale = Math.min(scaleX, scaleY, 1); // never scale UP

  const getInnerContentStyle = (index: number): React.CSSProperties => {
    // Calculate centering offsets for the scaled content
    const scaledW = DESIGN_W_SPREAD * contentScale;
    const scaledH = DESIGN_H * contentScale;
    const offsetX = containerSize.width > 0 ? (containerSize.width - scaledW) / 2 : 0;
    const offsetY = containerSize.height > 0 ? (containerSize.height - scaledH) / 2 : 0;

    // Full pages (cover/back cover) fill the container naturally — no scaling needed
    if (isFullPage(index)) {
      return {
        width: '100%',
        height: '100%',
        position: 'absolute' as const,
        top: 0,
        left: 0,
      };
    }

    // Base style: render at original design size, scale to fit, and center
    const base: React.CSSProperties = {
      width: DESIGN_W_SPREAD,
      height: DESIGN_H,
      transform: `scale(${contentScale})`,
      transformOrigin: 'top left',
      position: 'absolute' as const,
      top: Math.max(0, offsetY),
      left: Math.max(0, offsetX),
    };

    if (index !== currentPageIndex || effectiveViewMode === 'spread') return base;
    
    // Single page mode: show only left or right half
    if (isMobile) {
        return {
            ...base,
            transform: `scale(${contentScale}) translateY(${isRightSide ? '-50%' : '0%'})`,
            height: DESIGN_H * 2,
            top: 0,
            left: Math.max(0, offsetX),
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        };
    }
    
    // Desktop single: render full spread at design size, shift to show left or right half
    const singleScale = containerSize.width > 0 ? containerSize.width / DESIGN_W_SINGLE : 1;
    const singleScaleY = containerSize.height > 0 ? containerSize.height / DESIGN_H : 1;
    const sScale = Math.min(singleScale, singleScaleY, 1);
    const singleScaledH = DESIGN_H * sScale;
    const singleOffsetY = containerSize.height > 0 ? (containerSize.height - singleScaledH) / 2 : 0;
    
    return {
      width: DESIGN_W_SPREAD,
      height: DESIGN_H,
      transform: `scale(${sScale}) translateX(${isRightSide ? `-${DESIGN_W_SINGLE}px` : '0px'})`,
      transformOrigin: 'top left',
      position: 'absolute' as const,
      top: Math.max(0, singleOffsetY),
      left: 0,
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#0c0c0c] overflow-hidden flex flex-col items-center justify-center">
      {/* Premium Professional Workspace background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
      </div>

      {/* Editor Workspace */}
      <div 
        className="relative w-full h-full flex flex-col items-center justify-center p-2 md:p-4 mb-24 lg:mb-16 transition-all duration-500 ease-in-out"
        style={{ 
            maxWidth: `calc(min(98vw, 92vh * ${bookAspectRatio}))`,
            maxHeight: `calc(min(92vh, 98vw / ${bookAspectRatio}))`
        }}
      >
        <div className="relative w-full h-full" style={{ perspective: "3000px" }}>
          
          {/* Main Book Display */}
          <div ref={containerRef} className="absolute inset-0 w-full h-full shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9)] rounded-[4px] overflow-hidden border border-white/5 bg-white ring-1 ring-white/10 transition-all duration-500">
            {pages.map((Page, index) => (
              <div
                key={index}
                ref={(el: any) => (pagesRef.current[index] = el)}
                className={`book-page-container absolute inset-0 w-full h-full bg-white transition-all duration-700 ease-in-out`}
                style={getPageStyle(index)}
              >
                {/* Content Container */}
                <div 
                  className="w-full h-full relative overflow-hidden"
                  style={getInnerContentStyle(index)}
                >
                  {Page}

                  {/* Print Safety Guides Overlay */}
                  {index === currentPageIndex && showGuides && (
                    <div className="absolute inset-0 pointer-events-none z-[60]">
                        <div className="absolute inset-[15px] border-2 border-dashed border-red-500/40 rounded-sm" />
                        <div className="absolute inset-[40px] border-2 border-dashed border-cyan-500/40 rounded-sm" />
                        
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 px-4 py-1.5 rounded-full text-[10px] text-white/90 backdrop-blur-md border border-white/10 uppercase tracking-widest font-bold">
                            <span className="flex items-center gap-2"><div className="w-3 h-0.5 bg-red-500 border-dashed border-t-2" /> Trim Line (Cut)</span>
                            <span className="flex items-center gap-2"><div className="w-3 h-0.5 bg-cyan-500 border-dashed border-t-2" /> Safe Area</span>
                        </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Spine/Gutter Shadow based on View Mode */}
                {effectiveViewMode === 'spread' ? (
                    /* Spread view gutter (Center) */
                    <div className="absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 bg-gradient-to-r from-black/5 via-black/25 to-black/5 pointer-events-none z-10 opacity-60" />
                ) : (
                    /* Single view gutter alignment (Inside edge) */
                    isRightSide ? (
                        /* Right page interior edge (Left) */
                        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 to-transparent pointer-events-none z-10 opacity-70" />
                    ) : (
                        /* Left page interior edge (Right) */
                        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent pointer-events-none z-10 opacity-70" />
                    )
                )}

                {/* Subtle Inner Edge Shadows */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                
                {/* Edge highlights */}
                <div className="absolute inset-y-0 left-0 w-[1px] bg-white/40" />
                <div className="absolute inset-y-0 right-0 w-[1px] bg-white/40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 sm:gap-6 lg:gap-8 px-4 py-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <button
          onClick={flipPrev}
          disabled={currentStep === 0 || isAnimating}
          className={`p-3 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 transition-all duration-300 ${
            currentStep === 0 || isAnimating ? "opacity-20 cursor-not-allowed text-white/50" : "hover:bg-white/10 hover:scale-110 active:scale-95 text-white"
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-1 shadow-2xl">
            <button
                onClick={toggleViewMode}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${effectiveViewMode === 'spread' ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                title="Spread View"
            >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">SPREAD</span>
            </button>
            <button
                onClick={() => setViewMode('single')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${effectiveViewMode === 'single' ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                title="Single Page View"
            >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">PAGES</span>
            </button>
        </div>

        {/* Print Guides Toggle */}
        <button
          onClick={() => setShowGuides(!showGuides)}
          className={`p-3 rounded-xl backdrop-blur-2xl border transition-all duration-300 flex items-center gap-2 ${
            showGuides ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
          }`}
          title="Toggle Print Guides"
        >
          <div className={`w-2 h-2 rounded-full ${showGuides ? 'bg-cyan-400 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-xs font-black tracking-widest hidden lg:inline">DESIGN GUIDES</span>
        </button>

        {/* Editable Counter */}
        <div className="flex flex-col items-center">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-2">
            <span className="text-white/40 font-black text-[10px] tracking-widest pl-1">
              {effectiveViewMode === 'spread' ? 'SPREAD' : 'PAGE'}
            </span>
            <input
              type="text"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              onBlur={handleJump}
              className="w-10 bg-white/10 border border-white/10 rounded-lg py-1 px-1 text-center font-black text-sm lg:text-base outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/20 transition-all text-white"
            />
            <span className="text-white/40 font-black text-sm lg:text-base tracking-widest pr-2">
              / {totalDisplayPages}
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-2 text-white/80 hover:text-white font-bold text-xs tracking-widest transition-all hover:bg-white/10"
        >
          HOME
        </Link>

        {currentPageIndex === pages.length - 1 && !isReadOnly ? (
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-2 px-8 py-2 rounded-full bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black tracking-widest hover:brightness-110 hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            <Save className="w-5 h-5" />
            <span>SAVE</span>
          </button>
        ) : (
          <button
            onClick={flipNext}
            disabled={currentPageIndex === pages.length - 1 || isAnimating}
            className={`p-3 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 transition-all duration-300 ${
              currentPageIndex === pages.length - 1 || isAnimating ? "opacity-20 cursor-not-allowed text-white/50" : "hover:bg-white/10 hover:scale-110 active:scale-95 text-white"
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <SaveBookModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onOpen={() => setIsSaveModalOpen(true)}
        onSaveSuccess={handleSaveSuccess}
      />
      <ShareBookModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </div>
  );
};
