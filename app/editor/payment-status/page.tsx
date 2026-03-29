"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

  useEffect(() => {
    if (!sessionId || canceled) return;

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/check-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");

          if (data.oneTimeToken && data.email) {
            try {
              const result = await signIn("credentials", {
                email: data.email,
                oneTimeToken: data.oneTimeToken,
                redirect: false,
              });
              if (result?.error) {
                console.error("Post-payment sign-in failed:", result.error);
              }
            } catch (e) {
              console.error("Post-payment sign-in error:", e);
            }
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
        }
      } catch {
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [sessionId, canceled]);

  useEffect(() => {
    if (status === "success" || status === "canceled") {
      const timer = setTimeout(() => {
        router.replace("/editor?auto_ship=true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      <div className="text-center max-w-lg w-full">
        {status === "loading" && (
           <div className="space-y-4">
             <Loader2 className="w-12 h-12 animate-spin mx-auto text-coral" />
             <p className="text-xl font-medium">Verifying your payment...</p>
           </div>
        )}

        {status === "success" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-4xl font-display mb-4">Payment Successful!</h1>
            <p className="text-lg text-white/70 mb-8">
              Thank you for your purchase! We're redirecting you to your carnival book...
            </p>
          </div>
        )}

        {status === "failed" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-4xl font-display mb-4">Payment Failed</h1>
            <p className="text-lg text-white/70 mb-8">
              Something went wrong with your transaction. Please try again or contact support.
            </p>
            <button
              onClick={() => router.push("/editor")}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
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
