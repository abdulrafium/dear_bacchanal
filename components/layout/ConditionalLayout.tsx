"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSettings } from "@/providers/SettingsProvider";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface ActivePromo {
  code: string;
  type: string;
  value: number;
  startDate: string | null;
  activatedAt: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  return `${weekday} ${day}${suffix} ${month}`;
}

function PromoBanner() {
  const [promo, setPromo] = useState<ActivePromo | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/public/active-promo")
      .then((r) => r.json())
      .then((data) => setPromo(data.promo ?? null))
      .catch(() => setPromo(null));
  }, []);

  if (promo === undefined) {
    return <div className="h-10 bg-gradient-to-r from-pink-600 via-red-500 to-yellow-500 animate-pulse" />;
  }

  if (!promo) {
    return (
      <div className="bg-gradient-to-r from-[#1a0a2e] via-[#2d0a1f] to-[#1a0a0a] text-white text-center py-2.5 px-4 text-sm tracking-wide flex items-center justify-center gap-2 border-b border-white/5">
        <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse shrink-0" />
        <span className="font-bold text-yellow-300">Something exciting is coming —</span>
        <span className="text-white/70">exclusive discounts dropping very soon. Stay tuned!</span>
        <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse shrink-0" />
      </div>
    );
  }

  const discountText =
    promo.type === "percentage" ? `${promo.value}% off` : `$${promo.value} off`;

  const dateText = promo.startDate ? `Active from ${formatDate(promo.startDate)}` : null;

  return (
    <>
      <style>{`
        @keyframes code-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); transform: scale(1); }
          50% { box-shadow: 0 0 12px 4px rgba(255,255,255,0.25); transform: scale(1.04); }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .promo-banner {
          background: linear-gradient(90deg, #ec4899, #ef4444, #f59e0b);
          animation: float-in 0.4s ease forwards;
        }
        .promo-code-badge {
          animation: code-pulse 2.5s ease-in-out infinite;
        }
      `}</style>
      <div className="promo-banner text-white text-center py-2.5 px-4 text-sm font-medium tracking-wide flex items-center justify-center gap-2 flex-wrap">
        <Sparkles className="w-3.5 h-3.5 opacity-80 shrink-0" />
        <span className="opacity-90">Use code</span>
        <span className="promo-code-badge font-black bg-white/20 rounded-lg px-2.5 py-0.5 mx-0.5 tracking-widest text-white border border-white/30 text-xs md:text-sm">
          {promo.code}
        </span>
        <span>
          to get <strong>{discountText}</strong>!
        </span>
        {dateText && (
          <span className="font-medium ml-1">
            {dateText}
          </span>
        )}
        <Sparkles className="w-3.5 h-3.5 opacity-80 shrink-0 ml-1" />
      </div>
    </>
  );
}

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const isBookPage = pathname?.startsWith("/book");
  const isAdminPage = pathname?.startsWith("/admin");
  const isEditorPage = pathname?.startsWith("/editor");

  if (settings?.general?.maintenanceMode && !isAdminPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto text-red-500 mb-8 ring-1 ring-red-500/20">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic">
            Down for a <span className="text-red-500">Quick Pump</span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            We're currently performing some scheduled maintenance. We'll be back shortly!
          </p>
          <div className="pt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-white/20 text-xs font-bold uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              Estimated return: 2 Hours
            </div>
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBookPage || isAdminPage || isEditorPage) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
        <PromoBanner />
        <Navbar />
      </header>
      <main>
        {children}
      </main>
      <Footer />
    </>
  );
}