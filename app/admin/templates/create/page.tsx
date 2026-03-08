"use client";

import EditorWorkspace from "@/components/editor/EditorWorkspace";
import { useEditorStore } from "@/store/editor-store";
import { useEffect, Suspense } from "react";

export default function CreateTemplatePage() {
  const setIsAdmin = useEditorStore((s) => s.setIsAdmin);

  useEffect(() => {
    setIsAdmin(true);
    return () => setIsAdmin(false);
  }, [setIsAdmin]);

  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      <EditorWorkspace />
    </Suspense>
  );
}
