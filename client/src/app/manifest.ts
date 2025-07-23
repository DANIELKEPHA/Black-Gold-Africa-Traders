// app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Black Gold Africa Ltd",
        short_name: "BGATL",
        description: "Premium teas from lush estates...",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait-primary",
        categories: ["food", "shopping", "ecommerce"],
        icons: [
            {
                src: "/icons/icon-72x72.png",
                sizes: "72x72",
                type: "image/png",
            },
            {
                src: "/icons/icon-96x96.png",
                sizes: "96x96",
                type: "image/png"
            },
            {
                src: "/icons/icon-128x128.png",
                sizes: "128x128",
                type: "image/png"
            },
            {
                src: "/icons/icon-144x144.png",
                sizes: "144x144",
                type: "image/png"
            },
            {
                src: "/icons/icon-152x152.png",
                sizes: "152x152",
                type: "image/png"
            },
            {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icons/icon-384x384.png",
                sizes: "384x384",
                type: "image/png"
            },
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            }
        ],
        screenshots: [
            {
                src: "/screenshots/desktop.png",
                sizes: "1280x800",
                type: "image/png",
                form_factor: "wide"
            },
            {
                src: "/screenshots/mobile.png",
                sizes: "750x1334",
                type: "image/png",
                form_factor: "narrow"
            }
        ],
        shortcuts: [
            {
                name: "Our Teas",
                short_name: "Teas",
                description: "Browse our tea collection",
                url: "/teas",
                icons: [{ src: "/icons/tea-icon.png", sizes: "96x96" }]
            },
            {
                name: "Contact",
                short_name: "Contact",
                description: "Get in touch",
                url: "/contact",
                icons: [{ src: "/icons/contact-icon.png", sizes: "96x96" }]
            }
        ]
    };
}