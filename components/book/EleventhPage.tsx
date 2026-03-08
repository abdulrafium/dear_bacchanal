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
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Page Level Add Box Button */}
        {!isReadOnly && (
          <button
            onClick={() => addDynamicBox("EleventhPage")}
            className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-md transition-all border border-white/30 group"
            title="Add Image Box to this page"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        <Image
          src="/assets/layer-15.png"
          alt="Overlay"
          fill
          className="object-cover absolute pointer-events-none"
          priority
        />
        <DynamicBoxRenderer pageId="EleventhPage" />
      </section>
    </>
  )
}

export default EleventhPage;
