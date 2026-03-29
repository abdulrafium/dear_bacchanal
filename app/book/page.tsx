"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirects from deprecated /book route to /editor
 */
export default function BookRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/editor");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">Redirecting to Editor...</p>
      </div>
    </div>
  );
}
