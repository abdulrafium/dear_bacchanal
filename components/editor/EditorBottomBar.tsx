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
import { useState } from "react";

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

  const [showPageMenu, setShowPageMenu] = useState(false);

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
                <button onClick={() => { addSpread(); setShowPageMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" title="Add New Pages">
                  <Plus className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button onClick={() => { duplicateSpread(currentSpreadIndex); setShowPageMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" title="Duplicate Current">
                  <Copy className="w-3.5 h-3.5 text-violet-500" />
                </button>
                <button onClick={() => { removeSpread(currentSpreadIndex); setShowPageMenu(false); }} disabled={spreads.length <= 1} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 disabled:opacity-30 transition-colors" title="Delete Spread">
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Thumbnails */}
      {showThumbnails && (
        <div className="flex items-center gap-3 px-4 py-4 overflow-x-auto bg-gray-50/20 custom-scrollbar border-t border-gray-100">
          {spreads.map((spread, index) => (
            <button
              key={spread.id}
              onClick={() => setCurrentSpread(index)}
              className={`flex-shrink-0 group transition-all duration-300 ${
                index === currentSpreadIndex ? "scale-105" : "opacity-40 hover:opacity-100"
              }`}
            >
              <div className={`flex rounded-lg overflow-hidden shadow-xl transition-all ${
                  index === currentSpreadIndex
                    ? "ring-2 ring-[#2d2d2d] ring-offset-2"
                    : "ring-1 ring-gray-100 group-hover:ring-gray-300"
                }`}
              >
                <div className="w-12 h-16 bg-white" style={{ backgroundColor: spread.leftPage.background }} />
                <div className="w-12 h-16 bg-white border-l border-gray-50" style={{ backgroundColor: spread.rightPage.background }} />
              </div>
              <p className="text-[9px] font-bold text-gray-400 text-center mt-2 uppercase tracking-widest">
                {index === 0 ? "Cover" : `P. ${index * 2 - 1}-${index * 2}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
