"use client";

import { useEditorStore } from "@/store/editor-store";
import { Type, Image, QrCode, LayoutGrid, Square, Circle } from "lucide-react";

const tools = [
  { id: "text" as const, label: "Text", icon: Type },
  { id: "photo" as const, label: "Photo", icon: Image },
  { id: "layout" as const, label: "Layout", icon: LayoutGrid },
  { id: "rectangle" as const, label: "Rectangle", icon: Square },
  { id: "ellipse" as const, label: "Ellipse", icon: Circle },
];

export function EditorPageTools({ pageId, align }: { pageId: string, align: "left" | "right" }) {
  const activeRightTool = useEditorStore((s) => s.activeRightTool);
  const setRightTool = useEditorStore((s) => s.setRightTool);
  const addElement = useEditorStore((s) => s.addElement);
  const zoom = useEditorStore((s) => s.zoom);
  
  const scale = zoom / 100;

  const handleToolClick = (toolId: typeof tools[number]["id"]) => {
    setRightTool(toolId);

    switch (toolId) {
      case "text":
        addElement(pageId, {
          type: "text",
          x: 100,
          y: 200,
          width: 200,
          height: 40,
          rotation: 0,
          text: "Enter text",
          fontSize: 18,
          fontFamily: "Arial",
          fill: "#000000",
        });
        break;

      case "rectangle":
        addElement(pageId, {
          type: "shape",
          x: 100,
          y: 150,
          width: 150,
          height: 100,
          rotation: 0,
          shapeType: "rectangle",
          stroke: "#333333",
          strokeWidth: 2,
          shapeFill: "transparent",
        });
        break;

      case "ellipse":
        addElement(pageId, {
          type: "shape",
          x: 100,
          y: 150,
          width: 120,
          height: 120,
          rotation: 0,
          shapeType: "ellipse",
          stroke: "#333333",
          strokeWidth: 2,
          shapeFill: "transparent",
        });
        break;

      case "photo":
        // Trigger file picker
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            addElement(pageId, {
              type: "image",
              x: 80,
              y: 100,
              width: 220,
              height: 160,
              rotation: 0,
              src: url,
            });
          }
        };
        input.click();
        break;

      case "layout":
        useEditorStore.getState().setSidebarPanel("layouts");
        break;
    }

    // Reset tool after use
    setTimeout(() => setRightTool(null), 300);
  };

  return (
    <div 
      className={`absolute flex flex-col gap-2 z-30 top-[10%]`}
      style={{
        left: align === "left" ? 0 : "auto",
        right: align === "right" ? 0 : "auto",
        transform: `
          ${align === "left" ? 'translateX(calc(-100% - 16px))' : 'translateX(calc(100% + 16px))'}
          scale(${scale})
        `,
        transformOrigin: align === "left" ? "top right" : "top left",
      }}
    >
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleToolClick(id)}
          className={`flex flex-col items-center justify-center gap-1 w-14 h-16 rounded-xl border transition-all duration-200 ${
            activeRightTool === id
              ? "bg-white border-gray-300 shadow-md text-[#2d2d2d]"
              : "bg-white/95 backdrop-blur border-gray-200 text-gray-400 hover:bg-white hover:text-gray-800 hover:shadow-sm"
          }`}
        >
          {id === "text" ? (
             <span className="font-serif font-black text-xl leading-none text-gray-700 group-hover:text-gray-900 mb-[2px]">A+</span>
          ) : id === "photo" ? (
             <Image className="w-[18px] h-[18px] mb-[2px] text-gray-500" strokeWidth={1.5} />
          ) : id === "layout" ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-[2px] text-gray-500"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
          ) : (
             <Icon className="w-[18px] h-[18px] mb-[2px] text-gray-500" strokeWidth={1.5} />
          )}
          <span className="text-[10px] font-medium tracking-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}
