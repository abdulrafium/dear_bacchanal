"use client";
import { kalufira } from "@/components/book/Font";
import Image from "next/image";
import Link from "next/link";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const Homepage = () => {
  const { openModal } = useAuthModal();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAction = () => {
    if (isAuthenticated) {
      router.push("/editor");
    } else {
      openModal("signup");
    }
  };

  return (
    <>
      {/* section 1 */}
      <section className="bg-[#e09b2c] pt-32 lg:pt-0 min-h-screen w-full overflow-hidden relative">
        <div className="flex flex-col lg:flex-row w-full min-h-screen relative">
          {/* LEFT CONTENT */}
          <div
            className="flex flex-col justify-center items-center gap-4 
                        w-full lg:max-w-3xl 
                        z-10 
                        px-6 lg:pl-60
                        text-center lg:text-center"
          >
            <h1 className="font-bold leading-tight text-[#bf0000]">
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-handwritten">
                Welcome to
              </span>
              <span
                className={`${kalufira.className} text-4xl sm:text-5xl lg:text-6xl`}
              >
                DEAR BACCHANAL
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl font-black text-[#bf0000]">
              A PREMIUM CARNIVAL PHOTO BOOK WHERE YOUR MEMORIES LIVE FOREVER
            </p>

            <p className="text-xl sm:text-2xl lg:text-3xl font-handwritten font-black text-[#bf0000]">
              Sign up for early access, updates, and first dibs when the book
              drops
            </p>

            <button onClick={handleAction} className="mt-4 bg-[#ffde59] text-[#bf0000] px-10 sm:px-16 lg:px-20 py-4 rounded-full">
              <span className="block text-lg lg:text-2xl font-bold">
                START THE BACCHANAL
              </span>
              <span className="block text-sm font-black">CLICK HERE TO ADD YOUR EMAIL</span>
            </button>

            <p className="text-lg sm:text-xl  lg:text-2xl text-white font-black mt-6 lg:mt-10">
              NO SPAM. JUST CARNIVAL THINGS
            </p>
          </div>

          {/* RIGHT IMAGE */}
          <div
            className="
            relative w-full h-[280px] sm:h-[380px]
            lg:absolute lg:right-0 bottom-20 sm:bottom-0 lg:w-[50%] lg:min-h-[100%]
          "
          >
            <Image
              src="/assets/hero.png"
              alt="hero image"
              fill
              priority
              className="object-contain lg:object-cover"
            />
          </div>


        </div>
        {/* Sponsor Banner */}
        <div className="absolute bottom-0 w-full lg:max-w-2xl lg:left-40 flex justify-center">
          <Image
            src="/assets/full-banner.jpeg"
            alt="Sponsored by Crix & Carnival - The Perfect Pair"
            width={640}
            height={93}
            className="w-full lg:max-w-2xl h-auto rounded-lg shadow-2xl"
            priority
          />
        </div>
      </section>
      {/* section 2 */}
      <section className="relative min-h-screen w-full bg-[#521612]">
        <Image
          src="/assets/layer-12.png"
          alt="Overlay"
          fill
          className="object-cover pointer-events-none"
          priority
        />
        {/* Red overlay */}
        <div className="absolute inset-0 bg-[#521612]/70 z-10" />

        <div className="relative z-20 max-w-7xlpx-6 py-20">
          <h1 className="text-white text-center ps-10 text-5xl lg:text-7xl font-extrabold underline  mb-16">
            WHAT IS DEAR BACCHANAL?
          </h1>
          <div className="flex py-20 justify-between items-center px-5 lg:px-20">
            <p className="text-2xl md:text-5xl lg:text-6xl text-center">
              DEAR BACCHANAL IS A PREMIUM CARNIVAL PHOTO BOOK - ALREADY DESIGNED
              BY A LOCAL ARTIST AND BROUGHT TO LIFE WITH YOUR OWN CARNIVAL
              PHOTOS.
            </p>
          </div>
          <p className="text-white text-center text-3xl lg:text-6xl font-bold mt-10">
            Not a template. Not a scrapbook.{" "}
            <span className="font-handwritten">A keepsake</span>
          </p>
        </div>
      </section>
      {/* section 3 */}
      <section className="relative w-full h-screen">
        {/* Background Image */}
        <Image
          src="/assets/image.jpg" // public/images/bg.jpg
          alt="Background"
          fill
          priority
          className="object-cover"
        />

        {/* Content */}
        <div className="relative z-10 flex h-full items-end justify-center px-4">
          <Link
            href="/editor"
            className="
      font-bold
      bg-[#bb310a] text-[#face07]
      rounded-full
      mb-16 sm:mb-24 lg:mb-32
      px-6 sm:px-12 lg:px-20
      py-3
      text-lg sm:text-3xl lg:text-5xl
      text-center
      leading-tight
    "
          >
            <h1>CUSTOMIZED YOUR BACCHANAL NOW</h1>
          </Link>
        </div>
      </section>
      {/* section 4 */}
      <section className="bg-[#ecb52b] w-full min-h-screen">
        <div className="flex flex-col  items-center pt-10">
          <h1
            className="text-3xl sm:text-5xl lg:text-8xl text-white"
            style={{
              WebkitTextStroke: "2px #5d1915",
            }}
          >
            HOW DOES IT WORK?
          </h1>

          <p className="font-handwritten text-2xl md:text-4xl text-white mt-3 ">
            (its easier than you think)
          </p>
        </div>
        <div className=" w-full flex-col xl:flex-row flex min-h-[400px] justify-between items-center">
          <div className="flex justify-center items-center">
            <h1
              className="text-[200px] lg:text-[250px]"
              style={{
                WebkitTextStroke: "2px #5d1915",
              }}
            >
              1
            </h1>
            <div className="w-full lg:max-w-[40%]">
              <h1 className="text-2xl md:text-4xl ">WE DESIGN THE BOOK</h1>
              <p className="font-handwritten text-3xl ">
                Illustrated pages, prompts, and layouts, all donr for you!
              </p>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <h1
              className="text-[200px] lg:text-[250px]"
              style={{
                WebkitTextStroke: "2px #5d1915",
              }}
            >
              2
            </h1>
            <div className="w-full lg:max-w-[50%]">
              <h1 className="text-2xl md:text-4xl ">
                YOU ADD YOU CARNIVAL PHOTOS
              </h1>
              <p className="font-handwritten text-3xl ">
                Upload your memories and fill in guided moments
              </p>
            </div>
          </div>
          <div className="flex justify-center items-center">
            <h1
              className="text-[200px] lg:text-[250px]"
              style={{
                WebkitTextStroke: "2px #5d1915",
              }}
            >
              3
            </h1>
            <div className="w-full lg:max-w-[50%]">
              <h1 className="text-2xl md:text-4xl ">
                WE PRINT & DELIVER YOUR BOOK
              </h1>
              <p className="font-handwritten text-3xl ">
                A finished keepsake, ready to keep forever, delivered to your
                door
              </p>
            </div>
          </div>
        </div>
        <h1 className="text-[#5d1915] text-2xl md:text-6xl text-center">
          NO DESIGN WORK. NO DECISIONS. <br /> JUST YOUR MEMORIES.
        </h1>
      </section>
      {/* section 5 */}
      <section className="bg-[#c1bc38] min-h-screen w-full">
        <div className="flex  ">
          <Image
            src="/assets/section4.png"
            alt="section4 image"
            width={400}
            height={400}
            className="object-contain relative left-0 top-0 hidden lg:block"
          />
          <div className="pt-20 ps-10 lg:ps-20  lg:max-w-5xl">
            <h1
              className="text-white text-center w-full lg:text-left text-3xl md:text-6xl lg:text-8xl font-black"
              style={{
                WebkitTextStroke: "2px #077786",
              }}
            >
              WHAT INSPIRED DEAR BACCHANAL?
            </h1>
            <div className="relative mt-10">
              {/* Red circle (behind text) */}
              <div className="absolute -left-10 -top-5 w-20 h-20 rounded-full bg-[#fe5c2b] z-0"></div>

              {/* Text */}
              <p className="relative z-10 font-handwritten text-4xl font-black">
                Carnival moves fast.
              </p>
              <p className="relative z-10 font-handwritten text-4xl font-black">
                Photos get lost in camera rolls.
              </p>
            </div>
            <div className="relative mt-10">
              {/* Red circle (behind text) */}
              <div className="absolute -left-10 -top-5 w-20 h-20 rounded-full bg-[#fe5c2b] z-0"></div>

              {/* Text */}
              <p className="relative z-10 font-handwritten text-4xl font-black">
                Carnival ends.
              </p>
              <p className="relative z-10 font-handwritten text-4xl font-black">
                The momories don't.
              </p>
            </div>
            <div className="relative mt-10">
              {/* Red circle (behind text) */}
              <div className="absolute -left-10 -top-5 w-20 h-20 rounded-full bg-[#fe5c2b] z-0"></div>

              {/* Text */}
              <p className="relative z-10 font-handwritten text-4xl font-black">
                Dear Bacchanal exists so your carnival doesn't
              </p>
              <p className="relative z-10 font-handwritten text-4xl font-black">
                disappear once the season does.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center px-2 py-10">
          <Link href="/editor">
            <h1 className="text-2xl lg:text-5xl text-center bg-[#077786] text-white rounded-xl px-10 py-2">
              SOME MEMORIES DESERVER MORE THAN A SCROLL
            </h1>
          </Link>
        </div>
      </section>
      {/* section 6 */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background image */}
        <Image
          src="/assets/section5.jpg"
          alt="What's inside background"
          fill
          priority
          className="object-cover z-0"
        />

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-white text-center text-4xl sm:text-5xl lg:text-7xl font-extrabold underline underline-offset-8 mb-16">
            WHAT’S INSIDE?
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-20 gap-x-20 text-white font-handwritten text-2xl sm:text-3xl lg:text-4xl">
            <div className="space-y-20">
              <div className="flex gap-4">
                <span className=" text-3xl md:text-5xl font-black">☑</span>
                <p className=" text-3xl md:text-5xl font-black">
                  Trini-to-d-bone moments
                </p>
              </div>
              <div className="flex gap-4">
                <span className=" text-3xl md:text-5xl font-black">☑</span>
                <p className=" text-3xl md:text-5xl font-black">
                  Fete-keeping memories
                </p>
              </div>
              <div className="flex gap-4">
                <span className=" text-3xl md:text-5xl font-black">☑</span>
                <p className=" text-3xl md:text-5xl font-black">
                  Jouvert madness
                </p>
              </div>
              <div className="flex gap-4">
                <span className=" text-3xl md:text-5xl font-black">☑</span>
                <p className=" text-3xl md:text-5xl font-black">
                  Carnival Monday & Tuesday on the road
                </p>
              </div>
            </div>

            <div className="space-y-20">
              <div className="flex gap-4">
                <span className=" text-3xl md:text-5xl font-black">☑</span>
                <p className=" text-3xl md:text-5xl font-black">
                  Your photos, your story
                </p>
              </div>
              <div className="flex gap-4">
                <span className=" text-3xl md:text-5xl font-black">☑</span>
                <p className=" text-3xl md:text-5xl font-black">
                  Guided prompts & keepsakes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* section 7 */}
      <section className="relative min-h-screen w-full bg-[#521612]">
        <Image
          src="/assets/layer-12.png"
          alt="Overlay"
          fill
          className="object-cover pointer-events-none"
          priority
        />
        {/* Red overlay */}
        <div className="absolute inset-0 bg-[#521612]/70 z-10" />

        <div className="relative z-20 max-w-7xlpx-6 py-20">
          <h1 className="text-white text-left ps-10 text-4xl sm:text-5xl lg:text-7xl font-extrabold  mb-16">
            THIS BOOK IS FOR YOU IF...
          </h1>
          <div className="flex flex-col lg:flex-row justify-between items-center px-5 lg:px-20">
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/assets/dum.png"
                alt="section6 image"
                width={400}
                height={400}
                className="object-contain"
              />
              <p className="font-handwritten max-w-sm  text-center text-4xl">
                This is your 1st carnival or your 15th
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/assets/mob.png"
                alt="section6 image"
                width={400}
                height={400}
                className="object-contain"
              />
              <p className="font-handwritten max-w-sm text-center text-4xl">
                {" "}
                Your photos are messy, joyful, imperfect, real
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/assets/book.png"
                alt="section6 image"
                width={400}
                height={400}
                className="object-contain"
              />
              <p className="font-handwritten max-w-sm text-center text-4xl">
                You want your memories off your phone and into something you can
                keep
              </p>
            </div>
          </div>
          <h1 className="text-white text-center text-3xl lg:text-6xl font-bold mt-10">
            WHATEVER IS YOUR BACHAANAL - THE BOOK HOLDS iT
          </h1>
        </div>
      </section>
      {/* section 8 */}
      <section className="relative min-h-screen w-full ">
        <Image
          src="/assets/bacch.jpg"
          alt="Overlay"
          fill
          className="object-cover pointer-events-none"
          priority
        />
        <div className="flex justify-center items-center min-h-screen relative z-20 px-4 ">
          <Link href="/editor">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[170px] max-w-8xl mx-auto text-[#be2826]">
              LET'S CREATE <br />
              SOME{" "}
              <span className="inline-block max-w-[400px] text-xl sm:text-2xl lg:text-4xl bg-[#be2826] text-[#ecb52b] px-6 sm:px-8 md:px-10 py-3 sm:py-5 md:py-7 rounded-full mt-4">
                CUSTOMISE YOUR BOOK NOW
              </span>
              <br />
              BACCHANAL
            </h1>
          </Link>
        </div>
      </section>
      {/* section 9 */}
      <div className="bg-[#be2826] py-5 text-center">
        <h1 className="text-[#ecb52b] text-xl md:text-4xl">
          {" "}
          PRE-ORDER DEAR BACHAANAL 2026
        </h1>
      </div>
    </>
  );
};

export default Homepage;
