import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YaduJewels - Timeless Jewelry Crafted with Elegance",
    template: "%s | YaduJewels",
  },
  description:
    "Discover our collection of handcrafted jewelry, designed for those who appreciate elegance, sustainability, and timeless beauty.",
  keywords: [
    "jewelry",
    "gold",
    "diamond",
    "rings",
    "necklaces",
    "bracelets",
    "earrings",
    "luxury",
    "handcrafted",
  ],
  authors: [{ name: "YaduJewels" }],
  creator: "YaduJewels",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://yadujewels.com",
    siteName: "YaduJewels",
    title: "YaduJewels - Timeless Jewelry Crafted with Elegance",
    description:
      "Discover our collection of handcrafted jewelry, designed for those who appreciate elegance, sustainability, and timeless beauty.",
  },
  twitter: {
    card: "summary_large_image",
    title: "YaduJewels - Timeless Jewelry Crafted with Elegance",
    description:
      "Discover our collection of handcrafted jewelry, designed for those who appreciate elegance, sustainability, and timeless beauty.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-body antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
