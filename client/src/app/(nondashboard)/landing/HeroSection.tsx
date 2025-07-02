"use client";

import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();


  return (
    <div className="relative h-screen">
      <Image
        src="/landing-splash.webp"
        alt="BlackGold Hero Section"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center w-full"
      >
        <div className="max-w-4xl mx-auto px-16 sm:px-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sourcing Nature&rsquo;s Finest, Authentic and Exceptional Teas
          </h1>
          <p className="text-xl text-white mb-8">
            We take pride in sourcing the finest teas directly from nature&rsquo;s most fertile gardens. Each leaf is carefully selected to deliver a pure, authentic, and exceptional experience in every cup. Our commitment to quality ensures that tea lovers around the world enjoy the rich flavors and timeless tradition of premium tea, just as nature intended.
          </p>

        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
