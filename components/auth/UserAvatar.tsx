"use client";

import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";

export function UserAvatar() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-coral via-teal to-yellow animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* User Info - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/20">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-coral via-teal to-yellow flex items-center justify-center">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-white">{user.name}</p>
          <p className="text-xs text-neutral-400">{user.email}</p>
        </div>
      </div>

      {/* Mobile User Icon */}
      <div className="flex md:hidden w-10 h-10 rounded-full bg-gradient-to-r from-coral via-teal to-yellow items-center justify-center">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-200"
        aria-label="Sign out"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-semibold">Sign Out</span>
      </button>
    </div>
  );
}