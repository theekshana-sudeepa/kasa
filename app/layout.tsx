import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-sinhala",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0514" },
  ],
};

export const metadata: Metadata = {
  title: "KASA — Your AI Shopping Concierge for Kapruka",
  description:
    "KASA (කැස) is your personal AI shopping concierge for Kapruka.com — Sri Lanka's largest e-commerce platform. Discover products, compare options, and checkout through natural conversation. Supports Sinhala, Tanglish, and English.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KASA",
  },
  openGraph: {
    title: "KASA — AI Shopping Concierge for Kapruka",
    description:
      "Shop Kapruka.com with your personal AI assistant. Gifts, cakes, flowers, electronics, groceries — all through natural conversation.",
    type: "website",
  },
  keywords: ["Kapruka", "Sri Lanka", "AI shopping", "gift delivery", "online shopping", "KASA", "කැස"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansSinhala.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

