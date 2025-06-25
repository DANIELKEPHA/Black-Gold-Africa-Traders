import {Broker, TeaCategory, TeaGrade} from "@/state/enums";
import {AuthUserResponse} from "@/state/user";

export interface Favorite {
    id: number;
    userCognitoId: string;
    catalogId: number;
    createdAt: string;
}

export interface StockHistoryDetails {
    id: number;
    stockId: number;
    quantity: number;
    reason: string;
    createdAt: string;
    shipmentId?: number | null;
}

export interface UpdateStockInput {
    id: number;
    batchNumber?: string | null;
    lowStockThreshold?: number | null;
}

export interface StockFilters {
    stockId?: number | number[];
    stockIds?: string;
    minTotalWeight?: number;
    batchNumber?: string;
    broker?: Broker | "any";
    search?: string;
    onlyFavorites?: boolean;
    category?: TeaCategory | "any";
    grade?: TeaGrade | "any";
    lotNo?: string;
    page?: number;
    limit?: number;
}

export interface StockHistory {
    id: number;
    stocksId: number;
    userCognitoId: string;
    assignedWeight: number;
    assignedAt: string;
    details: {
        updatedAt: string;
        createdAt: string;
        adminCognitoId: string;
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
        batchNumber?: string;
        lowStockThreshold?: number;
        assignedWeight?: number;
    };
}

export interface Stock {
    id: number;
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
    batchNumber: string | null;
    lowStockThreshold: number | null;
    createdAt: string;
    updatedAt: string;
    assignedWeight?: number | null;
    assignedAt: string | null;
    adminCognitoId: string;
    assignments?: Array<{
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
    }>;
    admin: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
}

export interface UserStockHistoryEntry {
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
        batchNumber?: string | null;
        lowStockThreshold: number | null;
        adminCognitoId: string;
        createdAt: string;
        updatedAt: string;
        assignedWeight: number;
    };
}


export interface StockAssignment {
    id: number;
    stocksId: number;
    userCognitoId: string;
    assignedWeight: number;
    assignedAt: string;
    stocks: Stock | null;
}

export interface StockHistoryResponse {
    data: {
        data: StockHistory[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export interface StockData {
    id: number;
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
    batchNumber: string | null;
    lowStockThreshold: number | null;
    isLowStock: boolean;
    adminCognitoId: string;
    createdAt: string;
    updatedAt: string;
    isFavorited: boolean;
}

export interface StockTableProps {
    stocks: StockData[];
    authUser: AuthUserResponse | null;
    selectedItems: number[];
    handleSelectItem: (stockId: number) => void;
    handleSelectAll: () => void;
    viewMode: "list" | "grid";
    loading: boolean;
    isCreatingFavorite: boolean;
    isDeletingFavorite: boolean;
    handleFavoriteToggle: (stockId: number, isFavorited: boolean) => Promise<void>;
    handleExportCsv: () => Promise<void>;
    handleUploadCsv: (file: File, duplicateAction: "skip" | "replace") => Promise<void>;
    handleAdjustStock: (stockId: number, weight: number, reason: string) => Promise<void>;
    handleAssignStock: (stockId: number, userCognitoId: string, assignedWeight: number) => Promise<void>;
}

export interface UserStockTableProps {
    stocks: StockData[];
    authUser: AuthUserResponse | null;
    selectedItems: number[];
    handleSelectItem: (stockId: number) => void;
    handleSelectAll: () => void;
    viewMode: "list" | "grid";
    loading: boolean;
    isCreatingFavorite: boolean;
    isDeletingFavorite: boolean;
    handleFavoriteToggle: (stockId: number, isFavorited: boolean) => Promise<void>;
    handleExportCsv: () => Promise<void>;

}

export interface StockHistoryWithDetails {
    id: number;
    stockId: number;
    action: string;
    timestamp: string;
    userCognitoId: string | null;
    adminCognitoId: string | null;
    details?: {
        assignedWeight?: number;
        weightChange?: number;
        reason?: string;
    };
    stock?: {
        id: number;
        lotNo: string;
        batchNumber: string;
        lowStockThreshold: number | null;
        createdAt: string;
        updatedAt: string;
    };
    shipment?: {
        id: number;
        shipmentDate: string;
        status: string;
        userCognitoId: string;
        consignee: string;
        vessel: string;
        shipmark: string;
    };
    admin?: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    };
}

export interface StockResponse {
    data: Stock[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}


export interface BulkAssignStocksInput {
    userCognitoId: string;
    assignments: Array<{
        stockId: number;
        assignedWeight?: number;
    }>;
}

export interface BulkAssignStocksResponse {
    message: string;
    assignments: Array<{
        stockId: number;
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
    }>;
}

export interface ApiError {
    status: number;
    data: {
        message?: string;
        error?: string;
    };
}