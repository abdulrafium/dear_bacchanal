"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuthModal } from "@/hooks/useAuthModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const { setView } = useAuthModal();
  
  // Step 1 State
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [isFindingAccount, setIsFindingAccount] = useState(false);
  const [userName, setUserName] = useState("");

  // Step 2 State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isOtpValid = otp.length === 6;
  const canSubmit = hasMinLength && hasUpperCase && passwordsMatch && isOtpValid;

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address");

    setIsFindingAccount(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Account not found with this email");
      }

      setUserName(data.name || "User");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsFindingAccount(false);
    }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      toast.success("6-digit code sent to your email!");
      setCountdown(180); // 3 minutes
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!canSubmit) return;
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setView("signin");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => step === 2 ? setStep(1) : setView("signin")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-2xl font-black text-white uppercase tracking-wider">
          Forgot Password
        </h2>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isFindingAccount}
              className="h-9 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isFindingAccount || !email}
            className="w-full h-10 rounded-lg bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {isFindingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
            {isFindingAccount ? "Finding Account..." : "Next"}
          </button>
        </form>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white font-bold text-sm uppercase tracking-wider">{userName}</p>
            <p className="text-white/50 text-xs">{email}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-white/50 mb-1.5 block uppercase tracking-wider font-bold">New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="h-9 text-sm bg-white/5 border-white/10 focus:border-coral transition-colors pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
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
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${hasMinLength ? "text-green-500" : "text-red-500"}`}>
                    • Minimum 8 characters
                  </p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${hasUpperCase ? "text-green-500" : "text-red-500"}`}>
                    • At least one uppercase letter
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-white/50 mb-1.5 block uppercase tracking-wider font-bold">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  className="h-9 text-sm bg-white/5 border-white/10 focus:border-coral transition-colors pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`mt-2 text-[10px] uppercase tracking-widest font-bold ${passwordsMatch ? "text-green-500" : "text-red-500"}`}>
                  • {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </p>
              )}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-white/50 mb-1.5 block uppercase tracking-wider font-bold">6-Digit Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  className="h-9 text-sm bg-white/5 border-white/10 text-center tracking-[0.5em] font-bold"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || countdown > 0}
                className="h-9 px-4 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider whitespace-nowrap min-w-[120px] flex items-center justify-center"
              >
                {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : countdown > 0 ? `Resend (${formatTime(countdown)})` : "Send"}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={!canSubmit || isChangingPassword}
            className="w-full h-10 mt-2 rounded-lg bg-coral text-white text-sm font-bold hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider shadow-[0_0_20px_rgba(255,113,98,0.2)]"
          >
            {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      )}
    </div>
  );
}
