import withPWA from "next-pwa";

const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "example.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "*.amazonaws.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
    pwa: {
        dest: "public",
        register: true,
        skipWaiting: true,
        disable: process.env.NODE_ENV === "development",
        workboxOpts: {
            exclude: [
                /\.map$/,
                /_buildManifest\.js$/,
                /_ssgManifest\.js$/,
            ],
        },
    },
};

export default withPWA(nextConfig); // ✅ Do NOT pass two arguments
