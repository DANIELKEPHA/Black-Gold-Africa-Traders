import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
import {User, Admin, Contact} from "@/types/prismaTypes";
import { FetchArgs, BaseQueryFn, FetchBaseQueryError, TagDescription } from "@reduxjs/toolkit/query";
import {
    AuthUserResponse,
    GetLoggedInUsersParams,
    GetLoggedInUsersResponse,
    GetUserParams,
    GetUserResponse
} from "@/state/user";
import {
    FiltersState,
    FilterOptions,
    SellingPriceResponse,
    OutlotResponse,
    CatalogResponse,
    OutLotsResponse
} from "@/state/index";
import { CatalogFormData } from "@/lib/schemas";
import {
    BulkAssignStocksInput,
    BulkAssignStocksResponse,
    Stock,
    StockFilters,
    StockHistoryResponse,
    StockResponse,
    UpdateStockInput
} from "@/state/stock";
import {Broker, ShipmentStatus, TeaGrade} from "@/state/enums";
import {Shipment} from "@/state/shipment";

// Configure base query with API base URL
const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
});

// Custom baseQuery that attaches Cognito token
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const headers = new Headers();
    try {
        const session = await fetchAuthSession({ forceRefresh: true });
        const token = session.tokens?.idToken?.toString();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
            // // console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ✅ Attached token to headers`);
        } else {
            // // console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ⚠️ No ID token found in session`);
        }
    } catch (error) {
        // // console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ❌ Failed to fetch Cognito session:`, error);
    }

    const modifiedArgs = typeof args === "string"
        ? { url: args, headers }
        : {
            ...args,
            headers: {
                ...Object.fromEntries(headers.entries()),
                ...args.headers,
            },
        };

    const result = await rawBaseQuery(modifiedArgs, api, extraOptions);
    // console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Raw API Response:`, result);
    return result;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithAuth,
    tagTypes: [
        "Admin",
        "Users",
        "Catalog",
        "SellingPrices",
        "OutLots",
        "Favorites",
        "Shipments",
        "Stocks",
        "FilterPresets",
        "ShipmentHistory",
        'Contacts',
    ],
    endpoints: (builder) => ({
        // Existing Endpoints (Unchanged)
        getAuthUser: builder.query<AuthUserResponse, void>({
            queryFn: async (_, _queryApi, _extraOptions, fetchWithBQ) => {
                try {
                    const session = await fetchAuthSession();
                    const { idToken } = session.tokens ?? {};
                    if (!idToken) {
                        throw new Error('No ID token found in session');
                    }

                    const user = await getCurrentUser();
                    const rawRole = idToken?.payload?.['custom:role'];
                    const userRole = typeof rawRole === 'string' ? rawRole.toLowerCase() : 'user';

                    // // console.log(
                    // //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Cognito session:`,
                    // //     JSON.stringify({ userId: user.userId, role: userRole }, null, 4)
                    // // );

                    const endpoint = userRole === 'admin' ? `/admin/${user.userId}` : `/users/${user.userId}`;
                    let userDetailsResponse = await fetchWithBQ({
                        url: endpoint,
                        params: { includeShipments: true, includeAssignedStocks: true, includeFavoritedStocks: true },
                    });

                    // // console.log(
                    // //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] getAuthUser API Response:`,
                    // //     JSON.stringify(userDetailsResponse, null, 4)
                    // // );

                    if (userDetailsResponse.error) {
                        if (userDetailsResponse.error.status === 404) {
                            // console.log(
                            //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] User not found, creating new user...`
                            // );
                            userDetailsResponse = await createNewUserInDatabase(user, idToken, userRole, fetchWithBQ);
                        } else {
                            throw new Error(`API error: ${JSON.stringify(userDetailsResponse.error)}`);
                        }
                    }

                    if (!userDetailsResponse.data) {
                        throw new Error('No user data returned from API');
                    }

                    return {
                        data: {
                            cognitoInfo: {
                                signInDetails: user.signInDetails as { loginId: string },
                                username: user.username,
                                userId: user.userId,
                            },
                            userInfo: userDetailsResponse.data as User | Admin,
                            userRole,
                        },
                    };

                } catch (error: any) {
                    // console.error(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] getAuthUser error:`,
                    //     error
                    // );
                    return {
                        error: {
                            status: 'CUSTOM_ERROR',
                            error: error.message || 'Could not fetch user data',
                        },
                    };
                }
            },
            providesTags: ["Users", "Admin"],
        }),
        getAdminById: builder.query<Admin, string>({
            query: (adminCognitoId) => ({
                url: `/admin/${adminCognitoId}`,
                params: { includeShipments: true, includeFilterPresets: true },
            }),
            providesTags: ["Admin"],
        }),

        //users endpoints
        getLoggedInUsers: builder.query<GetLoggedInUsersResponse, GetLoggedInUsersParams>({
            query: ({ page, limit, search, includeShipments, includeFavoritedStocks, includeAssignedStocks }) => ({
                url: "/users/logged-in",
                params: cleanParams({
                    page,
                    limit,
                    search,
                    includeShipments,
                    includeFavoritedStocks,
                    includeAssignedStocks,
                }),
            }),
            providesTags: (result, error) => {
                if (error || !result || !result.data || !Array.isArray(result.data.data)) {
                    return [{ type: "Users", id: "LIST" }];
                }
                return [
                    ...result.data.data
                        .filter((item) => item?.userCognitoId)
                        .map((item) => ({
                            type: "Users" as const,
                            id: item.userCognitoId,
                        })),
                    { type: "Users", id: "LIST" },
                ];
            },
        }),
        getUserById: builder.query<GetUserResponse, GetUserParams>({
            query: ({ userCognitoId, includeShipments, includeAssignedStocks }) => ({
                url: `/users/${userCognitoId}`,
                params: cleanParams({
                    includeShipments,
                    includeAssignedStocks,
                }),
            }),
            providesTags: (result, error, { userCognitoId }) => [
                { type: "Users", id: userCognitoId },
            ],
        }),
        createUser: builder.mutation<User, Partial<User>>({
            query: (user) => ({
                url: "/users/register",
                method: "POST",
                body: user,
            }),
            invalidatesTags: ["Users"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "User created successfully!",
                    error: "Failed to create user.",
                });
            },
        }),
        updateUser: builder.mutation<User, { userCognitoId: string } & Partial<User>>({
            query: ({ userCognitoId, ...updatedUser }) => ({
                url: `/users/${userCognitoId}`,
                method: "PUT",
                body: updatedUser,
            }),
            invalidatesTags: (result) => [{ type: "Users", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Settings updated successfully!",
                    error: "Failed to update settings.",
                });
            },
        }),

        createAdminSettings: builder.mutation<Admin, Partial<Admin>>({
            query: (admin) => ({
                url: "/admin",
                method: "POST",
                body: admin,
            }),
            invalidatesTags: ["Admin"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Admin created successfully!",
                    error: "Failed to create admin.",
                });
            },
        }),
        updateAdminSettings: builder.mutation<Admin, { adminCognitoId: string } & Partial<Admin>>({
            query: ({ adminCognitoId, ...updatedAdmin }) => ({
                url: `/admin/${adminCognitoId}`,
                method: "PUT",
                body: updatedAdmin,
            }),
            invalidatesTags: (result) => [{ type: "Admin", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Admin settings updated successfully!",
                    error: "Failed to update admin settings.",
                });
            },
        }),
        getUser: builder.query<User, string>({
            query: (userCognitoId) => ({
                url: `/users/${userCognitoId}`,
                params: { includeShipments: true, includeFilterPresets: true },
            }),
            providesTags: ["Users"],
        }),

        // Catalog Endpoints
        getCatalog: builder.query<{ data: CatalogResponse[]; meta: { page: number; limit: number; total: number; totalPages: number } }, Partial<FiltersState> & { page?: number; limit?: number }>({
            query: (filters) => {
                // // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalog raw filters:`, filters);
                const cleanedFilters = cleanParams({
                    lotNo: filters.lotNo,
                    sellingMark: filters.sellingMark,
                    grade: filters.grade,
                    invoiceNo: filters.invoiceNo,
                    saleCode: filters.saleCode,
                    category: filters.category,
                    reprint: filters.reprint,
                    bags: filters.bags,
                    netWeight: filters.netWeight,
                    totalWeight: filters.totalWeight,
                    askingPrice: filters.askingPrice,
                    producerCountry: filters.producerCountry,
                    manufactureDate: filters.manufactureDate,
                    broker: filters.broker,
                    search: filters.search,
                    page: filters.page || 1,
                    limit: filters.limit || 100,
                });
                // // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalog query params:`, cleanedFilters);
                return {
                    url: "/catalogs",
                    params: cleanedFilters,
                    headers: { 'Cache-Control': 'no-cache' }
                };
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "Catalog" as const, id })),
                        { type: "Catalog" as const, id: "LIST" },
                    ]
                    : [{ type: "Catalog" as const, id: "LIST" }],
            async onQueryStarted(filters, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalog response:`, {
                    // //     total: data.meta.total,
                    // //     returned: data.data.length,
                    // //     reprintValues: data.data.map(c => c.reprint)
                    // // });
                } catch (error: any) {
                    // console.error(`[${ MANY LINES
                    //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalog error:`, {
                    //         status: error?.error?.status,
                    //         message: error?.error?.data?.message,
                    //         details: error?.error?.data?.details,
                    //         params: filters,
                    //     });
                }
            },
        }),

        getCatalogById: builder.query<CatalogResponse, number>({
            query: (id) => `/catalogs/${id}`,
            providesTags: (result, error, id): TagDescription<"Catalog">[] => [{ type: "Catalog", id }],
        }),
        getCatalogByLotNo: builder.query<CatalogResponse, string>({
            query: (lotNo) => `/catalogs/lot/${lotNo}`,
            providesTags: (result, error, lotNo): TagDescription<"Catalog">[] => [
                { type: "Catalog", id: result?.id || lotNo },
            ],
        }),
        getCatalogFilterOptions: builder.query<FilterOptions, void>({
            query: () => "/catalogs/filters",
            providesTags: ["Catalog"],
        }),
        createCatalogFromCsv: builder.mutation<{
            count: any;
            success: { created: number; skipped: number; replaced: number };
            errors: { row: number; message: string }[]
        }, { file: File; duplicateAction?: 'skip' | 'replace' }>({
            query: ({ file, duplicateAction }) => {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                if (!(file instanceof File)) {
                    // console.error(`[${time}] Invalid file object`);
                    throw new Error("Invalid file object");
                }
                const formData = new FormData();
                formData.append("file", file);
                if (duplicateAction && ["skip", "replace"].includes(duplicateAction)) {
                    formData.append("duplicateAction", duplicateAction);
                }
                // console.log(`[${time}] Preparing createCatalogFromCsv request:`, {
                //     fileName: file.name,
                //     size: file.size,
                //     duplicateAction,
                // });
                return {
                    url: "/catalogs/upload",
                    method: "POST",
                    body: formData,
                    responseHandler: async (response) => {
                        if (!response.ok) {
                            const errorData = await response.json();
                            // console.error(`[${time}] Server error response:`, errorData);
                            throw new Error(errorData.message || "Failed to upload CSV");
                        }
                        return response.json();
                    },
                };
            },
            invalidatesTags: [{ type: "Catalog", id: "LIST" }],
            async onQueryStarted({ file, duplicateAction }, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                try {
                    const { data } = await queryFulfilled;
                    // console.log(`[${time}] createCatalogFromCsv success:`, data);
                    await withToast(queryFulfilled, {
                        success: `Successfully uploaded ${data.success.created} catalog(s)!`,
                        error: "Failed to upload CSV file.",
                    });
                } catch (error: any) {
                    // console.error(`[${time}] createCatalogFromCsv error:`, {
                    //     status: error?.error?.status,
                    //     message: error?.error?.data?.message,
                    //     details: error?.error?.data?.details,
                    //     fileName: file.name,
                    // });
                }
            },
        }),

        exportCatalogsXlsx: builder.mutation<
            { success: boolean },
            { catalogIds?: number[] } & Partial<FiltersState>
        >({
            query: ({ catalogIds, ...filters }) => {
                const params = cleanParams({
                    lotNo: filters.lotNo,
                    sellingMark: filters.sellingMark,
                    grade: filters.grade,
                    invoiceNo: filters.invoiceNo,
                    saleCode: filters.saleCode,
                    category: filters.category,
                    reprint: filters.reprint,
                    bags: filters.bags,
                    netWeight: filters.netWeight,
                    totalWeight: filters.totalWeight,
                    askingPrice: filters.askingPrice,
                    producerCountry: filters.producerCountry,
                    manufactureDate: filters.manufactureDate,
                    broker: filters.broker,
                    catalogIds: catalogIds?.join(","),
                    page: 1,
                    limit: 10000,
                });
                // // console.log(
                // //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Sending XLSX export request with params:`,
                // //     params
                // // );
                return {
                    url: "/catalogs/export/xlsx",
                    method: "POST",
                    body: params,
                    responseHandler: async (response: Response) => {
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
                        }
                        const blob = await response.blob();
                        if (!blob || blob.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                            throw new Error("Unexpected response format or empty XLSX");
                        }
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `tea_catalog_${new Date().toISOString().split("T")[0]}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        return { success: true };
                    },
                    cache: "no-cache",
                };
            },
            async onQueryStarted(arg, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                // // console.log(`[${time}] Starting XLSX download query:`, arg);
                try {
                    await queryFulfilled;
                    // // console.log(`[${time}] XLSX export successful`);
                } catch (error) {
                    // console.error(`[${time}] XLSX download failed:`, error);
                    throw error;
                }
            },
            extraOptions: {
                maxRetries: 0,
            },
        }),

        deleteCatalogs: builder.mutation<{ message: string }, { ids: number[] }>({
            query: ({ ids }) => ({
                url: "/catalogs/bulk",
                method: "DELETE",
                body: { ids },
            }),
            invalidatesTags: [{ type: "Catalog", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "SellingPrice items deleted successfully!",
                    error: "Failed to delete catalog items.",
                });
            },
        }),

        deleteAllCatalogs: builder.mutation<
            { message: string; associations: { id: number; lotNo: string }[] },
            Record<string, any>
        >({
            query: (filters) => ({
                url: "/catalogs/bulk/delete-all",
                method: "DELETE",
                body: filters,
            }),
            invalidatesTags: [{ type: "Catalog", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "All catalogs deleted successfully!",
                    error: (err) => {
                        const errorData = err as {
                            error?: { data?: { message?: string } };
                        };
                        return `Failed to delete all catalogs: ${errorData?.error?.data?.message || "Unknown error"}`;
                    },
                });
            },
        }),

        // New SellingPrice Endpoints
        getSellingPrices: builder.query<{ data: SellingPriceResponse[]; meta: { page: number; limit: number; total: number; totalPages: number } }, Partial<FiltersState> & { page?: number; limit?: number }>({
            query: (filters) => {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                const params = cleanParams({
                    lotNo: filters.lotNo,
                    sellingMark: filters.sellingMark,
                    grade: filters.grade,
                    invoiceNo: filters.invoiceNo,
                    saleCode: filters.saleCode,
                    category: filters.category,
                    reprint: filters.reprint,
                    bags: filters.bags,
                    netWeight: filters.netWeight,
                    totalWeight: filters.totalWeight,
                    askingPrice: filters.askingPrice,
                    purchasePrice: filters.purchasePrice,
                    producerCountry: filters.producerCountry,
                    manufactureDate: filters.manufactureDate,
                    broker: filters.broker,
                    search: filters.search,
                    page: filters.page,
                    limit: filters.limit,
                });
                // // console.log(`[${time}] Sending getSellingPrices request with params:`, params);
                return {
                    url: "/sellingPrices",
                    params,
                };
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "SellingPrices" as const, id })),
                        { type: "SellingPrices" as const, id: "LIST" },
                    ]
                    : [{ type: "SellingPrices" as const, id: "LIST" }],
            async onQueryStarted(filters, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                try {
                    const { data } = await queryFulfilled;
                    // // console.log(`[${time}] getSellingPrices success:`, { meta: data.meta, dataLength: data.data.length });
                } catch (error: any) {
                    // console.error(`[${time}] getSellingPrices error:`, {
                    //     status: error?.error?.status,
                    //     message: error?.error?.data?.message,
                    //     details: error?.error?.data?.details,
                    //     params: filters,
                    //     url: `/sellingPrices`,
                    // });
                }
            },
        }),

        getSellingPriceById: builder.query<SellingPriceResponse, number>({
            query: (id) => `/sellingPrices/${id}`,
            providesTags: (result, error, id): TagDescription<"SellingPrices">[] => [{ type: "SellingPrices", id }],
        }),

        getSellingPriceByLotNo: builder.query<SellingPriceResponse, string>({
            query: (lotNo) => `/sellingPrices/lot/${lotNo}`,
            providesTags: (result, error, lotNo): TagDescription<"SellingPrices">[] => [
                { type: "SellingPrices", id: result?.id || lotNo },
            ],
        }),
        createSellingPrice: builder.mutation<SellingPriceResponse, {
            lotNo: string;
            broker: string;
            sellingMark: string;
            grade: string;
            invoiceNo: string;
            saleCode: string;
            category: string;
            reprint?: string;
            bags: number;
            netWeight: number;
            totalWeight: number;
            askingPrice: number;
            purchasePrice: number;
            producerCountry?: string;
            manufactureDate: string;
            adminCognitoId: string;
        }>({
            query: (body) => ({
                url: "/sellingPrices",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "SellingPrices", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Selling price created successfully!",
                    error: "Failed to create selling price.",
                });
            },
        }),

        deleteSellingPrices: builder.mutation<
            { message: string; associations: { id: number; lotNo: string }[]; deletedCount: number },
            { ids: number[]; signal?: AbortSignal }
        >({
            query: ({ ids, signal }) => ({
                url: "/sellingPrices",
                method: "DELETE",
                body: { ids },
                signal,
            }),
            invalidatesTags: [{ type: "SellingPrices", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Selling prices deleted successfully!",
                    error: "Failed to delete selling prices.",
                });
            },
        }),

        deleteAllSellingPrices: builder.mutation<
            { message: string; associations: { id: number; lotNo: string }[]; deletedCount: number },
            { confirm: boolean; signal?: AbortSignal }
        >({
            query: ({ confirm, signal }) => ({
                url: "/sellingPrices/deleteAll",
                method: "DELETE",
                body: { confirm },
                signal,
            }),
            invalidatesTags: [{ type: "SellingPrices", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                try {
                    const { data } = await queryFulfilled;
                    // console.log(`[${time}] deleteAllSellingPrices success:`, { deletedCount: data.deletedCount });
                } catch (error: any) {
                    // console.error(`[${time}] deleteAllSellingPrices error:`, {
                    //     status: error?.error?.status,
                    //     message: error?.error?.data?.message,
                    //     details: error?.error?.data?.details,
                    // });
                }
            },
        }),

        uploadSellingPricesCsv: builder.mutation({
            query: ({ file, duplicateAction }) => {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });

                if (!(file instanceof File)) {
                    // console.error(`[${time}] Invalid file object:`, { file });
                    throw new Error("Invalid file object");
                }

                const formData = new FormData();
                formData.append("file", file);

                if (duplicateAction && ["skip", "replace"].includes(duplicateAction)) {
                    formData.append("duplicateAction", duplicateAction);
                } else if (duplicateAction) {
                    // console.warn(`[${time}] Invalid duplicateAction value:`, duplicateAction);
                }

                // console.log(`[${time}] Preparing uploadSellingPricesCsv request:`, {
                //     fileName: file.name,
                //     fileSize: file.size,
                //     fileType: file.type,
                //     duplicateAction,
                // });

                return {
                    url: "/sellingPrices/upload",
                    method: "POST",
                    body: formData,
                    responseHandler: async (response) => {
                        const responseText = await response.text();
                        let errorData = null;

                        try {
                            errorData = JSON.parse(responseText);
                        } catch (e) {
                            // console.error(`[${time}] Failed to parse response as JSON:`, responseText);
                        }

                        if (!response.ok) {
                            // console.error(`[${time}] Server error response:`, {
                            //     status: response.status,
                            //     statusText: response.statusText,
                            //     data: errorData || responseText,
                            // });
                            throw new Error(errorData?.message || "Failed to upload CSV");
                        }

                        // console.log(`[${time}] Server response:`, errorData);
                        return errorData;
                    },
                };
            },

            invalidatesTags: [{ type: "SellingPrices", id: "LIST" }],

            async onQueryStarted(_, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });

                try {
                    const { data } = await queryFulfilled;

                    // console.log(`[${time}] Upload success:`, {
                    //     created: data.success.created,
                    //     skipped: data.success.skipped,
                    //     replaced: data.success.replaced,
                    //     errors: data.errors,
                    // });

                    await withToast(queryFulfilled, {
                        success: "Selling prices uploaded successfully!",
                        error: "Failed to upload selling prices.",
                    });
                } catch (error) {
                    if (error instanceof Error) {
                        // console.error(`[${time}] Upload error:`, {
                        //     message: error.message,
                        // });
                    } else {
                        // console.error(`[${time}] Upload error: Unknown error`, error);
                    }
                }
            },
        }),

        updateSellingPrice: builder.mutation<SellingPriceResponse, { id: number } & Partial<CatalogFormData>>({
            query: ({ id, ...body }) => ({
                url: `/sellingPrices/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "SellingPrices", id }, { type: "SellingPrices", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Selling price updated successfully!",
                    error: "Failed to update selling price.",
                });
            },
        }),

        exportSellingPricesXlsx: builder.mutation<
            { success: boolean },
            { sellingPriceIds?: number[] } & Partial<FiltersState>
        >({
            query: ({ sellingPriceIds, ...filters }) => {
                const params = cleanParams({
                    lotNo: filters.lotNo,
                    sellingMark: filters.sellingMark,
                    grade: filters.grade,
                    invoiceNo: filters.invoiceNo,
                    saleCode: filters.saleCode,
                    category: filters.category,
                    reprint: filters.reprint,
                    bags: filters.bags,
                    netWeight: filters.netWeight,
                    totalWeight: filters.totalWeight,
                    askingPrice: filters.askingPrice,
                    purchasePrice: filters.purchasePrice,
                    producerCountry: filters.producerCountry,
                    manufactureDate: filters.manufactureDate,
                    broker: filters.broker,
                    sellingPriceIds: sellingPriceIds?.join(","),
                    page: 1,
                    limit: 3000,
                });

                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                // // console.log(`[${time}] Sending Selling Prices XLSX export with params:`, params);

                return {
                    url: "/sellingPrices/export-xlsx",
                    method: "POST",
                    body: params,
                    responseHandler: async (response: Response) => {
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
                        }

                        const blob = await response.blob();

                        if (
                            !blob ||
                            blob.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        ) {
                            throw new Error("Unexpected response format or empty XLSX");
                        }

                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `selling_prices_${new Date().toISOString().split("T")[0]}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);

                        return { success: true };
                    },
                    cache: "no-cache",
                };
            },
            async onQueryStarted(arg, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                // // console.log(`[${time}] Starting Selling Prices XLSX download:`, arg);
                try {
                    await queryFulfilled;
                    // // console.log(`[${time}] Selling Prices XLSX export successful`);
                } catch (error) {
                    // console.error(`[${time}] Selling Prices XLSX export failed:`, error);
                    throw error;
                }
            },
            extraOptions: {
                maxRetries: 0,
            },
        }),

        getSellingPricesFilterOptions: builder.query<FilterOptions, void>({
            query: () => "/sellingPrices/filters",
            providesTags: ["SellingPrices"],
        }),

        // New Outlots Endpoints
        getOutlots: builder.query<
            { data: OutLotsResponse[]; meta: { page: number; limit: number; total: number; totalPages: number } },
            Partial<FiltersState> & { page?: number; limit?: number }
        >({
            query: (filters) => {
                const params = cleanParams({
                    lotNo: filters.lotNo,
                    auction: filters.auction,
                    broker: filters.broker,
                    sellingMark: filters.sellingMark,
                    grade: filters.grade,
                    invoiceNo: filters.invoiceNo,
                    bags: filters.bags,
                    netWeight: filters.netWeight,
                    totalWeight: filters.totalWeight,
                    baselinePrice: filters.baselinePrice,
                    manufactureDate: filters.manufactureDate,
                    search: filters.search,
                    page: filters.page,
                    limit: filters.limit,
                });
                // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutlots: Sending query params:`, params);
                return {
                    url: "/outLots",
                    params,
                };
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "OutLots" as const, id })),
                        { type: "OutLots" as const, id: "LIST" },
                    ]
                    : [{ type: "OutLots" as const, id: "LIST" }],
            async onQueryStarted(filters, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutlots: Success:`, data.meta);
                } catch (error: any) {
                    // console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutlots: Error:`, {
                    //     status: error?.error?.status,
                    //     message: error?.error?.data?.message,
                    //     details: error?.error?.data?.details || error?.error?.data || "No details provided",
                    //     params: filters,
                    //     response: JSON.stringify(error?.error?.data, null, 2),
                    //     fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
                    // });
                }
            },
        }),

        getOutlotById: builder.query<OutlotResponse, number>({
            query: (id) => `/outlots/${id}`,
            providesTags: (result, error, id): TagDescription<"OutLots">[] => [{ type: "OutLots", id }],
        }),
        getOutlotByLotNo: builder.query<OutlotResponse, string>({
            query: (lotNo) => `/outlots/lot/${lotNo}`,
            providesTags: (result, error, lotNo): TagDescription<"OutLots">[] => [
                { type: "OutLots", id: result?.id || lotNo },
            ],
        }),
        createOutlot: builder.mutation<OutlotResponse, {
            auction: string;
            lotNo: string;
            broker: string;
            sellingMark: string;
            grade: string;
            invoiceNo: string;
            bags: number;
            netWeight: number;
            totalWeight: number;
            baselinePrice: number;
            manufactureDate: string;
            adminCognitoId: string;
        }>({
            query: (body) => ({
                url: "/outlots",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "OutLots", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Outlot created successfully!",
                    error: "Failed to create outlot.",
                });
            },
        }),
        deleteOutlots: builder.mutation<{ message: string; associations: { id: number; lotNo: string }[] }, { ids: number[] }>({
            query: ({ ids }) => ({
                url: "/outLots",
                method: "DELETE",
                body: { ids },
            }),
            invalidatesTags: [{ type: "OutLots", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "outLots deleted successfully!",
                    error: "Failed to delete outLots.",
                });
            },
        }),
        uploadOutlotsCsv: builder.mutation<{
            count: any;
            success: { created: number; skipped: number; replaced: number };
            errors: { row: number; message: string }[]
        }, { file: File; duplicateAction?: 'skip' | 'replace' }>({
            query: ({ file, duplicateAction }) => {
                const formData = new FormData();
                formData.append('file', file);
                if (duplicateAction) formData.append('duplicateAction', duplicateAction);
                return {
                    url: "/outlots/upload",
                    method: "POST",
                    body: formData,
                    headers: {}, // Let browser set Content-Type for FormData
                };
            },
            invalidatesTags: [{ type: "OutLots", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "SellingPrice uploaded successfully!",
                    error: "Failed to upload outLots.",
                });
            },
        }),

        exportOutLotsXlsx: builder.mutation<
            { success: boolean },
            { outLotIds?: number[] } & Partial<FiltersState>
        >({
            query: ({ outLotIds, ...filters }) => {
                const params = cleanParams({
                    auction: filters.auction,
                    lotNo: filters.lotNo,
                    broker: filters.broker,
                    sellingMark: filters.sellingMark,
                    grade: filters.grade,
                    invoiceNo: filters.invoiceNo,
                    bags: filters.bags,
                    netWeight: filters.netWeight,
                    totalWeight: filters.totalWeight,
                    baselinePrice: filters.baselinePrice,
                    manufactureDate: filters.manufactureDate,
                    adminCognitoId: filters.adminCognitoId,
                    outLotIds: outLotIds?.join(","),
                    page: 1,
                    limit: 10000,
                });

                return {
                    url: "/outLots/export-xlsx",
                    method: "POST",
                    body: params,
                    responseHandler: async (response: Response) => {
                        const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                        if (!response.ok) {
                            const errorText = await response.text();
                            // console.error(`[${time}] Export failed:`, { status: response.status, text: errorText });
                            throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
                        }

                        const blob = await response.blob();
                        if (!blob || blob.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                            // console.error(`[${time}] Unexpected response format:`, { type: blob?.type });
                            throw new Error("Unexpected response format or empty XLSX");
                        }

                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `outlots_${new Date().toISOString().split("T")[0]}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);

                        // console.log(`[${time}] XLSX export successful`);
                        return { success: true };
                    },
                    cache: "no-cache",
                };
            },
            // Remove onQueryStarted to avoid duplicate fetch
            extraOptions: {
                maxRetries: 0,
            },
        }),

        getOutlotsFilterOptions: builder.query<FilterOptions, void>({
            query: () => "/outLots/filters",
            providesTags: ["OutLots"],
        }),

        // Stocks Endpoints
        getStocks: builder.query<
            { data: Stock[]; meta: { page: number; limit: number; total: number; totalPages: number } },
            Partial<StockFilters>
        >({
            query: (filters) => ({
                url: "/stocks",
                params: cleanParams({
                    stockId: filters.stockIds,
                    stockIds: filters.stockIds,
                    minTotalWeight: filters.minTotalWeight,
                    batchNumber: filters.batchNumber,
                    broker: filters.broker === "any" ? undefined : filters.broker,
                    search: filters.search,
                    onlyFavorites: filters.onlyFavorites,
                    category: filters.category === "any" ? undefined : filters.category,
                    grade: filters.grade === "any" ? undefined : filters.grade,
                    lotNo: filters.lotNo,
                    page: filters.page,
                    limit: filters.limit,
                }),
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: "Stocks" as const, id })),
                        { type: "Stocks" as const, id: "LIST" },
                    ]
                    : [{ type: "Stocks" as const, id: "LIST" }],
            async onQueryStarted(filters, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // // console.log(
                    // //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getStocks: ${JSON.stringify(data.meta)}`
                    // // );
                } catch (error: any) {
                    // console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getStocks error:`, {
                    //     status: error?.error?.status,
                    //     message: error?.error?.data?.message,
                    //     details: error?.error?.data?.details,
                    //     params: filters,
                    // });
                }
            },
        }),
        getStockById: builder.query<Stock, number>({
            query: (id) => `/stocks/${id}`,
            providesTags: (result, error, id): TagDescription<"Stocks">[] => [{ type: "Stocks", id }],
        }),
        getStockByLotNo: builder.query<Stock, string>({
            query: (lotNo) => `/stocks/lot/${lotNo}`,
            providesTags: (result, error, lotNo): TagDescription<"Stocks">[] => [
                { type: "Stocks", id: result?.id || lotNo },
            ],
        }),
        createStock: builder.mutation<
            Stock,
            {
                saleCode: string;
                broker: Broker;
                lotNo: string;
                mark: string;
                grade: TeaGrade;
                invoiceNo: string;
                bags: number;
                weight: number;
                purchaseValue: number;
                totalPurchaseValue: number;
                agingDays: number;
                penalty: number;
                bgtCommission: number;
                maerskFee: number;
                commission: number;
                netPrice: number;
                total: number;
                batchNumber?: string;
                lowStockThreshold?: number;
                adminCognitoId: string;
            }
        >({
            query: (body) => ({
                url: "/stocks",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "Stocks", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Stock created successfully!",
                    error: "Failed to create stock.",
                });
            },
        }),
        updateStock: builder.mutation<Stock, UpdateStockInput>({
            query: ({ id, ...body }) => ({
                url: `/stocks/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (result) => [{ type: "Stocks", id: result?.id }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Stock updated successfully!",
                    error: "Failed to update stock.",
                });
            },
        }),
        deleteStocks: builder.mutation<{ message: string; associations: { id: number; lotNo: string }[] }, { ids: number[] }>({
            query: ({ ids }) => ({
                url: "/stocks",
                method: "DELETE",
                body: { ids },
            }),
            invalidatesTags: [{ type: "Stocks", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Stocks deleted successfully!",
                    error: "Failed to delete stocks.",
                });
            },
        }),
        uploadStocksCsv: builder.mutation<
            { count: any; success: { created: number; skipped: number; replaced: number }; errors: { row: number; message: string }[] },
            { file: File; duplicateAction?: "skip" | "replace" }
        >({
            query: ({ file, duplicateAction }) => {
                const formData = new FormData();
                formData.append("file", file);
                if (duplicateAction) formData.append("duplicateAction", duplicateAction);
                return {
                    url: "/stocks/upload",
                    method: "POST",
                    body: formData,
                    headers: {}, // Let browser set Content-Type for FormData
                };
            },
            invalidatesTags: [{ type: "Stocks", id: "LIST" }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Stocks uploaded successfully!",
                    error: "Failed to upload stocks.",
                });
            },
        }),

        exportStocksXlsx: builder.mutation<
            { success: boolean },
            { stockIds?: number[] } & Omit<Partial<StockFilters>, 'stockIds'>
        >({
            query: ({ stockIds, ...filters }) => {
                const params = cleanParams({
                    stockId: filters.stockId,
                    lotNo: filters.lotNo,
                    batchNumber: filters.batchNumber,
                    broker: filters.broker === "any" ? undefined : filters.broker,
                    grade: filters.grade === "any" ? undefined : filters.grade,
                    category: filters.category === "any" ? undefined : filters.category,
                    minTotalWeight: filters.minTotalWeight,
                    search: filters.search,
                    onlyFavorites: filters.onlyFavorites,
                    stockIds: stockIds?.join(","),
                    page: 1,
                    limit: 10000,
                });

                return {
                    url: "/stocks/export-xlsx",
                    method: "POST",
                    body: params,
                    responseHandler: async (response: Response) => {
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
                        }
                        const blob = await response.blob();
                        if (!blob || blob.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                            throw new Error("Unexpected response format or empty XLSX");
                        }
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `stocks_${new Date().toISOString().split("T")[0]}.xlsx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                        return { success: true };
                    },
                    cache: "no-cache",
                };
            },
            async onQueryStarted(arg, { queryFulfilled }) {
                const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                try {
                    await queryFulfilled;
                    // // console.log(`[${time}] XLSX export successful`);
                } catch (error) {
                    // console.error(`[${time}] XLSX download failed:`, error);
                    throw error;
                }
            },
            extraOptions: {
                maxRetries: 0,
            },
        }),

        getStocksFilterOptions: builder.query<FilterOptions, void>({
            query: () => "/stocks/filters",
            providesTags: ["Stocks"],
        }),

        toggleFavorite: builder.mutation<
            { message: string; stocksId: number; userCognitoId: string; favorited: boolean },
            { userCognitoId: string; stocksId: number }
        >({
            query: ({ userCognitoId, stocksId }) => ({
                url: "/toggle-favorite",
                method: "POST",
                body: { userCognitoId, stocksId },
            }),
            invalidatesTags: (result, error, { stocksId }) => [
                { type: "Favorites", id: `stock-${stocksId}` },
                { type: "Stocks", id: "LIST" },
            ],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Favorite toggled successfully!",
                    error: "Failed to toggle favorite.",
                });
            },
        }),

        assignStock: builder.mutation<
            {
                message: string;
                assignment: {
                    stockId: number;
                    userCognitoId: string;
                    assignedWeight: number;
                    assignedAt: string;
                };
            },
            { stockId: number; userCognitoId: string }
        >({
            query: (body) => ({
                url: "/stocks/assign",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Stocks"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Stock assigned successfully!",
                    error: "Failed to assign stock.",
                });
            },
        }),

        bulkAssignStocks: builder.mutation<
            { message: string; assignments: Array<{ stockId: number; userCognitoId: string; assignedWeight: number; assignedAt: string }> },
            { userCognitoId: string; assignments: Array<{ stockId: number; assignedWeight?: number }> }
        >({
            query: (body) => ({
                url: '/stocks/bulk-assign',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Stocks', 'Users'],
        }),

        unassignStock: builder.mutation<
            { message: string },
            { stockId: number; userCognitoId: string }
        >({
            query: (body) => ({
                url: "/stocks/unassign",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Stocks"],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Stock unassigned successfully!",
                    error: "Failed to unassign stock.",
                });
            },
        }),
        getUserStockHistory: builder.query<
            {
                message: string;
                data: Array<{
                    stocksId: number;
                    assignedAt: string;
                    details: {
                        id: number;
                        saleCode: string;
                        broker: string;
                        lotNo: string;
                        mark: string;
                        grade: string;
                        invoiceNo: string;
                        bags: number;
                        weight: number;
                        purchaseValue: number;
                        totalPurchaseValue: number;
                        agingDays: number;
                        penalty: number;
                        bgtCommission: number;
                        maerskFee: number;
                        commission: number;
                        netPrice: number;
                        total: number;
                        batchNumber: string | null;
                        lowStockThreshold: number | null;
                        adminCognitoId: string;
                        createdAt: string;
                        updatedAt: string;
                        assignedWeight: number;
                    };
                }>;
                meta: { page: number; limit: number; total: number; totalPages: number };
            },
            { userCognitoId: string; page?: number; limit?: number; search?: string; sortBy?: 'assignedAt' | 'stocksId' | 'assignedWeight'; sortOrder?: 'asc' | 'desc' }
        >({
            query: ({ userCognitoId, page = 1, limit = 10, search = '', sortBy = 'assignedAt', sortOrder = 'desc' }) => ({
                url: `/users/${userCognitoId}/stock-history`,
                params: { page, limit, search, sortBy, sortOrder },
            }),
            providesTags: ['Users'],
        }),

        //shipment endpoints
        getShipments: builder.query<
            { data: Shipment[]; meta: { total: number; page: number; limit: number } },
            { page: number; limit: number; search?: string; status?: string; userCognitoId?: string; stocksId?: number }
        >({
            query: ({ page, limit, search, status, userCognitoId, stocksId }) => ({
                url: userCognitoId ? `/shipments/users/${userCognitoId}/shipments` : "/shipments/admin/shipments",
                params: cleanParams({ page, limit, search, status, stocksId }),
            }),
            providesTags: ["Shipments"],
            async onQueryStarted(params, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // console.log(
                    //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getShipments: ${JSON.stringify(data.meta)}`
                    // );
                } catch (error: any) {
                    // console.error(
                    //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getShipments error:`,
                    //     {
                    //         status: error?.error?.status,
                    //         message: error?.error?.data?.message || "Unknown error",
                    //         details: error?.error?.data?.details || null,
                    //         params,
                    //         fullError: JSON.stringify(error, null, 2),
                    //     }
                    // );
                }
            },
        }),
        getShipmentById: builder.query<{ data: Shipment }, string>({
            query: (id) => ({
                url: `/shipments/${id}`,
                method: 'GET',
            }),
            providesTags: ['Shipments'],
            async onQueryStarted(id, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // console.log(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] getShipmentById: Shipment ${id}`
                    // );
                } catch (error: any) {
                    // console.error(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] getShipmentById error:`,
                    //     {
                    //         status: error?.error?.status,
                    //         message: error?.error?.data?.message || 'Unknown error',
                    //         details: error?.error?.data?.details || null,
                    //         id,
                    //         fullError: JSON.stringify(error, null, 2),
                    //     }
                    // );
                }
            },
        }),
        createShipment: builder.mutation<{ data: Shipment }, { items: { stocksId: number; totalWeight: number }[]; shipmentDate: string; status: string; consignee: string; vessel: string; shipmark: string; packagingInstructions: string; additionalInstructions?: string; userCognitoId: string }>({
            query: (body) => ({
                url: `/shipments/users/${body.userCognitoId}/shipments`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["Shipments", "Stocks"],
        }),
        updateShipment: builder.mutation<{ data: Shipment }, { userCognitoId: string; shipmentId: number; shipment: { items?: { stocksId: number; totalWeight: number }[]; status?: string; consignee?: string; vessel?: string; shipmark?: string; packagingInstructions?: string; additionalInstructions?: string } }>({
            query: ({ userCognitoId, shipmentId, shipment }) => ({
                url: `/users/${userCognitoId}/shipments/${shipmentId}`,
                method: "PATCH",
                body: shipment,
            }),
            invalidatesTags: ["Shipments", "Stocks"],
        }),
        getAllShipments: builder.query<
            { data: Shipment[]; meta: { total: number; page: number; limit: number } },
            { page: number; limit: number; search?: string; status?: string; userCognitoId?: string }
        >({
            query: ({ page, limit, search, status, userCognitoId }) => ({
                url: "/shipments",
                params: cleanParams({ page, limit, search, status, userCognitoId }),
            }),
            providesTags: ["Shipments"],
            async onQueryStarted(params, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // console.log(
                    //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getAllShipments: ${JSON.stringify(data.meta)}`
                    // );
                } catch (error: any) {
                    // console.error(
                    //     `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getAllShipments error:`,
                    //     {
                    //         status: error?.error?.status,
                    //         message: error?.error?.data?.message,
                    //         details: error?.error?.data?.details,
                    //         params,
                    //     }
                    // );
                }
            },
        }),
        updateShipmentStatus: builder.mutation<
            { data: Shipment },
            { id: number; status: ShipmentStatus }
        >({
            query: ({ id, status }) => ({
                url: `/shipments/admin/shipments/${id}/status`,
                method: 'PUT',
                body: { status },
            }),
            invalidatesTags: ['Shipments'],
            async onQueryStarted({ id, status }, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // console.log(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] updateShipmentStatus: Shipment ${id} updated to ${status}`
                    // );
                } catch (error: any) {
                    // console.error(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] updateShipmentStatus error:`,
                    //     {
                    //         statusCode: error?.error?.status, // ✅ Renamed to avoid duplication
                    //         message: error?.error?.data?.message || 'Unknown error',
                    //         details: error?.error?.data?.details || null,
                    //         id,
                    //         status, // assuming this refers to shipment status, e.g., "Pending"
                    //         fullError: JSON.stringify(error, null, 2),
                    //     }
                    // );
                }
            },
        }),

        //contact endpoints
        createContact: builder.mutation<
            {
                id: number;
                name: string;
                email: string;
                subject?: string;
                message: string;
                privacyConsent: boolean;
                userCognitoId?: string | null;
                createdAt: string;
            },
            {
                name: string;
                email: string;
                subject?: string;
                message: string;
                privacyConsent: boolean;
                userCognitoId?: string | null;
                // recaptchaToken: string;
            }
        >({
            query: (body) => ({
                url: "/users",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Users"], // Invalidate Users to refresh contact-related data if linked
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: "Message sent successfully!",
                    error: "Failed to send message.",
                });
            },
        }),
        getContacts: builder.query<
            { data: Contact[]; meta: { page: number; limit: number; total: number; totalPages: number } },
            { page?: number; limit?: number; search?: string }
        >({
            query: ({ page = 1, limit = 10, search }) => ({
                url: '/users',
                params: cleanParams({ page, limit, search }),
            }),
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Contacts' as const, id })),
                        { type: 'Contacts' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Contacts' as const, id: 'LIST' }],
            async onQueryStarted(params, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    // console.log(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] getContacts: ${JSON.stringify(data.meta)}`
                    // );
                } catch (error: any) {
                    // console.error(
                    //     `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] getContacts error:`,
                    //     {
                    //         status: error?.error?.status,
                    //         message: error?.error?.data?.message,
                    //         details: error?.error?.data?.details,
                    //         params,
                    //     }
                    // );
                }
            },
        }),

        deleteContact: builder.mutation<{ message: string }, { id: number }>({
            query: ({ id }) => ({
                url: `/contacts/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Contacts', id: 'LIST' }],
            async onQueryStarted(_, { queryFulfilled }) {
                await withToast(queryFulfilled, {
                    success: 'Contact submission deleted successfully!',
                    error: 'Failed to delete contact submission.',
                });
            },
        }),
    }),
});

export const {
    useGetAuthUserQuery,
    useGetLoggedInUsersQuery,
    useGetAdminByIdQuery,
    useCreateAdminSettingsMutation,
    useUpdateAdminSettingsMutation,
    useGetUserQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useGetCatalogQuery,
    useGetCatalogByIdQuery,
    useCreateCatalogFromCsvMutation,
    useGetCatalogByLotNoQuery,
    useDeleteCatalogsMutation,
    useDeleteAllCatalogsMutation,
    useGetCatalogFilterOptionsQuery,
    useExportCatalogsXlsxMutation,
    useGetSellingPricesQuery,
    useGetSellingPriceByIdQuery,
    useGetSellingPriceByLotNoQuery,
    useCreateSellingPriceMutation,
    useDeleteSellingPricesMutation,
    useDeleteAllSellingPricesMutation,
    useUploadSellingPricesCsvMutation,
    useExportSellingPricesXlsxMutation,
    useGetSellingPricesFilterOptionsQuery,
    useGetOutlotsQuery,
    useGetOutlotByIdQuery,
    useGetOutlotByLotNoQuery,
    useCreateOutlotMutation,
    useDeleteOutlotsMutation,
    useUploadOutlotsCsvMutation,
    useExportOutLotsXlsxMutation,
    useGetOutlotsFilterOptionsQuery,
    useGetStocksQuery,
    useToggleFavoriteMutation,
    useGetStockByIdQuery,
    useGetStockByLotNoQuery,
    useCreateStockMutation,
    useUpdateStockMutation,
    useDeleteStocksMutation,
    useUploadStocksCsvMutation,
    useExportStocksXlsxMutation,
    useGetStocksFilterOptionsQuery,
    useBulkAssignStocksMutation,
    useAssignStockMutation,
    useUnassignStockMutation,
    useGetUserStockHistoryQuery,
    useGetShipmentsQuery,
    useGetShipmentByIdQuery,
    useCreateShipmentMutation,
    useUpdateShipmentMutation,
    useUpdateShipmentStatusMutation,
    useCreateContactMutation,
    useGetContactsQuery,
    useDeleteContactMutation,
} = api;