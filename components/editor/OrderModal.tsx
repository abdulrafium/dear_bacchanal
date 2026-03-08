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
import { Book, Download, Truck, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"soft" | "hard">("soft");

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden bg-[#0f0f0f] border-white/10 text-white">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-bold font-display text-center">
              Complete Your Order
            </DialogTitle>
            <DialogDescription className="text-center text-white/50 mt-2">
              Choose how you want to receive your carnival memory book.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {/* Soft Copy */}
            <div 
              onClick={() => setSelectedType("soft")}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                selectedType === "soft" 
                ? "border-red-500 bg-red-500/10" 
                : "border-white/5 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Download className="w-6 h-6 text-blue-400" />
                </div>
                {selectedType === "soft" && (
                  <div className="bg-red-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg">Digital Soft Copy</h3>
              <p className="text-sm text-white/40 mt-1">
                High-quality PDF file ready for digital sharing and self-printing.
              </p>
              <div className="mt-4 font-bold text-2xl text-white">$25</div>
            </div>

            {/* Hard Copy */}
            <div 
              onClick={() => setSelectedType("hard")}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                selectedType === "hard" 
                ? "border-red-500 bg-red-500/10" 
                : "border-white/5 bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <Book className="w-6 h-6 text-orange-400" />
                </div>
                {selectedType === "hard" && (
                  <div className="bg-red-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg">Physical Hard Copy</h3>
              <p className="text-sm text-white/40 mt-1">
                Premium printed hardcover book delivered to your doorstep.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="font-bold text-2xl text-white">$35</div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-full uppercase tracking-wider">
                  <Truck className="w-3 h-3" /> Includes Shipping
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20 transition-all active:scale-[0.98] group"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center">
                <CreditCard className="w-5 h-5" />
                Pay ${selectedType === "soft" ? "25" : "35"} Now
              </div>
            )}
          </Button>

          <p className="text-[10px] text-center text-white/30 mt-4 uppercase tracking-widest">
            Secure checkout powered by Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
