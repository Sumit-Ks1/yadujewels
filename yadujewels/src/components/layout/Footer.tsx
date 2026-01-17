import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const footerLinks = {
  shop: [
    { name: "All Jewelry", href: "/shop" },
    { name: "Rings", href: "/shop?category=rings" },
    { name: "Necklaces", href: "/shop?category=necklaces" },
    { name: "Bracelets", href: "/shop?category=bracelets" },
    { name: "Earrings", href: "/shop?category=earrings" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Collections", href: "/collections" },
    { name: "Contact", href: "/contact" },
    { name: "Sustainability", href: "/about#sustainability" },
  ],
  support: [
    { name: "FAQs", href: "/contact#faq" },
    { name: "Shipping & Returns", href: "/contact#shipping" },
    { name: "Care Guide", href: "/contact#care" },
    { name: "Size Guide", href: "/contact#size" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <span className="font-heading text-2xl font-semibold gold-text">
                YADUJEWELS
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Discover timeless elegance with our handcrafted jewelry. Each
              piece tells a story of artistry, sustainability, and enduring
              beauty.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/yadujewels?igsh=YmR2MzNibXV5Zzgy"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                yadujewels@gmail.com
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +91 99103 62371
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <span>
                  Greater Noida
                  <br />
                  Uttar Pradesh, India: 20310
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} YaduJewels. All rights reserved.
          </p>
          {/* <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
