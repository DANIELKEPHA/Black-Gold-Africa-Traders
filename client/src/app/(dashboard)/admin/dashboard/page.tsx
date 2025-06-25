import React from 'react';
import { Leaf } from 'lucide-react';
import Link from "next/link"; // optional icon for a tea vibe

const ComingSoonPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="max-w-xl">
                <div className="flex items-center justify-center mb-6">
                    <Leaf className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    Coming Soon 🍃
                </h1>
                <p className="text-gray-600 text-lg">
                    Welcome to the <strong>Black Gold Africa Traders Limited</strong> Dashboard — this is where you will find real-time tea inventory, shipment tracking, and analytics.
                </p>
                <p className="mt-4 text-gray-500 italic">
                    Our developers are steeping the final touches — stay tuned for something refreshing.
                </p>
                <div className="mt-8">
                    <Link
                        href="/admin/catalog"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                    >
                        Go to Catalog
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ComingSoonPage;
