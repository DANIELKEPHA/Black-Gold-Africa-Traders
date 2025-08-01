"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const DiscoverSection = () => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={containerVariants}
            className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-white to-gray-50"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div variants={itemVariants} className="mb-8 sm:mb-12 text-center">
                    <span className="text-xs sm:text-sm font-semibold tracking-wider text-blue-600 uppercase">
                        World-Class Tea Selection
                    </span>
                    <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                        Artisan Tea Experiences
                    </h2>
                    <p className="mt-3 sm:mt-4 max-w-3xl mx-auto text-base sm:text-lg text-gray-600">
                        Curated from the world&#39;s most prestigious tea gardens, our collection represents centuries of
                        tea-making tradition combined with modern sustainable practices.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-5 sm:gap-6 md:gap-8 md:grid-cols-2">
                    {[
                        {
                            imageSrc: "/tea-varieties.jpg",
                            title: "Masterful Tea Varieties",
                            description: "Explore our collection of single-origin and blended teas, including rare Darjeeling first flush, aged Pu-erh, and Japanese ceremonial matcha.",
                            stats: "200+ varieties",
                            cta: "Browse collection"
                        },
                        {
                            imageSrc: "/tea-farming.jpg",
                            title: "Sustainable Cultivation",
                            description: "Directly sourced from Rainforest Alliance certified estates practicing regenerative agriculture and fair trade principles.",
                            stats: "12 partner estates",
                            cta: "Our sourcing"
                        },
                        {
                            imageSrc: "/tea-ceremony.jpg",
                            title: "Brewing Expertise",
                            description: "Access our library of brewing guides and tea sommelier advice to perfect your preparation techniques.",
                            stats: "50+ brewing guides",
                            cta: "Learn to brew"
                        },
                        {
                            imageSrc: "/tea-wholesale.jpg",
                            title: "Wholesale Partnerships",
                            description: "Join our global network of premium tea retailers, cafes, and hospitality partners with dedicated support.",
                            stats: "36 countries",
                            cta: "Partner with us"
                        },
                    ].map((card, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="group h-72 sm:h-80 md:h-96"
                        >
                            <DiscoverCard {...card} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const DiscoverCard = ({
                          imageSrc,
                          title,
                          description,
                          stats,
                          cta,
                      }: {
    imageSrc: string;
    title: string;
    description: string;
    stats: string;
    cta: string;
}) => (
    <div className="relative h-full rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-gray-900/20 z-10" />
        {imageSrc && (
            <Image
                src={imageSrc}
                width={600}
                height={400}
                className="object-cover w-full h-full"
                alt={title}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={false}
            />
        )}
        <div className="absolute bottom-0 left-0 z-20 p-4 sm:p-6 text-white">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-500 rounded-md mb-1 sm:mb-2">
                {stats}
            </span>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 group-hover:text-blue-300 transition-colors">
                {title}
            </h3>
            <p className="text-sm sm:text-base text-gray-200 mb-2 sm:mb-4 line-clamp-2">{description}</p>
            <button
                className="text-xs sm:text-sm font-medium text-white hover:text-blue-300 transition-colors flex items-center"
                aria-label={cta}
            >
                {cta}
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
);

export default DiscoverSection;