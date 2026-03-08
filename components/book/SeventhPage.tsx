import Image from "next/image";
import { ImageBox } from "../ui/ImageBox";
import { DynamicBoxRenderer } from "./DynamicBoxRenderer";
import { useBookData } from "./BookDataContext";
import { Plus } from "lucide-react";

const SeventhPage = () => {
  const { isReadOnly, addDynamicBox } = useBookData();
  return (
    <>
      {/* Seventh Page */}
      <section className="bg-[#fbba00] relative overflow-hidden w-full min-h-screen">
        {/* Page Level Add Box Button */}
        {!isReadOnly && (
          <button
            onClick={() => addDynamicBox("SeventhPage")}
            className="absolute top-4 left-4 z-50 bg-black/10 hover:bg-black/20 text-black rounded-full p-2 backdrop-blur-md transition-all border border-black/10 group"
            title="Add Image Box to this page"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        <Image
          src="/assets/layer-11.png"
          alt="Overlay"
          fill
          className="object-cover pointer-events-none"
          priority
        />

        <div className="flex  flex-col lg:flex-row">
          <div className="p-4 sm:p-6 lg:p-10 w-full lg:w-1/2">
            <div className="flex gap-4 sm:gap-6 lg:gap-10 flex-wrap justify-center lg:justify-center">
              <ImageBox id="box-7-left-1" rotation="rotate-[0deg]" size="xlarge" pageId="SeventhPage" />
              <ImageBox id="box-7-left-2" rotation="rotate-[7deg]" size="xlarge" pageId="SeventhPage" />
            </div>
            <div className="flex gap-4 sm:gap-6 lg:gap-10 mt-6 sm:mt-8 lg:mt-10 flex-wrap justify-center lg:justify-center">
              <ImageBox id="box-7-left-3" rotation="rotate-[5deg]" size="xlarge" pageId="SeventhPage" />
              <ImageBox id="box-7-left-4" rotation="rotate-[-6deg]" size="xlarge" pageId="SeventhPage" />
            </div>
          </div>
          <div className="p-4 sm:p-6 lg:p-10 w-full lg:w-1/2">
            <div className="flex gap-4 sm:gap-6 lg:gap-10 flex-wrap justify-center lg:justify-start">
              <ImageBox id="box-7-right-1" rotation="rotate-[-2deg]" size="xlarge" pageId="SeventhPage" />
              <ImageBox id="box-7-right-2" rotation="rotate-[0deg]" size="xlarge" pageId="SeventhPage" />
            </div>
            <div className="flex gap-4 sm:gap-6 lg:gap-10 mt-6 sm:mt-8 lg:mt-10 flex-wrap justify-center lg:justify-start">
              <ImageBox id="box-7-right-3" rotation="rotate-[5deg]" size="xlarge" pageId="SeventhPage" />
              <ImageBox id="box-7-right-4" rotation="rotate-[5deg]" size="xlarge" pageId="SeventhPage" />
            </div>
          </div>
        </div>
        <DynamicBoxRenderer pageId="SeventhPage" />
      </section>
    </>
  );
};

export default SeventhPage;
