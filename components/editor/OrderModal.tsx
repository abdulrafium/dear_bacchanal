"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, Download, Truck, CreditCard, Check, Sparkles, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";
import { jsPDF } from "jspdf";

const PAGE_WIDTH = 400;
const PAGE_HEIGHT = 550;

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedType, setSelectedType] = useState<"soft" | "hard">("soft");

  const handlePayment = async () => {
    setLoading(true);
    // BYPASS FOR TESTING: Skipping Stripe fetch
    setTimeout(() => {
        toast.success("Payment Bypass Active (TESTING MODE)");
        toast.info("Your order is being processed automatically.");
        setLoading(false);
        if (selectedType === "soft") {
            handleGeneratePdf();
        } else {
            toast.success("Hardcopy order simulated! We would now send it to the print queue.");
        }
    }, 1500);

    /* Original Logic:
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) { ... }
    */
  };

  const handleGeneratePdf = async () => {
    const { spreads, setCurrentSpread, stageRef, activeTemplateName, currentSpreadIndex } = useEditorStore.getState();
    
    if (!stageRef) {
        toast.error("Export Error: Canvas stage not detected.");
        return;
    }

    setIsGeneratingPdf(true);
    const originalIndex = currentSpreadIndex;
    
    toast.info("Preparing PDF Book Export...", {
      description: `Processing ${spreads.length} spreads...`
    });

    try {
        // Dimensions for a landscape spread (2 pages + 8px spine)
        const spreadWidth = PAGE_WIDTH * 2 + 8;
        const spreadHeight = PAGE_HEIGHT;
        
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [spreadWidth, spreadHeight]
        });

        for (let i = 0; i < spreads.length; i++) {
            // Update UI to show progress
            toast.info(`Generating Spread ${i + 1} of ${spreads.length}`, { duration: 1000 });
            
            // Navigate to spread to trigger render
            setCurrentSpread(i);
            
            // Wait for Konva to render assets (images/fonts)
            await new Promise(resolve => setTimeout(resolve, 800)); 
            
            // Capture the stage at 2x quality for print
            const dataUrl = stageRef.toDataURL({ 
                pixelRatio: 2,
                mimeType: "image/jpeg",
                quality: 0.95
            });

            if (i > 0) pdf.addPage([spreadWidth, spreadHeight], "landscape");
            
            pdf.addImage(dataUrl, 'JPEG', 0, 0, spreadWidth, spreadHeight);
        }

        const fileName = `${activeTemplateName?.replace(/\s+/g, '_') || 'Carnival_Book'}_Book.pdf`;
        pdf.save(fileName);
        
        toast.success("PDF Generated Successfully!", {
          description: "Your digital book has been downloaded."
        });
    } catch (err) {
        console.error("PDF Export Error:", err);
        toast.error("Export Failed. Please try again.");
    } finally {
        // Restore original spread
        setCurrentSpread(originalIndex);
        setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[90vh] sm:max-h-[92vh] rounded-[32px] p-0 bg-[#0a0a0a] border-white/10 text-white shadow-[0_0_100px_rgba(159,46,43,0.3)] flex flex-col overflow-hidden">
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
          {/* Header area with gradient */}
          <div className="bg-gradient-to-br from-[#9f2e2b] to-[#1a1a1a] p-6 sm:p-8 pb-12 rounded-t-[31px]">
            <DialogHeader className="mb-0">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-4 block text-center">Checkout Portal</span>
              <DialogTitle className="text-3xl sm:text-4xl font-black font-display text-center leading-tight">
                Order Your <br/> Carnival Story
              </DialogTitle>
              <DialogDescription className="text-center text-white/60 mt-3 text-sm max-w-[300px] mx-auto leading-relaxed">
                Choose between a digital masterpiece or a premium physical heirloom.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-5 sm:p-8 -mt-8 bg-[#0a0a0a] rounded-t-[32px] pb-12">
            <div className="grid grid-cols-1 gap-4 mb-8">
              {/* Soft Copy */}
              <div 
                onClick={() => setSelectedType("soft")}
                className={`relative cursor-pointer rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300 ${
                  selectedType === "soft" 
                  ? "border-[#9f2e2b] bg-[#9f2e2b]/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
                  : "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl transition-colors ${selectedType === "soft" ? "bg-red-500/20" : "bg-white/5"}`}>
                    <FileText className={`w-7 h-7 ${selectedType === "soft" ? "text-red-400" : "text-white/40"}`} />
                  </div>
                  {selectedType === "soft" && (
                    <div className="bg-[#9f2e2b] rounded-full p-1.5 shadow-lg shadow-red-500/20">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight">PDF Book Edition</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full uppercase">High Res</span>
                    <span className="text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase">Digital Shelf</span>
                  </div>
                  <p className="text-xs text-white/50 mt-4 leading-relaxed">
                    A professional-grade Digital PDF book featuring all your spreads in pixel-perfect quality. Universal compatibility for tablet and mobile.
                  </p>
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                   <div className="font-black text-3xl text-white tracking-tighter">$25.00</div>
                   <div className="text-xs text-white/30 font-bold uppercase tracking-widest">USD</div>
                </div>
              </div>

              {/* Hard Copy */}
              <div 
                onClick={() => setSelectedType("hard")}
                className={`relative cursor-pointer rounded-3xl border-2 p-5 sm:p-6 transition-all duration-300 ${
                  selectedType === "hard" 
                  ? "border-[#9f2e2b] bg-[#9f2e2b]/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
                  : "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl transition-colors ${selectedType === "hard" ? "bg-orange-500/20" : "bg-white/5"}`}>
                    <Book className={`w-7 h-7 ${selectedType === "hard" ? "text-orange-400" : "text-white/40"}`} />
                  </div>
                  {selectedType === "hard" && (
                    <div className="bg-[#9f2e2b] rounded-full p-1.5 shadow-lg shadow-red-500/20">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                   <h3 className="font-black text-xl tracking-tight">Hardcover Volume</h3>
                   <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">Premium Print</span>
                    <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase">Linen Wrap</span>
                  </div>
                  <p className="text-xs text-white/50 mt-4 leading-relaxed">
                    A luxurious physical hardbound book with premium gloss coating. The ultimate way to preserve your carnival memories for a lifetime.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                  <div className="flex items-baseline gap-2">
                    <div className="font-black text-3xl text-white tracking-tighter">$35.00</div>
                    <div className="text-xs text-white/30 font-bold uppercase tracking-widest">USD</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-white/60 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10 w-fit">
                    <Truck className="w-3 h-3" /> Worldwide Shipping
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handlePayment}
                disabled={loading || isGeneratingPdf}
                className="w-full h-16 text-lg font-black rounded-2xl bg-[#9f2e2b] hover:bg-[#c8413d] text-white shadow-[0_10px_40px_rgba(159,46,43,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    PROCESSING...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    {selectedType === "soft" ? "DOWNLOAD PDF BOOK" : "ORDER PHYSICAL COPY"}
                  </>
                )}
              </Button>

              {selectedType === "soft" && (
                <button
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="w-full h-12 text-[10px] font-black rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white/60 flex items-center justify-center gap-2 uppercase tracking-[2px]"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  {isGeneratingPdf ? "Generating PDF..." : "Download Preview"}
                </button>
              )}
            </div>

            <div className="mt-10 flex items-center justify-center gap-8 opacity-30 grayscale invert">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
               <div className="w-[1px] h-4 bg-white/50" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
            </div>

            <p className="text-[9px] text-center text-white/20 mt-8 uppercase font-bold tracking-[3px]">
              Encrypted SSL Transaction • Secure Payment
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
