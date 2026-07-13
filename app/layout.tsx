import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://salon-booking-six-xi.vercel.app";
const TITLE = "Kindred Braid Studio — Black-Owned Braiding in Garland, TX";
const DESCRIPTION =
  "Kindred is a home-based braiding studio in Garland — one guest at a time, gentle tension, and clean parts. In-studio or in-home appointments across the DFW metroplex.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Kindred Braid Studio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/hero-model.jpg",
        width: 1200,
        height: 1600,
        alt: "Black woman with long knotless braids in soft, warm light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/hero-model.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
