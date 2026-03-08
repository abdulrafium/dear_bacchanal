import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { kalufira } from '@/components/book/Font';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] relative py-20">
      {/* Red Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#be2826]" />
      
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 lg:gap-24">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-8">
            <h3 className={`${kalufira.className} text-5xl text-[#be2826] tracking-tight`}>
              BACCHANAL
            </h3>
            <div className="space-y-6">
              <p className="font-handwritten text-3xl text-white/90 italic leading-snug">
                A celebration doesn&apos;t end when the music fades.
              </p>
              <p className="font-body text-white/40 text-base max-w-sm leading-relaxed tracking-wide">
                Preserve the energy, color, and emotion of carnival with a
                beautifully curated photo book that&apos;s uniquely yours.
              </p>
            </div>
          </div>

          {/* About Column */}
          <div className="space-y-8">
            <h4 className="font-display text-2xl text-white tracking-wide">
              About
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className="text-white/50 hover:text-[#be2826] transition-colors text-lg"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-white/50 hover:text-[#be2826] transition-colors text-lg"
                >
                  Customize Your Book
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-white/50 hover:text-[#be2826] transition-colors text-lg"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="space-y-8">
            <h4 className="font-display text-2xl text-white tracking-wide">
              Connect
            </h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                {[
                   { icon: Instagram, label: "Instagram" },
                   { icon: Facebook, label: "Facebook" },
                   { icon: Twitter, label: "Twitter" },
                   { icon: Mail, label: "Email" }
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-[#be2826] hover:text-white hover:border-transparent transition-all duration-300"
                    aria-label={social.label}
                  >
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
              <p className="text-white/50 text-lg hover:text-white transition-colors cursor-pointer">
                hello@bacchanal.com
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-24 pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-white/30 text-base font-medium">
            © <span suppressHydrationWarning>{currentYear}</span> Bacchanal. All rights reserved.
          </p>
          <p className="font-handwritten text-2xl text-white/30 italic">
            Made with love for carnival lovers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
