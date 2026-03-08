"use client";
import { Kalam } from "next/font/google";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const TenthPage = () => {
  return (
    <section className="relative w-full h-full overflow-hidden">
      <div className="flex flex-row w-full h-full relative z-10">
        {/* Left Section - Quote */}
        <div className="w-1/2 bg-[#9F2E2B] flex items-center justify-center p-8 relative h-full">
          <div className="relative w-full max-w-xl px-4">
            {/* Left Quote Mark - Hidden on mobile */}
            <div className="relative hidden md:block">
              <p
                className={`${kalam.className} font-black text-8xl absolute -top-10 -left-12 text-[#c8413d]`}
              >
                ❝
              </p>
            </div>

            {/* Quote Text */}
            <TextArea
              fieldId="page10_quote"
              placeholder="Dear Bacchanal, you never warn us. You just show up. You take our sleep, our voices, our sense of time. You leave glitter in our bags and stories we can’t fully explain. This book is proof that we were there, that it happened, that we lived it."
              className="font-handwritten font-black placeholder:text-center text-black text-lg sm:text-xl md:text-3xl max-w-xl leading-relaxed bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-black/40 resize-none w-full"
              rows={5}
            />

            {/* Right Quote Mark - Hidden on mobile */}
            <div className="relative hidden md:block">
              <p
                className={`${kalam.className} font-black text-8xl absolute -right-10  text-[#c8413d]`}
              >
                ❞
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Letter */}
        <div className="w-1/2 bg-white flex flex-col items-center relative justify-center p-8 h-full">
          <div className="max-w-sm mx-auto md:mx-0">
            <TextInput
              fieldId="page10_greeting"
              placeholder="Dear Bacchanal,"
              className="font-handwritten font-black text-[#ce3834] text-3xl sm:text-4xl md:text-5xl max-w-sm mb-6 sm:mb-8 md:mb-10 bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-[#ce3834]/40 w-full"
            />
            <TextInput
              fieldId="page10_message"
              placeholder="This is my Trinidad Carnival 2026."
              className="font-handwritten font-black text-[#ce3834] text-2xl sm:text-3xl md:text-3xl bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-[#ce3834]/40 w-full"
            />
          </div>

          {/* Signature Input */}
          <div className="absolute bottom-6 sm:bottom-8 md:bottom-40 right-6 sm:right-10 md:right-20">
            <p className="font-handwritten font-black text-[#ce3834] text-xl sm:text-2xl md:text-3xl">
              (
              <TextInput
                fieldId="name"
                placeholder="Your Name"
                className="bg-transparent w-24 sm:w-28 md:w-32 px-1 border-none outline-none focus:outline-none focus:ring-0 placeholder:text-[#ce3834] text-[#ce3834] text-xl sm:text-2xl md:text-3xl font-handwritten font-black"
              />
              )
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TenthPage;
