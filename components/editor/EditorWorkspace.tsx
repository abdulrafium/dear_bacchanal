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
import { Loader2, Edit3, LayoutGrid, Layout } from "lucide-react";

import { useFirebase } from "@/providers/FirebaseAuthProvider";

export default function EditorWorkspace() {
  const activeSidebarPanel = useEditorStore((s) => s.activeSidebarPanel);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const resetEditor = useEditorStore((s) => s.resetEditor);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const setCurrentSpread = useEditorStore((s) => s.setCurrentSpread);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const { refreshUser } = useFirebase();
  
  const searchParams = useSearchParams();
  const templateName = searchParams.get("templateName");
  const isAdminParam = searchParams.get("isAdmin") === "true";
  
  const [loading, setLoading] = useState(true);
  const lastLoadedRef = useRef<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(220); 
  const [bottomBarHeight, setBottomBarHeight] = useState(140);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);

  // Sync isAdmin once from URL on mount
  useEffect(() => {
    if (isAdminParam && !isAdmin) {
      useEditorStore.getState().setIsAdmin(true);
    }
  }, []);

  const handleSidebarResize = (e: MouseEvent) => {
    if (isResizingSidebar) {
      const newWidth = Math.max(220, Math.min(600, e.clientX - 64)); 
      setSidebarWidth(newWidth);
    }
  };

  const handleBottomResize = (e: MouseEvent) => {
    if (isResizingBottom) {
      const newHeight = Math.max(80, Math.min(400, window.innerHeight - e.clientY));
      setBottomBarHeight(newHeight);
    }
  };

  useEffect(() => {
    if (isResizingSidebar) window.addEventListener("mousemove", handleSidebarResize);
    if (isResizingBottom) window.addEventListener("mousemove", handleBottomResize);
    
    const stopResizing = () => {
      setIsResizingSidebar(false);
      setIsResizingBottom(false);
    };

    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleSidebarResize);
      window.removeEventListener("mousemove", handleBottomResize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizingSidebar, isResizingBottom]);

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
          headers: { 
              "Pragma": "no-cache",
              "Authorization": `Bearer ${localStorage.getItem("fb_token") || ""}`,
              "x-user-email": localStorage.getItem("fb_user_email") || "",
              "x-user-id": localStorage.getItem("fb_user_id") || ""
          }
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
    
    // AUTO-SAVE LOGIC: Debounced saving of user progress
    let saveTimeout: NodeJS.Timeout;
    const { spreads, isDirty, save, isAdmin: isAdminStore } = useEditorStore.getState();
    
    if (isDirty && !isAdminStore) { // Auto-save for users only, admins save manually to prevent accidental template overrides
      saveTimeout = setTimeout(() => {
        save();
      }, 2500);
    }

    // Add keyboard listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        useEditorStore.getState().save();
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
  }, []); // Only on mount

  // DEDICATED AUTO-SAVE: Watch spreads and dirty state
  const spreads = useEditorStore((s) => s.spreads);
  const isDirty = useEditorStore((s) => s.isDirty);
  const save = useEditorStore((s) => s.save);
  const isAdminStore = useEditorStore((s) => s.isAdmin);

  useEffect(() => {
    let saveTimeout: NodeJS.Timeout;
    
    if (isDirty && !isAdminStore) {
      saveTimeout = setTimeout(() => {
        save();
      }, 3000); // 3 second debounce
    }

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [isDirty, spreads, isAdminStore, save]);

  const downloadTriggeredRef = useRef(false);

  // Handle auto-download after payment
  useEffect(() => {
    const isPaymentSuccess = searchParams.get("payment") === "success";
    const isLoaded = useEditorStore.getState().templateLoaded;
    const stage = useEditorStore.getState().stageRef;

    if (isPaymentSuccess && isLoaded && stage && !loading && !downloadTriggeredRef.current) {
      downloadTriggeredRef.current = true;
      
      const triggerDownload = async () => {
        const { generatePdfBook } = useEditorStore.getState();
        const { toast } = await import("sonner");
        
        toast.info("Payment verified! Starting your automatic book download...", {
          duration: 5000,
        });

        try {
          await generatePdfBook();
          await refreshUser();

          // Clean up URL
          const url = new URL(window.location.href);
          url.searchParams.delete("payment");
          window.history.replaceState({}, "", url.toString());
        } catch (err) {
            console.error("Auto-download failed:", err);
            downloadTriggeredRef.current = false; // Allow retry if it failed
        }
      };

      triggerDownload();
    }
  }, [searchParams, loading]);

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
          <div 
            style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : sidebarWidth }}
            className="absolute inset-x-0 bottom-0 top-auto z-40 md:relative md:inset-auto md:z-auto h-[65vh] md:h-auto border-t md:border-t-0 border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none animate-in slide-in-from-bottom md:animate-none text-black flex flex-row shrink-0 bg-white rounded-t-3xl md:rounded-none overflow-hidden"
          >
             <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex flex-col items-center bg-white md:hidden border-b border-gray-50">
                    <div className="w-12 h-1 bg-gray-200 rounded-full mt-3 mb-2" />
                    <button 
                      onClick={() => useEditorStore.getState().setSidebarPanel(null)} 
                      className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                    >
                      Dismiss Tools
                    </button>
                </div>
                <EditorLeftPanel />
             </div>

             {/* Resize Handle */}
             <div 
                className="hidden md:flex w-1 bg-gray-100/50 hover:bg-teal/40 cursor-col-resize items-center justify-center group transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizingSidebar(true);
                }}
             >
                <div className="w-[2px] h-8 bg-gray-300 group-hover:bg-teal rounded-full" />
             </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden flex justify-center items-center">
          <EditorCanvas />
        </div>
      </div>

        <div 
           style={{ height: bottomBarHeight }}
           className="hidden md:block border-t border-gray-200 bg-white shrink-0 relative z-50"
        >
           {/* Resize Handle */}
           <div 
              className="absolute -top-[3px] inset-x-0 h-[6px] bg-transparent hover:bg-teal/40 cursor-row-resize z-50 transition-colors flex items-center justify-center group"
              onMouseDown={(e) => {
                 e.preventDefault();
                 setIsResizingBottom(true);
              }}
           >
              <div className="h-[1.5px] w-12 bg-gray-300 group-hover:bg-teal rounded-full" />
           </div>
           <div className="h-full overflow-hidden">
             <EditorBottomBar />
           </div>
        </div>

      {/* Mobile Tool Navigation */}
      {!isPreviewMode && (
        <div className="md:hidden fixed bottom-[70px] left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-full shadow-2xl z-50 transition-all active:scale-95">
           <button 
             onClick={() => useEditorStore.getState().setSidebarPanel("stickers")}
             className={`p-2 rounded-full transition-colors ${activeSidebarPanel === "stickers" ? "bg-black text-white" : "text-gray-500"}`}
           >
             <LayoutGrid className="w-5 h-5" />
           </button>
           <div className="w-px h-4 bg-gray-200" />
           <button 
             onClick={() => useEditorStore.getState().setSidebarPanel("text")}
             className={`p-2 rounded-full transition-colors ${activeSidebarPanel === "text" ? "bg-black text-white" : "text-gray-500"}`}
           >
            <Edit3 className="w-5 h-5" />
           </button>
           <div className="w-px h-4 bg-gray-200" />
           <button 
             onClick={() => useEditorStore.getState().setSidebarPanel("layouts")}
             className={`p-2 rounded-full transition-colors ${activeSidebarPanel === "layouts" ? "bg-black text-white" : "text-gray-500"}`}
           >
             <Layout className="w-5 h-5" />
           </button>
        </div>
      )}

      {!isPreviewMode && (
        <div className="md:hidden border-t border-gray-200 h-[60px] bg-white">
           <EditorBottomBar />
        </div>
      )}
    </div>
  );
}
