import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BACCHANAL | Carnival ",
  description: "Experience the ultimate carnival with BACCHANAL - your gateway to vibrant celebrations, thrilling parades, and unforgettable moments. Join us for a journey filled with music, dance, and cultural festivities that bring communities together in joyous harmony.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <SessionProvider>
          <AuthProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: "linear-gradient(135deg, #171717 0%, #262626 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                },
              }}
            />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
