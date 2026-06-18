"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/providers/SettingsProvider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, Truck, Check, Sparkles, FileText, Loader2, User, Video } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<"soft" | "hard">("soft");
  const { settings: providerSettings, refreshSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<any>(null);
  const settings = localSettings || providerSettings;
  const isGeneratingPdf = useEditorStore((s) => s.isGeneratingPdf);
  const generatePdfBook = useEditorStore((s) => s.generatePdfBook);
  const spreads = useEditorStore((s) => s.spreads);
  const activeTemplateName = useEditorStore((s) => s.activeTemplateName);
  const bookId = useEditorStore((s) => s.activeTemplateId); // Use official store ID

  const { user, refreshUser, logout } = useAuth();
  const isPurchased = user?.isPurchased;

  const [step, setStep] = useState<"selection" | "shipping">("selection");
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "", // No default, user must select
    phone: "",
    email: user?.email || "",
  });

  const [shippingRate, setShippingRate] = useState<number | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [shippingErrors, setShippingErrors] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setShippingInfo(prev => ({ 
        ...prev, 
        name: prev.name || user.name || "", 
        email: prev.email || user.email || "" 
      }));
    }
  }, [user]);

  const [selectedZone, setSelectedZone] = useState<string>("");

  // Reset calculation when country or zone changes
  useEffect(() => {
    setShippingCalculated(false);
    setShippingRate(null);
  }, [shippingInfo.country, selectedZone]);

  const extraSpreads = Math.max(0, spreads.length - 16);
  const stickersCount = spreads.reduce((acc, s) => {
    const leftS = s.leftPage?.elements?.filter(e => e.type === 'sticker').length || 0;
    const rightS = s.rightPage?.elements?.filter(e => e.type === 'sticker').length || 0;
    return acc + leftS + rightS;
  }, 0);

  const extraSpreadPrice = settings?.pricing?.extraSpreadPrice || 500;

  const addonsTotal = (extraSpreads * extraSpreadPrice);

  const softCopyPrice = settings?.pricing?.softCopyPrice ? (settings.pricing.softCopyPrice / 100).toFixed(2) : "20.00";
  const hardCopyPrice = settings?.pricing?.hardCopyPrice ? (settings.pricing.hardCopyPrice / 100).toFixed(2) : "35.00";


  const handlePayment = async () => {
    if (isPurchased && selectedType === "soft") {
      handleGeneratePdf();
      return;
    }

    if (selectedType === "hard" && step === "selection") {
        setStep("shipping");
        return;
    }

    setLoading(true);

    try {
      // FORCE SAVE BEFORE CHECKOUT
      // This ensures the database has the latest page count for accurate Stripe add-on pricing
      const saveBook = useEditorStore.getState().save;
      await saveBook();

      // Get the freshest bookId from the store (since save updates it from global template -> user book)
      const freshestBookId = useEditorStore.getState().activeTemplateId;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            type: selectedType,
            templateName: activeTemplateName,
            bookId: freshestBookId || bookId,
            shippingInfo: selectedType === "hard" ? shippingInfo : undefined,
            shippingRate: selectedType === "hard" ? shippingRate : undefined
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to initiate checkout");
        setLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
      setLoading(false);
    }
  };

  const calculateShipping = () => {
    const errors: string[] = [];
    if (!shippingInfo.name) errors.push("name");
    if (!selectedZone) errors.push("zone");
    if (!shippingInfo.country) errors.push("country");
    if (!shippingInfo.line1) errors.push("line1");
    if (!shippingInfo.city) errors.push("city");

    if (errors.length > 0) {
      setShippingErrors(errors);
      return;
    }
    
    setShippingErrors([]);
    setCalculatingShipping(true);
    try {
      const country = settings.countries.find((c: any) => c.code === shippingInfo.country);
      if (country && country.shippingRate > 0) {
        // shippingRate is stored in pence (GBP × 100), so divide by 100 to get GBP, then multiply by exchange rate, then × 100 for cents
        const gbpPence = country.shippingRate; // e.g. 1383 pence = £13.83
        const usdCents = Math.round((gbpPence / 100) * settings.general.exchangeRateGbpToUsd * 100);
        setShippingRate(usdCents);
      } else {
        setShippingRate(0);
      }
      setShippingCalculated(true);
    } finally {
      setCalculatingShipping(false);
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

  useEffect(() => {
    if (isOpen) {
        // Fetch fresh settings directly to avoid stale cache
        fetch("/api/public/settings", { cache: "no-store" })
          .then(r => r.json())
          .then(data => {
            setLocalSettings(data);
          })
          .catch(() => refreshSettings());
        console.log("OrderModal Triggered - isOpen:", isOpen);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="z-[9999] max-w-[95vw] sm:max-w-[750px] w-full h-auto max-h-[85vh] rounded-[32px] p-0 bg-[#0a0a0a] border-white/10 text-white shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_80px_rgba(159,46,43,0.2)] flex flex-col overflow-hidden outline-none">
        <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain">
          <div className="bg-gradient-to-br from-[#9f2e2b]/80 to-[#1a1a1a] p-4 sm:p-6 pb-6 relative">
            <DialogHeader className="mb-0">
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[4px]">Checkout Portal</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black font-display text-center leading-tight tracking-tight">
                ORDER YOUR STORY
              </DialogTitle>
              <DialogDescription className="text-center text-white/40 mt-1 text-[10px] sm:text-[11px] max-w-[400px] mx-auto leading-relaxed uppercase tracking-widest font-bold">
                Digital masterpiece or premium physical heirloom
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 -mt-4 bg-[#0a0a0a] rounded-t-[24px]">
            <div className="pt-4">
                {step === "selection" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                    <div
                        onClick={() => setSelectedType("soft")}
                        className={`relative cursor-pointer rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 transition-all duration-300 ${selectedType === "soft"
                            ? "border-[#9f2e2b] bg-[#9f2e2b]/10 shadow-lg"
                            : "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg transition-colors ${selectedType === "soft" ? "bg-red-500/20" : "bg-white/5"}`}>
                            <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedType === "soft" ? "text-red-400" : "text-white/40"}`} />
                        </div>
                        {selectedType === "soft" && <Check className="w-3 h-3 text-red-500" />}
                        </div>
                        <div>
                        <h3 className="font-black text-sm sm:text-base">PDF Book Edition</h3>
                        <div className="flex gap-1.5 mt-0.5">
                            <span className="text-[7px] font-bold text-green-400 uppercase tracking-tighter">High Res</span>
                            <span className="text-[7px] font-bold text-blue-400 uppercase tracking-tighter">Instant</span>
                        </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                        <div className="font-black text-xl sm:text-2xl text-white">${softCopyPrice}</div>
                        <div className="text-[8px] text-white/30 font-bold uppercase tracking-widest">USD</div>
                        </div>
                    </div>

                    <div
                        onClick={() => setSelectedType("hard")}
                        className={`relative cursor-pointer rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 transition-all duration-300 ${selectedType === "hard"
                            ? "border-[#9f2e2b] bg-[#9f2e2b]/10 shadow-lg"
                            : "border-white/5 bg-white/5 hover:bg-white/[0.08]"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg transition-colors ${selectedType === "hard" ? "bg-orange-500/20" : "bg-white/5"}`}>
                            <Book className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedType === "hard" ? "text-orange-400" : "text-white/40"}`} />
                        </div>
                        {selectedType === "hard" && <Check className="w-3 h-3 text-red-500" />}
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
                            <div className="font-black text-2xl sm:text-3xl text-white">${hardCopyPrice}</div>
                            <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">USD</div>
                        </div>
                        <div className="text-[8px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-md uppercase tracking-wider border border-white/10">
                            + Shipping
                        </div>
                        </div>
                    </div>
                    </div>
                ) : (
                    <div className="space-y-4 mb-6 p-1 animate-in slide-in-from-right-4 duration-300">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-red-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest">Shipping Destination</h3>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!navigator.geolocation) {
                                        toast.error("Geolocation is not supported by your browser");
                                        return;
                                    }
                                    toast.info("Locating...");
                                    navigator.geolocation.getCurrentPosition(async (pos) => {
                                        try {
                                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                                            const data = await res.json();
                                            if (data && data.address) {
                                                setShippingInfo(prev => ({
                                                    ...prev,
                                                    city: data.address.city || data.address.town || data.address.village || "",
                                                    postalCode: data.address.postcode || "",
                                                    country: data.address.country_code?.toUpperCase() || "US"
                                                }));
                                                toast.success("Location detected!");
                                            }
                                        } catch (e) {
                                            toast.error("Failed to detect location address");
                                        }
                                    }, () => toast.error("Location permission denied"));
                                }}
                                className="text-[9px] font-black uppercase tracking-widest text-teal hover:text-teal/80 bg-teal/10 px-2 py-1 rounded"
                            >
                                Auto-Detect
                            </button>
                         </div>
                         
                         <div className="grid grid-cols-1 gap-2">
                            <input 
                                placeholder="Full Recipient Name"
                                value={shippingInfo.name}
                                onChange={e => {
                                    setShippingInfo({...shippingInfo, name: e.target.value});
                                    setShippingErrors(prev => prev.filter(err => err !== "name"));
                                }}
                                className={`bg-white/5 border ${shippingErrors.includes("name") ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder-white/30 transition-all`}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={selectedZone}
                                    onChange={e => {
                                        setSelectedZone(e.target.value);
                                        setShippingInfo({...shippingInfo, country: ""});
                                        setShippingCalculated(false);
                                        setShippingErrors(prev => prev.filter(err => err !== "zone" && err !== "country"));
                                    }}
                                    className={`bg-white/5 border ${shippingErrors.includes("zone") ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 text-white transition-all`}
                                >
                                    <option value="" className="bg-[#0a0a0a]">Select Region</option>
                                    <option value="Clear EU" className="bg-[#0a0a0a]">Europe (EU)</option>
                                    <option value="Clear Non EU" className="bg-[#0a0a0a]">North America (USA)</option>
                                    <option value="Tracked Non EU" className="bg-[#0a0a0a]">International (Tracked)</option>
                                    <option value="Other" className="bg-[#0a0a0a]">Rest of World</option>
                                </select>
                                
                                <select 
                                    value={shippingInfo.country}
                                    onChange={e => {
                                        setShippingInfo({...shippingInfo, country: e.target.value, city: ""});
                                        setShippingCalculated(false);
                                        setShippingErrors(prev => prev.filter(err => err !== "country" && err !== "city"));
                                    }}
                                    disabled={!selectedZone}
                                    className={`bg-white/5 border ${shippingErrors.includes("country") ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 text-white disabled:opacity-50 transition-all`}
                                >
                                    <option value="" className="bg-[#0a0a0a]">Select Country</option>
                                    {settings?.countries?.filter((c: { zone: string; code: string; name: string }) => c.zone === selectedZone).map((c: { zone: string; code: string; name: string }) => (
                                        <option key={c.code} value={c.code} className="bg-[#0a0a0a]">{c.name}</option>
                                    ))}
                                </select>
                            </div>


                            <input 
                                placeholder="Address Line 1"
                                value={shippingInfo.line1}
                                onChange={e => {
                                    setShippingInfo({...shippingInfo, line1: e.target.value});
                                    setShippingErrors(prev => prev.filter(err => err !== "line1"));
                                }}
                                className={`bg-white/5 border ${shippingErrors.includes("line1") ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder-white/30 transition-all`}
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                                <input 
                                    placeholder="City"
                                    value={shippingInfo.city}
                                    onChange={e => {
                                        setShippingInfo({...shippingInfo, city: e.target.value});
                                        setShippingErrors(prev => prev.filter(err => err !== "city"));
                                    }}
                                    className={`bg-white/5 border ${shippingErrors.includes("city") ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-white/10"} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder-white/30 transition-all`}
                                />
                                
                                <input 
                                    placeholder="Postcode / ZIP"
                                    value={shippingInfo.postalCode}
                                    onChange={e => setShippingInfo({...shippingInfo, postalCode: e.target.value})}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder-white/30"
                                />
                            </div>
                         </div>
                    </div>
                )}
            </div>

            <div className="px-4 sm:px-6 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-bold text-white/40 uppercase tracking-widest">
                      <span>Base {selectedType === 'soft' ? 'Digital' : 'Hardcover'}</span>
                      <span className="text-white">${selectedType === 'soft' ? softCopyPrice : hardCopyPrice}</span>
                  </div>
                  
                  {extraSpreads > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-white/40 uppercase tracking-widest">
                        <span>Extra Spreads ({extraSpreads})</span>
                        <span className="text-red-400">+${((extraSpreads * extraSpreadPrice) / 100).toFixed(2)}</span>
                    </div>
                  )}



                   {shippingCalculated && shippingRate !== null && selectedType === 'hard' && (
                     <div className="flex justify-between items-center text-[9px] font-bold text-green-400 uppercase tracking-widest bg-green-400/5 p-1 px-2 rounded-md border border-green-400/10">
                        <span>Shipping Delivery</span>
                        <span>+${(shippingRate / 100).toFixed(2)}</span>
                     </div>
                   )}

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                     <span className="text-[11px] font-black text-white uppercase tracking-wider">Estimated Total</span>
                     <span className="text-lg font-black text-white decoration-[#9f2e2b] decoration-2">${(( (selectedType === 'soft' ? (settings?.pricing?.softCopyPrice || 2000) : (settings?.pricing?.hardCopyPrice || 3500)) + addonsTotal + (selectedType === 'hard' ? (shippingRate || 0) : 0) ) / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <div className="rounded-xl bg-gradient-to-r from-teal/10 to-transparent border border-teal/20 p-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4 text-teal shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Video Reel</h4>
                          <span className="text-[6px] font-black bg-teal text-white px-1 py-0.5 rounded leading-none">SOON</span>
                        </div>
                        <p className="text-[8px] text-white/40 leading-tight">Automated video story of your memories</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] rounded-xl border border-white/5 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <User className="w-3 h-3 text-white/30" />
                       <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider truncate max-w-[120px]">{user?.email}</span>
                    </div>
                    <button
                      onClick={async () => { await logout(); window.location.href = "/"; }}
                      className="text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-wider"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 mb-6 flex flex-col gap-2">
              {step === "shipping" && shippingCalculated && shippingRate !== null && (
                 <div className="text-center text-[10px] text-green-400/70 font-bold uppercase tracking-widest mb-1">
                    ✓ Shipping cost confirmed — click below to proceed
                 </div>
              )}
              
              {/* Calculate Shipping Button — shown only on shipping step, above Next button */}
              {step === "shipping" && (
                <button
                  onClick={calculateShipping}
                  disabled={calculatingShipping}
                  className="w-full h-14 sm:h-16 text-base sm:text-lg font-black rounded-xl sm:rounded-2xl bg-white hover:bg-white/90 text-[#9f2e2b] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] disabled:opacity-60"
                >
                  {calculatingShipping ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> CALCULATING...</>
                  ) : shippingCalculated ? (
                    <><Check className="w-5 h-5" /> RECALCULATE SHIPPING</>
                  ) : (
                    <><Truck className="w-5 h-5" /> CALCULATE SHIPPING</>
                  )}
                </button>
              )}

              <Button
                onClick={handlePayment}
                disabled={loading || isGeneratingPdf || (step === "shipping" && !shippingCalculated)}
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-black rounded-xl sm:rounded-2xl bg-[#9f2e2b] hover:bg-[#c8413d] text-white transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(159,46,43,0.2)]"
              >
                {loading ? (
                  <div className="flex flex-col items-center leading-none">
                    <Loader2 className="w-5 h-5 animate-spin mb-1" />
                    <span className="text-[10px] font-black tracking-widest">{downloadStatus || "PROCESSING..."}</span>
                  </div>
                ) : <Sparkles className="w-5 h-5" />}
                {!loading && (
                    isPurchased && selectedType === "soft" 
                        ? "DOWNLOAD PDF" 
                        : (step === "selection" && selectedType === "hard" ? "NEXT: SHIPPING" : "PROCEED TO PAYMENT")
                )}
              </Button>

              <button
                onClick={() => {
                    if (step === "shipping") setStep("selection");
                    else onClose();
                }}
                className="w-full py-1 text-[9px] font-black text-white/20 hover:text-white transition-all uppercase tracking-[3px]"
              >
                {step === "shipping" ? "← Back to Selection" : "× Close & Continue Editing"}
              </button>
            </div>

            <div className="py-3 flex items-center justify-center gap-4">
              <span className="text-[7px] text-white/15 uppercase font-bold tracking-[2px]">Secure AES-256 Encrypted Gateway</span>
              <span className="text-white/10">·</span>
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-2.5 opacity-15 grayscale invert" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
