'use client';

import React from 'react';

export default function OfflinePage() {
    return (
        <main className="flex h-screen items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">You&#39;re offline</h1>
                <p className="text-lg text-gray-500">
                    Please check your internet connection and try again.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 rounded bg-black text-white"
                >
                    Retry
                </button>
            </div>
        </main>
    );
}
