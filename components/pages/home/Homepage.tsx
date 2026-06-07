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
  useEffect(() => {
    if (isAuthenticated && user) {
      closeModal();
      if (user.isAdmin) {
        console.log("Admin detected, redirecting to admin dashboard...");
        router.push("/admin/dashboard");
      } else {
        console.log("Regular user detected, redirecting to customize...");
        router.push("/customize");
      }
    }
  }, [isAuthenticated, user, router, closeModal]);

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

            <button onClick={handleAction} className="mt-4 bg-[#ffde59] text-[#bf0000] px-10 sm:px-16 lg:px-20 py-4 rounded-full shadow-xl hover:scale-105 transition-transform">
              <span className="block text-lg lg:text-2xl font-bold">
                START THE BACCHANAL
              </span>
              <span className="block text-sm font-black uppercase">CLICK HERE TO ADD YOUR EMAIL</span>
            </button>

            <p className="text-lg sm:text-xl  lg:text-2xl text-white font-black mt-6 lg:mt-10 uppercase">
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
          className="object-cover pointer-events-none opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-[#521612]/70 z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20 text-center">
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
          <p className="text-white text-2xl sm:text-3xl lg:text-6xl font-bold mt-16 leading-relaxed">
            Not a template. Not a scrapbook. <br />
            <span className="font-handwritten text-[#ffde59] text-4xl sm:text-5xl lg:text-8xl">A keepsake</span>
          </p>
        </div>
      </section>

      {/* section 3 */}
      <section className="relative w-full h-screen">
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
            className="w-full sm:w-auto font-bold bg-[#bb310a] text-[#face07] rounded-full px-8 sm:px-12 lg:px-20 py-5 text-xl sm:text-3xl lg:text-5xl shadow-2xl hover:scale-105 transition-transform leading-none uppercase"
          >
            CUSTOMIZE YOUR BACCHANAL NOW
          </button>
        </div>
      </section>

      {/* section 4 */}
      <section className="bg-[#ecb52b] w-full min-h-screen py-20">
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
      <section className="bg-[#c1bc38] min-h-screen w-full px-6 py-20 lg:py-0 overflow-hidden">
        <div className="flex max-w-7xl mx-auto">
          <div className="hidden lg:block w-1/3">
            <Image src="/assets/section4.png" alt="inspiration" width={500} height={700} className="object-contain" />
          </div>
          <div className="w-full lg:w-2/3 lg:pt-32 lg:ps-12">
            <h1 className="text-white text-center lg:text-left text-4xl sm:text-6xl lg:text-[100px] font-black leading-none uppercase tracking-tighter" style={{ WebkitTextStroke: "2px #077786" }}>
              WHAT INSPIRED DEAR BACCHANAL?
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
        <div className="flex justify-center items-center px-4 mt-20">
          <button onClick={handleAction} className="w-full max-w-4xl py-6 bg-[#077786] text-white rounded-3xl shadow-2xl hover:bg-[#066471] transition-transform hover:scale-[1.02]">
            <span className="text-xl sm:text-3xl lg:text-5xl font-black uppercase leading-tight px-4 block">SOME MEMORIES DESERVE MORE THAN A SCROLL</span>
          </button>
        </div>
      </section>

      {/* section 6 */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <Image src="/assets/section5.jpg" alt="inside" fill className="object-cover" />
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-24">
          <h1 className="text-white text-center text-4xl sm:text-6xl lg:text-8xl font-black underline underline-offset-[16px] mb-24 uppercase">WHAT’S INSIDE?</h1>
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
      <section className="relative min-h-screen w-full bg-[#521612]">
        <Image src="/assets/layer-12.png" alt="overlay" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[#521612]/70 z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-6 py-24">
          <h1 className="text-white text-center lg:text-left text-4xl sm:text-6xl lg:text-8xl font-black mb-24 uppercase">THIS BOOK IS FOR YOU IF...</h1>
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
          <h1 className="text-white text-center text-2xl sm:text-4xl lg:text-6xl font-black mt-24 uppercase tracking-tighter shadow-sm">WHATEVER IS YOUR BACCHANAL - THE BOOK HOLDS IT</h1>
        </div>
      </section>

      {/* section 8 */}
      <section className="relative min-h-screen w-full">
        <Image src="/assets/bacch.jpg" alt="footer hero" fill className="object-cover" />
        <div className="relative z-20 min-h-screen flex flex-col justify-center items-center px-6 text-center">
          <h1 className="text-5xl sm:text-8xl lg:text-[180px] font-black text-[#be2826] leading-none uppercase">LET'S CREATE</h1>
          <button onClick={handleAction} className="my-10 bg-[#be2826] text-[#ecb52b] px-8 sm:px-16 py-6 sm:py-10 rounded-full shadow-2xl hover:scale-110 transition-transform">
            <span className="text-2xl sm:text-4xl lg:text-6xl font-black uppercase">CUSTOMIZE YOUR BOOK NOW</span>
          </button>
          <h1 className="text-5xl sm:text-8xl lg:text-[180px] font-black text-[#be2826] leading-none uppercase">BACCHANAL</h1>
        </div>
      </section>

      {/* section 9 */}
      <footer className="bg-[#be2826] py-12 text-center px-6">
        <h1 className="text-[#ecb52b] text-xl sm:text-3xl lg:text-5xl font-black uppercase tracking-widest leading-none">PRE-ORDER DEAR BACCHANAL 2026</h1>
      </footer>
    </>
  );
};

export default Homepage;
