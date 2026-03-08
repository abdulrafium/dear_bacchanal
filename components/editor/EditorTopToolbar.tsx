"use client";

import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editor-store";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Clock,
  Settings2,
  Play,
  Save,
  Eye,
  Pencil,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { OrderModal } from "./OrderModal";

export function EditorTopToolbar() {
  const router = useRouter();
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const historyLength = useEditorStore((s) => s.history.length);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const togglePreview = useEditorStore((s) => s.togglePreview);
  const spreads = useEditorStore((s) => s.spreads);
  const isAdmin = useEditorStore((s) => s.isAdmin);
  const activeTemplateName = useEditorStore((s) => s.activeTemplateName);
  const currentSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "modified">("saved");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Auto-save logic
  useEffect(() => {
    // Only auto-save if they've explicitly dirtied the state
    if (isDirty) {
      setSaveStatus("modified");

      const timer = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await fetch("/api/editor/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spreads, isAdmin, activeTemplateName, currentSpreadIndex }),
          });
          setSaveStatus("saved");
          setDirty(false); // Reset dirty flag after successful save
        } catch (error) {
          console.error("Auto-save failed", error);
          setSaveStatus("modified");
        }
      }, 3000); // Wait 3 seconds after last edit to autosave

      return () => clearTimeout(timer);
    }
  }, [isDirty, spreads, isAdmin, activeTemplateName, currentSpreadIndex, setDirty]);

  const handleManualSave = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/editor/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreads, isAdmin, activeTemplateName, currentSpreadIndex }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }
      
      const data = await res.json();
      toast.success(data.message || "Book saved successfully!");
      setSaveStatus("saved");
      setDirty(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save the book.");
      setSaveStatus("modified");
    }
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => router.push("/book")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="ml-2 mr-4 hidden sm:block">
          <span className="font-display text-lg font-bold text-[#2d2d2d] tracking-tight">
            bacchanal
          </span>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={undo}
          disabled={historyIndex < 0}
          className="flex flex-col items-center gap-0.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Undo"
        >
          <Undo2 className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-500 hidden md:block">Undo</span>
        </button>

        <button
          onClick={redo}
          disabled={historyIndex >= historyLength - 1}
          className="flex flex-col items-center gap-0.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
          title="Redo"
        >
          <Redo2 className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-500 hidden md:block">Redo</span>
        </button>
      </div>

      {/* Center */}
      <button className="hidden lg:flex items-center gap-2 bg-[#2d2d2d] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#404040] transition-colors">
        <Play className="w-4 h-4 fill-current" />
        Video Tutorial
      </button>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center text-[10px] text-gray-400 mr-2">
          {saveStatus === "saving" && <span className="animate-pulse flex items-center gap-1"><Clock className="w-3 h-3"/> Saving draft...</span>}
          {saveStatus === "saved" && <span className="text-green-500 font-medium flex items-center gap-1">Saved</span>}
        </div>

        <button 
          onClick={handleManualSave}
          disabled={saveStatus === "saving"}
          className="flex flex-col items-center gap-0.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] text-gray-500 hidden md:block">Save</span>
        </button>

        <button
          onClick={togglePreview}
          className="flex flex-col items-center gap-0.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
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

        <button 
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center gap-1.5 bg-[#2d2d2d] text-white px-3 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold hover:bg-[#404040] transition-colors ml-1 md:ml-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden xs:block">Order</span>
        </button>
      </div>

      <OrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
      />
    </div>
  );
}
