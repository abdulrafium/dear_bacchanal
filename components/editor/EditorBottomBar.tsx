"use client";

import { useEditorStore } from "@/store/editor-store";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  MoreHorizontal,
  Columns2,
  Grid2X2,
} from "lucide-react";
import { useState, memo, useRef } from "react";

export function EditorBottomBar() {
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread);
  const nextSpread = useEditorStore((s) => s.nextSpread);
  const prevSpread = useEditorStore((s) => s.prevSpread);
  const addSpread = useEditorStore((s) => s.addSpread);
  const duplicateSpread = useEditorStore((s) => s.duplicateSpread);
  const removeSpread = useEditorStore((s) => s.removeSpread);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const showThumbnails = useEditorStore((s) => s.showThumbnails);
  const toggleThumbnails = useEditorStore((s) => s.toggleThumbnails);
  const viewMode = useEditorStore((s) => s.viewMode);
  const setViewMode = useEditorStore((s) => s.setViewMode);
  const isAdmin = useEditorStore((s) => s.isAdmin);

  const [showPageMenu, setShowPageMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-100 flex flex-col w-full relative z-[2000]">
      {/* Primary Toolbar */}
      <div className="bg-white/95 backdrop-blur-xl py-2 px-4 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.02)] transition-all duration-300 h-14">
        
        {/* Left: View mode */}
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={() => setViewMode("spread")}
            className={`px-3 h-8 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              viewMode === "spread"
                ? "bg-[#2d2d2d] text-white shadow-md shadow-black/10"
                : "text-gray-400 hover:text-[#2d2d2d] hover:bg-gray-50"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden lg:block">Spread</span>
          </button>
          <button
            onClick={() => setViewMode("single")}
            className={`px-3 h-8 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              viewMode === "single"
                ? "bg-[#2d2d2d] text-white shadow-md shadow-black/10"
                : "text-gray-400 hover:text-[#2d2d2d] hover:bg-gray-50"
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span className="hidden lg:block">Single</span>
          </button>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          <button
            onClick={prevSpread}
            disabled={currentSpreadIndex === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#2d2d2d] hover:bg-gray-50 transition-all disabled:opacity-0 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-none">Page</span>
            <span className="text-[12px] font-semibold text-[#2d2d2d]">
              {currentSpreadIndex === 0 ? "COVER" : `${currentSpreadIndex * 2 - 1} - ${currentSpreadIndex * 2}`}
            </span>
          </div>

          <button
            onClick={nextSpread}
            disabled={currentSpreadIndex >= spreads.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#2d2d2d] hover:bg-gray-50 transition-all disabled:opacity-0 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Zoom & Menu */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button 
             onClick={() => toggleThumbnails()}
             className={`px-2 h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
               showThumbnails ? "bg-red-50 text-red-600" : "text-gray-400 hover:text-[#2d2d2d]"
             }`}
          >
            {showThumbnails ? "Hide Grid" : "All Pages"}
          </button>
          
          <div className="w-px h-5 bg-gray-100 mx-1" />

          {/* Compact Zoom Controls */}
          <div className="flex items-center gap-2 bg-gray-50/70 px-2.5 py-1 rounded-xl border border-gray-100 h-8">
            <button 
              onClick={() => setZoom(Math.max(10, zoom - 10))}
              className="text-gray-400 hover:text-[#2d2d2d] transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-gray-400 w-8 text-center">{zoom}%</span>
            <button 
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="text-gray-400 hover:text-[#2d2d2d] transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-50/50 rounded-full p-1 transition-all duration-500 overflow-hidden">
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                showPageMenu ? "bg-[#2d2d2d] text-white shadow-md rotate-90" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showPageMenu && (
              <div className="flex items-center gap-1 px-1 animate-in slide-in-from-right-4 fade-in duration-300">
                {/* Add New Page: Admins only */}
                {isAdmin && (
                  <button 
                    onClick={() => { 
                      if (spreads.length >= 10) {
                        const { toast } = require("sonner");
                        toast.info("Adding Extra Spread (+$5.00 Add-on)");
                      }
                      addSpread(); 
                      setShowPageMenu(false); 
                    }} 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative group/btn" 
                    title="Add New Pages"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-500" />
                    {spreads.length >= 10 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[7px] font-black px-1 py-0.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">+$5.00</span>
                    )}
                  </button>
                )}

                {/* Duplicate: Disabled on cover for non-admin users */}
                <button 
                  onClick={() => { duplicateSpread(currentSpreadIndex); setShowPageMenu(false); }} 
                  disabled={currentSpreadIndex === 0 && !isAdmin}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
                  title={currentSpreadIndex === 0 && !isAdmin ? "Cover cannot be duplicated" : "Duplicate Current Page"}
                >
                  <Copy className="w-3.5 h-3.5 text-violet-500" />
                </button>

                {/* Delete: Disabled on cover for non-admin users */}
                <button 
                  onClick={() => { removeSpread(currentSpreadIndex); setShowPageMenu(false); }} 
                  disabled={spreads.length <= 1 || (currentSpreadIndex === 0 && !isAdmin)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
                  title={currentSpreadIndex === 0 && !isAdmin ? "Cover cannot be deleted" : "Delete Spread"}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Thumbnails */}
      {showThumbnails && (() => {
        const coverBg = spreads[0]?.leftPage?.background;
        const isImageBg = coverBg?.startsWith("http") || coverBg?.startsWith("data:") || coverBg?.startsWith("/");
        const btnColor = isImageBg ? "#2d2d2d" : (coverBg || "#2d2d2d");

        return (
          <div className="relative border-t border-gray-100 bg-gray-50/20">
            {/* Left Arrow */}
            <button 
              onClick={scrollLeft} 
              className="absolute left-0 top-0 bottom-0 w-12 z-10 flex items-center justify-center"
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity"
                style={{ backgroundColor: btnColor }}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </div>
            </button>

            {/* Scrollable Thumbnails */}
            <div 
              ref={scrollRef}
              className="flex items-center gap-3 px-14 py-4 overflow-x-auto scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
            >
              {spreads.map((spread, index) => (
                <button
                  key={spread.id}
                  onClick={() => setCurrentSpread(index)}
                  className={`flex-shrink-0 group transition-all duration-300 ${
                    index === currentSpreadIndex ? "scale-105" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <div className={`flex rounded-lg overflow-hidden shadow-xl transition-all ${
                      index === currentSpreadIndex
                        ? "ring-2 ring-[#2d2d2d] ring-offset-2"
                        : "ring-1 ring-gray-200 group-hover:ring-gray-300"
                    }`}
                  >
                    <MiniPage page={spread.leftPage} isLeft={true} />
                    <MiniPage page={spread.rightPage} isLeft={false} />
                  </div>
                  <p className="text-[9px] font-bold text-gray-500 text-center mt-2 uppercase tracking-widest group-hover:text-[#2d2d2d] transition-colors">
                    {index === 0 ? "Cover" : `P. ${index * 2 - 1}-${index * 2}`}
                  </p>
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            <button 
              onClick={scrollRight} 
              className="absolute right-0 top-0 bottom-0 w-12 z-10 flex items-center justify-center"
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity"
                style={{ backgroundColor: btnColor }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </button>
          </div>
        );
      })()}
    </div>
  );
}

const MiniPage = memo(({ page, isLeft }: { page: any; isLeft?: boolean }) => {
  const bgStyle = page.background?.startsWith("http") || page.background?.startsWith("data:") || page.background?.startsWith("/") 
    ? { backgroundImage: `url(${page.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: page.background || "white" };

  return (
    <div 
      className={`w-14 h-14 relative overflow-hidden shrink-0 ${!isLeft ? 'border-l border-gray-100' : ''}`}
      style={bgStyle}
    >
      <svg 
        viewBox="0 0 500 500" 
        className="w-full h-full pointer-events-none"
        style={{ contain: 'strict', willChange: 'transform', transform: 'translateZ(0)' }}
      >
        {page.elements?.map((el: any) => {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const transform = `rotate(${el.rotation || 0} ${cx} ${cy})`;

          if (el.type === "image" || el.type === "sticker" || el.type === "photo-card") {
             if (el.src) {
                const isCircle = el.shapeType === "ellipse";
                const clipId = `clip-${el.id}`;
                return (
                  <g key={el.id} transform={transform}>
                    {isCircle && (
                      <clipPath id={clipId}>
                        <circle cx={cx} cy={cy} r={Math.min(el.width, el.height)/2} />
                      </clipPath>
                    )}
                    <image 
                      href={el.src} 
                      x={el.x} 
                      y={el.y} 
                      width={el.width} 
                      height={el.height} 
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={isCircle ? `url(#${clipId})` : undefined}
                    />
                    {el.type === "photo-card" && (
                      <rect x={el.x} y={el.y} width={el.width} height={el.height} fill="none" stroke="white" strokeWidth={12} />
                    )}
                  </g>
                );
             } else {
                return (
                  <rect 
                    key={el.id} 
                    x={el.x} y={el.y} width={el.width} height={el.height} 
                    fill="rgba(0,0,0,0.1)" stroke="white" strokeWidth={el.type === 'photo-card' ? 12 : 2} 
                    transform={transform} 
                  />
                );
             }
          }
          
          if (el.type === "text") {
             return (
               <text 
                 key={el.id} 
                 x={el.x} 
                 y={el.y + (el.fontSize || 24)} 
                 fill={el.fill || "#000"} 
                 fontSize={el.fontSize || 24} 
                 fontFamily={el.fontFamily || "Arial"}
                 transform={transform}
                 style={{ fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal', fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal' }}
               >
                 {el.text}
               </text>
             );
          }
          
          if (el.type === "shape" || el.type === "checkbox") {
             if (el.shapeType === "ellipse") {
               return (
                 <ellipse 
                   key={el.id} 
                   cx={cx} cy={cy} rx={el.width/2} ry={el.height/2} 
                   fill={el.shapeFill || "transparent"} 
                   stroke={el.stroke || el.fill || "#000"} 
                   strokeWidth={el.strokeWidth || 2} 
                   transform={transform} 
                 />
               );
             } else {
               return (
                 <rect 
                   key={el.id} 
                   x={el.x} y={el.y} width={el.width} height={el.height} 
                   fill={el.shapeFill || "transparent"} 
                   stroke={el.stroke || el.fill || "#000"} 
                   strokeWidth={el.strokeWidth || 2} 
                   transform={transform} 
                 />
               );
             }
          }
          
          if (el.type === "calendar") {
             const headerH = 70;
             const cellW = el.width / 7;
             const gridH = el.height - headerH;
             const cellH = gridH / 6;

             return (
                <g key={el.id} transform={transform}>
                  <rect 
                    x={el.x} y={el.y} width={el.width} height={el.height} 
                    fill="transparent" stroke="rgba(0,0,0,0.5)" strokeWidth={2} 
                  />
                  {/* Simulate text title */}
                  <rect 
                    x={el.x + el.width * 0.2} y={el.y + 15} 
                    width={el.width * 0.6} height={25} 
                    fill="rgba(0,0,0,0.4)" rx={4} 
                  />
                  {/* Simulate grid lines (vertical) */}
                  {Array.from({length: 6}).map((_, i) => (
                     <line key={`v-${i}`} x1={el.x + cellW * (i+1)} y1={el.y + headerH} x2={el.x + cellW * (i+1)} y2={el.y + el.height} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                  ))}
                  {/* Simulate grid lines (horizontal) */}
                  {Array.from({length: 5}).map((_, i) => (
                     <line key={`h-${i}`} x1={el.x} y1={el.y + headerH + cellH * (i+1)} x2={el.x + el.width} y2={el.y + headerH + cellH * (i+1)} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                  ))}
                  {/* Header separator */}
                  <line x1={el.x} y1={el.y + headerH} x2={el.x + el.width} y2={el.y + headerH} stroke="rgba(0,0,0,0.5)" strokeWidth={3} />
                </g>
             );
          }

          return null;
        })}
      </svg>
    </div>
  );
});
