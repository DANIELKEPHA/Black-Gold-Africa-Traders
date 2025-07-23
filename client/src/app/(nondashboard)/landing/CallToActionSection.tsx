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
                src="/Tea.jpg"
                alt="Tea plantation aerial view"
                fill
                className="absolute inset-0 -z-10 h-full w-full object-cover"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-gray-900/20" />

            {/* Content container */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="mx-auto max-w-7xl px-6 lg:px-8"
            >
                <div className="mx-auto max-w-2xl lg:max-w-none">
                    <div className="text-center">
                        <motion.h2
                            initial={{ y: 40, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{
                                duration: 0.8,
                                ease: "backOut",
                                delay: 0.2
                            }}
                            viewport={{ once: true }}
                            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
                        >
                            Direct from East Africa&#39;s Finest Tea Gardens
                        </motion.h2>
                        <motion.p
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{
                                duration: 0.6,
                                ease: "easeOut",
                                delay: 0.4
                            }}
                            viewport={{ once: true }}
                            className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300"
                        >
                            Our single-origin teas are ethically sourced from family-owned estates in Kenya, Rwanda, and Tanzania, featuring unique terroir characteristics.
                        </motion.p>
                    </div>

                    {/* Stats grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ staggerChildren: 0.1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="mt-16 grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-3"
                    >
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
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            duration: 0.6,
                                            ease: "easeOut"
                                        }
                                    }
                                }}
                                className="flex flex-col-reverse gap-y-4 rounded-2xl bg-white/5 p-6 sm:p-8 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                            >
                                <p className="text-base leading-7 text-gray-300">{stat.description}</p>
                                <div className="flex items-baseline justify-between gap-x-2">
                                    <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
                                    <p className="text-sm font-semibold leading-6 text-emerald-400">{stat.name}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA buttons */}
                    {/*<motion.div*/}
                    {/*    initial={{ opacity: 0 }}*/}
                    {/*    whileInView={{ opacity: 1 }}*/}
                    {/*    transition={{ staggerChildren: 0.1 }}*/}
                    {/*    viewport={{ once: true }}*/}
                    {/*    className="mt-16 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"*/}
                    {/*>*/}
                    {/*    <motion.div*/}
                    {/*        variants={{*/}
                    {/*            hidden: { opacity: 0, x: -40 },*/}
                    {/*            visible: {*/}
                    {/*                opacity: 1,*/}
                    {/*                x: 0,*/}
                    {/*                transition: {*/}
                    {/*                    duration: 0.6,*/}
                    {/*                    ease: "backOut",*/}
                    {/*                    delay: 0.4*/}
                    {/*                }*/}
                    {/*            }*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        <Link*/}
                    {/*            href="/explore"*/}
                    {/*            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all duration-200 hover:shadow-emerald-500/20 hover:-translate-y-0.5"*/}
                    {/*        >*/}
                    {/*            Explore Our Tea Catalog*/}
                    {/*            <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span>*/}
                    {/*        </Link>*/}
                    {/*    </motion.div>*/}
                    {/*    <motion.div*/}
                    {/*        variants={{*/}
                    {/*            hidden: { opacity: 0, x: 40 },*/}
                    {/*            visible: {*/}
                    {/*                opacity: 1,*/}
                    {/*                x: 0,*/}
                    {/*                transition: {*/}
                    {/*                    duration: 0.6,*/}
                    {/*                    ease: "backOut",*/}
                    {/*                    delay: 0.4*/}
                    {/*                }*/}
                    {/*            }*/}
                    {/*        }}*/}
                    {/*    >*/}
                    {/*        <Link*/}
                    {/*            href="/contact"*/}
                    {/*            className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-900 shadow-lg hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-200 hover:shadow-white/20 hover:-translate-y-0.5"*/}
                    {/*        >*/}
                    {/*            Request Wholesale Pricing*/}
                    {/*            <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">↗</span>*/}
                    {/*        </Link>*/}
                    {/*    </motion.div>*/}
                    {/*</motion.div>*/}
                </div>
            </motion.div>
        </section>
    );
};

export default CallToActionSection;