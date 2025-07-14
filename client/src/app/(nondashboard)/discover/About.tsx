import React from 'react';
import Image from 'next/image'; // Import the Image component

const AboutPage = () => {
    return (
        <div className="bg-white text-gray-800 font-sans">
            {/* Hero Section */}
            <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/landing-splash.webp"
                        alt="Tea Field"
                        fill
                        className="object-cover"
                        priority // Optional: Prioritize loading for hero image
                    />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />
                <div className="relative z-20 container mx-auto px-5 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold mb-5">Black Gold Africa Traders Ltd</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        We source and export premium teas from lush highland plantations, partnering with trusted growers to deliver quality black, green, and specialty teas worldwide. Rooted in tradition and guided by innovation, our commitment to sustainability ensures every cup reflects the rich heritage and flavor of our origin.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;