"use client";

import { EditorTopToolbar } from "./EditorTopToolbar";
import { EditorLeftSidebar } from "./EditorLeftSidebar";
import { EditorLeftPanel } from "./EditorLeftPanel";
import { EditorCanvas } from "./EditorCanvas";
import { EditorBottomBar } from "./EditorBottomBar";
import { EditorElementToolbar } from "./EditorElementToolbar";
import { useEditorStore } from "@/store/editor-store";
import { useEffect, useState, useRef } from "react";
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
  const isAdminParam = searchParams.get("isAdmin") === "true";
  
  const [loading, setLoading] = useState(true);
  const lastLoadedRef = useRef<string | null>(null);

  // Sync isAdmin once from URL on mount
  useEffect(() => {
    if (isAdminParam && !isAdmin) {
      useEditorStore.getState().setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const loadEditorState = async () => {
      const isNewParam = searchParams.get("new") === "true";
      const currentKey = `${isAdmin}_${templateName}_${isNewParam}`;
      
      // If the store already matches the URL parameters, don't re-load from API
      const activeNameInStore = useEditorStore.getState().activeTemplateName;
      const isLoaded = useEditorStore.getState().templateLoaded;
      
      if (isLoaded && activeNameInStore === templateName && !isNewParam) {
        setLoading(false);
        return;
      }

      // Also use the ref as a secondary guard for the exact same fetch cycle
      if (lastLoadedRef.current === currentKey) {
        setLoading(false);
        return;
      }

      try {
        const query = new URLSearchParams();
        if (isAdminParam || isAdmin) query.set("isAdmin", "true");
        if (templateName) query.set("templateName", templateName);
        if (isNewParam) query.set("new", "true");

        const res = await fetch(`/api/editor/load?${query.toString()}&t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache" }
        });

        const spreadFromUrl = searchParams.get("spread");

        if (res.ok) {
          const data = await res.json();
          lastLoadedRef.current = currentKey;
          
          if (isAdminParam || isAdmin) {
            if (data.template?.spreads?.length) {
              loadTemplate(data.template.spreads, data.template.templateName, data.template.description, data.template.country, data.template.year, data.template._id);
              const targetIndex = spreadFromUrl ? parseInt(spreadFromUrl) : data.template.currentSpreadIndex;
              if (targetIndex !== undefined) {
                setCurrentSpread(targetIndex, true);
              }
            } else if (templateName) {
              const { getAvailableTemplates } = await import('@/lib/book-templates');
              const hardTemplate = getAvailableTemplates().find(t => t.name === templateName);
              if (hardTemplate) {
                loadTemplate(hardTemplate.spreads, hardTemplate.name, hardTemplate.description, hardTemplate.country, hardTemplate.year.toString(), hardTemplate.id);
                if (spreadFromUrl) setCurrentSpread(parseInt(spreadFromUrl), true);
              }
            }
          } else if (data.book?.spreads?.length) {
            loadTemplate(data.book.spreads, data.book.activeTemplateName, data.book.templateDescription, data.book.templateCountry, data.book.templateYear, data.book._id);
            const targetIndex = spreadFromUrl ? parseInt(spreadFromUrl) : data.book.currentSpreadIndex;
            if (targetIndex !== undefined) {
              setCurrentSpread(targetIndex, true);
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const { selectedElementId, spreads, removeElement, isAdmin: isAdminStore } = useEditorStore.getState();
        if (selectedElementId) {
          for (const spread of spreads) {
            const leftEl = spread.leftPage.elements.find(el => el.id === selectedElementId);
            if (leftEl) {
               if (isAdminStore || (!spread.leftPage.isLocked && !leftEl.isLocked)) {
                  removeElement(spread.leftPage.id, selectedElementId);
               }
               break;
            }
            const rightEl = spread.rightPage.elements.find(el => el.id === selectedElementId);
            if (rightEl) {
               if (isAdminStore || (!spread.rightPage.isLocked && !rightEl.isLocked)) {
                  removeElement(spread.rightPage.id, selectedElementId);
               }
               break;
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin, templateName, loadTemplate, setCurrentSpread, searchParams, isAdminParam]);

  // Sync templateName, isAdmin, and currentSpreadIndex with URL and handle beforeunload
  useEffect(() => {
    const state = useEditorStore.getState();
    const activeTemplateName = state.activeTemplateName;
    const currentSpreadIndex = state.currentSpreadIndex;
    const isAdminStore = state.isAdmin;

    if (activeTemplateName) {
      const url = new URL(window.location.href);
      let changed = false;

      if (url.searchParams.get("templateName") !== activeTemplateName) {
        url.searchParams.set("templateName", activeTemplateName);
        changed = true;
      }
      
      const spreadParam = url.searchParams.get("spread");
      if (spreadParam !== currentSpreadIndex.toString()) {
        url.searchParams.set("spread", currentSpreadIndex.toString());
        changed = true;
      }

      if (isAdminStore && url.searchParams.get("isAdmin") !== "true") {
        url.searchParams.set("isAdmin", "true");
        changed = true;
      }

      if (changed) {
        window.history.replaceState({}, "", url.toString());
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [useEditorStore((s) => s.activeTemplateName), useEditorStore((s) => s.currentSpreadIndex), useEditorStore((s) => s.isDirty), useEditorStore((s) => s.isAdmin)]);

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
      <EditorTopToolbar />

      <div className="flex flex-1 overflow-hidden relative">
        {!isPreviewMode && activeSidebarPanel && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => useEditorStore.getState().setSidebarPanel(null)}
          />
        )}

        {!isPreviewMode && (
          <div className="hidden md:block flex-shrink-0 border-r border-gray-200">
            <EditorLeftSidebar />
          </div>
        )}

        {!isPreviewMode && activeSidebarPanel && (
          <div className="absolute inset-x-0 bottom-0 top-auto z-40 md:relative md:inset-auto md:z-auto h-[60vh] md:h-auto border-t md:border-t-0 border-gray-200 shadow-2xl md:shadow-none animate-in slide-in-from-bottom md:animate-none text-black">
             <div className="flex justify-end p-2 bg-white md:hidden">
                <button onClick={() => useEditorStore.getState().setSidebarPanel(null)} className="text-sm font-bold text-gray-500">Close</button>
             </div>
            <EditorLeftPanel />
          </div>
        )}

        <div className="flex-1 relative overflow-hidden flex justify-center items-center">
          <EditorCanvas />
        </div>
      </div>

      {!isPreviewMode && (
        <div className="md:hidden border-t border-gray-200">
           <EditorLeftSidebar />
        </div>
      )}

      <EditorBottomBar />
    </div>
  );
}
