"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, BookOpen, Check, ArrowRight, Loader2, Sparkles, X, Truck, Zap } from "lucide-react";
import { useSettings } from "@/providers/SettingsProvider";
import { useEditorStore } from "@/store/editor-store";

interface CopySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (type: "soft" | "hard") => void;
  isRendering?: boolean;
}

export function CopySelectionModal({
  isOpen,
  onClose,
  onProceed,
  isRendering = false,
}: CopySelectionModalProps) {
  const [selectedType, setSelectedType] = useState<"soft" | "hard">("soft");
  const [isStarting, setIsStarting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { settings } = useSettings();
  const spreads = useEditorStore((s) => s.spreads);

  if (!isOpen || !mounted) return null;

  // Actual Admin Dashboard Pricing (in cents)
  const baseSoftCents = settings?.pricing?.softCopyPrice ?? 2000;
  const baseHardCents = settings?.pricing?.hardCopyPrice ?? 3500;
  const extraSpreadPriceCents = settings?.pricing?.extraSpreadPrice ?? 500;

  // Base book includes 17 spreads (34 pages)
  const extraSpreads = Math.max(0, spreads.length - 17);
  const addonsTotalCents = extraSpreads * extraSpreadPriceCents;

  const finalSoftCents = baseSoftCents + addonsTotalCents;
  const finalHardCents = baseHardCents + addonsTotalCents;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleProceedClick = async () => {
    if (isStarting || isRendering) return;
    setIsStarting(true);
    await new Promise((r) => setTimeout(r, 350));
    setIsStarting(false);
    onProceed(selectedType);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none p-4 pb-24 sm:pb-28"
      onClick={onClose}
    >
      <div 
        className="bg-[#18191c] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-[540px] w-full shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#9f2e2b]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9f2e2b] to-[#c0392b] flex items-center justify-center shadow-md shadow-[#9f2e2b]/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-sans text-white tracking-tight leading-tight">
                Select Book Format
              </h3>
              <p className="text-[11px] text-white/50 leading-tight">
                Choose how to generate your production preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option Cards (Symmetrical & Compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Soft Copy Card */}
          <div
            onClick={() => setSelectedType("soft")}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              selectedType === "soft"
                ? "bg-gradient-to-b from-sky-500/15 to-sky-950/20 border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/40"
                : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]"
            }`}
          >
            {selectedType === "soft" && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-sky-400 text-black flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
            <div>
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Digital Soft Copy
              </h4>
              <p className="text-[11px] text-white/60 leading-relaxed mb-2.5">
                Single unified PDF book (cover & inner pages) formatted for instant digital download.
              </p>

              {/* Extra spreads or Included info */}
              {extraSpreads > 0 ? (
                <div className="mb-2 px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-300/90 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Base (17 Spreads):</span>
                    <span className="font-semibold text-white">{formatPrice(baseSoftCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+{extraSpreads} Spreads:</span>
                    <span className="font-semibold text-white">+{formatPrice(addonsTotalCents)}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-2 text-[10px] text-white/40">
                  Includes all {spreads.length} spreads
                </div>
              )}

              {/* Instant Delivery Pill */}
              <div className="mb-2.5 px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-start gap-1.5 text-[10px] text-sky-200/90 leading-tight">
                <Zap className="w-3 h-3 text-sky-400 shrink-0 mt-0.5" />
                <span>Instant digital download available right after payment.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-sky-300">Final Soft Copy</span>
              <span className="text-base font-extrabold text-white">{formatPrice(finalSoftCents)}</span>
            </div>
          </div>

          {/* Hard Copy Card */}
          <div
            onClick={() => setSelectedType("hard")}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              selectedType === "hard"
                ? "bg-gradient-to-b from-[#9f2e2b]/20 to-red-950/25 border-[#c0392b] shadow-[0_0_20px_rgba(192,57,43,0.25)] ring-1 ring-[#c0392b]/40"
                : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]"
            }`}
          >
            {selectedType === "hard" && (
              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#d6302c] text-white flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
            <div>
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center mb-2.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Hardcover Book
              </h4>
              <p className="text-[11px] text-white/60 leading-relaxed mb-2.5">
                Physical hardbound print book with 570mm jacket & 260mm inner signatures.
              </p>

              {/* Extra spreads or Included info */}
              {extraSpreads > 0 ? (
                <div className="mb-2 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] text-red-300/90 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Base (17 Spreads):</span>
                    <span className="font-semibold text-white">{formatPrice(baseHardCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+{extraSpreads} Spreads:</span>
                    <span className="font-semibold text-white">+{formatPrice(addonsTotalCents)}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-2 text-[10px] text-white/40">
                  Includes all {spreads.length} spreads
                </div>
              )}

              {/* Delivery notice line */}
              <div className="mb-2.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-start gap-1.5 text-[10px] text-amber-200/90 leading-tight">
                <Truck className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>Delivery charges applied separately based on location.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold text-red-300">Book Total</span>
              <span className="text-base font-extrabold text-white">{formatPrice(finalHardCents)}</span>
            </div>
          </div>
        </div>

        {/* Action Button with Clean Proportionate Height */}
        <button
          onClick={handleProceedClick}
          disabled={isStarting || isRendering}
          className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#9f2e2b] via-[#b92c29] to-[#d6302c] hover:brightness-110 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#9f2e2b]/30 flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer shrink-0"
        >
          {isStarting || isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating {selectedType === "soft" ? "Soft Copy" : "Hardcover"} Preview...</span>
            </>
          ) : (
            <>
              <span>
                Proceed to {selectedType === "soft" ? "Soft Copy" : "Hardcover"} Preview • {selectedType === "soft" ? formatPrice(finalSoftCents) : formatPrice(finalHardCents)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
