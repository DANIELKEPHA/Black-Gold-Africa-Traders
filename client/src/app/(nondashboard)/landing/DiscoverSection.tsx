// src/components/DiscoverSection.tsx
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
            viewport={{ once: true, amount: 0.8 }}
            variants={containerVariants}
            className="py-12 bg-white mb-16"
        >
            <div className="max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
                <motion.div variants={itemVariants} className="my-12 text-center">
                    <h2 className="text-3xl font-semibold leading-tight text-gray-800">
                        Discover Premium Tea
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Experience the Finest Tea Selection from Our Plantations
                    </p>
                    <p className="mt-2 text-gray-500 max-w-3xl mx-auto">
                        Explore our exquisite collection of premium teas sourced directly from
                        the most renowned tea gardens. Each variety is carefully selected and
                        processed to deliver exceptional quality and flavor.
                    </p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 xl:gap-16 text-center">
                    {[
                        {
                            imageSrc: "/tea-leaf-icon.png",
                            title: "Explore Our Varieties",
                            description:
                                "Discover our diverse range of black, green, white, and herbal teas from premium estates.",
                        },
                        {
                            imageSrc: "/shipping-icon.png",
                            title: "Global Export Network",
                            description:
                                "We ship worldwide with temperature-controlled logistics to preserve freshness.",
                        },
                        {
                            imageSrc: "/quality-icon.png",
                            title: "Quality Assurance",
                            description:
                                "Every batch undergoes rigorous testing for purity, flavor, and aroma.",
                        },
                        {
                            imageSrc: "/partnership-icon.png",
                            title: "Become a Partner",
                            description:
                                "Join our network of distributors and bring premium tea to your market.",
                        },
                    ].map((card, index) => (
                        <motion.div key={index} variants={itemVariants}>
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
                      }: {
    imageSrc: string;
    title: string;
    description: string;
}) => (
    <div className="flex flex-col h-72 shadow-lg rounded-lg bg-primary-50 overflow-hidden">
        <div className="h-[40%] relative">
            <Image
                src={imageSrc}
                fill
                className="object-cover w-full h-full"
                alt={title}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
        </div>
        <div className="flex flex-col justify-between h-[60%] p-4 text-center">
            <h3 className="text-xl font-medium text-gray-800">{title}</h3>
            <p className="text-base text-gray-500">{description}</p>
        </div>
    </div>
);

export default DiscoverSection;