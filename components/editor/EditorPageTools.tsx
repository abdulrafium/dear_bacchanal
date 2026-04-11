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

export function EditorPageTools({ pageId, align }: { pageId: string, align: "left" | "right" | "center" }) {
  const activeRightTool = useEditorStore((s) => s.activeRightTool);
  const setRightTool = useEditorStore((s) => s.setRightTool);
  const addElement = useEditorStore((s) => s.addElement);
  const zoom = useEditorStore((s) => s.zoom);
  const viewMode = useEditorStore((s) => s.viewMode);
  
  const scale = viewMode === "single" ? 1 : (zoom / 100);

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
        useEditorStore.getState().setSidebarPanel("images");
        break;

      case "layout":
        useEditorStore.getState().setSidebarPanel("layouts");
        break;
    }

    // Reset tool after use
    setTimeout(() => setRightTool(null), 300);
  };

  const isCenter = align === "center";

  return (
    <div 
      className={`absolute z-30 flex ${isCenter ? "flex-row top-[-70px] left-1/2 -translate-x-1/2" : "flex-col top-[10%]"} gap-2 pointer-events-auto`}
      style={{
        left: isCenter ? "50%" : align === "left" ? 0 : "auto",
        right: align === "right" ? 0 : "auto",
        transform: `${isCenter 
          ? "translateX(-50%)" 
          : align === "left" 
            ? "translateX(calc(-100% - 16px))" 
            : "translateX(calc(100% + 16px))"} scale(${scale})`,
        transformOrigin: isCenter ? "center bottom" : align === "left" ? "top right" : "top left",
      }}
    >
      {tools.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleToolClick(id)}
          className={`flex flex-col items-center justify-center gap-1 ${isCenter ? "w-12 h-14" : "w-14 h-16"} rounded-xl border transition-all duration-200 ${
            activeRightTool === id
              ? "bg-[#2d2d2d] border-[#2d2d2d] shadow-lg text-white"
              : "bg-white/95 backdrop-blur border-gray-200 text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm"
          }`}
        >
          {id === "text" ? (
             <span className={`font-serif font-black ${isCenter ? "text-lg" : "text-xl"} leading-none mb-[1px] ${activeRightTool === id ? "text-white" : "text-gray-700"}`}>A+</span>
          ) : id === "photo" ? (
             <Image className={`${isCenter ? "w-4 h-4" : "w-[18px] h-[18px]"} mb-[2px]`} strokeWidth={1.5} />
          ) : (
             <Icon className={`${isCenter ? "w-4 h-4" : "w-[18px] h-[18px]"} mb-[2px]`} strokeWidth={1.5} />
          )}
          <span className="text-[9px] font-bold tracking-tight uppercase">{label}</span>
        </button>
      ))}
    </div>
  );
}
