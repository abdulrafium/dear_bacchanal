'use client';

import Image from "next/image";
import React from "react";
import { kalufira } from "./Font";
import { TextInput } from "../ui/TextInput";


const FourteenPage = () => {
  return (
    <>
      {/* Fourteen Page */}
      <section className="w-full min-h-screen flex flex-col xl:flex-row overflow-hidden relative">

        <Image
          src="/assets/layer-18.png"
          alt="Overlay"
          width={300}
          height={200}
          className="object-cover  lg:min-w-[50%] h-auto  absolute pointer-events-none z-10 hidden lg:block"
          priority
        />
        <div className="w-full xl:w-1/2 bg-[#bfbf40] relative overflow-hidden min-h-[50vh] h-auto lg:h-auto lg:min-h-screen flex items-center justify-center lg:block lg:pt-20">
          <div className="py-10 lg:py-0 relative" >
            <h1
              className={`${kalufira.className} text-black text-5xl sm:text-7xl lg:text-[10vw] relative lg:top-[10vw] rotate-[-10deg] text-center lg:text-left px-4 lg:px-0`}
            >
              TELL
            </h1>

            <div className="leading-tight sm:leading-[80px] lg:leading-[10vw] relative lg:top-[6vw] px-4 lg:px-0">
              <h1
                className={`${kalufira.className} text-black text-5xl sm:text-7xl lg:text-[12vw] text-center lg:text-end`}
              >
                MEH
              </h1>
              <h1
                className={`${kalufira.className} text-black text-4xl sm:text-6xl lg:text-[10vw] text-center lg:text-end`}
              >
                ABOUT UR <br />
                <span className=" xl:hidden block text-black ">VIBE</span>
              </h1>
            </div>
          </div>
        </div>
        <div className="w-full xl:w-1/2 bg-[#fbdc36] flex justify-start px-4 sm:px-6 lg:pl-10 items-center relative overflow-hidden min-h-[50vh] h-auto lg:h-auto lg:min-h-screen py-10 lg:py-0">
          <Image
            src="/assets/layer-19.png"
            alt="Overlay"
            width={300}
            height={200}
            className="object-cover  lg:min-w-[40%] h-auto right-0 absolute pointer-events-none z-10 hidden lg:block"
            priority
          />
          <div className="w-full max-w-xl lg:max-w-none lg:w-[42vw] relative z-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 mb-3 sm:mb-4 lg:mb-3">
              <span className="text-black text-sm sm:text-base lg:text-xl whitespace-nowrap">
                My vibe this year was:
              </span>

              <TextInput
                fieldId="vibe"
                className="w-full sm:flex-1 bg-transparent border-0 border-b-2 border-black text-black placeholder-black focus:outline-none focus:border-black text-sm sm:text-base"
                placeholder="Write name"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 mb-3 sm:mb-4 lg:mb-3">
              <span className="text-black text-sm sm:text-base lg:text-xl whitespace-nowrap">
                My first fete was:
              </span>

              <TextInput
                fieldId="first-fate"
                className="w-full sm:flex-1 bg-transparent border-0 border-b-2 border-black text-black placeholder-black focus:outline-none focus:border-black text-sm sm:text-base"
                placeholder="Write First Fete"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 mb-3 sm:mb-4 lg:mb-3">
              <span className="text-black text-sm sm:text-base lg:text-xl whitespace-nowrap">
                My Band:
              </span>

              <TextInput
                fieldId="band"
                className="w-full sm:flex-1 bg-transparent border-0 border-b-2 border-black text-black placeholder-black focus:outline-none focus:border-black text-sm sm:text-base"
                placeholder="Write Band Name"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 mb-3 sm:mb-4 lg:mb-3">
              <span className="text-black text-sm sm:text-base lg:text-xl whitespace-nowrap">
                My Section:
              </span>

              <TextInput
                fieldId="section"
                className="w-full sm:flex-1 bg-transparent border-0 border-b-2 border-black text-black placeholder-black focus:outline-none focus:border-black text-sm sm:text-base"
                placeholder="Write Section"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 mb-3 sm:mb-4 lg:mb-3">
              <span className="text-black text-sm sm:text-base lg:text-xl whitespace-nowrap">
                My soca songs on repeat were:
              </span>

              <TextInput
                fieldId="soca-songs"
                className="w-full sm:flex-1 bg-transparent border-0 border-b-2 border-black text-black placeholder-black focus:outline-none focus:border-black text-sm sm:text-base"
                placeholder="Write Songs"
              />
            </div>
          </div>
          <div className="hidden xl:block">
            <h1
              className={`${kalufira.className} absolute left-[2vw] text-black lg:text-[18vw]`}
            >
              VIBE
            </h1>
          </div>
        </div>
      </section>
    </>
  );
};

export default FourteenPage;
