"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { AlertCircle } from "lucide-react";

function DisabledAccountChecker() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "account_disabled") {
      setShow(true);
      // Optional: remove query param from URL without reloading
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111111] border border-red-500/30 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(220,38,38,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">Account Disabled</h3>
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          Your account has been disabled by an administrator. Please contact support at <strong className="text-white">admin@bacchanal.com</strong> for assistance.
        </p>
        <button
          onClick={() => setShow(false)}
          className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider text-sm"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function AuthModal() {
  const { isOpen, view, closeModal } = useAuthModal();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={closeModal}>
        <DialogContent>
        <DialogHeader className={view === "forgot-password" ? "hidden" : ""}>
          <DialogTitle>
            {view === "signin" ? "Welcome Back" : view === "signup" ? "Join BACCHANAL" : ""}
          </DialogTitle>
          <DialogDescription>
            {view === "signin"
              ? "Sign in to access your carnival experience"
              : view === "signup"
              ? "Create an account to start your carnival journey"
              : ""}
          </DialogDescription>
        </DialogHeader>

          {view === "signin" ? <SignInForm /> : view === "signup" ? <SignUpForm /> : <ForgotPasswordForm />}
        </DialogContent>
      </Dialog>
      
      <Suspense fallback={null}>
        <DisabledAccountChecker />
      </Suspense>
    </>
  );
}