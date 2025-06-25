// lib/fetchBaseQueryWithAuth.ts
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession } from "aws-amplify/auth";

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const fetchBaseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
    const session = await fetchAuthSession({ forceRefresh: true });
    const token = session.tokens?.accessToken?.toString(); // Use access token for API auth


    console.log("Token used in API request:", token); // ← Add this line here

    const modifiedArgs = {
        ...args,
        headers: {
            ...args.headers,
            Authorization: token ? `Bearer ${token}` : "",
        },
    };

    return baseQuery(modifiedArgs, api, extraOptions);
};
