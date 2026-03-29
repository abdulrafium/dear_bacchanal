"use client";

import { useEditorStore } from "@/store/editor-store";
import { Underline, Bold, AlignLeft, AlignCenter, AlignRight, Layers, Trash2, Bookmark, ChevronDown, Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function EditorElementToolbar() {
  const spreads = useEditorStore((s) => s.spreads);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const updateElement = useEditorStore((s) => s.updateElement);
  const removeElement = useEditorStore((s) => s.removeElement);
  const addElement = useEditorStore((s) => s.addElement);
  const toggleElementLock = useEditorStore((s) => s.toggleElementLock);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const setPreviewElement = useEditorStore((s) => s.setPreviewElement);

  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false);

  // Early returns must come after hooks
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

  const fontCategories = {
    "Serif": [
      "Playfair Display", "Instrument Serif", "Merriweather", "Lora", "EB Garamond", 
      "Crimson Text", "Lusitana", "Libre Baskerville"
    ],
    "Sans Serif": [
      "Montserrat", "Open Sans", "Roboto", "Lato", "Poppins", 
      "Outfit", "Inter", "Raleway", "Work Sans", "Quicksand"
    ],
    "Script": [
      "Kalam", "Dancing Script", "Pacifico", "Great Vibes", "Satisfy", 
      "Sacramento", "Lobster", "Alex Brush", "Cookie", "Parisienne"
    ],
    "Monospaced": [
      "Space Mono", "Fira Code", "Source Code Pro", "Courier Prime"
    ],
    "Display": [
      "Bungee", "Press Start 2P", "Creepster", "Special Elite", 
      "Fredericka the Great", "Cinzel", "Righteous", "Abril Fatface"
    ]
  };

  const sizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 96, 120];

  const update = (updates: Partial<typeof element>) => {
    updateElement(pageId, element.id, updates);
  };

  const handleDuplicate = () => {
    const { id, ...elementWithoutId } = element;
    addElement(pageId, {
      ...elementWithoutId,
      x: element.x + 20,
      y: element.y + 20,
    });
  };

  const handleDelete = () => {
    removeElement(pageId, element.id);
  };

  const handleApplyToAll = () => {
    const { fontFamily, fontSize, fill } = element;
    spreads.forEach(s => {
      s.leftPage.elements.forEach(el => {
        if (el.type === "text") updateElement(s.leftPage.id, el.id, { fontFamily, fontSize, fill });
      });
      s.rightPage.elements.forEach(el => {
        if (el.type === "text") updateElement(s.rightPage.id, el.id, { fontFamily, fontSize, fill });
      });
    });
    toast.success("Applied style to all text elements!");
  };

  const fontsImportString = Object.values(fontCategories).flat().map(f => `family=${f.replace(/ /g, "+")}`).join("&");

  return (
    <>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?${fontsImportString}&display=swap');`}
      </style>
      
      {/* 
        High-end floating toolbar 
        Using fixed position and very high z-index to ensure it's always interactable
      */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center justify-center pointer-events-none w-full px-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-200/50 flex items-center p-2 gap-2 h-14 pointer-events-auto h-auto min-h-14 overflow-visible max-w-full">
          
          {element.type === "text" && (
            <>
              {/* Font Name Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsFontMenuOpen(!isFontMenuOpen);
                    setIsSizeMenuOpen(false);
                  }}
                  className="flex items-center h-10 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer transition-all w-32 md:w-44 lg:w-56 justify-between select-none"
                >
                  <span className="text-xs md:text-sm text-gray-800 truncate" style={{ fontFamily: element.fontFamily }}>
                    {element.fontFamily || "Arial"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFontMenuOpen && (
                  <div className="absolute top-12 left-0 w-72 bg-white border border-gray-200 shadow-[0_30px_60px_rgba(0,0,0,0.2)] rounded-3xl py-3 z-[10000] animate-in fade-in zoom-in-95 max-h-[500px] overflow-y-auto hide-scrollbar">
                    {Object.entries(fontCategories).map(([category, fonts]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <div className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                          {category}
                        </div>
                        <div className="grid grid-cols-1">
                          {fonts.map(font => (
                            <button
                              key={font}
                              onClick={() => {
                                update({ fontFamily: font });
                                setIsFontMenuOpen(false);
                                setPreviewElement(null);
                              }}
                              onMouseEnter={() => setPreviewElement({ id: element.id, updates: { fontFamily: font } })}
                              onMouseLeave={() => setPreviewElement(null)}
                              className={`w-full px-5 py-3 text-left transition-all duration-200 flex items-center justify-between group/item ${
                                element.fontFamily === font 
                                  ? 'bg-gray-100/80 font-bold' 
                                  : 'bg-transparent'
                              } hover:bg-black text-[#1a1a1a] hover:text-white`}
                              style={{ fontFamily: font }}
                            >
                              <span className="text-xl leading-none">{font}</span>
                              {element.fontFamily === font && <div className="w-1.5 h-1.5 rounded-full bg-black group-hover/item:bg-white transition-colors"></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Font Size Dropdown */}
              <div className="relative">
                <button 
                   onClick={() => {
                     setIsSizeMenuOpen(!isSizeMenuOpen);
                     setIsFontMenuOpen(false);
                   }}
                   className="flex items-center h-10 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer transition-all w-16 md:w-20 justify-between select-none"
                >
                  <span className="text-xs md:text-sm text-gray-800">
                    {element.fontSize || 18}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSizeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSizeMenuOpen && (
                  <div className="absolute top-12 left-0 w-24 bg-white border border-gray-200 shadow-[0_30px_60px_rgba(0,0,0,0.2)] rounded-3xl py-3 z-[10000] animate-in fade-in zoom-in-95 max-h-[400px] overflow-y-auto text-center hide-scrollbar">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          update({ fontSize: size });
                          setIsSizeMenuOpen(false);
                        }}
                        className={`w-full px-4 py-2 hover:bg-black text-[#1a1a1a] hover:text-white transition-all duration-200 text-lg ${element.fontSize === size ? 'bg-gray-100 font-bold' : ''}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-[1px] h-6 bg-gray-200 mx-1 shrink-0" />

              {/* Color Picker */}
              <div className="relative w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer overflow-hidden flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: element.fill || "#000" }} />
                <input
                  type="color"
                  value={element.fill || "#000000"}
                  onChange={(e) => update({ fill: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer scale-150"
                />
              </div>

              <div className="w-[1px] h-6 bg-gray-200 mx-1 shrink-0" />

              {/* Bold */}
              <button 
                onClick={() => {
                  const current = element.fontStyle || "normal";
                  const isBold = current.includes("bold");
                  let next;
                  if (isBold) {
                    next = current.replace("bold", "").trim() || "normal";
                  } else {
                    next = (current === "normal" ? "bold" : `${current} bold`).trim();
                  }
                  update({ fontStyle: next });
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                  element.fontStyle?.includes("bold") 
                    ? "bg-black text-white border-black" 
                    : "border-transparent text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Bold className="w-5 h-5" />
              </button>

              {/* Underline */}
              <button 
                onClick={() => {
                  const current = element.fontStyle || "normal";
                  const isUnderline = current.includes("underline");
                  let next;
                  if (isUnderline) {
                    next = current.replace("underline", "").trim() || "normal";
                  } else {
                    next = (current === "normal" ? "underline" : `${current} underline`).trim();
                  }
                  update({ fontStyle: next });
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                  element.fontStyle?.includes("underline") 
                    ? "bg-black text-white border-black" 
                    : "border-transparent text-gray-600 hover:bg-gray-100"
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
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-100 transition-all shrink-0"
              >
                {element.align === "center" ? <AlignCenter className="w-5 h-5" /> : element.align === "right" ? <AlignRight className="w-5 h-5" /> : <AlignLeft className="w-5 h-5" />}
              </button>

              <div className="w-[1px] h-6 bg-gray-200 mx-1 shrink-0" />
            </>
          )}

          {/* Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="w-10 h-10 rounded-xl flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-100 transition-all" title="Layers">
              <Layers className="w-5 h-5" />
            </button>

            <button onClick={handleDelete} className="w-10 h-10 rounded-xl flex items-center justify-center border border-transparent text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete">
              <Trash2 className="w-5 h-5" />
            </button>

            <button onClick={handleDuplicate} className="w-10 h-10 rounded-xl flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-100 transition-all" title="Duplicate">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>

          {element.type === "text" && (
            <button 
              onClick={handleApplyToAll}
              className="ml-2 bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all text-[10px] md:text-sm shrink-0 active:scale-95 shadow-lg shadow-black/10"
            >
              Apply to all
            </button>
          )}

          {/* Admin Lock Controls */}
          {isAdmin && (
            <>
              <div className="w-[1px] h-6 bg-gray-200 mx-1 shrink-0" />
              <button 
                onClick={() => toggleElementLock(pageId, element.id)} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  element.isLocked ? "bg-red-50 border-red-200 text-red-600" : "border-transparent text-gray-600 hover:bg-gray-100"
                }`} 
                title={element.isLocked ? "Unlock Element" : "Lock Element"}
              >
                {element.isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}
