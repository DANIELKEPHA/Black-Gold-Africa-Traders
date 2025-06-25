import React from 'react'

const Cta = () => {
    return (
        <section className="bg-green-800 text-white py-16 md:py-20">
            <div className="container mx-auto px-5 text-center">
                <h2 className="text-3xl md:text-4xl font-semibold mb-5">Expert Tea Solutions</h2>
                <p className="text-lg max-w-3xl mx-auto mb-8">
                    Our team of tea experts works closely with clients to develop customized tea solutions that meet specific flavor profiles, functional requirements, and market demands.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button className="px-8 py-3 bg-white text-green-800 font-semibold rounded hover:bg-transparent hover:text-white border-2 border-white transition-colors duration-300">
                        Contact Our Team
                    </button>
                    <button disabled={true} className="px-8 py-3 bg-transparent text-white font-semibold rounded hover:bg-white hover:text-green-800 border-2 border-white transition-colors duration-300">
                        Download Brochure
                    </button>
                </div>
            </div>
        </section>
    )
}
export default Cta
