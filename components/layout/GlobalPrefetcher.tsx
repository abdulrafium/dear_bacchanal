"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";
import { useSession } from "next-auth/react";

export function GlobalPrefetcher() {
  const { data: session } = useSession();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch once, and only if the user is logged in
    if (hasPrefetched.current || !session?.user) return;

    // Delay the prefetch by a few seconds so it absolutely never slows down the initial homepage load
    const timer = setTimeout(async () => {
      hasPrefetched.current = true;
      try {
        // Silently fetch the user's latest active book in the background
        const res = await fetch("/api/editor/load?loadLatest=true");
        if (res.ok) {
          const data = await res.json();
          
          if (data.book?.spreads?.length) {
            // 2. Pre-fetch every single sticker, image, and background into the browser cache
            data.book.spreads.forEach((spread: any) => {
              const elements = [...(spread.leftPage?.elements || []), ...(spread.rightPage?.elements || [])];
              elements.forEach((el: any) => {
                if (el.src) {
                  const img = new window.Image();
                  img.crossOrigin = "anonymous";
                  img.src = el.src; // This completely downloads the image in the background
                }
              });
            });
          }

          // 3. Pre-fetch premium stickers at thumbnail size (150px — same as panel display)
          const premiumStickers = [
            "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=60&w=150&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=60&w=150&auto=format&fit=crop",
          ];
          premiumStickers.forEach((url) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.src = url;
          });

          // 4. Pre-fetch custom stickers library
          fetch("/api/admin/stickers")
            .then((res) => res.json())
            .then((data) => {
              if (data.stickers) {
                data.stickers.forEach((s: any) => {
                  const img = new window.Image();
                  img.crossOrigin = "anonymous";
                  img.src = s.url;
                });
              }
            })
            .catch(() => {});

        }
      } catch (err) {
        // Silently fail in the background if network fails
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [session]);

  return null;
}
