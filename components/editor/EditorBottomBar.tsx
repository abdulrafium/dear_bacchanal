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

  const currentSpread = spreads[currentSpreadIndex];

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200 flex flex-col">
      {/* View mode + Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        {/* Left: View mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("spread")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "spread"
                ? "bg-gray-100 text-[#2d2d2d]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            One page
          </button>
          <button
            onClick={() => setViewMode("single")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "single"
                ? "bg-gray-100 text-[#2d2d2d]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            All pages
          </button>
        </div>

        {/* Center: Page navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevSpread}
            disabled={currentSpreadIndex === 0}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm text-gray-600">
            {currentSpreadIndex === 0 ? "Cover" : `Page ${currentSpreadIndex * 2 - 1}`}
            {currentSpread && ` — `}
            {currentSpreadIndex === 0 ? "Page 1" : `Page ${currentSpreadIndex * 2}`}
          </span>

          <button
            onClick={nextSpread}
            disabled={currentSpreadIndex >= spreads.length - 1}
            className="text-sm text-blue-500 hover:text-blue-700 font-medium disabled:opacity-30 disabled:text-gray-400"
          >
            Next page →
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={toggleThumbnails}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            {showThumbnails ? "Hide" : "Show"} page thumbnails ✓
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-1 ml-3 border-l border-gray-200 pl-3">
            <button onClick={() => setZoom(zoom - 10)} className="p-1 text-gray-400 hover:text-gray-700">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 w-10 text-center font-medium">{zoom}%</span>
            <button onClick={() => setZoom(zoom + 10)} className="p-1 text-gray-400 hover:text-gray-700">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Page actions */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowPageMenu(!showPageMenu)}
              className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showPageMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-40 z-50">
                <button
                  onClick={() => { addSpread(); setShowPageMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Pages
                </button>
                <button
                  onClick={() => { duplicateSpread(currentSpreadIndex); setShowPageMenu(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => { removeSpread(currentSpreadIndex); setShowPageMenu(false); }}
                  disabled={spreads.length <= 1}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Thumbnails */}
      {showThumbnails && (
        <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto">
          {spreads.map((spread, index) => (
            <button
              key={spread.id}
              onClick={() => setCurrentSpread(index)}
              className={`flex-shrink-0 group transition-all duration-200 ${
                index === currentSpreadIndex ? "scale-105" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div
                className={`flex rounded-lg overflow-hidden shadow-sm transition-all ${
                  index === currentSpreadIndex
                    ? "ring-2 ring-[#2d2d2d] ring-offset-2"
                    : "ring-1 ring-gray-200 group-hover:ring-gray-400"
                }`}
              >
                {/* Left mini page */}
                <div
                  className="w-12 h-16"
                  style={{ backgroundColor: spread.leftPage.background }}
                >
                  {spread.leftPage.isLocked && (
                    <div className="w-full h-full bg-black/30 flex items-center justify-center">
                      <span className="text-[5px] text-white font-bold">LOCKED</span>
                    </div>
                  )}
                </div>
                {/* Right mini page */}
                <div
                  className="w-12 h-16 border-l border-gray-200"
                  style={{ backgroundColor: spread.rightPage.background }}
                />
              </div>
              <p className="text-[10px] text-gray-500 text-center mt-1 font-medium">
                {index === 0 ? "Cover" : `Page ${index * 2 - 1}-${index * 2}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
