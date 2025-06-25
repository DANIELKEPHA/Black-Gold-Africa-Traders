import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";

// Import i18n to ensure initialization
import "../i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Black Gold Africa Ltd",
  description:
      "Discover the world’s finest teas sourced from lush estates and expertly curated for global export. At Black Gold Africa Enterprise Ltd, we deliver pure, authentic, and exceptional tea experiences from farm to cup.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en" dir="ltr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Providers>
        <Suspense fallback={<div>System Loading translations...</div>}>
          {children}
        </Suspense>
      </Providers>
      <Toaster closeButton position="top-right" richColors />
      </body>
      </html>
  );
}