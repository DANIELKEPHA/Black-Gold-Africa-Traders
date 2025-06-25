"use client";

import React, { useState } from 'react';
import Image from 'next/image'; // Next.js optimized Image component

const teas = [
    {
        name: 'BP1 Tea',
        bgColor: 'bg-green-600',
        description: (
            <>
                <p className="text-white">
                    BP1 (Broken Pekoe 1) is a premium black tea grade known for its large, twisted leaf particles and bright liquor. Unlike
                    the finer grades, BP1 delivers a mellow, full-flavored cup with moderate strength and a fragrant aroma, ideal for
                    those who prefer a smooth, less astringent tea.
                </p>
                <p className="text-white">
                    This grade is highly sought after in specialty markets across Europe and the Middle East, where nuanced flavor
                    and aroma are appreciated. BP1 performs beautifully in loose-leaf offerings and higher-end blends.
                </p>
                <p className="text-white">
                    Carefully plucked from Kenya’s finest tea gardens, BP1 showcases the balance between bold flavor and refined drinking
                    experience, making it a distinguished choice for tea connoisseurs.
                </p>
            </>
        ),
        image: '/image2.png',
    },
    {
        name: 'Dust1 Tea',
        bgColor: 'bg-yellow-500',
        description: (
            <>
                <p className="text-white">
                    Dust1 is one of the finest particle-size grades produced in the CTC (Crush, Tear, Curl) process. It is highly prized for
                    its exceptionally strong flavor, briskness, and quick infusion. Dust1 offers a bold, full-bodied cup with deep color,
                    making it perfect for strong tea lovers and tea bags.
                </p>
                <p className="text-white">
                    Popular in markets like India, Egypt, and Pakistan, Dust1 is a favorite base for masala chai and other spiced teas
                    where intensity and quick brewing are critical. It provides a robust caffeine kick and rich aroma even in small quantities.
                </p>
                <p className="text-white">
                    Harvested from Kenya’s high-altitude tea estates, Dust1 captures the spirit of East African black teas—strength, vibrancy,
                    and a distinctive earthy character.
                </p>
            </>
        ),
        image: '/image1.png',
    },
    {
        name: 'PD Tea',
        bgColor: 'bg-blue-500',
        description: (
            <>
                <p className="text-white">
                    PD (Pekoe Dust) is a fine CTC tea grade renowned for its briskness, bright liquor, and strong character. Finer than PF1
                    but coarser than Dust1, PD brews quickly and produces a bold, satisfying cup — perfect for fast-paced consumption and
                    blending into spiced or flavored teas.
                </p>
                <p className="text-white">
                    Highly favored in African and South Asian markets, PD’s balance of strength and flavor makes it a staple in
                    both traditional tea culture and mass-market tea bags.
                </p>
                <p className="text-white">
                    Sourced from Kenya’s fertile highlands, PD captures the rich soils and unique climate conditions, delivering an
                    invigorating black tea with a slightly sweet aftertaste.
                </p>
            </>
        ),
        image: '/image3.png',
    },
    {
        name: 'PF1 Tea',
        bgColor: 'bg-red-500',
        description: (
            <>
                <p className="text-white">
                    PF1 (Pekoe Fannings 1) is one of Kenya’s most popular CTC black tea grades, recognized for its well-balanced
                    profile, bright cup color, and smooth drinking experience. Slightly larger than PD and Dust1, PF1 combines briskness
                    and subtle aroma to deliver a premium yet accessible tea.
                </p>
                <p className="text-white">
                    Widely used in both loose-leaf blends and high-quality tea bags, PF1 is known for its quick brew time and clean finish.
                    It is a favorite in markets across Africa, the Middle East, and Asia due to its refreshing character and adaptability to
                    various flavor profiles, including chai and flavored teas.
                </p>
                <p className="text-white">
                    Grown in Kenya’s elevated tea zones and harvested from top-grade Camellia sinensis plants, PF1 maintains a bright
                    golden infusion and a mild, slightly sweet flavor that suits both standalone enjoyment and blending with herbs, spices,
                    or milk.
                </p>
            </>
        ),
        image: '/image4.png',
    },
];

const TeaCard = () => {
    return (
        <div className="text-gray-800 font-sans">
            <section className="w-full">
                {teas.map((tea, index) => (
                    <div
                        key={index}
                        className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} w-full ${tea.bgColor}`}
                    >
                        {/* Content */}
                        <div className="lg:w-1/2 w-full">
                            <div className="container mx-auto px-6 py-16 lg:py-24 max-w-2xl">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{tea.name}</h2>
                                <div className="text-lg leading-relaxed space-y-4">
                                    {tea.description}
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="lg:w-1/2 w-full relative h-[400px] lg:h-auto">
                            <Image
                                src={tea.image}
                                alt={tea.name}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default TeaCard;
