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
  const resetEditor = useEditorStore((s) => s.resetEditor);
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

        const res = await fetch(`/api/editor/load?${query.toString()}&t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          
          if (isAdmin) {
            if (data.template?.spreads?.length) {
              loadTemplate(data.template.spreads, data.template.templateName, data.template.description);
              if (data.template.currentSpreadIndex !== undefined) {
                setCurrentSpread(data.template.currentSpreadIndex, true);
              }
            } else if (templateName) {
              // Admin explicitly asked for a template by name, but it's not in DB yet
              // Load from hard-coded templates if available
              const { getAvailableTemplates } = await import('@/lib/book-templates');
              const hardTemplate = getAvailableTemplates().find(t => t.name === templateName);
              if (hardTemplate) {
                loadTemplate(hardTemplate.spreads, hardTemplate.name, hardTemplate.description);
              }
            }
          } else if (data.book?.spreads?.length) {
            loadTemplate(data.book.spreads, data.book.activeTemplateName, data.book.templateDescription);
            if (data.book.currentSpreadIndex !== undefined) {
              setCurrentSpread(data.book.currentSpreadIndex, true);
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
    
    // Add keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't delete if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedElementId, spreads, removeElement, isAdmin } = useEditorStore.getState();
        if (selectedElementId) {
          // Find which page the element is on and check for locks
          for (const spread of spreads) {
            const leftEl = spread.leftPage.elements.find(el => el.id === selectedElementId);
            if (leftEl) {
               if (isAdmin || (!spread.leftPage.isLocked && !leftEl.isLocked)) {
                  removeElement(spread.leftPage.id, selectedElementId);
               }
               break;
            }
            const rightEl = spread.rightPage.elements.find(el => el.id === selectedElementId);
            if (rightEl) {
               if (isAdmin || (!spread.rightPage.isLocked && !rightEl.isLocked)) {
                  removeElement(spread.rightPage.id, selectedElementId);
               }
               break;
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAdmin, templateName, loadTemplate, setCurrentSpread]);

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
