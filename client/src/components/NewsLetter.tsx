'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { useCreateContactMutation } from '@/state/api';
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Form validation schema
const formSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
    subject: z.string().max(200, 'Subject is too long').optional(),
    message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
    privacyConsent: z
        .boolean()
        .refine((val) => val === true, 'You must agree to the Privacy Policy'),
});

type FormData = z.infer<typeof formSchema>;

const contacts = [
    {
        country: 'Kenya',
        flag: '/kenya-flag.jpg',
        address: 'P.O Box 42964 - 80100, Mombasa',
        tel: '+254 722 239804',
        extra: '+254 719 110110',
    },
    {
        country: 'Dubai, UAE',
        flag: '/dubai-flag.jpg',
        address: 'Meydan F.Z Dubai, 6th Floor',
        tel: '+971 52 608 3663‬',
        extra: '',
    },
    {
        country: 'Tanzania',
        flag: '/tanzania-flag.jpg',
        address: 'P.O Box 20035, Dar es Salaam',
        tel: '+255 712 499859',
        extra: '',
    },
    {
        country: 'Pakistan',
        flag: '/pakistan-flag.jpg',
        address: 'Near Adam Mosque, Karachi',
        tel: '+92 343 0110501',
        extra: 'WhatsApp: +254 0113 786110',
    },
];

const NewsLetter = () => {
    const [createContact, { isLoading: isSubmitting }] = useCreateContactMutation();
    const [userInfo, setUserInfo] = useState<{
        userCognitoId: string | null;
        email: string | null;
    }>({ userCognitoId: null, email: null });

    // Fetch user session on mount
    useEffect(() => {
        const fetchUserSession = async () => {
            try {
                const session = await fetchAuthSession({ forceRefresh: true });
                const user = await getCurrentUser();
                const userCognitoId = user.userId;
                const email = session.tokens?.idToken?.payload?.email as string | undefined;

                console.log(
                    `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Fetched user session:`,
                    { userCognitoId, email }
                );

                setUserInfo({ userCognitoId, email: email || null });
            } catch (error) {
                console.log(
                    `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] No user session found, proceeding as anonymous`
                );
                setUserInfo({ userCognitoId: null, email: null });
            }
        };

        fetchUserSession();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: userInfo.email || '',
            subject: '',
            message: '',
            privacyConsent: false,
        },
    });

    // Update form email when userInfo changes
    useEffect(() => {
        if (userInfo.email) {
            setValue('email', userInfo.email);
        }
    }, [userInfo.email, setValue]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        try {
            await createContact({
                ...data,
                userCognitoId: userInfo.userCognitoId,
            }).unwrap();

            reset();
            toast.success('Message sent successfully!');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to send message. Please try again.');
            console.error(
                `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Form submission error:`,
                error
            );
        }
    };

    return (
        <div className="relative py-16 bg-green-800 overflow-hidden">
            <Toaster position="top-right" />
            <div className="absolute inset-0 bg-shape z-0 pointer-events-none"></div>

            <div className="relative z-10 max-w-screen-xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
                    {/* Contact Information */}
                    <div className="lg:w-5/12">
                        <div className="mb-6">
                            <h2 className="text-white text-3xl font-bold mb-3">Get in Touch</h2>
                            <p className="text-white opacity-75 text-lg">
                                Have questions about our premium tea products? Our team is ready to assist you with expert advice and personalized service. No sign-in required!
                            </p>
                        </div>

                        <div>
                            {contacts.map((contact, index) => (
                                <div key={index} className="flex items-start p-4 bg-green-900 rounded-lg mb-6">
                                    <Image
                                        src={contact.flag}
                                        alt={`${contact.country} flag`}
                                        width={40}
                                        height={30}
                                        style={{ width: '40px', height: 'auto' }}
                                        className="mr-4 rounded"
                                    />
                                    <div>
                                        <h5 className="text-white text-xl mb-1">{contact.country}</h5>
                                        <p className="text-white mb-1">{contact.address}</p>
                                        <p className="text-white opacity-75">{contact.tel}</p>
                                        {contact.extra && (
                                            <p className="text-white opacity-75">{contact.extra}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:w-6/12">
                        <div className="bg-white p-6 lg:p-8 rounded-lg shadow-lg">
                            <h3 className="text-green-800 text-2xl font-semibold mb-6">
                                Send us a Message
                            </h3>

                            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        {...register('name')}
                                        className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            errors.name ? 'border-red-500' : ''
                                        }`}
                                        aria-invalid={errors.name ? 'true' : 'false'}
                                        aria-describedby={errors.name ? 'name-error' : undefined}
                                    />
                                    {errors.name && (
                                        <p id="name-error" className="text-red-500 text-sm mt-1">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        {...register('email')}
                                        className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            errors.email ? 'border-red-500' : ''
                                        }`}
                                        aria-invalid={errors.email ? 'true' : 'false'}
                                        aria-describedby={errors.email ? 'email-error' : undefined}
                                    />
                                    {errors.email && (
                                        <p id="email-error" className="text-red-500 text-sm mt-1">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        {...register('subject')}
                                        className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            errors.subject ? 'border-red-500' : ''
                                        }`}
                                        aria-invalid={errors.subject ? 'true' : 'false'}
                                        aria-describedby={errors.subject ? 'subject-error' : undefined}
                                    />
                                    {errors.subject && (
                                        <p id="subject-error" className="text-red-500 text-sm mt-1">
                                            {errors.subject.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <textarea
                                        rows={5}
                                        placeholder="Type your message here..."
                                        {...register('message')}
                                        className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                                            errors.message ? 'border-red-500' : ''
                                        }`}
                                        aria-invalid={errors.message ? 'true' : 'false'}
                                        aria-describedby={errors.message ? 'message-error' : undefined}
                                    ></textarea>
                                    {errors.message && (
                                        <p id="message-error" className="text-red-500 text-sm mt-1">
                                            {errors.message.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-start text-gray-600">
                                        <input
                                            type="checkbox"
                                            {...register('privacyConsent')}
                                            className={`mt-1 h-5 w-5 mr-2 ${
                                                errors.privacyConsent ? 'border-red-500' : ''
                                            }`}
                                            aria-invalid={errors.privacyConsent ? 'true' : 'false'}
                                            aria-describedby={errors.privacyConsent ? 'privacy-error' : undefined}
                                        />
                                        <span>
                                            I agree to the{' '}
                                            <a
                                                href="/privacyPolicy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-500 underline"
                                            >
                                                Privacy Policy
                                            </a>{' '}
                                            and consent to data processing.
                                        </span>
                                    </label>
                                    {errors.privacyConsent && (
                                        <p id="privacy-error" className="text-red-500 text-sm mt-1">
                                            {errors.privacyConsent.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 transition duration-300 ${
                                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsLetter;
