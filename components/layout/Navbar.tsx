"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { AuthModal } from "@/components/auth/AuthModal";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const { openModal } = useAuthModal();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/customize", label: "Customize" },
    { path: "/faqs", label: "FAQs" },
  ];

  return (
    <nav
      className={`fixed top-0  left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/60 backdrop-blur-md m-2 md:m-5 rounded-xl  "
          : "bg-black/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none rounded-xl top-8 "
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="font-display text-3xl">
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(90deg, #ec4899 0%, #fbbf24 50%, #10b981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              BACCHANAL
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative font-medium transition-colors py-2 ${
                  pathname === link.path
                    ? "text-pink-500"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
                {pathname === link.path && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                )}
              </Link>
            ))}
            {isAuthenticated ? (
              <UserAvatar />
            ) : (
              <button
                onClick={() => openModal("signin")}
                className="bg-red-500 rounded-xl text-base px-6 py-2.5 hover:bg-red-600 transition-colors duration-200"
              >
                <span>Get Started</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-white/10  ">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`font-medium py-2 transition-colors ${
                    pathname === link.path
                      ? "text-pink-500"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <UserAvatar />
              ) : (
                <button
                  onClick={() => {
                    openModal("signin");
                    setIsOpen(false);
                  }}
                  className="bg-red-500 rounded-xl text-base px-6 py-3 text-center mt-2 hover:bg-red-600 transition-colors duration-200"
                >
                  <span>Get Started</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <AuthModal />
    </nav>
  );
};

export default Navbar;