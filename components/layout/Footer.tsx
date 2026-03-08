import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-3xl text-primary mb-4">
              BACCHANAL
            </h3>
            <p className="font-handwritten text-xl text-foreground/60 mb-4">
              A celebration doesn&apos;t end when the music fades.
            </p>
            <p className="font-body text-foreground/50 text-sm max-w-md">
              Preserve the energy, color, and emotion of carnival with a
              beautifully curated photo book that&apos;s uniquely yours.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-foreground mb-4">
              About
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-foreground/50 hover:text-primary transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-foreground/50 hover:text-primary transition-colors text-sm"
                >
                  Customize Your Book
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-foreground/50 hover:text-primary transition-colors text-sm"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold text-foreground mb-4">
              Connect
            </h4>
            <div className="flex gap-3 mb-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>

              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>

              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>

              <a
                href="mailto:hello@bacchanal.com"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>

            <p className="text-foreground/50 text-sm">
              hello@bacchanal.com
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-foreground/40 text-sm">
            © <span suppressHydrationWarning>{currentYear}</span> Bacchanal. All rights reserved.
          </p>
          <p className="font-handwritten text-lg text-foreground/40">
            Made with love for carnival lovers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
