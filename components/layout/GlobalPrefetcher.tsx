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
            // 1. Inject the data directly into the global memory store
            useEditorStore.getState().loadTemplate(
              data.book.spreads,
              data.book.activeTemplateName,
              data.book.templateDescription,
              data.book.templateCountry,
              data.book.templateYear,
              data.book._id
            );

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

          // 3. Pre-fetch the premium stickers gallery
          const premiumStickers = [
            "https://images.unsplash.com/photo-1543160732-23720935794b?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1521404094228-56960b73c914?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517457373958-b7bdd058a548?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1555436169-20d9321f92f6?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1531058022187-017e408fc048?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1520110120305-6672fc927163?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=300&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1514525253344-f814d0743b15?q=80&w=300&auto=format&fit=crop",
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
