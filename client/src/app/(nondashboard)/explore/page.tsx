"use client";

import React from "react";
import Products from "@/app/(nondashboard)/explore/Products";
import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import NewsLetter from "@/components/NewsLetter";

const SearchPage = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-white">
            <main className="flex flex-col flex-1">
                <Products />
                <NewsLetter/>
                <FooterSection />
            </main>
        </div>
    );
};

export default SearchPage;
