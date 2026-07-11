"use client";

import { useEditorStore, SidebarPanel, isTemplateSpread, isFullyLockedSpread } from "@/store/editor-store";
import { Image, LayoutGrid, Grid3X3, Paintbrush, Sticker, Calendar } from "lucide-react";

const sidebarItems: { panel: SidebarPanel; label: string; icon: React.ElementType }[] = [
  { panel: "images", label: "Images", icon: Image },
  { panel: "templates", label: "Templates", icon: LayoutGrid },
  { panel: "layouts", label: "Layouts", icon: Grid3X3 },
  { panel: "backgrounds", label: "Backgrounds", icon: Paintbrush },
  { panel: "stickers", label: "Stickers", icon: Sticker },
  { panel: "calendar" as any, label: "Calendar", icon: Calendar },
];

export function EditorLeftSidebar() {
  const activeSidebarPanel = useEditorStore((s) => s.activeSidebarPanel);
  const setSidebarPanel = useEditorStore((s) => s.setSidebarPanel);
  const spreads = useEditorStore((s) => s.spreads);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  
  const currentSpread = spreads[currentSpreadIndex];
  const isTemplatePage = isTemplateSpread(currentSpread, isAdmin, currentSpreadIndex);
  const isFullyLocked = isFullyLockedSpread(currentSpread, isAdmin, currentSpreadIndex);

  return (
    <div className="w-full md:w-16 h-16 md:h-full bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-row md:flex-col items-center justify-around md:justify-start py-1 md:py-3 gap-1 flex-shrink-0">
      {sidebarItems.map(({ panel, label, icon: Icon }) => {
        const isActive = activeSidebarPanel === panel;
        const isDisabled = isFullyLocked || (isTemplatePage && panel !== "images");

        return (
          <button
            key={panel}
            onClick={() => { if (!isDisabled) setSidebarPanel(panel); }}
            disabled={isDisabled}
            className={`w-full max-w-[70px] md:w-14 flex flex-col items-center gap-1 py-1 md:py-2.5 rounded-xl transition-all duration-200 ${
              isDisabled ? "opacity-30 cursor-not-allowed" :
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
