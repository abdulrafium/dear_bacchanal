import Image from "next/image";
import { ImageBox } from "../ui/ImageBox";
import { DynamicBoxRenderer } from "./DynamicBoxRenderer";
import { useBookData } from "./BookDataContext";
import { Plus } from "lucide-react";

const SixthPage = () => {
  const { isReadOnly, addDynamicBox } = useBookData();
  return (
    <>
      {/* Sixth Page */}
      <section className="relative overflow-hidden bg-[#d22e56] min-h-screen w-full pt-10 sm:pt-14 lg:pt-20">
        {/* Page Level Add Box Button */}
        {!isReadOnly && (
          <button
            onClick={() => addDynamicBox("SixthPage")}
            className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-md transition-all border border-white/30 group"
            title="Add Image Box to this page"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        <Image
          src="/assets/layer-10.png"
          alt="Overlay"
          fill
          className="object-cover pointer-events-none"
          priority
        />

        <div className="flex flex-col xl:flex-row px-4 sm:px-6 lg:px-0 h-full overflow-y-auto lg:overflow-visible">
          <div className="relative w-full xl:w-1/2 min-h-screen xl:min-h-[600px] flex flex-col gap-8 lg:block py-10 lg:py-0 items-center">
            {/* Box 1 - Horizontal */}
            <div className="relative lg:absolute lg:left-[6vw] lg:top-0">
              <ImageBox id="box-6-left-1" rotation="rotate-[-3deg]" size="horizontal"  pageId="SixthPage" />
            </div>
            {/* Box 2 - Vertical Left */}
            <div className="relative lg:absolute lg:top-[22vw] lg:left-[6vw]">
              <ImageBox id="box-6-left-2" rotation="rotate-[-3deg]" size="vertical"  pageId="SixthPage" />
            </div>
            {/* Box 3 - Vertical Right */}
            <div className="relative lg:absolute lg:top-[22vw] lg:right-[11vw]">
              <ImageBox id="box-6-left-3" rotation="rotate-[6deg]" size="vertical"  pageId="SixthPage" />
            </div>
          </div>
          <div className="relative w-full xl:w-1/2 min-h-screen xl:min-h-[600px] flex flex-col gap-8 lg:block py-10 lg:py-0 items-center">
            {/* Box 1 - Tall Vertical */}
            <div className="relative lg:absolute lg:left-[6vw] lg:top-0">
              <ImageBox id="box-6-right-1" rotation="rotate-[-3deg]" size="tall-vertical"  pageId="SixthPage" />
            </div>
            {/* Box 2 - Top Right */}
            <div className="relative lg:absolute lg:top-[3vw] lg:right-[11vw]">
              <ImageBox id="box-6-right-2" rotation="rotate-[-3deg]" size="vertical"  pageId="SixthPage" />
            </div>
            {/* Box 3 - Bottom Right */}
            <div className="relative lg:absolute lg:top-[22vw] lg:right-[11vw]">
              <ImageBox id="box-6-right-3" rotation="rotate-[-3deg]" size="vertical"  pageId="SixthPage" />
            </div>
          </div>
        </div>
        <DynamicBoxRenderer pageId="SixthPage" />
      </section>
    </>
  );
};

export default SixthPage;
