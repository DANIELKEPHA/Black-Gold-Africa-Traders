import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString();
}


export const formatBrokerName = (broker: string): string => {
    return broker.replace(/_/g, " ");
};

export function formatEnumString(str: string) {
    return str.replace(/([A-Z])/g, " $1").trim();
}

export function formatPriceValue(value: number | null, isMin: boolean) {
    if (value === null || value === 0)
        return isMin ? "Any Min Price" : "Any Max Price";
    if (value >= 1000) {
        const kValue = value / 1000;
        return isMin ? `$${kValue}k+` : `<$${kValue}k`;
    }
    return isMin ? `$${value}+` : `<$${value}`;
}

// Enhanced cleanParams to handle arrays, dates, and nested objects
export function cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "" || value === "any") {
            continue;
        }

        // Special handling for sellingPriceIds
        if (key === "sellingPriceIds") {
            let ids: number[] = [];
            if (typeof value === "string") {
                ids = value
                    .split(",")
                    .map((id) => parseInt(id.trim()))
                    .filter((id) => !isNaN(id) && id > 0);
            } else if (Array.isArray(value)) {
                ids = value
                    .map((id) => parseInt(id))
                    .filter((id) => !isNaN(id) && id > 0);
            }
            if (ids.length > 0) {
                cleaned[key] = ids.join(",");
            }
            continue;
        }

        if (Array.isArray(value)) {
            const filteredArray = value.filter((v) => v !== null && v !== undefined && v !== "");
            if (filteredArray.length > 0) {
                cleaned[key] = filteredArray;
            }
            continue;
        }

        if (value instanceof Date) {
            if (!isNaN(value.getTime())) {
                cleaned[key] = value.toISOString();
            }
            continue;
        } else if (
            typeof value === "string" &&
            !isNaN(Date.parse(value)) &&
            key.toLowerCase().includes("date")
        ) {
            cleaned[key] = new Date(value).toISOString();
            continue;
        }

        if (typeof value === "string" && !isNaN(Number(value)) && key !== "sellingPriceIds") {
            cleaned[key] = Number(value);
            continue;
        }

        if (typeof value === "object" && !(value instanceof Date)) {
            const nestedCleaned = cleanParams(value);
            if (Object.keys(nestedCleaned).length > 0) {
                cleaned[key] = nestedCleaned;
            }
            continue;
        }

        cleaned[key] = value;
    }

    return cleaned;
}

type MutationMessages = {
    success?: string;
    error: string;
};

export const withToast = async <T>(
    mutationFn: Promise<T>,
    messages: Partial<MutationMessages>
) => {
    const { success, error } = messages;

    try {
        const result = await mutationFn;
        if (success) toast.success(success);
        return result;
    } catch (err) {
        if (error) toast.error(error);
        throw err;
    }
};


// src/lib/utils.ts
export const createNewUserInDatabase = async (
    user: any,
    idToken: any,
    userRole: string,
    fetchWithBQ: any
) => {
    const createEndpoint = userRole?.toLowerCase() === 'admin' ? '/admin' : '/users/register';
    const isAdmin = userRole?.toLowerCase() === 'admin';
    const body = {
        ...(isAdmin ? { adminCognitoId: user.userId } : { userCognitoId: user.userId }),
        name: user.username || 'Unknown',
        email: idToken?.payload?.email || '',
        phoneNumber: idToken?.payload?.phone_number || 'N/A', // Use placeholder instead of empty string
    };

    console.log(
        `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Creating user at ${createEndpoint} with body:`,
        JSON.stringify(body, null, 4)
    );

    try {
        const createUserResponse = await fetchWithBQ({
            url: createEndpoint,
            method: 'POST',
            body,
        });

        if (createUserResponse.error) {
            if (createUserResponse.error.status === 409) {
                console.log(
                    `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] 409 Conflict, fetching existing user...`
                );
                const retryResponse = await fetchWithBQ({
                    url: `/${isAdmin ? 'admin' : 'users'}/${user.userId}`,
                    method: 'GET',
                    params: { includeShipments: true, includeFilterPresets: true },
                });

                if (retryResponse.data) {
                    console.log(
                        `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Found user after retry:`,
                        JSON.stringify(retryResponse.data, null, 4)
                    );
                    return retryResponse;
                }
                throw new Error(`Failed to fetch existing user: ${JSON.stringify(retryResponse.error)}`);
            }
            console.error(
                `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Create user error:`,
                createUserResponse.error
            );
            throw new Error(`Failed to create user: ${JSON.stringify(createUserResponse.error)}`);
        }

        if (!createUserResponse.data) {
            console.error(
                `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] No data in create user response:`,
                createUserResponse
            );
            throw new Error('No user data returned from API');
        }

        console.log(
            `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Created user response:`,
            JSON.stringify(createUserResponse.data, null, 4)
        );
        return createUserResponse;
    } catch (error) {
        console.error(
            `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Create user error:`,
            error
        );
        throw error;
    }
};
