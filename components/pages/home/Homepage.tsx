"use client";
import { kalufira } from "@/components/book/Font";
import Image from "next/image";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const Homepage = () => {
  const { openModal, closeModal } = useAuthModal();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authView = searchParams.get("auth");
    const error = searchParams.get("error");

    if (error) {
      toast.error(`Authentication Error: ${error}`);
      // Clean up the URL
      window.history.replaceState({}, "", "/");
    }

    if (authView === "signin" || authView === "signup") {
      openModal(authView as "signin" | "signup");
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, openModal]);

  // If user is already authenticated, send them to the appropriate dashboard
  const { user } = useAuth();
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     closeModal();
  //     if (user.isAdmin) {
  //       console.log("Admin detected, redirecting to admin dashboard...");
  //       router.push("/admin/dashboard");
  //     } else {
  //       console.log("Regular user detected, redirecting to customize...");
  //       router.push("/customize");
  //     }
  //   }
  // }, [isAuthenticated, user, router, closeModal]);

  const handleAction = () => {
    if (isAuthenticated) {
      router.push("/customize");
    } else {
      openModal("signup");
    }
  };

  return (
    <>
      {/* section 1 */}
      <section className="bg-[#e09b2c] min-h-screen w-full overflow-hidden relative pt-20 lg:pt-24">
        <div className="flex flex-col lg:flex-row w-full min-h-screen relative">
          {/* LEFT CONTENT */}
          <div
            className="flex flex-col justify-center items-center gap-4 
                        w-full lg:max-w-3xl 
                        z-10 
                        px-6 lg:pl-60
                        text-center lg:text-center
                        mt-24 lg:-mt-36"
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

            <button onClick={handleAction} className="mt-4 bg-[#ffde59] text-[#bf0000] w-full max-w-[90%] sm:max-w-md lg:max-w-lg py-4 rounded-full shadow-xl hover:scale-105 transition-transform">
              <span className="block text-2xl lg:text-4xl font-display font-normal tracking-wide">
                START THE BACCHANAL
              </span>
              <span className="block text-sm font-black uppercase mt-1">CLICK HERE TO ADD YOUR EMAIL</span>
            </button>

            <p className="text-xl sm:text-2xl lg:text-3xl text-white font-display font-normal tracking-wide mt-6 lg:mt-10 uppercase">
              NO SPAM. JUST CARNIVAL THINGS
            </p>
          </div>

          {/* RIGHT IMAGE */}
          <div
            className="
            relative w-full aspect-square sm:aspect-[4/3]
            lg:absolute lg:inset-y-0 lg:right-0 lg:w-[50%] lg:h-full lg:min-h-screen
          "
          >
            <Image
              src="/assets/hero.png"
              alt="hero image"
              fill
              priority
              className="object-contain lg:object-cover object-right-bottom lg:object-center"
            />
          </div>
        </div>

      </section>

      {/* section 2 */}
      <section className="relative h-auto lg:min-h-screen w-full bg-[#521612] overflow-hidden">
        <Image
          src="/assets/layer-12.png"
          alt="Overlay"
          fill
          className="object-cover pointer-events-none opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-[#521612]/70 z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-12 lg:py-20 text-center">
          <h1 className="text-white text-3xl sm:text-5xl lg:text-7xl font-extrabold underline underline-offset-8 mb-16 uppercase">
            WHAT IS DEAR BACCHANAL?
          </h1>
          <div className="flex flex-col justify-center items-center px-4 max-w-5xl mx-auto">
            <p className="text-2xl md:text-5xl lg:text-6xl text-white font-bold leading-tight">
              DEAR BACCHANAL IS A PREMIUM CARNIVAL PHOTO BOOK - ALREADY DESIGNED
              BY A LOCAL ARTIST AND BROUGHT TO LIFE WITH YOUR OWN CARNIVAL
              PHOTOS.
            </p>
          </div>
          <div className="text-white text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mt-16 leading-relaxed flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <span>Not a template. Not a scrapbook.</span>
            <span className="font-handwritten text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl -mt-1 lg:-mt-2">A keepsake</span>
          </div>
        </div>
      </section>

      {/* section 3 */}
      <section className="relative w-full h-[70vh] lg:h-screen overflow-hidden">
        <Image
          src="/assets/image.jpg"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
        <div className="relative z-10 flex h-full items-end justify-center px-6 pb-20">
          <button
            onClick={handleAction}
            className="w-full sm:w-auto font-display font-normal tracking-wide bg-[#bb310a] text-[#face07] rounded-full px-8 sm:px-12 lg:px-20 py-5 text-xl sm:text-3xl lg:text-5xl shadow-2xl hover:scale-105 transition-transform leading-none uppercase"
          >
            CUSTOMIZE YOUR BACCHANAL NOW
          </button>
        </div>
      </section>

      {/* section 4 */}
      <section className="relative bg-[#ecb52b] w-full h-auto lg:min-h-screen py-12 lg:py-20 overflow-hidden">
        <div className="flex flex-col items-center mb-16">
          <h1
            className="text-4xl sm:text-6xl lg:text-[140px] text-white font-black text-center px-4 uppercase leading-none"
            style={{ WebkitTextStroke: "2px #5d1915" }}
          >
            HOW DOES IT WORK?
          </h1>
          <p className="font-handwritten text-2xl sm:text-4xl text-[#5d1915] mt-4">
            (it's easier than you think)
          </p>
        </div>

        <div className="w-full flex flex-col xl:flex-row justify-between items-center px-6 lg:px-20 gap-16 xl:gap-0">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <h1 className="text-[150px] sm:text-[200px] lg:text-[250px] font-black leading-none text-white" style={{ WebkitTextStroke: "4px #5d1915" }}>1</h1>
            <div className="max-w-[18rem] text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase leading-tight">WE DESIGN THE BOOK</h1>
              <p className="font-handwritten text-3xl sm:text-4xl text-[#5d1915] mt-2">Illustrated pages, prompts, and layouts, all done for you!</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <h1 className="text-[150px] sm:text-[200px] lg:text-[250px] font-black leading-none text-white" style={{ WebkitTextStroke: "4px #5d1915" }}>2</h1>
            <div className="max-w-[20rem] text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase leading-tight">YOU ADD YOUR PHOTOS</h1>
              <p className="font-handwritten text-3xl sm:text-4xl text-[#5d1915] mt-2">Upload your memories and fill in guided moments</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <h1 className="text-[150px] sm:text-[200px] lg:text-[250px] font-black leading-none text-white" style={{ WebkitTextStroke: "4px #5d1915" }}>3</h1>
            <div className="max-w-[20rem] text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase leading-tight">WE PRINT & DELIVER</h1>
              <p className="font-handwritten text-3xl sm:text-4xl text-[#5d1915] mt-2">A finished keepsake, ready to keep forever, delivered to your door</p>
            </div>
          </div>
        </div>

        <h1 className="text-[#5d1915] text-2xl sm:text-4xl lg:text-6xl text-center px-6 mt-20 font-black leading-tight uppercase">
          NO DESIGN WORK. NO DECISIONS. <br className="hidden sm:block" /> JUST YOUR MEMORIES.
        </h1>
      </section>

      {/* section 5 */}
      <section className="bg-[#c1bc38] relative h-auto lg:min-h-screen w-full py-12 lg:py-0 overflow-hidden">
        {/* Steelpan sticker positioned to bleed off the left edge */}
        <div className="hidden lg:block absolute -left-16 xl:-left-12 top-16 z-0">
          <Image src="/assets/section4.png" alt="inspiration" width={500} height={700} className="object-contain pointer-events-none" />
        </div>

        <div className="flex max-w-7xl mx-auto px-6 relative z-10">
          <div className="hidden lg:block w-[25%] flex-shrink-0" />
          <div className="w-full lg:w-[75%] lg:pt-32">
            <h1 className="text-white text-center lg:text-left text-3xl sm:text-5xl lg:text-6xl xl:text-[70px] font-display tracking-wide leading-[1.1] uppercase" style={{ WebkitTextStroke: "2px #077786" }}>
              WHAT INSPIRED DEAR <br className="hidden lg:block" /> BACCHANAL?
            </h1>

            <div className="mt-16 space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-12 sm:w-20 h-12 sm:h-20 rounded-full bg-[#fe5c2b] flex-shrink-0" />
                <p className="font-handwritten text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">Carnival moves fast. Photos get lost.</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 sm:w-20 h-12 sm:h-20 rounded-full bg-[#fe5c2b] flex-shrink-0" />
                <p className="font-handwritten text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">Carnival ends. The memories don't.</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-12 sm:w-20 h-12 sm:h-20 rounded-full bg-[#fe5c2b] flex-shrink-0" />
                <p className="font-handwritten text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">Dear Bacchanal exists so your carnival doesn't disappear.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center px-4 mt-2 w-full max-w-5xl mx-auto">
          <button onClick={handleAction} className="w-full py-5 lg:py-6 bg-[#077786] text-white rounded-[2rem] shadow-2xl hover:bg-[#066471] transition-transform hover:scale-[1.02]">
            <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-display font-normal tracking-wide uppercase leading-tight px-4 block">SOME MEMORIES DESERVE MORE THAN A SCROLL</span>
          </button>
        </div>
      </section>

      {/* section 6 */}
      <section className="relative h-auto lg:min-h-screen w-full overflow-hidden">
        <Image src="/assets/section5.jpg" alt="inside" fill className="object-cover" />
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-12 lg:py-24">
          <h1 className="text-white text-center text-4xl sm:text-6xl lg:text-8xl font-black underline underline-offset-[16px] mb-12 lg:mb-24 uppercase">WHAT’S INSIDE?</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-12">
            <div className="space-y-10">
              {["Trini-to-d-bone moments", "Fete-keeping memories", "Jouvert madness", "Road March Monday & Tuesday"].map((t) => (
                <div key={t} className="flex gap-6 items-start">
                  <span className="text-4xl sm:text-6xl text-white font-black">☑</span>
                  <p className="font-handwritten text-3xl sm:text-5xl lg:text-6xl text-white font-black leading-none">{t}</p>
                </div>
              ))}
            </div>
            <div className="space-y-10">
              {["Your photos, your story", "Guided prompts & keepsakes"].map((t) => (
                <div key={t} className="flex gap-6 items-start">
                  <span className="text-4xl sm:text-6xl text-white font-black">☑</span>
                  <p className="font-handwritten text-3xl sm:text-5xl lg:text-6xl text-white font-black leading-none">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* section 7 */}
      <section className="relative h-auto lg:min-h-screen w-full bg-[#521612] overflow-hidden">
        <Image src="/assets/layer-12.png" alt="overlay" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[#521612]/70 z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-12 lg:py-24">
          <h1 className="text-white text-center lg:text-left text-4xl sm:text-6xl lg:text-8xl font-black mb-12 lg:mb-24 uppercase">THIS BOOK IS FOR YOU IF...</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {[
              { src: "/assets/dum.png", text: "This is your 1st carnival or your 15th" },
              { src: "/assets/mob.png", text: "Your photos are messy, joyful, joyful, real" },
              { src: "/assets/book.png", text: "You want your memories off your phone and into a keepsake" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <Image src={item.src} alt="icon" width={300} height={300} className="w-56 sm:w-72 h-auto object-contain" />
                <p className="font-handwritten text-white text-center text-3xl sm:text-4xl mt-6 max-w-xs font-black">{item.text}</p>
              </div>
            ))}
          </div>
          <h1 className="text-white text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-[44px] 2xl:text-5xl font-display font-normal tracking-wide mt-24 uppercase shadow-sm">WHATEVER IS YOUR BACCHANAL - THE BOOK HOLDS IT</h1>
        </div>
      </section>

      {/* section 8 */}
      <section className="relative h-auto lg:min-h-screen w-full overflow-hidden">
        <Image src="/assets/bacch.jpg" alt="footer hero" fill className="object-cover" />
        <div className="relative z-20 h-auto lg:min-h-screen py-16 lg:py-0 flex flex-col justify-center items-center px-6 w-full">
          <div className="flex flex-col items-center lg:items-start w-full max-w-5xl">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[140px] xl:text-[180px] font-display text-[#be2826] leading-[0.9] uppercase text-center lg:text-left w-full break-words mt-4 lg:mt-0">LET'S CREATE</h1>
            
            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-6 lg:gap-12 my-6 lg:my-0 w-full">
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[140px] xl:text-[180px] font-display text-[#be2826] leading-[0.9] uppercase text-center lg:text-left">SOME</h1>
              <button onClick={handleAction} className="bg-[#be2826] text-[#ecb52b] px-6 sm:px-12 py-5 sm:py-8 rounded-[3rem] shadow-2xl hover:scale-105 transition-transform flex flex-col items-center justify-center text-center w-full sm:w-auto">
                <span className="text-xl sm:text-2xl lg:text-4xl font-black uppercase leading-tight">CUSTOMISE</span>
                <span className="text-xl sm:text-2xl lg:text-4xl font-black uppercase leading-tight">YOUR BOOK NOW</span>
              </button>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[140px] xl:text-[180px] font-display text-[#be2826] leading-[0.9] uppercase text-center lg:text-left w-full break-words">BACCHANAL</h1>
          </div>
        </div>
      </section>

      {/* section 9 */}
      <section className="relative bg-[#be2826] py-4 sm:py-6 text-center px-6 w-full overflow-hidden">
        <h1 className="text-[#ecb52b] text-xl sm:text-3xl lg:text-4xl font-display font-normal uppercase tracking-wider leading-none">PRE-ORDER DEAR BACCHANAL 2026</h1>
      </section>

      {/* section 10: Banner Image */}
      <section className="relative w-full bg-[#111111] overflow-hidden">
        <Image src="/assets/banner.png" alt="Dear Bacchanal Banner" width={1920} height={600} className="w-full h-auto object-cover" />
      </section>
    </>
  );
};

export default Homepage;
