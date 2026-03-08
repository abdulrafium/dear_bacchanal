import Image from "next/image";
import { ImageBox } from "../ui/ImageBox";
import { DynamicBoxRenderer } from "./DynamicBoxRenderer";
import { useBookData } from "./BookDataContext";
import { Plus } from "lucide-react";

const FifthPage = () => {
  const { isReadOnly, addDynamicBox } = useBookData();
  return (
    <>
      {/* Fifth Page */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col xl:flex-row">
        {/* Page Level Add Box Button */}
        {!isReadOnly && (
          <button
            onClick={() => addDynamicBox("FifthPage")}
            className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-md transition-all border border-white/30 group"
            title="Add Image Box to this page"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
       
        <div className="w-full xl:w-1/2 relative flex justify-center min-h-[50vh] h-auto xl:min-h-screen ">
          <Image
            src="/assets/crix.png"
            alt="Layer background"
            width={900}
            height={500}
            className="absolute w-full h-full"
            priority
          />
        </div>
        <div className="w-full xl:w-1/2 bg-[#143951] relative flex justify-center pt-8 sm:pt-10 lg:pt-14 min-h-[50vh] h-auto xl:min-h-screen pb-20 xl:pb-0">
          {/* Overlay Image */}
          <Image
            src="/assets/layer-7.png"
            alt="Overlay"
            fill
            className="object-cover pointer-events-none"
            priority
          />
          <Image
            src="/assets/layer-8.png"
            alt="Layer background"
            width={350}
            height={350}
            className="absolute object-contain bottom-0 right-0 w-48 sm:w-64 lg:min-w-[40%] h-48 sm:h-64 lg:min-h-[40%]"
            priority
          />

          <div className="p-4 sm:p-6 lg:p-10 z-10">
            <div className="flex gap-4 sm:gap-6 lg:gap-10 flex-wrap justify-center lg:justify-start">
              <ImageBox id="box-5-jouvert-1" rotation="rotate-[7deg]" pageId="FifthPage" />
              <ImageBox id="box-5-jouvert-2" rotation="rotate-[-9deg]" pageId="FifthPage" />
              <ImageBox id="box-5-jouvert-3" rotation="rotate-[8deg]" pageId="FifthPage" />
            </div>
            <div className="flex justify-start gap-4 sm:gap-6 lg:gap-10 mt-6 sm:mt-8 lg:mt-10">
              <ImageBox id="box-5-jouvert-4" rotation="rotate-[-9deg]" size="large" pageId="FifthPage" />
            </div>
          </div>
          <h1 className="absolute text-[#007689] text-4xl sm:text-5xl lg:text-[12vh] leading-tight sm:leading-tight lg:leading-[70px] bottom-2 sm:bottom-4 lg:bottom-5 left-4 sm:left-6 lg:left-10 ">
            JOUVERT
          </h1>
        </div>
        <DynamicBoxRenderer pageId="FifthPage" />
      </section>
    </>
  );
};

export default FifthPage;
