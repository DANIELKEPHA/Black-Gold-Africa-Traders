"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const formFields = {
    forgotPassword: {
        username: {
            label: "Email",
            placeholder: "Enter your email address",
            isRequired: true,
        },
    },
};

export default function ResetPasswordPage() {
    const router = useRouter();
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);

    useEffect(() => {
        if (authStatus === "authenticated") {
            router.push("/"); // or wherever you want to redirect after login
        }
    }, [authStatus, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Authenticator
                initialState="forgotPassword"
                loginMechanisms={["email"]}
                formFields={formFields}
            />
        </div>
    );
}
