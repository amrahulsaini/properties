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
      <body className="min-h-full bg-app text-ink">{children}</body>
    </html>
  );
}
