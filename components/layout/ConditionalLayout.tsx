"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBookPage = pathname?.startsWith("/book");
  const isAdminPage = pathname?.startsWith("/admin");
  const isEditorPage = pathname?.startsWith("/editor");

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