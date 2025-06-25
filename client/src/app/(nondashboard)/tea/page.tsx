"use client";

import React from "react";
import FooterSection from "@/app/(nondashboard)/landing/FooterSection";
import NewsLetter from "@/components/NewsLetter";
import TeaCard from "@/app/(nondashboard)/tea/TeaCard";
import CTA from "@/components/CTA";
import BreadCrumb from "@/components/BreadCrumb";

const SearchPage = () => {
    return (
        <div className="w-full min-h-screen flex flex-col bg-white">
            <main className="flex flex-col flex-1">
                <BreadCrumb
                    items={[
                        { label: 'Black Gold Africa', href: '/' },
                        { label: 'Products & Solution', href: '/explore' },
                        { label: 'Overview' }
                    ]}
                />
                <TeaCard />
                <CTA/>
                <NewsLetter/>
                <FooterSection />
            </main>
        </div>
    );
};

export default SearchPage;
