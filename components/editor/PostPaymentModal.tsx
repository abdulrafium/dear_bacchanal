"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/editor-store";
import { 
  CheckCircle2, 
  Download, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  BookCheck, 
  Check, 
  Loader2 
} from "lucide-react";

interface PostPaymentModalProps {
  type: "soft" | "hard";
  onClose?: () => void;
  isProcessingHard?: boolean;
}

export function PostPaymentModal({ type, onClose, isProcessingHard = false }: PostPaymentModalProps) {
  const router = useRouter();
  const generatePdfBook = useEditorStore((s) => s.generatePdfBook);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownloadSoftCopy = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    // Liquid fill animation progression
    let currentPct = 0;
    const progressInterval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 8) + 4;
      if (currentPct > 92) {
        currentPct = 92;
        clearInterval(progressInterval);
      }
      setDownloadProgress(currentPct);
    }, 120);

    try {
      // Trigger the soft copy download (clean high-res export)
      await generatePdfBook(false, false, 'both', false);

      clearInterval(progressInterval);
      setDownloadProgress(100);
      setIsDownloaded(true);
    } catch (err) {
      console.error("Soft copy download failed:", err);
      clearInterval(progressInterval);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGoToOrders = () => {
    if (onClose) onClose();
    window.location.href = "/customize?tab=orders";
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div 
        className="bg-[#18191c] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center flex flex-col items-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#9f2e2b]/20 rounded-full blur-3xl pointer-events-none" />

        {type === "soft" ? (
          /* ── SOFT COPY SUCCESS CARD ── */
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-white font-poppins tracking-tight mb-2">
              Purchase Successful!
            </h2>

            <p className="text-sm text-white/60 font-medium leading-relaxed mb-6">
              Thank you for Shopping with us. Your custom carnival photobook digital copy is ready.
            </p>

            {/* ── Liquid Wave Download Button ── */}
            <div className="w-full mb-4">
              <button
                onClick={handleDownloadSoftCopy}
                disabled={isDownloading}
                className={`relative w-full h-14 rounded-2xl overflow-hidden font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center group ${
                  isDownloaded
                    ? "bg-emerald-600/30 border border-emerald-500/40 text-emerald-300"
                    : "bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white hover:brightness-110 border border-sky-400/30"
                }`}
              >
                {/* Animated Liquid Wave Water Fill Background */}
                {isDownloading && (
                  <div 
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0284c7] via-[#38bdf8] to-[#7dd3fc] transition-all duration-150 ease-out"
                    style={{ height: `${downloadProgress}%` }}
                  >
                    {/* Animated sinusoidal wave crest */}
                    <div className="absolute -top-3 inset-x-0 h-4 overflow-hidden pointer-events-none">
                      <svg 
                        className="w-[200%] h-full text-[#7dd3fc] fill-current animate-wave opacity-80" 
                        viewBox="0 0 1200 120" 
                        preserveAspectRatio="none"
                      >
                        <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Button Content */}
                <span className="relative z-10 flex items-center gap-2">
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span className="font-extrabold text-white text-base">
                        Preparing PDF ({downloadProgress}%)
                      </span>
                    </>
                  ) : isDownloaded ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>Downloaded! (Click to re-download)</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Download Soft Copy</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* OK Button (Redirects to /customize?tab=orders) */}
            <button
              onClick={handleGoToOrders}
              className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm tracking-wide transition-colors border border-white/10 flex items-center justify-center gap-2"
            >
              <span>OK</span>
              <ArrowRight className="w-4 h-4 text-white/60" />
            </button>
          </>
        ) : (
          /* ── HARD COPY SUCCESS / PROCESSING CARD ── */
          <>
            {isProcessingHard ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>

                <h2 className="text-2xl font-black text-white font-poppins tracking-tight mb-2">
                  Processing Print Files
                </h2>

                <p className="text-sm text-white/60 font-medium leading-relaxed mb-6">
                  Generating high-resolution 300+ DPI cover and inner page print files for the press queue. Please keep this tab open...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                  <BookCheck className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-black text-white font-poppins tracking-tight mb-2">
                  Purchase Successful!
                </h2>

                <p className="text-sm text-white/70 font-medium leading-relaxed mb-6 px-2">
                  Your Order is pending for Admin Approve. You will be notify soon for further process of Your Book. Thank you for Shopping with us.
                </p>

                {/* OK Button */}
                <button
                  onClick={handleGoToOrders}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#9f2e2b] via-[#b92c29] to-[#d6302c] hover:brightness-110 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-[#9f2e2b]/30 flex items-center justify-center gap-2"
                >
                  <span>OK</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Global CSS for Wave Animation */}
      <style jsx global>{`
        @keyframes waveAnimation {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-wave {
          animation: waveAnimation 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
