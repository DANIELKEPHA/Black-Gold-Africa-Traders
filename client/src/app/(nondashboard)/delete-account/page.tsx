"use client";

import { useState } from "react";

export default function DeleteAccountPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        // Open default mail client
        const subject = encodeURIComponent("Delete my account");
        const body = encodeURIComponent(
            `Hello BGATL team,\n\nPlease delete my account and all associated data.\n\nAccount email: ${email}\n\nThank you.`
        );
        window.location.href = `mailto:info@bgatld.com?subject=${subject}&body=${body}`;

        setSubmitted(true);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Request Account & Data Deletion</h1>
                <p className="text-gray-700 mb-6">
                    We respect your privacy. To delete your account and all associated data, please enter your email below and submit a request.
                </p>

                {submitted ? (
                    <div className="text-center text-green-600 font-semibold">
                        Your request has been prepared. Please complete it in your email client.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="font-medium text-gray-700">Your Account Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
                        >
                            Submit Request
                        </button>
                    </form>
                )}

                <p className="mt-6 text-gray-500 text-sm">
                    Once submitted, we will process your deletion request within 30 days. This action is permanent and cannot be undone.
                </p>
            </div>
        </div>
    );
}
