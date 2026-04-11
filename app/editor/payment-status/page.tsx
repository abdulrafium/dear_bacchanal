"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-3 text-lg">Loading...</p>
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

  useEffect(() => {
    if (!sessionId || canceled) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/check-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");

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

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.replace("/editor?payment=success");
      }, 5000); // 5 seconds to let them click manual download if they want
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="text-center max-w-lg w-full">
        {status === "loading" && (
           <div className="space-y-4">
             <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#9f2e2b]" />
             <p className="text-xl font-medium tracking-tight">Verifying your legacy...</p>
           </div>
        )}

        {status === "success" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-4xl font-black font-display mb-4 uppercase">Success!</h1>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              Your payment is verified. Your carnival book is ready for generation.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.replace("/editor?payment=success")}
                className="w-full py-4 bg-[#9f2e2b] text-white font-black rounded-2xl hover:bg-[#c8413d] transition-all shadow-[0_10px_40px_rgba(159,46,43,0.3)] uppercase tracking-widest text-sm"
              >
                Download Book Now
              </button>
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-[2px]">Automatic download in 5 seconds...</p>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-4xl font-black font-display mb-4 uppercase">Payment Incomplete</h1>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
               <p className="text-red-400 font-bold text-sm tracking-tight">
                 REASON: {reason || "The transaction could not be verified by Stripe."}
               </p>
            </div>
            <p className="text-sm text-white/50 mb-8 leading-relaxed">
              Please try again or contact support if your account was charged.
            </p>
            <button
              onClick={() => router.push("/editor")}
              className="px-10 py-4 border border-white/20 text-white font-black rounded-2xl hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
            >
              Back to Editor
            </button>
          </div>
        )}

        {status === "canceled" && (
          <div className="animate-in fade-in zoom-in duration-500 text-white/80">
            <h1 className="text-4xl font-display mb-4">Payment Canceled</h1>
            <p className="text-lg mb-8">
              You've canceled your payment. Redirecting you back...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
