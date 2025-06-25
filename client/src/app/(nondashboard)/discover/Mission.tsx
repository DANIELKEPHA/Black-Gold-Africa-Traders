import React from 'react';
import Image from 'next/image'; // Import the Image component

const Mission = () => {
    return (
        <div className="p-0 my-16">
            {/* Mission & Vision */}
            <section className="mb-16 grid md:grid-cols-2 gap-8 px-8">
                <div className="bg-green-800 text-white p-8 rounded-xl">
                    <h2 className="text-2xl font-semibold mb-4 border-b-2 border-white pb-2">Our Mission</h2>
                    <p className="text-lg leading-relaxed">
                        To deliver world-class Kenyan tea to global markets with excellence in quality, timely delivery, innovation, and sustainability, aiming to become the largest exporter of Kenyan tea worldwide.
                    </p>
                </div>
                <div className="bg-green-700 text-white p-8 rounded-xl">
                    <h2 className="text-2xl font-semibold mb-4 border-b-2 border-white pb-2">Our Vision</h2>
                    <p className="text-lg leading-relaxed">
                        To be the global leader in Kenyan tea exports by honoring heritage, prioritizing sustainability, promoting health, and expanding globally with innovative, impactful products.
                    </p>
                </div>
            </section>

            {/* Values */}
            <section className="mb-16 bg-green-50 p-8 rounded-xl px-8">
                <h2 className="text-2xl font-semibold text-green-700 mb-6 border-b-2 border-green-700 pb-2">Our Values</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-green-800 mb-2">Quality</h3>
                        <p>Every leaf carefully selected for exceptional taste and standards</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-green-800 mb-2">Sustainability</h3>
                        <p>Organic farming and eco-conscious production</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-green-800 mb-2">Community</h3>
                        <p>Supporting education, healthcare and fair trade</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-bold text-green-800 mb-2">Innovation</h3>
                        <p>Technology-driven packaging and global reach</p>
                    </div>
                </div>
            </section>

            {/* Achievements */}
            <section className="mb-16 px-8">
                <h2 className="text-2xl font-semibold text-green-700 mb-6 border-b-2 border-green-700 pb-2">Achievements</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-xl font-semibold text-green-700 mb-4">Awards</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <span className="bg-green-100 text-green-800 p-2 rounded-full mr-4">🏆</span>
                                <div>
                                    <h4 className="font-bold">Best Tea Exporter Award (2023)</h4>
                                    <p className="text-sm">Honored for product excellence and global impact</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-green-100 text-green-800 p-2 rounded-full mr-4">🌱</span>
                                <div>
                                    <h4 className="font-bold">Sustainability Excellence Award (2022)</h4>
                                    <p className="text-sm">Recognized for commitment to green practices</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-700 mb-4">Collaborations</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
                                <Image
                                    src="/eatta-logo.png"
                                    alt="EATTA"
                                    width={96} // Adjust based on your image dimensions
                                    height={48} // Adjust based on your image dimensions
                                    className="object-contain"
                                />
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center">
                                <Image
                                    src="/tea-board-kenya-logo.png"
                                    alt="Tea Board of Kenya"
                                    width={96} // Adjust based on your image dimensions
                                    height={48} // Adjust based on your image dimensions
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Mission;