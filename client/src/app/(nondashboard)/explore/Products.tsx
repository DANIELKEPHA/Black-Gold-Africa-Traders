"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import CTA from "@/components/CTA";

const Products = () => {
    const products = [
        {
            id: 1,
            name: "BP1 Tea",
            category: "Black Tea",
            description:
                "BP1 is a high-quality black tea grade from Kenya, known for its bold flavor, rich aroma, and bright liquor. It is part of Kenya's renowned CTC (Crush, Tear, Curl) tea production, making it ideal for commercial tea bags and blends.",
            image: "/bp1-tea.jpg",
            color: "bg-amber-100 text-amber-800 border-amber-800",
        },
        {
            id: 2,
            name: "Dust1 Tea",
            category: "Tea Dust",
            description:
                "Dust1 Tea is a premium fine-grade black tea known for its rich color, strong aroma, and robust flavor. With its fine, powdery texture, Dust1 brews quickly, delivering a deep, full-bodied cup that is perfect for those who love a strong tea experience.",
            image: "/dust1-tea.jpg",
            color: "bg-lime-100 text-lime-800 border-lime-800",
        },
        {
            id: 3,
            name: "PD Tea",
            category: "Premium Blend",
            description:
                "PD (Pekoe Dust) Tea is a high-quality black tea grade known for its slightly larger granules compared to Dust1. It brews into a rich, full-bodied cup with a deep color and a bold, brisk flavor. This makes it an excellent choice for those who enjoy a strong, energizing tea experience.",
            image: "/pd-tea.jpg",
            color: "bg-rose-100 text-rose-800 border-rose-800",
        },
        {
            id: 4,
            name: "PF1 Tea",
            category: "Specialty Tea",
            description:
                "PF1 (Pekoe Fannings 1) Tea is a premium black tea grade known for its well-balanced strength, bright color, and rich aroma. With slightly larger granules than Dust1 and PD, PF1 brews into a smooth, full-bodied cup with a brisk, refreshing taste.",
            image: "/pf1-tea.jpg",
            color: "bg-sky-100 text-sky-800 border-sky-800",
        },
    ];

    return (
        <div className="font-sans text-gray-800 leading-relaxed">
            {/* Hero Section */}
            <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden">
                <Image
                    src="/tea-field.jpg"
                    alt="Tea Field"
                    fill
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    priority
                    onError={(e) => {
                        e.currentTarget.src = "/tea-placeholder.jpg";
                        e.currentTarget.className = "absolute inset-0 w-full h-full object-contain p-4 bg-gray-100 z-0";
                    }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />
                <div className="relative z-20 container mx-auto px-5 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-5">Our Tea Portfolio</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        Discover our premium range of teas, carefully sourced and expertly blended to deliver exceptional quality and flavor.
                    </p>
                </div>
            </section>

            {/* Products Section */}
            <section className="bg-gray-50 py-16 md:py-20">
                <div className="container mx-auto px-5">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-semibold text-green-900 mb-3">
                            Tea and Extract Portfolio
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Explore our diverse range of tea products tailored for various applications and preferences.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="flex flex-col sm:flex-row bg-white rounded-lg shadow-md overflow-hidden"
                            >
                                <div className="sm:w-1/2 w-full h-60 relative">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = "/tea-placeholder.jpg";
                                            e.currentTarget.className = "w-full h-full object-contain p-4 bg-gray-100";
                                        }}
                                    />
                                </div>
                                <div className={`sm:w-1/2 w-full p-6 ${product.color}`}>
                                    <span className="uppercase text-xs font-bold tracking-wider">
                                        {product.category}
                                    </span>
                                    <h3 className="text-xl font-bold my-2">{product.name}</h3>
                                    <p className="text-gray-700 text-sm mb-4">{product.description}</p>
                                    <Link href="/tea">
                                        <span
                                            className={`inline-block mt-auto px-4 py-2 border-2 ${product.color.split(" ").pop()} font-semibold rounded hover:bg-opacity-90 transition-colors duration-300`}
                                        >
                                            Learn More
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <CTA />
        </div>
    );
};

export default Products;