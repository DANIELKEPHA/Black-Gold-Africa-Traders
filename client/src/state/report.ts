export interface Report {
    id: number;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
    adminCognitoId: string | null;
    userCognitoId: string | null;
    admin: { adminCognitoId: string; name: string | null; email: string | null } | null;
    user: { userCognitoId: string; name: string | null; email: string | null } | null;
}

export interface ReportsResponse {
    data: Report[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ReportFilterOptions {
    fileTypes: string[];
    adminCognitoIds: string[];
    userCognitoIds: string[];
    uploadedAt: {
        min: string;
        max: string;
    };
}

export interface ReportFilters {
    page?: number;
    limit?: number;
    title?: string;
    fileType?: string;
    adminCognitoId?: string;
    userCognitoId?: string;
    search?: string;
}

export interface CreateReportInput {
    title: string;
    description?: string;
    fileUrl: string;
    fileType: string;
    userCognitoId?: string;
}

export interface DeleteReportsInput {
    ids: number[];
}

export interface ExportReportsInput {
    reportIds?: number[];
    title?: string;
    fileType?: string;
    adminCognitoId?: string;
    userCognitoId?: string;
    search?: string;
    page?: number;
    limit?: number;
}