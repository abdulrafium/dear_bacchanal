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
import { Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/hooks/useAuthModal";

export default function EditorPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { openModal } = useAuthModal();
  const router = useRouter();

  /* Temporarily commented out auth redirect for dev
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
      openModal("signin");
    }
  }, [isAuthenticated, isLoading, router, openModal]);
  */

  /*
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">
            {isLoading ? "Loading Editor..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }
  */

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading Workspace Components...</p>
        </div>
      </div>
    }>
      <EditorWorkspace />
    </Suspense>
  );
}
