"use client";

import dynamic from "next/dynamic";

// Konva must be loaded client-side only (no SSR)
const EditorWorkspace = dynamic(() => import("@/components/editor/EditorWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading Editor...</p>
      </div>
    </div>
  ),
});
import { Suspense } from "react";

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading Editor...</p>
        </div>
      </div>
    }>
      <EditorWorkspace />
    </Suspense>
  );
}
