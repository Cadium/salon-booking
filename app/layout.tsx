import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://salon-booking-six-xi.vercel.app";
const TITLE = "HAIRBYBELLES — Black-Owned Braiding in Garland, TX";
const DESCRIPTION =
  "HAIRBYBELLES is a braiding studio in Garland, Texas — knotless braids, boho, twists and more, with over ten years of clean parts and gentle tension. Open Monday to Saturday.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "HAIRBYBELLES",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/styles/french-curls.jpeg",
        width: 923,
        height: 1387,
        alt: "Auburn braids finishing in large loose curls",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/styles/french-curls.jpeg"],
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
