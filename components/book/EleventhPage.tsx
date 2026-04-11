"use client";
import Image from 'next/image'
import React from 'react'
import { DynamicBoxRenderer } from "./DynamicBoxRenderer";
import { useBookData } from "./BookDataContext";
import { Plus } from "lucide-react";

const EleventhPage = () => {
  const { isReadOnly, addDynamicBox } = useBookData();
  return (
    <>
      {/* Eleventh Page */}
      <section className="relative min-h-screen w-full overflow-hidden bg-[#fbba00]">
        <Image
          src="/assets/layer-15.png"
          alt="Overlay"
          fill
          className="object-cover absolute pointer-events-none opacity-40"
          priority
        />
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="h-full w-px bg-black absolute left-1/4" />
          <div className="h-full w-px bg-black absolute left-2/4" />
          <div className="h-full w-px bg-black absolute left-3/4" />
          <div className="w-full h-px bg-black absolute top-1/4" />
          <div className="w-full h-px bg-black absolute top-2/4" />
          <div className="w-full h-px bg-black absolute top-3/4" />
        </div>

        <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
           {/* Static Calendar for visual placeholder if no elements added yet */}
           <div className="w-full max-w-4xl opacity-50 pointer-events-none select-none">
              <div className="text-center mb-12">
                  <h2 className="kalufira text-8xl font-black text-black">CALENDAR</h2>
              </div>
           </div>
        </div>

        {/* Page Level Add Box Button */}
        {!isReadOnly && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
                onClick={() => addDynamicBox("EleventhPage")}
                className="bg-black/80 hover:bg-black text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all border border-white/20 flex items-center gap-2"
                title="Add Image Box"
            >
                <Plus className="w-3.5 h-3.5" />
                Add Box
            </button>
          </div>
        )}
        
        <DynamicBoxRenderer pageId="EleventhPage" />
      </section>
    </>
  )
}

export default EleventhPage;
