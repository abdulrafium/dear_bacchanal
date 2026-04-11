"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/providers/FirebaseAuthProvider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, Download, Truck, Check, Sparkles, FileText, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

const PAGE_WIDTH = 400;
const PAGE_HEIGHT = 550;

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"soft" | "hard">("soft");
  const isGeneratingPdf = useEditorStore((s) => s.isGeneratingPdf);
  const generatePdfBook = useEditorStore((s) => s.generatePdfBook);

  const { user, refreshUser, logout } = useFirebase();
  const isPurchased = user?.isPurchased;

  useEffect(() => {
    if (isOpen) {
      refreshUser();
    }
  }, [isOpen, refreshUser]);

  const handlePayment = async () => {
    if (isPurchased && selectedType === "soft") {
        handleGeneratePdf();
        return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("fb_token") || ""}`,
            "x-user-email": localStorage.getItem("fb_user_email") || "",
            "x-user-id": localStorage.getItem("fb_user_id") || ""
        },
        body: JSON.stringify({ type: selectedType }),
      });
      const data = await response.json();
      if (data.url) {
          window.location.href = data.url;
      } else {
          toast.error("Failed to initiate checkout");
          setLoading(false);
      }
    } catch (error) {
        console.error("Checkout error:", error);
        toast.error("An error occurred during checkout");
        setLoading(false);
    }
  };


  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handleGeneratePdf = async () => {
    setLoading(true);
    setDownloadStatus("PREPARING YOUR DIGITAL MEMORY...");
    
    try {
      setTimeout(() => setDownloadStatus("SYNCHRONIZING ASSETS..."), 1500);
      setTimeout(() => setDownloadStatus("GENERATING HIGH-RES PAGES..."), 3000);
      setTimeout(() => setDownloadStatus("FINALIZING PDF DOCUMENT..."), 4500);

      await generatePdfBook();
      await refreshUser();
      
      setDownloadStatus("DOWNLOAD COMPLETE!");
      toast.success("Download successful! Redirecting...");
      
      setTimeout(() => {
        window.location.href = "/customize";
      }, 2000);

    } catch (error) {
        console.error("PDF Error:", error);
        toast.error("Failed to generate PDF");
        setDownloadStatus(null);
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] h-full max-h-[90vh] sm:h-auto rounded-3xl sm:rounded-[40px] p-0 bg-[#0a0a0a] border-white/10 text-white shadow-[0_0_100px_rgba(159,46,43,0.3)] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide sm:scrollbar-default overscroll-contain pb-8">
          <div className="bg-gradient-to-br from-[#9f2e2b] to-[#1a1a1a] p-5 sm:p-8 pb-10 rounded-t-[23px] sm:rounded-t-[39px]">
            <DialogHeader className="mb-0">
               <div className="flex justify-between items-center mb-6">
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-[4px]">Checkout Portal</span>
               </div>
              <DialogTitle className="text-2xl sm:text-4xl font-black font-display text-center leading-tight">
                Order Your <br className="hidden sm:block"/> Carnival Story
              </DialogTitle>
              <DialogDescription className="text-center text-white/50 mt-2 text-xs sm:text-sm max-w-[280px] mx-auto leading-relaxed">
                Choose between a digital masterpiece or a premium physical heirloom.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-8 -mt-6 bg-[#0a0a0a] rounded-t-[32px]">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 pt-6">
              <div 
                onClick={() => setSelectedType("soft")}
                className={`relative cursor-pointer rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-6 transition-all duration-300 ${
                  selectedType === "soft" 
                  ? "border-[#9f2e2b] bg-[#9f2e2b]/10 shadow-lg" 
                  : "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className={`p-2 sm:p-3 rounded-xl transition-colors ${selectedType === "soft" ? "bg-red-500/20" : "bg-white/5"}`}>
                    <FileText className={`w-5 h-5 sm:w-7 sm:h-7 ${selectedType === "soft" ? "text-red-400" : "text-white/40"}`} />
                  </div>
                  {selectedType === "soft" && <Check className="w-4 h-4 text-red-500" />}
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl">PDF Book Edition</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter">High Res</span>
                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Instant</span>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                   <div className="font-black text-2xl sm:text-3xl text-white">$25.00</div>
                   <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">USD</div>
                </div>
              </div>

              <div 
                onClick={() => setSelectedType("hard")}
                className={`relative cursor-pointer rounded-2xl sm:rounded-3xl border-2 p-4 sm:p-6 transition-all duration-300 ${
                  selectedType === "hard" 
                  ? "border-[#9f2e2b] bg-[#9f2e2b]/10 shadow-lg" 
                  : "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className={`p-2 sm:p-3 rounded-xl transition-colors ${selectedType === "hard" ? "bg-orange-500/20" : "bg-white/5"}`}>
                    <Book className={`w-5 h-5 sm:w-7 sm:h-7 ${selectedType === "hard" ? "text-orange-400" : "text-white/40"}`} />
                  </div>
                  {selectedType === "hard" && <Check className="w-4 h-4 text-red-500" />}
                </div>
                <div>
                   <h3 className="font-black text-lg sm:text-xl">Hardcover Volume</h3>
                   <div className="flex gap-2 mt-1">
                    <span className="text-[8px] font-bold text-orange-400 uppercase tracking-tighter">Premium Print</span>
                    <span className="text-[8px] font-bold text-purple-400 uppercase tracking-tighter">Linen Wrap</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-baseline gap-2">
                    <div className="font-black text-2xl sm:text-3xl text-white">$35.00</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">USD</div>
                  </div>
                  <div className="text-[8px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-md uppercase tracking-wider border border-white/10">
                    + Shipping
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handlePayment}
                disabled={loading || isGeneratingPdf}
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-black rounded-xl sm:rounded-2xl bg-[#9f2e2b] hover:bg-[#c8413d] text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="flex flex-col items-center leading-none">
                    <Loader2 className="w-5 h-5 animate-spin mb-1" />
                    <span className="text-[10px] font-black tracking-widest">{downloadStatus || "PROCESSING..."}</span>
                  </div>
                ) : <Sparkles className="w-5 h-5" />}
                {!loading && (isPurchased && selectedType === "soft" ? "DOWNLOAD PDF" : "PROCEED TO PAYMENT")}
              </Button>

              <button
                onClick={onClose}
                className="w-full py-2 text-[10px] font-bold text-white/30 hover:text-white transition-all uppercase tracking-[2px]"
              >
                Continue Editing
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 opacity-20 grayscale invert">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-3" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-3" />
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                     <User className="w-3 h-3 text-white/40" />
                   </div>
                   <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider truncate max-w-[150px]">{user?.email}</span>
                   <button 
                    onClick={async () => {
                      await logout();
                      window.location.href = "/";
                    }}
                    className="text-[10px] font-black text-red-500/60 hover:text-red-500 underline uppercase tracking-wider ml-2"
                   >
                     Sign Out
                   </button>
                </div>
                <p className="text-[8px] text-white/20 uppercase font-bold tracking-[2px]">
                  Secure AES-256 Encrypted Gateway
                </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
