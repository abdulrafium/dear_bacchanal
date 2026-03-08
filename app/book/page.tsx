"use client";

import EigthPage from "@/components/book/EigthPage";
import TenthPage from "@/components/book/TenthPage";
import NinthPage from "@/components/book/NinthPage";
import EleventhPage from "@/components/book/EleventhPage";
import FifteenthPage from "@/components/book/FifteenthPage";
import TwevelthPage from "@/components/book/TwevelthPage";
import ThirteenthPage from "@/components/book/ThirteenthPage";
import ForteenPage from "@/components/book/ForteenPage";
import FifthPage from "@/components/book/FifthPage";
import SixthPage from "@/components/book/SixthPage";
import SeventhPage from "@/components/book/SeventhPage";
import ForthPage from "@/components/book/ForthPage";
import SecondPage from "@/components/book/SecondPage";
import ThirdPage from "@/components/book/ThirdPage";
import FirstPage from "@/components/book/FirstPage";
import { AuthModal } from "@/components/auth/AuthModal";
import { BookFlip } from "@/components/book/BookFlip";
import { BookDataProvider } from "@/components/book/BookDataContext";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { PaymentModal } from "@/components/book/PaymentModal";
import Seventhteen from "@/components/book/Seventhteen";
import EigthteenPage from "@/components/book/EigthteenPage";
import { BookPDFGenerator, BookPDFGeneratorHandle } from "@/components/book/BookPDFGenerator";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

// Main component wrapped in Suspense
export default function BookPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#000" }}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}

// Actual page component that uses useSearchParams
function BookPageContent() {
  const [data, setData] = useState<{
    textData: Record<string, string>;
    images: Record<string, string>;
  }>({ textData: {}, images: {} });
  const [loading, setLoading] = useState(true);
  const [boxData, setBoxData] = useState<Record<string, any>>({});
  const [dynamicBoxes, setDynamicBoxes] = useState<Record<string, string[]>>(
    {},
  );

  const { data: session, status } = useSession();
  const isPurchased = session?.user?.isPurchased;
  const isAuthenticated = status === "authenticated";

  const searchParams = useSearchParams();
  const router = useRouter();
  const autoShip = searchParams.get("auto_ship");
  const pdfGeneratorRef = useRef<BookPDFGeneratorHandle>(null);
  const [shippingState, setShippingState] = useState<"idle" | "generating" | "shipping">("idle");

  // Auto-ship effect - triggers after payment
  useEffect(() => {
    const autoShipAfterPayment = async () => {
      if (autoShip === "true" && isPurchased && !loading) {
        // Remove param to prevent loop/re-trigger
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("auto_ship");
        window.history.replaceState({}, "", newUrl.toString());

        // Wait for webhook to save shipping details (retry logic)
        setShippingState("shipping");
        toast.loading("Preparing order...", { id: "auto-ship-toast" });

        let retryCount = 0;
        const maxRetries = 10; // Wait up to 10 seconds

        const attemptShip = async (): Promise<boolean> => {
          try {
            const shipRes = await fetch("/api/ship-book", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}), // No fileUrl - will use saved PDF from database
            });

            const result = await shipRes.json();

            if (!shipRes.ok) {
              // If shipping details not found, retry
              if (result.error?.includes("Shipping details not found") && retryCount < maxRetries) {
                retryCount++;
                console.log(`Waiting for shipping details... Retry ${retryCount}/${maxRetries}`);
                toast.loading(`Waiting for payment confirmation... (${retryCount}/${maxRetries})`, { id: "auto-ship-toast" });
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                return attemptShip(); // Retry
              }
              // No PDF yet — user must generate book first, then use "Send to Home"
              if (result.error?.includes("PDF not uploaded") || result.error?.includes("generate and upload")) {
                toast.success("Payment confirmed! Flip through your book, then click \"Send to Home\" when you're ready to ship.", { id: "auto-ship-toast", duration: 6000 });
                return false; // skip as success, no order placed yet
              }
              throw new Error(result.error || "Auto-ship failed");
            }

            return true;
          } catch (error: any) {
            throw error;
          }
        };

        try {
          const didShip = await attemptShip();
          if (didShip) {
            toast.success("Book order placed successfully!", { id: "auto-ship-toast" });
          }
        } catch (error: any) {
          console.error("Auto-ship error:", error);
          toast.error(
            error.message === "Shipping details not found"
              ? "Payment confirmed but shipping details not ready. Please use 'Send to Home' button."
              : error.message || "Failed to create order. Please use 'Send to Home' button.",
            { id: "auto-ship-toast", duration: 5000 }
          );
        } finally {
          setShippingState("idle");
        }
      }
    };

    autoShipAfterPayment();
  }, [autoShip, isPurchased, loading]);

  const handleManualShip = () => {
    if (pdfGeneratorRef.current) {
      pdfGeneratorRef.current.ship();
    }
  };

  const handleManualDownload = () => {
    if (pdfGeneratorRef.current) {
      pdfGeneratorRef.current.generate();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [textRes, imgRes] = await Promise.all([
          fetch("/api/book-data"),
          fetch("/api/book-images"),
        ]);

        const textResult = await textRes.json();
        const imgResult = await imgRes.json();

        const textData = textResult.data || {};
        const newBoxData: Record<string, any> = {};
        const newDynamicBoxes: Record<string, string[]> = {};

        Object.keys(textData).forEach((key) => {
          if (key.startsWith("box-settings-")) {
            const id = key.replace("box-settings-", "");
            try {
              newBoxData[id] = JSON.parse(textData[key]);
            } catch (e) {
              console.error("Error parsing box settings in provider:", e);
            }
          } else if (key.startsWith("dynamic-boxes-")) {
            const pageId = key.replace("dynamic-boxes-", "");
            try {
              newDynamicBoxes[pageId] = JSON.parse(textData[key]);
            } catch (e) {
              console.error("Error parsing dynamic boxes in provider:", e);
            }
          }
        });

        setData({
          textData,
          images: imgResult.images || {},
        });
        setBoxData(newBoxData);
        setDynamicBoxes(newDynamicBoxes);
      } catch (error) {
        console.error("Error fetching book data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Pages for PDF generation (without download button to avoid circular reference)
  const pagesForPDF = [
    <EigthPage key="pdf-page-1" />,
    <TenthPage key="pdf-page-2" />,
    <NinthPage key="pdf-page-3" />,
    <EleventhPage key="pdf-page-4" />,
    <FifteenthPage key="pdf-page-5" />,
    <TwevelthPage key="pdf-page-6" />,
    <ThirteenthPage key="pdf-page-7" />,
    <ForteenPage key="pdf-page-8" />,
    <FifthPage key="pdf-page-9" />,
    <Seventhteen key="pdf-page-10" />,
    <SixthPage key="pdf-page-11" />,
    <SeventhPage key="pdf-page-12" />,
    <ForthPage key="pdf-page-13" />,
    <SecondPage key="pdf-page-14" />,
    <EigthteenPage key="pdf-page-15" />,
    <ThirdPage key="pdf-page-16" />,
    <FirstPage key="pdf-page-17" />,
  ];

  // Display pages with download button on last page
  const pages = [
    <EigthPage key="page-1" />,
    <TenthPage key="page-2" />,
    <NinthPage key="page-3" />,
    <EleventhPage key="page-4" />,
    <FifteenthPage key="page-5" />,
    <TwevelthPage key="page-6" />,
    <ThirteenthPage key="page-7" />,
    <ForteenPage key="page-8" />,
    <FifthPage key="page-9" />,
    <Seventhteen key="page-10" />,
    <SixthPage key="page-11" />,
    <SeventhPage key="page-12" />,
    <ForthPage key="page-13" />,
    <SecondPage key="page-14" />,
    <EigthteenPage key="page-15" />,
    <ThirdPage key="page-16" />,
    <FirstPage
      key="page-17"
      pages={pagesForPDF}
      isPurchased={!!isPurchased}
      onShip={handleManualShip}
      onDownload={handleManualDownload}
    />,
  ];

  return (
    <BookDataProvider
      textData={data.textData}
      images={data.images}
      boxData={boxData}
      dynamicBoxes={dynamicBoxes}
      isLoading={loading}
    >
      <BookFlip pages={pages} />

      {/* Hidden Generator for Logic */}
      <div style={{ position: "absolute", top: -9999, left: -9999 }}>
        <BookPDFGenerator
          ref={pdfGeneratorRef}
          pages={pagesForPDF}
          isPurchased={!!isPurchased}
          hideButton={true}
          onStateChange={setShippingState}
        />
      </div>

      {/* Processing Overlay */}
      {shippingState !== "idle" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {shippingState === "generating" ? "Generating Book PDF..." : "Sending Order to Printer..."}
          </h2>
          <p className="text-white/70">Please do not close this tab.</p>
        </div>
      )}

      <AuthModal />
    </BookDataProvider>
  );
};
