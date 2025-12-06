import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/i,
            handler: "CacheFirst",
            options: {
                cacheName: "images-cache",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                },
            },
        },
        {
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-assets",
            },
        },
        {
            urlPattern: /^https?.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "offline-fallback",
                networkTimeoutSeconds: 15,
                expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                },
            },
        },
    ],
    dynamicStartUrl: true,
    fallbacks: {
        image: "/logo.png",
        document: "/offline",
    },
    publicExcludes: ["!robots.txt", "!sitemap.xml"],
    subdomainPrefix: "",
});

const nextConfig: NextConfig = {
    // ❌ REMOVE: output: "export"
    // ❌ REMOVE: images.unoptimized
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "example.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.amazonaws.com",
                pathname: "/**",
            },
        ],
    },
};

export default withPWA(nextConfig);
