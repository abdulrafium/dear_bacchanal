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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { openModal } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/");
      openModal("signin");
      return;
    }

    // Ensure they have a template selected or are an admin or have existing books
    // For now, if no templateName is in URL, we can redirect to /customize 
    // BUT only if it's not a 'load existing' scenario.
    // Actually, let's keep it simple: if no templateName and not admin, go to customize.
    const searchParams = new URLSearchParams(window.location.search);
    const templateName = searchParams.get("templateName");
    const isNew = searchParams.get("new") === "true";
    
    const paymentStatus = searchParams.get("payment");
    
    if (!isAuthLoading && isAuthenticated && !templateName && !isNew && paymentStatus !== "success") {
      router.push("/customize");
    }
  }, [isAuthenticated, isAuthLoading, router, openModal]);

  // Only show the full-page loader if we're doing the initial auth check
  // or if we're not authenticated at all.
  if ((isAuthLoading && !isAuthenticated) || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">
            {isAuthLoading ? "Verifying Authentication..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

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
