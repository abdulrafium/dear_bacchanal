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

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Icons */}
        {!isPreviewMode && <EditorLeftSidebar />}

        {/* Left Content Panel */}
        {!isPreviewMode && activeSidebarPanel && <EditorLeftPanel />}

        {/* Center Canvas */}
        <div className="flex-1 relative overflow-hidden flex justify-center items-center">
          <EditorCanvas />
        </div>
      </div>

      {/* Bottom Page Navigation */}
      <EditorBottomBar />
    </div>
  );
}
