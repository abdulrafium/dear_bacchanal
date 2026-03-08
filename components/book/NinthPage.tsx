import { kalufira } from "./Font";
import Image from "next/image";

const NinthPage = () => {
  return (
    <>
      {/* Ninth Page */}
      <section className="bg-[#d13430] h-full w-full relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/assets/layer-14.png"
            alt="Overlay"
            fill
            className="object-cover object-bottom pointer-events-none"
            priority
          />
        </div>
        <div className="flex flex-row h-full relative">
          <div className="w-1/2 px-8 lg:pl-10 z-10 flex flex-col justify-start items-center py-10">
            <h1
              className={`text-[13vh] ${kalufira.className} text-center lg:text-left`}
            >
              THE GREATEST
            </h1>
            <div className="mt-8 text-center lg:text-left">
              <p className=" font-handwritten font-black text-[4vh] mb-[2vh]">
                ✓ Vibes
              </p>
              <p className=" font-handwritten font-black text-[4vh] mb-[2vh]">
                ✓ Costume from ya band
              </p>
              <p className=" font-handwritten font-black text-[4vh] mb-2">
                ✓ Fete-in time
              </p>
            </div>
          </div>
          <div className="w-1/2 px-8 xl:px-0 z-10 flex flex-col justify-start items-center py-10">
            <h1
              className={`text-[13vh] ${kalufira.className} text-center lg:text-left`}
            >
              SHOW ON EARTH
            </h1>
            <div className="mt-8 text-center lg:text-left">
              <p className=" font-handwritten font-black text-[4vh] mb-[2vh]">
                ✓ Friends
              </p>
              <p className=" font-handwritten font-black text-[4vh] mb-[2vh]">
                ✓ Soca tunes loaded
              </p>
              <p className=" font-handwritten font-black text-[4vh] mb-[2vh]">
                ✓ Waist veady to wine
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default NinthPage;
