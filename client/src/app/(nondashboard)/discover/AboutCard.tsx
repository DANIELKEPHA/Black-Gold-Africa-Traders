import React from 'react';
import Image from 'next/image'; // Import Image component from next/image

const teas = [
    {
        name: 'Company Overview',
        bgColor: 'bg-green-500',
        description: (
            <>
                <p className="text-lg leading-relaxed">
                    Black Gold Africa Traders Ltd. was founded by <strong className="text-green-800">Inayat Ali</strong>, a tea visionary with a mission to showcase the exceptional quality of Kenyan tea on the global stage. With years of hands-on experience in the industry, Inayat recognized Kenya’s unique potential as one of the world’s leading tea producers, known for its vibrant, full-bodied teas with unmatched flavor and health benefits.
                </p>
                <p className="text-lg leading-relaxed">
                    Black Gold Africa Traders specializes in exporting premium teas sourced from Kenyas renowned tea-growing regions. The company collaborates closely with key industry partners, including the East African Tea Trade Association (EATTA), the Tea Board of Kenya, and regional factories representing farmers and other stakeholders. As global demand for high-quality Kenyan tea grew, Black Gold Traders steadily emerged as a prominent player in the export market. Their unwavering commitment to delivering exceptional teas while promoting wellness is reflected in their dedication to organic practices, ensuring that every cup offers both a rich flavor and health-conscious benefits.
                </p>
            </>
        ),
        image: '/image1.png',
    },
    {
        name: 'Our Journey',
        bgColor: 'bg-yellow-500',
        description: (
            <>
                <p className="mb-4 text-lg leading-relaxed">
                    Black Gold Africa Traders stays ahead of market trends by embracing innovation and technology. With a state-of-the-art lab ensuring quality and safety, and advanced packaging and digital solutions enhancing efficiency, the company sets new standards in the tea industry.
                </p>
                <p className="text-lg leading-relaxed">
                    From the start, Black Gold Africa Traders has stood out for its commitment to community empowerment—supporting education, healthcare, and sustainable farming. This holistic approach uplifts local communities, preserves the environment, and strengthens the tea industrys foundation.
                </p>
                <p className="text-lg leading-relaxed">
                   We are a leading exporter of Kenyan tea, known globally for its commitment to quality, innovation, and social responsibility. As demand for natural and organic products grows, the company remains dedicated to delivering health-boosting teas rooted in respect for the land, farmers, and communities behind every leaf.
                </p>
            </>
        ),
        image: '/image2.png',
    },
    {
        name: 'Leadership',
        bgColor: 'bg-orange-500',
        description: (
            <>
                <p className="text-green-700 font-medium mb-4">Founder & Managing Director</p>
                <p className="mb-4 text-lg leading-relaxed">
                    Mr.Inayat Ali’s professional journey in the tea industry began in the fields of Kenya, where he learned firsthand about the intricacies of tea testing and blending and sourcing and the art of producing high-quality tea.
                </p>
                <p className="text-lg leading-relaxed">
                    Through dedication and innovation, he grew Black Gold Traders into a globally recognized brand. Mr. Inayats expertise lies in tea sourcing, international trade, and establishing strong partnerships that benefit both the company and the Tea stake Holders at large.
                </p>
            </>
        ),
        image: '/image3.png',
    },

];

const AboutCard = () => {
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
                        <div className="lg:w-1/2 w-full relative">
                            <Image
                                src={tea.image}
                                alt={tea.name}
                                width={600} // Specify width (adjust based on your design)
                                height={600} // Specify height (adjust based on your design)
                                className="w-full h-full max-h-[600px] object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = '/tea-placeholder.jpg';
                                }}
                                priority={index === 0} // Optional: Prioritize loading for the first image
                            />
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default AboutCard;