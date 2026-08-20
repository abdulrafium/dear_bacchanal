import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins, Luckiest_Guy, Caveat } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { GlobalPrefetcher } from "@/components/layout/GlobalPrefetcher";
import CookieConsentModal from "@/components/ui/CookieConsentModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const luckiestGuy = Luckiest_Guy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-luckiest-guy",
});

const caveat = Caveat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "BACCHANAL | Carnival ",
  description: "Experience the ultimate carnival with BACCHANAL - your gateway to vibrant celebrations, thrilling parades, and unforgettable moments. Join us for a journey filled with music, dance, and cultural festivities that bring communities together in joyous harmony.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g transform='rotate(-6 50 50)'><rect x='10' y='10' width='80' height='80' rx='22' fill='%23be2826' stroke='white' stroke-width='7'/><text x='50%25' y='65%25' text-anchor='middle' font-family='system-ui, sans-serif' font-weight='900' font-size='44' fill='white'>DB</text></g></svg>"
        />
        {/* Preconnect so browser opens the connection before the editor canvas even loads */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload the editor-specific fonts that were previously loaded late via @import inside a <style> tag */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Kalam:wght@300;400;700&family=Luckiest+Guy&family=Caveat:wght@400;700&family=Pacifico&family=Anton&family=Bangers&family=Lobster&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:wght@400;700&family=Boogaloo&family=Fredoka+One&family=Baloo+2:wght@400;700&family=Titan+One&family=Architects+Daughter&family=Patrick+Hand&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${luckiestGuy.variable} ${caveat.variable} antialiased overflow-x-hidden`}
      >
        <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
          <AuthProvider>
            <SettingsProvider>
              <GlobalPrefetcher />
              <div className="w-full overflow-x-hidden relative flex flex-col min-h-screen">
                <ConditionalLayout>{children}</ConditionalLayout>
              </div>
              <CookieConsentModal />
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
            </SettingsProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

