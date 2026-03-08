import { ImageBox } from "@/components/ui/ImageBox";
import Image from "next/image";
const Seventhteen = () => {
  return (
    <>
      <section className="min-h-screen bg-[#e79437] w-full relative overflow-x-hidden">
        <div className="relative flex flex-col lg:block justify-center pt-8 sm:pt-10 lg:pt-14 min-h-[50vh] h-auto xl:min-h-screen pb-20 xl:pb-0">
          <h1 className="relative lg:absolute text-[#d13430] leading-tight sm:leading-tight lg:leading-[5vh] mt-10 lg:mt-0 lg:top-[5vh] lg:left-[5vh] text-center lg:text-left z-20 w-full lg:w-auto">
            <span className="transform rotate-[-10deg] inline-block text-6xl sm:text-8xl lg:text-[8vh]">
              CULTURAL
            </span>
            <span className="block lg:absolute lg:left-[28vh] text-7xl sm:text-9xl lg:text-[12vh]">
              EVENTS
            </span>
          </h1>
          <Image
            src="/assets/layer-9.png"
            alt="Layer background"
            width={900}
            height={500}
            className="absolute w-full h-full lg:w-[150vh] lg:h-[90vh] min-h-[80%] bottom-0 left-0 object-cover lg:object-fill z-0"
            priority
          />

          <div className="p-4 sm:p-6 lg:p-10 z-10 flex flex-col lg:block w-full relative gap-8 lg:gap-0 mt-8 lg:mt-0">
            <div className="flex flex-col lg:block items-center gap-8 lg:gap-0">
              <div className="relative lg:absolute lg:top-[20vh] lg:left-[30vh]">
                <ImageBox
                  id="box-17-cultural-1"
                  rotation="rotate-[8deg]"
                  pageId="Seventhteen"
                />
              </div>

              <div className="relative lg:absolute lg:top-[20vh] lg:left-[70vh]">
                <ImageBox
                  id="box-17-cultural-2"
                  rotation="rotate-[-4deg]"
                  pageId="Seventhteen"
                />
              </div>

              <div className="relative lg:absolute lg:top-[0vh] lg:left-[120vh]">
                <ImageBox
                  id="box-17-cultural-3"
                  size="xlarge"
                  rotation="rotate-[0deg]"
                  pageId="Seventhteen"
                />
              </div>

              <div className="relative lg:absolute lg:top-[10vh] lg:right-[20vh]">
                <ImageBox
                  id="box-17-cultural-4"
                  rotation="rotate-[-8deg]"
                  pageId="Seventhteen"
                />
              </div>
            </div>

            <div className="flex flex-col lg:block items-center gap-8 lg:gap-0">
              <div className="relative lg:absolute lg:top-[55vh] lg:left-[60vh]">
                <ImageBox
                  id="box-17-cultural-5"
                  rotation="rotate-[-8deg]"
                  pageId="Seventhteen"
                />
              </div>
              <div className="relative lg:absolute lg:top-[55vh] lg:left-[120vh]">
                <ImageBox
                  id="box-17-cultural-6"
                  rotation="rotate-[0deg]"
                  pageId="Seventhteen"
                />
              </div>

              <div className="relative lg:absolute lg:top-[45vh] lg:right-[20vh]">
                <ImageBox
                  id="box-17-cultural-7"
                  size="xlarge"
                  rotation="rotate-[0deg]"
                  pageId="Seventhteen"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Seventhteen;

