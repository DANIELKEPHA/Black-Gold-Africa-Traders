"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const CallToActionSection = () => {
    return (
        <section className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
            {/* Background with gradient overlay */}
            <Image
                src="/Tea.jpg" // Updated to use correct path
                alt="Tea plantation aerial view"
                fill
                className="absolute inset-0 -z-10 h-full w-full object-cover"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/60 to-gray-900/30" />

            {/* Content container */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="mx-auto max-w-7xl px-6 lg:px-8"
            >
                <div className="mx-auto max-w-2xl lg:max-w-none">
                    <div className="text-center">
                        <motion.h2
                            initial={{ y: 20 }}
                            whileInView={{ y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
                        >
                            Direct from East Africa&#39;s Finest Tea Gardens
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20 }}
                            whileInView={{ y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300"
                        >
                            Our single-origin teas are ethically sourced from family-owned estates in Kenya, Rwanda, and Tanzania, featuring unique terroir characteristics.
                        </motion.p>
                    </div>

                    {/* Stats grid */}
                    <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                        {[
                            {
                                name: "Tea Varieties",
                                value: "20+",
                                description: "Including rare purple tea and orthodox-processed black teas"
                            },
                            {
                                name: "Export Countries",
                                value: "45+",
                                description: "Shipped with climate-controlled logistics"
                            },
                            {
                                name: "Years Experience",
                                value: "5+",
                                description: "In premium tea cultivation and export"
                            }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.1 }}
                                className="flex flex-col-reverse gap-y-4 rounded-2xl bg-white/5 p-8 backdrop-blur-sm"
                            >
                                <p className="text-base leading-7 text-gray-300">{stat.description}</p>
                                <div className="flex items-baseline justify-between gap-x-2">
                                    <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                                    <p className="text-sm font-semibold leading-6 text-emerald-400">{stat.name}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className="mt-16 flex flex-col sm:flex-row justify-center gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link
                                href="/explore"
                                className="rounded-md bg-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200"
                            >
                                Explore Our Tea Catalog
                                <span aria-hidden="true" className="ml-2">→</span>
                            </Link>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Link
                                href="/contact"
                                className="rounded-md bg-white px-6 py-4 text-lg font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200"
                            >
                                Request Wholesale Pricing
                                <span aria-hidden="true" className="ml-2">↗</span>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default CallToActionSection;