import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "KASA — Your AI Shopping Assistant for Kapruka",
  description:
    "KASA (කැස) is your personal AI shopping assistant for Kapruka.com — Sri Lanka's largest e-commerce platform. Discover products, compare options, and checkout in a natural conversation.",
  openGraph: {
    title: "KASA — AI Shopping Agent for Kapruka",
    description:
      "Shop Kapruka.com with your personal AI assistant. Gifts, cakes, flowers, electronics — all through natural conversation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
