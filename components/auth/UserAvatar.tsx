"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function UserAvatar() {
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse border border-white/20" />
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      setIsMenuOpen(false);
      await logout();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error during logout");
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group overflow-hidden"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral via-teal to-yellow p-[2px]">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        
        <div className="hidden sm:flex flex-col items-start leading-none text-left">
          <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
            {user.name || "Explorer"}
          </span>
        </div>

        <ChevronDown 
          className={`w-3 h-3 text-white/50 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Premium Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-3 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
          {/* User Header */}
          <div className="p-4 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <p className="text-sm font-black text-white uppercase tracking-wider truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-neutral-400 truncate mt-1">
              {user.email}
            </p>
          </div>

          <div className="p-2">
            {/* <Link 
              href="/templates" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            >
              <Settings className="w-4 h-4 text-coral group-hover:rotate-45 transition-transform duration-500" />
              My Books
            </Link> */}

            {(user as any).isAdmin && (
              <Link 
                href="/admin/dashboard" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <LayoutDashboard className="w-4 h-4 text-teal" />
                Admin Dashboard
              </Link>
            )}

            <div className="h-px bg-white/5 my-2" />

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}