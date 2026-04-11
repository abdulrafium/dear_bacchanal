"use client";

import { useEditorStore } from "@/store/editor-store";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Layers, Trash2, Bookmark, ChevronDown, Lock, Unlock } from "lucide-react";
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
  const setPreviewElement = useEditorStore((s) => s.setPreviewElement);

  const [isFontOpen, setIsFontOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const fonts = [
    "Arial",
    "Boogaloo",
    "Fredoka One",
    "Baloo 2",
    "Titan One",
    "Architects Daughter",
    "Patrick Hand",
    "Luckiest Guy",
    "Poppins",
    "Instrument Serif",
    "Kalam",
    "Caveat",
    "Pacifico",
    "Anton",
    "Bangers",
    "Lobster",
    "Montserrat",
    "Oswald",
    "Playfair Display",
    "Inter",
    "Courier New",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "sans-serif",
    "serif"
  ];
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
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Kalam:wght@300;400;700&family=Poppins:wght@300;400;500;600;700;800;900&family=Luckiest+Guy&family=Caveat:wght@400;700&family=Pacifico&family=Anton&family=Bangers&family=Lobster&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Inter:wght@400;700&family=Boogaloo&family=Fredoka+One&family=Baloo+2:wght@400;700&family=Titan+One&family=Architects+Daughter&family=Patrick+Hand&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}} />
      <div className="fixed md:absolute top-[80px] left-0 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 z-40 bg-white rounded-none md:rounded-xl shadow-lg border-b md:border border-gray-100 flex items-center p-2 gap-2 h-14 max-w-full overflow-visible">

        {(element.type === "text" || element.type === "calendar") && (
          <>
            {/* Real-time Font Family Selector */}
            <div ref={fontDropdownRef} className="relative shrink-0">
              <button
                onClick={() => setIsFontOpen(!isFontOpen)}
                className="flex items-center h-10 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-colors w-36 md:w-44 justify-between gap-2"
              >
                <span className="text-xs md:text-[13px] text-gray-900 truncate" style={{ fontFamily: element.fontFamily }}>
                  {element.fontFamily || (element.type === "calendar" ? "Boogaloo" : "Font")}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isFontOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFontOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {fonts.map((f) => (
                    <button
                      key={f}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between group ${element.fontFamily === f ? 'bg-gray-50 text-black font-bold' : 'text-gray-600'}`}
                      onMouseEnter={() => setPreviewElement(element.id, { fontFamily: f })}
                      onMouseLeave={() => setPreviewElement(null, null)}
                      onClick={() => {
                        update({ fontFamily: f });
                        setIsFontOpen(false);
                      }}
                    >
                      <span style={{ fontFamily: f }}>{f}</span>
                      {element.fontFamily === f && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size */}
            <div className="relative group flex items-center h-10 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg cursor-pointer transition-colors w-20 md:w-24 justify-between shrink-0">
              <select
                value={element.fontSize || (element.type === "calendar" ? 16 : 18)}
                onChange={(e) => {
                  const size = parseInt(e.target.value);
                  update({ fontSize: size });
                  setPreviewElement(null, null);
                }}
                onMouseEnter={() => setPreviewElement(element.id, { fontSize: element.fontSize || (element.type === "calendar" ? 16 : 18) })}
                onMouseLeave={() => setPreviewElement(null, null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {sizes.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs md:text-sm text-gray-700">{element.fontSize || (element.type === "calendar" ? 16 : 18)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </div>

            <div className="w-[1px] h-6 bg-gray-200 mx-1" />

            {/* Bold */}
            <button
              onClick={() => {
                const isBold = element.fontStyle?.includes("bold");
                const nextStyle = isBold
                  ? element.fontStyle?.replace("bold", "").trim() || "normal"
                  : `${element.fontStyle || ""} bold`.trim();
                update({ fontStyle: nextStyle });
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${element.fontStyle?.includes("bold")
                  ? "bg-gray-100 border-gray-300 text-gray-900"
                  : "border-transparent text-gray-600 hover:bg-gray-50"
                }`}
              title="Bold"
            >
              <Bold className="w-5 h-5" />
            </button>
          </>
        )}

        {element.type === "text" && (
          <>
            {/* Italic */}
            <button
              onClick={() => {
                const isItalic = element.fontStyle?.includes("italic");
                const nextStyle = isItalic
                  ? element.fontStyle?.replace("italic", "").trim() || "normal"
                  : `${element.fontStyle || ""} italic`.trim();
                update({ fontStyle: nextStyle });
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${element.fontStyle?.includes("italic")
                  ? "bg-gray-100 border-gray-300 text-gray-900"
                  : "border-transparent text-gray-600 hover:bg-gray-50"
                }`}
              title="Italic"
            >
              <Italic className="w-5 h-5" />
            </button>

            {/* Underline */}
            <button
              onClick={() => {
                const isUnderline = element.fontStyle?.includes("underline");
                const nextStyle = isUnderline
                  ? element.fontStyle?.replace("underline", "").trim() || "normal"
                  : `${element.fontStyle || ""} underline`.trim();
                update({ fontStyle: nextStyle });
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${element.fontStyle?.includes("underline")
                  ? "bg-gray-100 border-gray-300 text-gray-900"
                  : "border-transparent text-gray-600 hover:bg-gray-50"
                }`}
              title="Underline"
            >
              <Underline className="w-5 h-5" />
            </button>

            {/* Alignment */}
            <button
              onClick={() => {
                const nextAlign = element.align === "left" ? "center" : element.align === "center" ? "right" : "left";
                update({ align: nextAlign as any });
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
            >
              {element.align === "center" ? <AlignCenter className="w-5 h-5" /> : element.align === "right" ? <AlignRight className="w-5 h-5" /> : <AlignLeft className="w-5 h-5" />}
            </button>

            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
          </>
        )}

        {/* Layers */}
        <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors shrink-0" title="Bring to front">
          <Layers className="w-5 h-5" />
        </button>

        {/* Delete */}
        <button onClick={handleDelete} className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors hover:text-red-500 shrink-0" title="Delete">
          <Trash2 className="w-5 h-5" />
        </button>

        {/* Duplicate / Save Bookmark */}
        <button onClick={handleDuplicate} className="w-10 h-10 rounded-lg flex items-center justify-center border border-transparent text-gray-600 hover:bg-gray-50 transition-colors shrink-0" title="Duplicate">
          <Bookmark className="w-5 h-5" />
        </button>

        {element.type === "text" && (
          <button className="ml-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors text-xs md:text-sm shrink-0">
            Apply to all
          </button>
        )}
        
        {element.type === "calendar" && (
          <div className="relative w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer overflow-hidden flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-sm shadow-sm" style={{ backgroundColor: element.fill || "#000" }} />
            <input
              type="color"
              value={element.fill || "#000000"}
              onChange={(e) => update({ fill: e.target.value })}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </div>
        )}

        {/* Lock/Unlock feature for Admins */}
        {isAdmin && (
          <>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            <button
              onClick={() => toggleElementLock(pageId, element.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${element.isLocked ? "bg-red-50 border-red-200 text-red-600" : "border-transparent text-gray-600 hover:bg-gray-50"
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
