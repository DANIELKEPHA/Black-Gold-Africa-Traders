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
        icon: "/favicon-196.png",
        apple: "/apple-icon-180.png",
    },
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <link rel="manifest" href="/manifest.webmanifest" />
            <meta name="theme-color" content="#ffffff" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Black Gold Africa Ltd" />
            <link rel="apple-touch-icon" href="/apple-icon-180.png" />

            {/* Add splash screens */}
            <>
                {/* iPad Pro 12.9" (portrait & landscape) */}
                <link rel="apple-touch-startup-image" href="/apple-splash-2048-2732.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2732-2048.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPad Pro 11" (portrait & landscape) */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1668-2388.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2388-1668.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPad Air 10.5" */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1536-2048.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2048-1536.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPad Mini */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1640-2360.jpg" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2360-1640.jpg" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPad 10.5" */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1668-2224.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2224-1668.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPad Air 5 */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1620-2160.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2160-1620.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPad Mini 6 */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1488-2266.jpg" media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2266-1488.jpg" media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPhone 14 Pro Max */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1290-2796.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2796-1290.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />

                {/* iPhone 14 Pro */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1179-2556.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2556-1179.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />

                {/* iPhone 14, 13, 12 */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2532-1170.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />

                {/* iPhone 11 Pro Max, XS Max */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1242-2688.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2688-1242.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />

                {/* iPhone 11, XR */}
                <link rel="apple-touch-startup-image" href="/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-1792-828.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPhone 8 Plus */}
                <link rel="apple-touch-startup-image" href="/apple-splash-1242-2208.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-2208-1242.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />

                {/* iPhone 8 */}
                <link rel="apple-touch-startup-image" href="/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-1334-750.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />

                {/* iPhone SE */}
                <link rel="apple-touch-startup-image" href="/apple-splash-640-1136.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
                <link rel="apple-touch-startup-image" href="/apple-splash-1136-640.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
            </>


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
