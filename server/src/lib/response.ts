export interface ApiResponse<T> {
    status: "success" | "error";
    data?: T;
    message?: string;
    details?: any;
}

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
    status: "success",
    data,
    message,
});

export const errorResponse = (message: string, details?: any): ApiResponse<never> => ({
    status: "error",
    message,
    details,
});

export function formatPaginatedResponse<T>(
    data: T[],
    meta: { total: number; page: number; limit: number; totalPages: number }
) {
    return { data, meta };
}
