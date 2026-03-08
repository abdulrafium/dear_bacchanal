"use client";

import { EditorTopToolbar } from "./EditorTopToolbar";
import { EditorLeftSidebar } from "./EditorLeftSidebar";
import { EditorLeftPanel } from "./EditorLeftPanel";
import { EditorCanvas } from "./EditorCanvas";
import { EditorBottomBar } from "./EditorBottomBar";
import { EditorElementToolbar } from "./EditorElementToolbar";
import { useEditorStore } from "@/store/editor-store";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EditorWorkspace() {
  const activeSidebarPanel = useEditorStore((s) => s.activeSidebarPanel);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  
  const searchParams = useSearchParams();
  const templateName = searchParams.get("templateName");
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEditorState = async () => {
      try {
        const query = new URLSearchParams();
        if (isAdmin) query.set("isAdmin", "true");
        if (templateName) query.set("templateName", templateName);

        const res = await fetch(`/api/editor/load?` + query.toString());
        if (res.ok) {
          const data = await res.json();
          
          if (isAdmin && data.template?.spreads?.length) {
            loadTemplate(data.template.spreads, data.template.templateName);
            if (data.template.currentSpreadIndex !== undefined) {
              setCurrentSpread(data.template.currentSpreadIndex);
            }
          } else if (!isAdmin && data.book?.spreads?.length) {
            loadTemplate(data.book.spreads, data.book.activeTemplateName);
            if (data.book.currentSpreadIndex !== undefined) {
              setCurrentSpread(data.book.currentSpreadIndex);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load editor state", err);
      } finally {
        setLoading(false);
      }
    };

    loadEditorState();
  }, [isAdmin, templateName, loadTemplate]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f5f5f5]">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f5f5f5] overflow-hidden select-none relative">
      <EditorElementToolbar />
      {/* Top Toolbar */}
      <EditorTopToolbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {!isPreviewMode && activeSidebarPanel && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => useEditorStore.getState().setSidebarPanel(null)}
          />
        )}

        {/* Left Sidebar Icons - Sidebar on desktop, hidden on mobile (moved to bottom) */}
        {!isPreviewMode && (
          <div className="hidden md:block flex-shrink-0 border-r border-gray-200">
            <EditorLeftSidebar />
          </div>
        )}

        {/* Left Content Panel - Slide up on mobile, sidebar on desktop */}
        {!isPreviewMode && activeSidebarPanel && (
          <div className="absolute inset-x-0 bottom-0 top-auto z-40 md:relative md:inset-auto md:z-auto h-[60vh] md:h-auto border-t md:border-t-0 border-gray-200 shadow-2xl md:shadow-none animate-in slide-in-from-bottom md:animate-none">
             <div className="flex justify-end p-2 bg-white md:hidden">
                <button onClick={() => useEditorStore.getState().setSidebarPanel(null)} className="text-sm font-bold text-gray-500">Close</button>
             </div>
            <EditorLeftPanel />
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 relative overflow-hidden flex justify-center items-center">
          <EditorCanvas />
        </div>
      </div>

      {/* Mobile Tools Bar (only on smaller screens) */}
      {!isPreviewMode && (
        <div className="md:hidden border-t border-gray-200">
           <EditorLeftSidebar />
        </div>
      )}

      {/* Bottom Page Navigation */}
      <EditorBottomBar />
    </div>
  );
}
