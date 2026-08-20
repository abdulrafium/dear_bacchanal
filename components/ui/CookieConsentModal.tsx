"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Cookie, Check, X } from "lucide-react";

export interface CookiePreferences {
  status: "accepted" | "declined";
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  timestamp: number;
  userId: string;
  userEmail?: string;
}

export function getCookieConsentKey(userIdentifier: string) {
  const safeId = encodeURIComponent(userIdentifier.trim().toLowerCase());
  return `bacchanal_cookie_consent_${safeId}`;
}

export default function CookieConsentModal() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [nudge, setNudge] = useState(false);

  // Helper to check if a key exists in localStorage or document.cookie
  const checkKey = useCallback((storageKey: string): boolean => {
    try {
      // 1. Check localStorage
      const localValue = localStorage.getItem(storageKey);
      if (localValue) return true;

      // 2. Check document.cookie with regex handling leading semicolon/spaces
      const cookieMatch = document.cookie.match(
        new RegExp("(^|;\\s*)" + storageKey + "=([^;]+)")
      );
      if (cookieMatch && cookieMatch[2]) return true;
    } catch (e) {
      console.warn("Could not check cookie consent key:", e);
    }
    return false;
  }, []);

  useEffect(() => {
    // Only check and show when user is actively logged in
    if (status !== "authenticated" || !session?.user) {
      setIsOpen(false);
      return;
    }

    const email = session.user.email?.trim().toLowerCase();
    const id = session.user.id ? String(session.user.id).trim() : null;

    if (!email && !id) return;

    // Check if consent exists for this user account (by email or ID) on this browser
    let hasConsent = false;
    if (email && checkKey(getCookieConsentKey(email))) {
      hasConsent = true;
    }
    if (id && checkKey(getCookieConsentKey(id))) {
      hasConsent = true;
    }

    if (!hasConsent) {
      // Small delay to allow smooth initial slide-in
      const timer = setTimeout(() => {
        setIsClosing(false);
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [status, session, checkKey]);

  const saveConsent = (consentStatus: "accepted" | "declined") => {
    if (!session?.user) return;

    const email = session.user.email?.trim().toLowerCase();
    const id = session.user.id ? String(session.user.id).trim() : null;

    if (!email && !id) return;

    const consentData: CookiePreferences = {
      status: consentStatus,
      necessary: true,
      analytics: consentStatus === "accepted",
      preferences: consentStatus === "accepted",
      timestamp: Date.now(),
      userId: id || "",
      userEmail: email || undefined,
    };

    const keysToSave: string[] = [];
    if (email) keysToSave.push(getCookieConsentKey(email));
    if (id) keysToSave.push(getCookieConsentKey(id));

    try {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);

      keysToSave.forEach((storageKey) => {
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(consentData));
        // Save to persistent cookie (1 year expiry)
        document.cookie = `${storageKey}=${consentStatus}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      });

      // Set active functional cookies based on user consent
      if (consentStatus === "accepted") {
        document.cookie = `bacchanal_cookies_enabled=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        document.cookie = `bacchanal_analytics_allowed=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        document.cookie = `bacchanal_preferences_allowed=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      } else {
        document.cookie = `bacchanal_cookies_enabled=false; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        document.cookie = `bacchanal_analytics_allowed=false; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        document.cookie = `bacchanal_preferences_allowed=false; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }

      // Dispatch global event for any listening analytics/feature listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: consentData }));
      }
    } catch (e) {
      console.warn("Could not save cookie consent:", e);
    }

    // Trigger smooth exit animation before removing from DOM
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 350);
  };

  const handleAcceptAll = () => {
    saveConsent("accepted");
  };

  const handleDecline = () => {
    saveConsent("declined");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Trigger smooth horizontal shake without ungrounding from bottom
    setNudge(true);
    setTimeout(() => setNudge(false), 550);
  };

  if (!isOpen) return null;

  const userEmail = session?.user?.email;

  return (
    <>
      <style>{`
        @keyframes cookie-smooth-nudge {
          0%, 100% { transform: translateX(0) scale(1); }
          15% { transform: translateX(-8px) scale(1.015); }
          30% { transform: translateX(8px) scale(1.015); }
          45% { transform: translateX(-5px) scale(1.01); }
          60% { transform: translateX(5px) scale(1.01); }
          75% { transform: translateX(-2px) scale(1.005); }
          90% { transform: translateX(2px) scale(1); }
        }
        .cookie-nudge-active {
          animation: cookie-smooth-nudge 0.5s ease-in-out forwards !important;
        }
      `}</style>

      {/* 
        Full-page transparent click-blocking overlay:
        - Prevents clicks on buttons, links, inputs, navbar menus, etc.
        - Allows mouse-wheel & touch scrolling smoothly.
        - Non-dismissible: clicking outside smoothly shakes the modal.
      */}
      <div
        aria-hidden="true"
        onClick={handleBackdropClick}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`fixed inset-0 z-[9990] bg-black/40 backdrop-blur-[1.5px] transition-opacity duration-300 cursor-default ${
          isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Cookie Consent Modal Box (Anchored at Bottom-Left) */}
      <aside
        aria-label="Cookie Consent"
        role="dialog"
        aria-modal="true"
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] max-w-[420px] w-[calc(100%-2rem)] pointer-events-auto"
      >
        <div
          className={`relative overflow-hidden rounded-2xl bg-[#121212]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(190,40,38,0.22)] p-5 sm:p-6 transition-all duration-300 ease-out ${
            isClosing
              ? "opacity-0 translate-y-8 scale-95"
              : nudge
              ? "cookie-nudge-active ring-2 ring-red-500/70 shadow-[0_0_45px_rgba(190,40,38,0.45)]"
              : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          {/* Decorative ambient glowing top-border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#be2826] to-transparent opacity-90" />

          {/* Header with Cookie Icon & Badge */}
          <div className="flex items-start gap-3.5 mb-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 via-red-500/15 to-transparent border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Cookie className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Cookie Consent
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  Required
                </span>
              </div>
              {userEmail && (
                <p className="text-[11px] text-white/40 truncate mt-0.5">
                  Account: <span className="text-white/70">{userEmail}</span>
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-white/70 leading-relaxed mb-5">
            We use cookies on this device to authenticate your session, save your custom book drafts, and remember your carnival preferences. Please accept or decline to continue using the application.
          </p>

          {/* Action Buttons (Accept All Cookies & Decline) */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#be2826] to-[#e63946] hover:from-[#a52220] hover:to-[#be2826] text-white shadow-lg shadow-red-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Accept All Cookies</span>
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-medium text-xs bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
