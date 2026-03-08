import Image from "next/image";

import { kalufira } from "./Font";

const ThirdPage = () => {
  return (
    <>
      {/* Third Page */}
      <section className="bg-[#d4602c] relative w-full min-h-screen">

        <Image
          src="/assets/layer-3.png"
          alt="Layer background"
          width={900}
          height={300}
          className="absolute object-contain bottom-0 right-0 w-40 sm:w-96 lg:w-[900px]"
          priority
        />
        <div className="flex flex-col xl:flex-row justify-between items-start z-10 relative px-4 sm:px-8 lg:px-0">
          <div className="p-6 sm:p-10 lg:p-20 w-full xl:w-1/2">
            <h1
              className={`${kalufira.className} text-white text-3xl sm:text-4xl lg:text-6xl`}
            >
              HISTORY OF
              <span className="block text-6xl sm:text-8xl lg:text-[140px] text-[#f8dc3c]">
                CARNIVAL
              </span>
            </h1>
            <p className="text-white text-lg sm:text-lg lg:text-xl mt-6 lg:mt-10">
              Long before music trucks, glittering costumes, and iconic stage
              crossings, Carnival in Trinidad and Tobago was shaped by a people
              determined to express their freedom. Its earliest roots trace back
              to the 18th century, when French planters held exclusive
              masquerade balls celebrations enslaved Africans were barred from
              attending. In response, they created their own rituals in the
              streets, using drums, chants, and masks to reclaim joy and
              humanity in the face of oppression.{" "}
            </p>
            <p className="text-white text-base sm:text-lg lg:text-xl mt-6 lg:mt-10">
              With Emancipation, those street celebrations erupted into a
              powerful public declaration of liberty our liberty. From that
              moment on, Carnival became the heartbeat of a nation that refused
              to forget its origins. It evolved into a space where every creed
              and race could wine, chant, jump, and create together, in a shared
              rhythm.
            </p>
          </div>
          <div className="w-full xl:w-1/2 p-6 sm:p-10 lg:p-20 ">
            <p className="text-white text-base sm:text-lg lg:text-xl mt-6 xl:mt-10">
              From calypso to steelpan, from the fierceness of Jab to the
              swagger of the Fancy Sailor, every character carries a chapter of
              resistance, memory, and cultural pride. And every Carnival, when
              the sun hits the road and the music rises, we reenact that story
              all over again.
            </p>
            <p className="text-white text-lg sm:text-lg lg:text-xl mt-6 lg:mt-10">
              With Emancipation, those street celebrations erupted into a
              powerful public declaration of liberty our liberty. From that
              moment on, Carnival became the heartbeat of a nation that refused
              to forget its origins. It evolved into a space where every creed
              and race could wine, chant, jump, and create together, in a shared
              rhythm.
            </p>
          </div>
        </div>

      </section>
    </>
  );
};

export default ThirdPage;
