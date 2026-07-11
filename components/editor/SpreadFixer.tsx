"use client";
import { useEffect } from "react";
import { useEditorStore } from "@/store/editor-store";

export function SpreadFixer() {
  const spreads = useEditorStore((state) => state.spreads);
  const updateElement = useEditorStore((state) => state.updateElement);
  const addElement = useEditorStore((state) => state.addElement);

  useEffect(() => {
    if (!spreads || spreads.length < 17) return;

    // --- Fix Spread 15 ---
    const s15 = spreads[15];
    if (s15 && s15.leftPage) {
      const leftHistory = s15.leftPage.elements.find((el: any) => el.src === "/assets/historyLayer.png" || el.src === "/assets/historyLayer.PNG");
      if (leftHistory) {
        if (leftHistory.x !== 0 || leftHistory.width !== 1001) {
          updateElement(s15.leftPage.id, leftHistory.id, { x: 0, width: 1001, height: 500, isLocked: true });
        }
      } else {
        addElement(s15.leftPage.id, {
          type: "image", src: "/assets/historyLayer.png",
          x: 0, y: 0, width: 1001, height: 500, rotation: 0, isLocked: true
        } as any);
      }
    }

    if (s15 && s15.rightPage) {
      const rightHistory = s15.rightPage.elements.find((el: any) => el.src === "/assets/historyLayer.png" || el.src === "/assets/historyLayer.PNG");
      if (rightHistory) {
        if (rightHistory.x !== -500 || rightHistory.width !== 1001) {
          updateElement(s15.rightPage.id, rightHistory.id, { x: -500, width: 1001, height: 500, isLocked: true });
        }
      } else {
        addElement(s15.rightPage.id, {
          type: "image", src: "/assets/historyLayer.png",
          x: -500, y: 0, width: 1001, height: 500, rotation: 0, isLocked: true
        } as any);
      }
    }

    // --- Fix Spread 16 ---
    const s16 = spreads[16];
    if (s16 && s16.leftPage) {
      const font5 = s16.leftPage.elements.find((el: any) => el.src === "/assets/font5.png");
      if (font5) {
        if (font5.x !== 20 || font5.width !== 252) {
          updateElement(s16.leftPage.id, font5.id, { x: 20, width: 252, height: 193, isLocked: true });
        }
      } else {
        addElement(s16.leftPage.id, {
          type: "image", src: "/assets/font5.png",
          x: 20, y: 290, width: 252, height: 193, rotation: 0, isLocked: true
        } as any);
      }
    }

    if (s16 && s16.rightPage) {
      const hands = s16.rightPage.elements.find((el: any) => el.src === "/assets/hands.png");
      if (hands) {
        if (hands.x !== -10 || hands.width !== 560) {
          updateElement(s16.rightPage.id, hands.id, { x: -10, width: 560, height: 325, isLocked: true });
        }
      } else {
        addElement(s16.rightPage.id, {
          type: "image", src: "/assets/hands.png",
          x: -10, y: 175, width: 560, height: 325, rotation: 0, isLocked: true
        } as any);
      }
    }
  }, [spreads, updateElement, addElement]);

  return null;
}
