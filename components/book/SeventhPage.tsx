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

        <div className="relative z-10 w-full h-full p-8 lg:p-12 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
            <ImageBox id="box-7-1" rotation="rotate-[2deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-2" rotation="rotate-[-3deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-3" rotation="rotate-[1deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-4" rotation="rotate-[-2deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-5" rotation="rotate-[-1deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-6" rotation="rotate-[4deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-7" rotation="rotate-[-2deg]" size="xlarge" pageId="SeventhPage" />
            <ImageBox id="box-7-8" rotation="rotate-[3deg]" size="xlarge" pageId="SeventhPage" />
          </div>
        </div>
        <DynamicBoxRenderer pageId="SeventhPage" />
      </section>
    </>
  );
};

export default SeventhPage;
