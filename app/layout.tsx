import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_Devanagari, Sora } from "next/font/google";
import "./globals.css";
import { defaultBranding } from "@/lib/brand";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${defaultBranding.productTitle} | ${defaultBranding.companyName}`,
  description:
    "Property, land, GST, agent, booking, construction, and document operations in one platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PropertySuite",
  },
  icons: {
    icon: "/samarth-icon.ico",
    shortcut: "/samarth-icon.ico",
    apple: "/samarth-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${devanagari.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F26A1B" />
        <link rel="apple-touch-icon" href="/samarth-logo.webp" />
      </head>
      <body className="min-h-full bg-app text-ink">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </body>
    </html>
  );
}
