'use client';

import Image from 'next/image';
import { ImageBox } from '../ui/ImageBox';
import { DynamicBoxRenderer } from './DynamicBoxRenderer';
import { useBookData } from "./BookDataContext";
import { Plus } from "lucide-react";

const FifteenthPage = () => {
  const { isReadOnly, addDynamicBox } = useBookData();
  return (
    <>
      {/* Fifteenth page */}
      <section className="bg-[#643676] min-h-screen relative w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Page Level Add Box Button */}
        {!isReadOnly && (
          <button
            onClick={() => addDynamicBox("FifteenthPage")}
            className="absolute top-4 left-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-md transition-all border border-white/10 group"
            title="Add Image Box to this page"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        <Image
          src="/assets/layer-20.png"
          alt="Overlay"
          fill
          className="object-cover absolute pointer-events-none"
          priority
        />
        <Image
          src="/assets/FEte-ing.png"
          alt="Overlay"
          width={300}
          height={200}
          className="object-cover top-2 sm:top-4 lg:top-5 left-4 sm:left-6 lg:left-10 absolute pointer-events-none w-48 sm:w-48 lg:min-w-[30%] h-auto"
          priority
        />
        <Image
          src="/assets/layer-21.png"
          alt="Overlay"
          width={300}
          height={200}
          className="object-cover bottom-0 left-0 absolute pointer-events-none w-48 sm:w-48 lg:min-w-[20%] h-auto"
          priority
        />
        <Image
          src="/assets/layer-22.png"
          alt="Overlay"
          width={300}
          height={200}
          className="object-cover bottom-0 right-0 absolute pointer-events-none w-48 sm:w-48 lg:min-w-[20%] h-auto"
          priority
        />

        <div className="flex justify-center flex-col items-center relative gap-8 sm:gap-12 lg:gap-16 py-10 px-4 w-full h-full">
          <div className="flex gap-6 sm:gap-16 lg:gap-32 flex-wrap justify-center items-center">
            <div className="relative lg:top-32">
              <ImageBox id="box-15-1" rotation="rotate-[4deg]" size="portrait" pageId="FifteenthPage" />
            </div>
            <ImageBox id="box-15-2" rotation="rotate-[2deg]" size="portrait" pageId="FifteenthPage" />
            <ImageBox id="box-15-3" rotation="rotate-[7deg]" size="portrait" pageId="FifteenthPage" />
            <ImageBox id="box-15-4" rotation="rotate-[-9deg]" size="portrait" pageId="FifteenthPage" />
          </div>
          <div className="flex gap-6 sm:gap-16 lg:gap-32 flex-wrap justify-center items-center">
            <ImageBox id="box-15-5" rotation="rotate-[-7deg]" size="portrait" pageId="FifteenthPage" />
            <ImageBox id="box-15-6" rotation="rotate-[9deg]" size="portrait" pageId="FifteenthPage" />
          </div>

          {/* Dynamic Boxes Added by User */}

        </div>
        <DynamicBoxRenderer pageId="FifteenthPage" />
      </section>
    </>
  );
};

export default FifteenthPage;