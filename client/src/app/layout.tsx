import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";

// Import i18n to ensure initialization
import "../i18n";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const defaultUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://bgatltd.com";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Black Gold Africa Traders Ltd",
    description:
        "The world’s finest teas sourced from lush estates and expertly curated for global export. At Black Gold Africa Enterprise Ltd, we deliver pure, authentic, and exceptional tea experiences from farm to cup.",
    icons: {
        icon: [{ url: "/favicon-196.png", sizes: "196x196", type: "image/png" }],
        apple: [{ url: "/apple-icon-180.png" }],
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "BGATL",
        startupImage: [
            {
                url: "/apple-splash-2048-2732.jpg",
                media:
                    "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2732-2048.jpg",
                media:
                    "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1668-2388.jpg",
                media:
                    "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2388-1668.jpg",
                media:
                    "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1536-2048.jpg",
                media:
                    "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2048-1536.jpg",
                media:
                    "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1488-2266.jpg",
                media:
                    "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2266-1488.jpg",
                media:
                    "(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1640-2360.jpg",
                media:
                    "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2360-1640.jpg",
                media:
                    "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1668-2224.jpg",
                media:
                    "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2224-1668.jpg",
                media:
                    "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1620-2160.jpg",
                media:
                    "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2160-1620.jpg",
                media:
                    "(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1290-2796.jpg",
                media:
                    "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2796-1290.jpg",
                media:
                    "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1179-2556.jpg",
                media:
                    "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2556-1179.jpg",
                media:
                    "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1284-2778.jpg",
                media:
                    "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2778-1284.jpg",
                media:
                    "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1170-2532.jpg",
                media:
                    "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2532-1170.jpg",
                media:
                    "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1125-2436.jpg",
                media:
                    "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2436-1125.jpg",
                media:
                    "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1242-2688.jpg",
                media:
                    "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2688-1242.jpg",
                media:
                    "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-828-1792.jpg",
                media:
                    "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-1792-828.jpg",
                media:
                    "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-1242-2208.jpg",
                media:
                    "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-2208-1242.jpg",
                media:
                    "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-750-1334.jpg",
                media:
                    "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-1334-750.jpg",
                media:
                    "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
            {
                url: "/apple-splash-640-1136.jpg",
                media:
                    "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
            },
            {
                url: "/apple-splash-1136-640.jpg",
                media:
                    "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
            },
        ],
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
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
        <ServiceWorkerRegistration />
        <Toaster closeButton position="top-right" richColors />
        </body>
        </html>
    );
}