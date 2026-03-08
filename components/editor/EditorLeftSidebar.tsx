"use client";

import { useEditorStore, SidebarPanel } from "@/store/editor-store";
import { Image, LayoutGrid, Grid3X3, Paintbrush, Sticker } from "lucide-react";

const sidebarItems: { panel: SidebarPanel; label: string; icon: React.ElementType }[] = [
  { panel: "images", label: "Images", icon: Image },
  { panel: "templates", label: "Templates", icon: LayoutGrid },
  { panel: "layouts", label: "Layouts", icon: Grid3X3 },
  { panel: "backgrounds", label: "Backgrounds", icon: Paintbrush },
  { panel: "stickers", label: "Stickers", icon: Sticker },
];

export function EditorLeftSidebar() {
  const activeSidebarPanel = useEditorStore((s) => s.activeSidebarPanel);
  const setSidebarPanel = useEditorStore((s) => s.setSidebarPanel);

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 flex-shrink-0">
      {sidebarItems.map(({ panel, label, icon: Icon }) => {
        const isActive = activeSidebarPanel === panel;
        return (
          <button
            key={panel}
            onClick={() => setSidebarPanel(panel)}
            className={`w-14 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-[#2d2d2d] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
