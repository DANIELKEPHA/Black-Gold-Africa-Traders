"use client";

import React, { useEffect } from "react";
import { Amplify } from "aws-amplify";
import {
    Authenticator,
    Heading,
    Radio,
    RadioGroupField,
    useAuthenticator,
    View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter, usePathname } from "next/navigation";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID!,
        },
    },
});

const components = {
    Header() {
        return (
            <View className="mt-4 mb-7">
                <Heading level={3} className="!text-2xl !font-bold">
                    Black Gold
                    <span className="text-secondary-500 font-light hover:!text-primary-300">
                         Africa Traders
                    </span>
                </Heading>
                <p className="text-muted-foreground mt-2">
                    <span className="font-bold">Welcome!</span> Please sign in to continue
                </p>
            </View>
        );
    },
    SignIn: {
        Footer() {
            const { toSignUp } = useAuthenticator();
            const router = useRouter();

            return (
                <View className="text-center mt-4 space-y-2">
                    <p className="text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <button
                            onClick={toSignUp}
                            className="text-primary hover:underline bg-transparent border-none p-0"
                        >
                            Sign up here
                        </button>
                    </p>
                    <p>
                        <button
                            onClick={() => router.push("/reset-password")}
                            className="text-sm text-muted-foreground hover:underline"
                        >
                            Forgot your password?
                        </button>
                    </p>
                </View>
            );
        },
    },

    SignUp: {
        FormFields() {
            const { validationErrors } = useAuthenticator();

            return (
                <>
                    <Authenticator.SignUp.FormFields />
                    <RadioGroupField
                        legend="Terms & Conditions"
                        name="custom:role"
                        errorMessage={validationErrors?.["custom:role"]}
                        hasError={!!validationErrors?.["custom:role"]}
                        isRequired
                    >
                        <Radio value="user"> Agree & Proceed</Radio>
                    </RadioGroupField>
                </>
            );
        },
        Footer() {
            const { toSignIn } = useAuthenticator();
            return (
                <View className="text-center mt-4">
                    <p className="text-muted-foreground">
                        Already have an account?{" "}
                        <button
                            onClick={toSignIn}
                            className="text-primary hover:underline bg-transparent border-none p-0"
                        >
                            Sign in
                        </button>
                    </p>
                </View>
            );
        },
    },
};

const formFields = {
    signIn: {
        username: {
            placeholder: "Enter your email",
            label: "Email",
            isRequired: true,
        },
        password: {
            placeholder: "Enter your password",
            label: "Password",
            isRequired: true,
        },
    },
    signUp: {
        username: {
            order: 1,
            placeholder: "Choose a username",
            label: "Username",
            isRequired: true,
        },
        email: {
            order: 2,
            placeholder: "Enter your email address",
            label: "Email",
            isRequired: true,
        },
        phone_number: {
            order: 3,
            placeholder: "Enter your phone number (e.g., +254...)",
            label: "Phone Number",
            isRequired: true,
            dialCode: "+254",
        },
        password: {
            order: 4,
            placeholder: "Create a password",
            label: "Password",
            isRequired: true,
        },
        confirm_password: {
            order: 5,
            placeholder: "Confirm your password",
            label: "Confirm Password",
            isRequired: true,
        },
    },
    forgotPassword: {
        username: {
            label: "Email",
            placeholder: "Enter your email address",
            isRequired: true,
        },
    },
};


const Auth = ({ children }: { children: React.ReactNode }) => {
    const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
    const router = useRouter();
    const pathname = usePathname();

    const isAuthPage = pathname.match(/^\/(signin|signup)$/);
    const isDashboardPage = pathname.startsWith("/admin") || pathname.startsWith("/user");

    useEffect(() => {
        if (user && isAuthPage) {
            router.push("/");
        }
    }, [user, isAuthPage, router]);

    if (authStatus === "configuring") {
        return <div className="text-center py-10">Loading authentication...</div>;
    }

    if (!isAuthPage && !isDashboardPage) {
        return <>{children}</>;
    }

    return (
        <div className="h-full">
            <Authenticator
                initialState={pathname.includes("signup") ? "signUp" : "signIn"}
                components={components}
                formFields={formFields}
            >
                {() => <>{children}</>}
            </Authenticator>
        </div>
    );
};

export default Auth;
