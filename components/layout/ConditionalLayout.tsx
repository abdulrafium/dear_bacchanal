"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { useSettings } from "@/providers/SettingsProvider";
import { AlertTriangle, Clock, Settings } from "lucide-react";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, loading } = useSettings();
  const pathname = usePathname();
  const isBookPage = pathname?.startsWith("/book");
  const isAdminPage = pathname?.startsWith("/admin");
  const isEditorPage = pathname?.startsWith("/editor");

  // Show maintenance mode if enabled and NOT an admin page
  if (settings?.general?.maintenanceMode && !isAdminPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto text-red-500 mb-8 ring-1 ring-red-500/20">
                <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic">Down for a <span className="text-red-500">Quick Pump</span></h1>
            <p className="text-white/40 text-sm leading-relaxed">
                We're currently performing some scheduled maintenance to bring you an even better experience. We'll be back online shortly!
            </p>
            <div className="pt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-white/20 text-xs font-bold uppercase tracking-widest">
                    <Clock className="w-4 h-4" />
                    Estimated return: 2 Hours
                </div>
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-1/3 animate-[shimmer_2s_infinite_linear]" />
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
      <div className="bg-gradient-to-r from-pink-600 via-red-500 to-yellow-500  text-white text-center py-2 px-4 text-sm font-medium tracking-wide">
        Use code <span className="font-bold">BACCHANAL10</span> to get 10% off! Active from Sunday 8th Feb
      </div>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}