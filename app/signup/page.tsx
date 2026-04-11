"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import Image from "next/image";
import Link from "next/link";
import { kalufira } from "@/components/book/Font";

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full bg-[#f4f4f4] flex flex-col lg:flex-row">
      {/* Left: Branding/Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#bf0000] relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/assets/image.jpg"
            alt="Carnival Background"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 text-center space-y-8">
            <h1 className={`${kalufira.className} text-7xl text-[#ffde59] tracking-tighter`}>
                DEAR <br/> BACCHANAL
            </h1>
            <p className="text-white text-2xl font-bold max-w-md mx-auto leading-tight uppercase">
                Where your carnival memories live forever.
            </p>
            <div className="flex justify-center flex-wrap gap-4 mt-8">
                <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20">
                    Premium Quality
                </span>
                <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/20">
                    Custom Designs
                </span>
            </div>
        </div>
      </div>

      {/* Right: Actual Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 md:p-20 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <Link href="/" className="lg:hidden inline-block mb-4">
                 <span className={`${kalufira.className} text-4xl text-[#bf0000]`}>BACCHANAL</span>
            </Link>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Create your account</h2>
            <p className="text-gray-500 font-medium">Join the bacchanal and start your photo book journey today.</p>
          </div>

          <div className="bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-sm">
             <SignUpForm />
          </div>

          <p className="text-center text-xs text-gray-400 mt-8 px-8">
            By signing up, you agree to our Terms of Service and Privacy Policy. 
             memries are sacred, we keep them safe.
          </p>
        </div>
      </div>
    </div>
  );
}
