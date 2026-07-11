"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuthModal } from "@/hooks/useAuthModal";
import { signInSchema, SignInInput } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toggleView, closeModal, setView } = useAuthModal();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    try {
      setIsLoading(true);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "ACCOUNT_DISABLED" || result.error.includes("ACCOUNT_DISABLED")) {
          closeModal();
          router.push("/?error=account_disabled");
        } else {
          toast.error("Invalid email or password");
        }
      } else {
        const session = await getSession();
        toast.success("Signed in successfully!");
        closeModal();
        
        if (session?.user?.isAdmin) {
          router.push("/admin/dashboard");
        } else {
          router.push("/customize");
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      // We'll redirect to a client-side route that handles role-based redirection after sign-in
      const callbackUrl = `${window.location.origin}/api/auth/callback/google?callbackUrl=${window.location.origin}/admin/dashboard`;
      
      // Actually, simplest is to just use standard callback and let the root page handle it or use midleware
      // But for better UX, we'll use standard and rely on the Redirect callback in auth.config
      await signIn("google", { callbackUrl: `${window.location.origin}/` });
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast.error("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            disabled={isLoading}
            className="h-9 text-sm"
          />
          {errors.email && (
            <p className="text-[10px] text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              className="h-9 text-sm pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            {errors.password ? (
              <p className="text-[10px] text-red-400">{errors.password.message}</p>
            ) : (
              <div /> // Spacer
            )}
            <button
              type="button"
              onClick={() => setView("forgot-password")}
              className="text-[10px] text-coral hover:text-white transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 rounded-lg bg-gradient-to-r from-coral via-teal to-yellow text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-[#ffffff60]">
          <span className="px-2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
        className="w-full h-10 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/10 hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </button>

      <div className="text-center">
        <button
          onClick={toggleView}
          className="text-xs text-white/40 hover:text-white transition-colors"
        >
          Don't have an account? <span className="text-coral font-bold underline">Sign Up</span>
        </button>
      </div>
    </div>
  );
}