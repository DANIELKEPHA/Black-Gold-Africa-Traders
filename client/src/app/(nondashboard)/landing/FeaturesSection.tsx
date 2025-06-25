"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FeaturesSection = () => {
  return (
      <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="py-24 px-6 sm:px-8 lg:px-12 xl:px-16 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-center mb-12"
          >
            Recommended For You
          </motion.h2>

          {/* Only two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                imageSrc: "/landing-search1.png",
                title: "Products and Solutions",
                description:
                    "Experience the rich heritage of East African tea, where every leaf is carefully nurtured to bring you an unparalleled depth of flavor.",
                linkText: "Explore",
                linkHref: "/explore",
              },
              {
                imageSrc: "/landing-search3.png",
                title: "About Us",
                description: "Get to know Black Gold Africa Traders Ltd.",
                linkText: "Discover",
                linkHref: "/discover",
              },
            ].map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <FeatureCard {...item} />
                </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
  );
};

const FeatureCard = ({
                       imageSrc,
                       title,
                       description,
                       linkText,
                       linkHref,
                     }: {
  imageSrc: string;
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
}) => (
    <div className="text-center">
      <div className="rounded-lg mb-4 flex items-center justify-center h-64 overflow-hidden">
        <Image
            src={imageSrc}
            width={400}
            height={400}
            className="w-full h-full object-cover"
            alt={title}
        />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="mb-4">{description}</p>
      <Link
          href={linkHref}
          className="inline-block border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
          scroll={false}
      >
        {linkText}
      </Link>
    </div>
);

export default FeaturesSection;
