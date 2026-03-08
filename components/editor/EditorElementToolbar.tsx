"use client";

import { useEditorStore } from "@/store/editor-store";
import { Underline, AlignLeft, AlignCenter, AlignRight, Layers, Trash2, Bookmark, ChevronDown, Lock, Unlock } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function EditorElementToolbar() {
  const spreads = useEditorStore((s) => s.spreads);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const updateElement = useEditorStore((s) => s.updateElement);
  const removeElement = useEditorStore((s) => s.removeElement);
  const addElement = useEditorStore((s) => s.addElement);
  const toggleElementLock = useEditorStore((s) => s.toggleElementLock);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const isAdmin = useEditorStore((s) => s.isAdmin);

  if (isPreviewMode || !selectedElementId) return null;

  let selectedElementInfo = null;
  for (const spread of spreads) {
    let el = spread.leftPage.elements.find((e) => e.id === selectedElementId);
    if (el) {
      selectedElementInfo = { element: el, pageId: spread.leftPage.id };
      break;
    }
    el = spread.rightPage.elements.find((e) => e.id === selectedElementId);
    if (el) {
      selectedElementInfo = { element: el, pageId: spread.rightPage.id };
      break;
    }
  }

  if (!selectedElementInfo) return null;

  const { element, pageId } = selectedElementInfo;

  const fonts = ["Arial", "Courier New", "Georgia", "Times New Roman", "Verdana", "Instrument Serif", "Kalam", "sans-serif", "serif"];
  const sizes = [12, 14, 16, 18, 20, 24, 28, 36, 48, 60, 72, 96, 120];

  const update = (updates: Partial<typeof element>) => {
    updateElement(pageId, element.id, updates);
  };

  const handleDuplicate = () => {
    addElement(pageId, {
      ...element,
      x: element.x + 20,
      y: element.y + 20,
    });
  };

  const handleDelete = () => {
    removeElement(pageId, element.id);
  };

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Kalam:wght@300;400;700&display=swap');`}
      </style>
      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-40 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center p-2 gap-2 h-14">
        
        {element.type === "text" && (
          <>
            {/* Font Family */}
      <div className="relative group flex items-center h-10 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-colors w-40 justify-between">
        <select
          value={element.fontFamily || "Arial"}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {fonts.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <span className="text-sm text-gray-700 truncate font-serif" style={{ fontFamily: element.fontFamily }}>
          {element.fontFamily || "Font"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>

      {/* Font Size */}
      <div className="relative group flex items-center h-10 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-colors w-24 justify-between">
        <select
          value={element.fontSize || 18}
          onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {sizes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-sm text-gray-700">{element.fontSize}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Color Picker */}
      <div className="relative w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer overflow-hidden flex items-center justify-center">
        <div className="w-6 h-6 rounded-sm shadow-sm" style={{ backgroundColor: element.fill || "#000" }} />
        <input
          type="color"
          value={element.fill || "#000000"}
          onChange={(e) => update({ fill: e.target.value })}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>

      <div className="w-[1px] h-6 bg-gray-200 mx-1" />

      {/* Underline */}
      <button 
        onClick={() => update({ fontStyle: element.fontStyle === "underline" ? "normal" : "underline" })}
        className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
          element.fontStyle === "underline" 
            ? "bg-gray-100 border-gray-300 text-gray-900" 
            : "border-transparent text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Underline className="w-5 h-5" />
      </button>

      {/* Alignment */}
      <button 
        onClick={() => {
          const nextAlign = element.align === "left" ? "center" : element.align === "center" ? "right" : "left";
          update({ align: nextAlign as any });
        }}
        className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {element.align === "center" ? <AlignCenter className="w-5 h-5" /> : element.align === "right" ? <AlignRight className="w-5 h-5" /> : <AlignLeft className="w-5 h-5" />}
      </button>

            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
          </>
        )}

        {/* Layers */}
      <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors" title="Bring to front">
        <Layers className="w-5 h-5" />
      </button>

      {/* Delete */}
      <button onClick={handleDelete} className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors hover:text-red-500" title="Delete">
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Duplicate / Save Bookmark */}
      <button onClick={handleDuplicate} className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors" title="Duplicate">
        <Bookmark className="w-5 h-5" />
      </button>

        {element.type === "text" && (
          <button className="ml-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm">
            Apply to all
          </button>
        )}

        {/* Lock/Unlock feature for Admins */}
        {isAdmin && (
          <>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            <button 
              onClick={() => toggleElementLock(pageId, element.id)} 
              className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                element.isLocked ? "bg-red-50 border-red-200 text-red-600" : "border-transparent text-gray-600 hover:bg-gray-50"
              }`} 
              title={element.isLocked ? "Unlock Element" : "Lock Element"}
            >
              {element.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </button>
          </>
        )}

      </div>
    </>
  );
}
