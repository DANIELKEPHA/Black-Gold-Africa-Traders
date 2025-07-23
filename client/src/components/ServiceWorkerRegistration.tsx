'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted install');
        } else {
            console.log('User declined install');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50 max-w-xs">
            <h3 className="font-bold mb-2">Install our app</h3>
            <p className="text-sm mb-3">Add BGATL to your home screen for faster access</p>
            <div className="flex gap-2">
                <button
                    onClick={installApp}
                    className="px-4 py-2 bg-black text-white rounded-md text-sm"
                >
                    Install
                </button>
                <button
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                >
                    Later
                </button>
            </div>
        </div>
    );
}