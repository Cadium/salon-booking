import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindred Braid Studio — Black-Owned Braiding in Dallas, TX",
  description:
    "Kindred is a home-based braiding studio in South Dallas — one guest at a time, gentle tension, and clean parts. In-studio or in-home appointments across the DFW metroplex.",
  icons: {
    icon: "/favicon.ico",
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
