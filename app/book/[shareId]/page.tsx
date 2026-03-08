"use client";

import { useEffect, useState, use } from "react";
import { BookDataProvider } from "@/components/book/BookDataContext";
import { BookFlip } from "@/components/book/BookFlip";
import { Loader2 } from "lucide-react";

// Import all pages
import FirstPage from "@/components/book/FirstPage";
import SecondPage from "@/components/book/SecondPage";
import ThirdPage from "@/components/book/ThirdPage";
import ForthPage from "@/components/book/ForthPage";
import FifthPage from "@/components/book/FifthPage";
import SixthPage from "@/components/book/SixthPage";
import SeventhPage from "@/components/book/SeventhPage";
import EigthPage from "@/components/book/EigthPage";
import NinthPage from "@/components/book/NinthPage";
import TenthPage from "@/components/book/TenthPage";
import EleventhPage from "@/components/book/EleventhPage";
import TwevelthPage from "@/components/book/TwevelthPage";
import ThirteenthPage from "@/components/book/ThirteenthPage";
import ForteenPage from "@/components/book/ForteenPage";
import FifteenthPage from "@/components/book/FifteenthPage";
import Sponser from "@/components/book/Sponser";
import EigthteenPage from "@/components/book/EigthteenPage";
import Seventhteen from "@/components/book/Seventhteen";

interface SharedBookPageProps {
  params: Promise<{
    shareId: string;
  }>;
}

export default function SharedBookPage({ params }: SharedBookPageProps) {
  const { shareId } = use(params);
  const [bookData, setBookData] = useState<{
    textData: Record<string, string>;
    images: Record<string, string>;
    bookName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/public/books/${shareId}`);
        if (response.ok) {
          const data = await response.json();
          setBookData(data);
        } else {
          const err = await response.json();
          setError(err.error || "Failed to load book");
        }
      } catch (e) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchBook();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black/90">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-white mx-auto mb-4" />
          <p className="text-white font-medium">Loading Book...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black/90 text-white">
        <div className="text-center max-w-md p-6 bg-white/10 rounded-xl border border-white/20">
          <h1 className="text-2xl font-bold mb-2 text-coral">Oops!</h1>
          <p className="text-lg mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            If you believe this is an error, ask the owner to check their
            privacy settings.
          </p>
        </div>
      </div>
    );
  }

  if (!bookData) return null;

  // Pages for PDF generation (without download button to avoid circular reference)
  const pagesForPDF = [
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
    <FirstPage key="page-17" />,
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
    <FirstPage key="page-17" pages={pagesForPDF} />,
  ];

  const boxData: Record<string, any> = {};
  const dynamicBoxes: Record<string, string[]> = {};
  if (bookData.textData) {
    Object.keys(bookData.textData).forEach((key) => {
      if (key.startsWith("box-settings-")) {
        const id = key.replace("box-settings-", "");
        try {
          boxData[id] = JSON.parse(bookData.textData[key]);
        } catch (e) {
          console.error("Error parsing box settings in shared provider:", e);
        }
      } else if (key.startsWith("dynamic-boxes-")) {
        const pageId = key.replace("dynamic-boxes-", "");
        try {
          dynamicBoxes[pageId] = JSON.parse(bookData.textData[key]);
        } catch (e) {
          console.error("Error parsing dynamic boxes in shared provider:", e);
        }
      }
    });
  }

  return (
    <BookDataProvider
      textData={bookData.textData}
      images={bookData.images}
      boxData={boxData}
      dynamicBoxes={dynamicBoxes}
      isReadOnly={true}
    >
      <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center">
        {/* Optional Header for Shared View */}
        <div className="absolute top-4 left-0 right-0 z-50 text-center pointer-events-none">
          <span className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
            Viewing: {bookData.bookName}
          </span>
        </div>
        <BookFlip pages={pages} />
      </div>
    </BookDataProvider>
  );
}
