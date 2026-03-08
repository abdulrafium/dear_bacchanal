'use client';
import Image from "next/image";
import { Download, Send, Plus } from "lucide-react";
import { useBookData } from "@/components/book/BookDataContext";
import { ImageBox } from "@/components/ui/ImageBox";
import { DynamicBoxRenderer } from "@/components/book/DynamicBoxRenderer";

interface EigthteenPageProps {
  pages?: React.ReactNode[];
  isPurchased?: boolean;
  onShip?: () => void;
  onDownload?: () => void;
}

const EigthteenPage = ({ pages, isPurchased, onShip, onDownload }: EigthteenPageProps) => {
  const { isReadOnly, addDynamicBox } = useBookData();
  return (
    <>
      <section className=" relative overflow-hidden w-full min-h-screen">
        <Image
          src="/assets/eight.jpg"
          alt="Eigthteen Image"
          fill
          priority
          className="object-cover"
        />
        {!isReadOnly && (
          <button
            onClick={() => addDynamicBox("EigthteenPage")}
            className="absolute top-4 left-4 z-50 bg-black/10 hover:bg-black/20 text-black rounded-full p-2 backdrop-blur-md transition-all border border-black/10 group"
            title="Add Image Box to this page"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        <div className="flex  flex-col lg:flex-row">
          <div className="p-4 sm:p-6 lg:p-10 w-full lg:w-1/2">
            <div className="flex gap-4 sm:gap-6 lg:gap-10 flex-wrap justify-center lg:justify-center">
              <ImageBox id="box-18-left-1" rotation="rotate-[0deg]" size="xlarge" pageId="EigthteenPage" />
              <ImageBox id="box-18-left-2" rotation="rotate-[7deg]" size="xlarge" pageId="EigthteenPage" />
            </div>
            <div className="flex gap-4 sm:gap-6 lg:gap-10 mt-6 sm:mt-8 lg:mt-10 flex-wrap justify-center lg:justify-center">
              <ImageBox id="box-18-left-3" rotation="rotate-[5deg]" size="xlarge" pageId="EigthteenPage" />
              <ImageBox id="box-18-left-4" rotation="rotate-[-6deg]" size="xlarge" pageId="EigthteenPage" />
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-10 w-full lg:w-1/2">
            <div className="flex gap-4 sm:gap-6 lg:gap-10 flex-wrap justify-center lg:justify-start">
              <ImageBox id="box-18-right-1" rotation="rotate-[-2deg]" size="xlarge" pageId="EigthteenPage" />
              <ImageBox id="box-18-right-2" rotation="rotate-[0deg]" size="xlarge" pageId="EigthteenPage" />
            </div>
            <div className="flex gap-4 sm:gap-6 lg:gap-10 mt-6 sm:mt-8 lg:mt-10 flex-wrap justify-center lg:justify-start">
              <ImageBox id="box-18-right-3" rotation="rotate-[5deg]" size="xlarge" pageId="EigthteenPage" />
              <ImageBox id="box-18-right-4" rotation="rotate-[5deg]" size="xlarge" pageId="EigthteenPage" />
            </div>
          </div>
        </div>

        {/* Download PDF and Ship buttons — only when user has paid */}
        {pages && pages.length > 0 && isPurchased && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-4">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-lg"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline text-sm sm:text-base">Download PDF</span>
            </button>
            {onShip && (
              <button
                onClick={onShip}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-[#ff5500] backdrop-blur-xl border border-white/20 text-white font-semibold hover:bg-[#ff4400] transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-lg"
              >
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline text-sm sm:text-base">Send to Home</span>
              </button>
            )}
          </div>
        )}

        <DynamicBoxRenderer pageId="EigthteenPage" />
      </section>
    </>
  );
};

export default EigthteenPage;
