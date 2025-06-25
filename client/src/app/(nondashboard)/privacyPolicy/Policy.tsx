'use client';

import React from 'react';


const Policy = () => {

    const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <section className="py-16 bg-white">
            <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-green-800 mb-6">Terms and Conditions</h1>
                <p className="text-gray-600 mb-4">Last updated: {today}</p>
                <p className="text-gray-600 mb-8">
                    Please read these Terms and Conditions carefully before using our website.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Definitions</h2>
                <ul className="list-disc pl-6 mb-8 text-gray-600 space-y-2">
                    <li>
                        <strong>Company</strong> (referred to as &quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;) means Black Gold Africa Traders Ltd, P.O Box 42964 - 80100, Mombasa, Kenya.
                    </li>
                    <li>
                        <strong>Service</strong> refers to our website, accessible at{' '}
                        <a
                            href="https://www.bgatl.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500 underline hover:text-green-600"
                        >
                            www.bgatl.com
                        </a>.
                    </li>
                    <li>
                        <strong>You</strong> means the individual or entity using the Service.
                    </li>
                    <li>
                        <strong>Device</strong> means any device accessing the Service, such as a computer, cellphone, or tablet.
                    </li>
                </ul>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Acknowledgment</h2>
                <p className="text-gray-600 mb-8">
                    These Terms and Conditions govern your use of our Service. By accessing the Service, you agree to be bound by these Terms. If you disagree, you may not use the Service. You must be at least 18 years old to use the Service.
                </p>
                {/*<p className="text-gray-600 mb-8">*/}
                {/*    Your use of the Service is also subject to our{' '}*/}
                {/*    <a*/}
                {/*        href="/privacyPolicy"*/}
                {/*        target="_blank"*/}
                {/*        rel="noopener noreferrer"*/}
                {/*        className="text-green-500 underline hover:text-green-600"*/}
                {/*    >*/}
                {/*        Privacy Policy*/}
                {/*    </a>*/}
                {/*    , which outlines how we collect, use, and protect your personal information.*/}
                {/*</p>*/}

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Links to Other Websites</h2>
                <p className="text-gray-600 mb-8">
                    Our Service may link to third-party websites not controlled by us. We are not responsible for their content, privacy policies, or practices. Please review the terms and policies of any third-party sites you visit.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Termination</h2>
                <p className="text-gray-600 mb-8">
                    We may terminate or suspend your access to the Service at any time, without notice, for reasons including violation of these Terms. Upon termination, your right to use the Service will end immediately.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Limitation of Liability</h2>
                <p className="text-gray-600 mb-8">
                    To the maximum extent permitted by law, our liability for any damages related to the Service is limited to 100 USD or the amount you paid through the Service, if any. We are not liable for indirect, incidental, or consequential damages, including loss of profits or data, even if advised of the possibility.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">&quot;AS IS&quot; Disclaimer</h2>
                <p className="text-gray-600 mb-8">
                    The Service is provided &quot;AS IS&quot; without warranties of any kind, including merchantability, fitness for a particular purpose, or error-free operation. We do not guarantee the Service will meet your requirements or be uninterrupted.
                </p>


                <h2 className="text-2xl font-semibold text-green-800 mb-4">Governing Law</h2>
                <p className="text-gray-600 mb-8">
                    These Terms are governed by the laws of Kenya, excluding conflict of law rules. Your use of the Service may also be subject to other applicable laws.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Disputes Resolution</h2>
                <p className="text-gray-600 mb-8">
                    If you have a concern or dispute about the Service, please contact us to resolve it informally.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Changes to These Terms</h2>
                <p className="text-gray-600 mb-8">
                    We may update these Terms at our discretion. Material changes will be communicated with at least 30 days’ notice. By continuing to use the Service after updates, you agree to the revised Terms.
                </p>

                <h2 className="text-2xl font-semibold text-green-800 mb-4">Contact Us</h2>
                <p className="text-gray-600">
                    For questions about these Terms, contact us at{' '}
                    <a
                        href="mailto:blackgoldtrd@gmail.com"
                        className="text-green-500 underline hover:text-green-600"
                    >
                        blackgoldtrd@gmail.com
                    </a>.
                </p>
            </div>
        </section>
    );
};

export default Policy;