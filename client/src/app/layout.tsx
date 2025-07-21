import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
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
    icons: {
        icon: "/manifest-icon-192.maskable.png", // Match manifest
        apple: "/manifest-icon-192.maskable.png", // Match manifest
    },
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="theme-color" content="#000000" /> {/* Match manifest */}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Black Gold Africa Ltd" />
            <link rel="manifest" href="/manifest.webmanifest" />
            <link rel="apple-touch-icon" href="/manifest-icon-192.maskable.png" />

            {/* Splash screens (unchanged, looks good) */}
            <link
                rel="apple-touch-startup-image"
                href="/apple-splash-2048-2732.jpg"
                media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
            />
            <link
                rel="apple-touch-startup-image"
                href="/apple-splash-2732-2048.jpg"
                media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
            />
            {/* Include other splash screens as in your original code */}
        </head>
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