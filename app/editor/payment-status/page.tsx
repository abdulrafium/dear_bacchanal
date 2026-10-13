"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Download, Check, ArrowRight } from "lucide-react";
import { getCleanPdfFromCache } from "@/lib/pdf-cache";

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#9f2e2b]" />
        <p className="ml-3 text-lg font-medium">Loading...</p>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");

  const [status, setStatus] = useState<"loading" | "success" | "failed" | "canceled">(
    canceled ? "canceled" : "loading"
  );
  const [reason, setReason] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);

  // Download state for soft copy
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (!sessionId || canceled) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/check-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");

          if (data.session?.metadata) {
            setOrderInfo(data.session.metadata);
          }

          if (data.session?.shipping_details) {
            try {
              await fetch("/api/save-shipping-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ shippingDetails: data.session.shipping_details }),
              });
            } catch (saveError) {
              console.error("Error saving shipping details:", saveError);
            }
          }
        } else {
          setStatus("failed");
          setReason(data.payment_status === "unpaid" ? `Status: ${data.status}` : data.error || "Payment was not confirmed.");
        }
      } catch (err: any) {
        setStatus("failed");
        setReason(err.message || "An unexpected error occurred.");
      }
    };

    verifyPayment();
  }, [sessionId, canceled]);

  // Background upload of pre-rendered Hard Copy or Soft Copy PDFs to UploadThing & Database
  useEffect(() => {
    if (status !== "success") return;

    const uploadFilesToCloud = async () => {
      try {
        const bookId = orderInfo?.bookId || orderInfo?.templateName || "Dear_Bacchanal";
        const tmplName = orderInfo?.templateName || "Dear Bacchanal";
        const cleanName = tmplName.replace(/\s+/g, "_");

        const cached = await getCleanPdfFromCache(bookId);

        if (orderInfo?.orderType === "hard") {
          if (cached?.coverPdfBlob && cached?.textPdfBlob) {
            const { uploadFiles } = await import("@/lib/uploadthing-client");
            const coverFile = new File([cached.coverPdfBlob], `${cleanName}_Cover.pdf`, { type: "application/pdf" });
            const textFile = new File([cached.textPdfBlob], `${cleanName}_Text.pdf`, { type: "application/pdf" });

            const uploadResult = await uploadFiles("bookPdfUploader", {
              files: [coverFile, textFile]
            });

            if (uploadResult && uploadResult.length === 2) {
              const coverUrl = uploadResult.find(r => r.name.includes("_Cover"))?.url || uploadResult[0].url;
              const textUrl = uploadResult.find(r => r.name.includes("_Text"))?.url || uploadResult[1].url;

              await fetch("/api/editor/upload-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  coverUrl,
                  textUrl,
                  bookId,
                  templateName: tmplName
                }),
              });
              console.log("[payment-status] Hard copy print files uploaded to factory successfully!");
            }
          }
        } else {
          // Soft Copy (Digital PDF)
          if (cached?.softPdfBlob) {
            const { uploadFiles } = await import("@/lib/uploadthing-client");
            const softFile = new File([cached.softPdfBlob], `${cleanName}_Digital.pdf`, { type: "application/pdf" });

            const uploadResult = await uploadFiles("bookPdfUploader", {
              files: [softFile]
            });

            if (uploadResult && uploadResult.length > 0) {
              const softUrl = uploadResult[0].url;

              await fetch("/api/editor/upload-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  softUrl,
                  bookId,
                  templateName: tmplName
                }),
              });
              console.log("[payment-status] Soft copy digital PDF uploaded to cloud successfully!", softUrl);
            }
          }
        }
      } catch (e) {
        console.error("[payment-status] Background upload failed:", e);
      }
    };

    uploadFilesToCloud();
  }, [status, orderInfo]);

  const handleDownloadSoftCopy = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const bookId = orderInfo?.bookId || orderInfo?.templateName || "Dear_Bacchanal";
      const cached = await getCleanPdfFromCache(bookId);
      let blob = cached?.softPdfBlob;

      // Fallback: check remote URL if available
      if (!blob && (orderInfo?.savedSoftPdfUrl || orderInfo?.softUrl)) {
        try {
          const downloadRes = await fetch(orderInfo.savedSoftPdfUrl || orderInfo.softUrl);
          if (downloadRes.ok) {
            blob = await downloadRes.blob();
          }
        } catch (e) {
          console.warn("Could not fetch remote soft PDF:", e);
        }
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (orderInfo?.templateName || "Dear_Bacchanal").replace(/\s+/g, "_");
        a.download = `${cleanName}_Soft_Copy.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setIsDownloaded(true);
      } else {
        // Fallback if cache cleared: redirect to editor to export
        const tplName = orderInfo?.templateName ? `&templateName=${encodeURIComponent(orderInfo.templateName)}` : '';
        const bId = orderInfo?.bookId ? `&bookId=${orderInfo.bookId}` : '';
        window.location.href = `/editor?payment=success${tplName}${bId}`;
        return;
      }
    } catch (err) {
      console.error("Soft copy download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGoToOrders = () => {
    window.location.href = "/customize?tab=orders";
  };

  const isHardCopy = orderInfo?.orderType === "hard";

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4 select-none">
      {/* ── 1. LOADING STATE (Verifying legacy...) ── */}
      {status === "loading" && (
        <div className="text-center max-w-sm w-full space-y-4 animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#9f2e2b]" />
          <p className="text-xl font-medium tracking-tight text-white/90">
            Verifying your legacy...
          </p>
          <p className="text-xs text-white/40">
            Confirming your transaction with Stripe
          </p>
        </div>
      )}

      {/* ── 2. SUCCESS STATE (Exact Theme Modal Box) ── */}
      {status === "success" && (
        <div 
          className="bg-[#18191c] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center flex flex-col items-center animate-in zoom-in-95 duration-300 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#9f2e2b]/25 rounded-full blur-3xl pointer-events-none" />

          {/* Success Check Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-white font-sans tracking-tight mb-2 uppercase">
            Purchase Successful!
          </h2>

          <p className="text-sm text-white/60 font-medium leading-relaxed mb-6">
            {isHardCopy ? (
              "Purchase Successful! Your Order is pending for Admin Approve. You will be notify soon for further process of Your Book. Thank you for Shopping with us."
            ) : (
              "Thank you for Shopping with us. Your custom carnival photobook digital copy is ready."
            )}
          </p>

          <div className="w-full flex flex-col gap-2.5">
            {/* Soft Copy: Theme-Styled Download Button */}
            {!isHardCopy && (
              <button
                onClick={handleDownloadSoftCopy}
                disabled={isDownloading}
                className={`w-full h-12 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isDownloaded
                    ? "bg-white/10 hover:bg-white/15 text-white border border-white/20"
                    : "bg-gradient-to-r from-[#9f2e2b] via-[#b92c29] to-[#d6302c] hover:brightness-110 text-white shadow-lg shadow-[#9f2e2b]/30"
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Preparing Download...</span>
                  </>
                ) : isDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Downloaded! (Click to re-download)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>Download Soft Copy PDF</span>
                  </>
                )}
              </button>
            )}

            {/* OK Button Styled in Theme */}
            <button
              onClick={handleGoToOrders}
              className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white font-bold text-xs sm:text-sm tracking-wide transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>OK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. FAILED STATE ── */}
      {status === "failed" && (
        <div className="bg-[#18191c] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mb-5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-black mb-2 uppercase text-white font-sans">
            Payment Incomplete
          </h1>
          <p className="text-xs text-red-400 mb-6 font-medium">
            {reason || "The transaction could not be verified by Stripe."}
          </p>
          <button
            onClick={() => router.push("/editor")}
            className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10"
          >
            Back to Editor
          </button>
        </div>
      )}

      {/* ── 4. CANCELED STATE ── */}
      {status === "canceled" && (
        <div className="bg-[#18191c] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
          <h1 className="text-xl font-bold mb-3 text-white">Payment Canceled</h1>
          <p className="text-xs text-white/60 mb-6">
            You canceled your transaction. No charges were made.
          </p>
          <button
            onClick={() => router.push("/editor")}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#9f2e2b] to-[#d6302c] text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Return to Editor
          </button>
        </div>
      )}
    </div>
  );
}
