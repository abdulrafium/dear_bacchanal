"use client";

import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editor-store";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Clock,
  Save,
  Eye,
  Pencil,
  ShoppingCart,
  Layout,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function EditorTopToolbar() {
  const router = useRouter();
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const isDirty = useEditorStore((s) => s.isDirty);
  const historyLength = useEditorStore((s) => s.history.length);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const togglePreview = useEditorStore((s) => s.togglePreview);
  const spreads = useEditorStore((s) => s.spreads);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const activeTemplateName = useEditorStore((s) => s.activeTemplateName);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "modified">("saved");

  const save = useEditorStore((s) => s.save);

  // Auto-save logic
  useEffect(() => {
    if (isDirty) {
      setSaveStatus("modified");
      const timer = setTimeout(async () => {
        setSaveStatus("saving");
        const success = await save();
        if (success) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("modified");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isDirty, save, spreads, historyIndex]);

  const handleManualSave = async () => {
    setSaveStatus("saving");
    const success = await save();
    if (success) {
      toast.success("Book saved successfully!");
      setSaveStatus("saved");
    } else {
      toast.error("Failed to save the book.");
      setSaveStatus("modified");
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-2 sm:px-4 z-50 flex-shrink-0">
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          onClick={() => router.push("/customize")}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {isAdmin && (
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-0.5 sm:ml-1 border border-red-100"
            title="Go to Admin Dashboard"
          >
            <Layout className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight hidden lg:block">Admin Portal</span>
          </button>
        )}

        <div className="ml-1 sm:ml-2 mr-2 sm:mr-4 hidden md:block">
          <span className="font-display text-lg font-bold text-[#2d2d2d] tracking-tight">
            bacchanal
          </span>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-0.5 sm:mx-1 hidden sm:block" />

        <div className="flex flex-col ml-1 sm:ml-2 mr-2 md:mr-4 hidden xs:flex">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex flex-col gap-0.5">
              <input 
                type="text"
                value={activeTemplateName || "Untitled Book"}
                onChange={(e) => useEditorStore.getState().setTemplateMetadata(e.target.value, null)}
                className="text-[11px] sm:text-sm font-bold text-black bg-white/50 border-b border-gray-100 focus:border-[#2d2d2d] focus:bg-white p-0.5 focus:ring-0 w-20 sm:w-32 md:w-64 outline-none transition-all placeholder:text-gray-300"
                placeholder="Name..."
              />
            </div>
            <span className="bg-[#2d2d2d] text-white text-[7px] sm:text-[8px] font-bold px-1 sm:px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm hidden sm:block">
              {isAdmin ? "Admin" : "Draft"}
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-0.5 sm:mx-1 hidden sm:block" />

        <button
          onClick={undo}
          disabled={historyIndex < 0}
          className="flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Undo"
        >
          <Undo2 className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-500 hidden md:block">Undo</span>
        </button>

        <button
          onClick={redo}
          disabled={historyIndex >= historyLength - 1}
          className="flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Redo"
        >
          <Redo2 className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-500 hidden md:block">Redo</span>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="hidden sm:flex items-center text-[10px] text-gray-400 mr-1 sm:mr-2">
          {saveStatus === "saving" && <span className="animate-pulse flex items-center gap-1"><Clock className="w-3 h-3"/> Saving...</span>}
          {saveStatus === "saved" && <span className="text-green-500 font-medium flex items-center gap-1 text-[9px] uppercase tracking-tighter">Synced</span>}
        </div>

        <button 
          onClick={handleManualSave}
          disabled={saveStatus === "saving"}
          className="flex flex-col items-center gap-0.5 px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-500 hidden md:block">Save</span>
        </button>

        <button
          onClick={togglePreview}
          className="flex flex-col items-center gap-0.5 px-1.5 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title={isPreviewMode ? "Edit" : "Preview"}
        >
          {isPreviewMode ? (
            <Pencil className="w-4 h-4 text-gray-600" />
          ) : (
            <Eye className="w-4 h-4 text-gray-600" />
          )}
          <span className="text-[10px] text-gray-500 hidden md:block">
            {isPreviewMode ? "Edit" : "Preview"}
          </span>
        </button>

        {isAdmin && (
          <button 
            onClick={async () => {
              const { generatePdfBook, spreads } = useEditorStore.getState();
              toast.info("Generating free Admin PDF for testing...");
              try {
                await generatePdfBook();
                toast.success("PDF generated successfully!");
              } catch (err) {
                console.error("PDF generation failed:", err);
                toast.error("Failed to generate PDF");
              }
            }}
            className="flex items-center gap-1 sm:gap-1.5 bg-red-600/10 text-red-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold hover:bg-red-600 hover:text-white transition-all ml-0.5 sm:ml-2 border border-red-200"
            title="Admin Quick PDF Test"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:block uppercase tracking-tight">Admin PDF</span>
          </button>
        )}

        {!isAdmin && (
          <button 
            onClick={() => useEditorStore.getState().setIsOrderModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#2d2d2d] text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs md:text-sm font-bold hover:bg-black transition-all ml-0.5 sm:ml-2 shadow-lg shadow-black/10 group"
          >
            <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden xs:block uppercase tracking-tight">Order</span>
          </button>
        )}
      </div>
    </div>
  );
}
