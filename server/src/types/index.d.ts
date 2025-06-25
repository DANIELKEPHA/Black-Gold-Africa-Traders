import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PackagingInstructions, ShipmentStatus, Vessel } from "@prisma/client";


export interface FiltersState {
    lotNo?: string;
    sellingMark?: string;
    country?: string;
    manufactureDate?: string;
    category?: TeaCategory | "any";
    grade?: TeaGrade | "any";
    broker?: Broker | "any";
    invoiceNo?: string;
    askingPrice?: number;
    bags?: number;
    totalWeight?: number;
    tareWeight?: number;
    reprint?: number;
    search?: string;
    warehouse?: string;
}

export interface ErrorResponse {
    message: string;
    details?: unknown;
}

export interface AuthenticatedUser {
    userId: string;
    role: "admin" | "user";
}

export interface UserDetails {
    id: string;
    userId: string;
    username?: string;
    email: string;
    phoneNumber?: string;
    role: string;
    tokenUse: "id" | "access";
}

export interface DecodedToken {
    sub: string;
    email?: string;
    "cognito:username"?: string;
    phone_number?: string;
    "custom:role"?: string;
    "cognito:groups"?: string[];
    token_use: "id" | "access";
}


export interface FilterOptions {
    countries: string[];
    grades: TeaGrade[];
    categories: TeaCategory[];
    brokers: Broker[];
    sellingMarks: string[];
    invoiceNos: string[];
    askingPrice: number;
    manufactureDate: string;
    bags: number;
    totalWeight: number;
    tareWeight: number;
    warehouses: string[];
}

export interface FilterPreset {
    id: number;
    name: string;
    filters: FiltersState;
}

export interface CatalogResponse {
    id: number;
    lotNo: string;
    sellingMark: string;
    bags: number;
    totalWeight: number;
    tareWeight: number;
    sale: number;
    invoiceNo: string | null;
    askingPrice: number;
    adminCognitoId: string;
    country: string | null;
    manufactureDate: string;
    category: TeaCategory;
    grade: TeaGrade;
    broker: Broker;
    reprint: number;
    admin?: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
    history?: any[];
    sellingPrices?: {
        id: number;
        price: number;
        effectiveDate: string;
    }[];
    stock?: {
        id: number;
        batchNumber: string;
        lowStockThreshold: number | null;
        lastUpdated: string;
        createdAt: string;
    }[];
    shipmentItems?: {
        id: number;
        shipmentId: number;
        quantity: number;
    }[];
}

export interface Catalog {
    id: number;
    lotNo: string;
    sellingMark: string;
    invoiceNo: string | null;
    broker: Broker;
    sale: number;
    category: TeaCategory;
    country: string | null;
    grade: TeaGrade;
    bags: number;
    totalWeight: number;
    askingPrice: number;
    manufactureDate: string;
    tareWeight: number;
    reprint: number;
}


export interface Stock {
    id: number;
    catalogId: number;
    batchNumber: string;
    warehouse: string;
    lowStockThreshold: number | null;
    lastUpdated: string;
    createdAt: string;
    isLowStock: boolean;
    catalog: {
        id: number;
        lotNo: string;
        sellingMark: string;
        bags: number;
        totalWeight: number;
        askingPrice: number;
        category: TeaCategory;
        grade: TeaGrade;
        country: string | null;
        manufactureDate: string;
        sale: number;
        broker: Broker;
        invoiceNo: string | null;
        tareWeight: number;
        reprint: number;
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

export interface StockDetails {
    id: number;
    catalogId: number;
    batchNumber: string;
    warehouse: string;
    lowStockThreshold: number | null;
    isLowStock: boolean;
    lastUpdated: string;
    catalog: {
        id: number;
        lotNo: string;
        sellingMark: string;
        bags: number;
        totalWeight: number;
        invoiceNo: string | null;
        askingPrice: number;
        category: TeaCategory;
        grade: TeaGrade;
        country: string | null; // Renamed from origin
        manufactureDate: string;
        broker: Broker;
        tareWeight: number;
        reprint: number;
    };
}

export interface StockHistoryDetails {
    id: number;
    stockId: number;
    totalWeight: number;
    reason: string;
    updatedAt: string;
    shipmentId: number | null;
    adminId: string | null;
}

export interface StockFilters {
    lotNo?: string;
    minTotalWeight?: number;
    batchNumber?: string;
    warehouse?: string;
    userCognitoId?: string;
}

export interface SellingPriceDetails {
    id: number;
    catalogId: number;
    price: number;
    effectiveDate: string;
}

export interface ShipmentFilters {
    lotNo?: string;
    status?: ShipmentStatus;
    userCognitoId?: string;
}

export interface ShipmentFormData {
    lotNo: string;
    quantity: number | null;
    consignee: string;
    vessel: Vessel;
    shipmark: string;
    packagingInstructions: PackagingInstructions;
    additionalInstructions?: string;
}

export interface StockWithCatalog {
    id: number;
    catalogId: number;
    batchNumber: string;
    warehouse: string;
    lowStockThreshold: number | null;
    lastUpdated: Date;
    createdAt: Date;
    catalog: {
        id: number;
        lotNo: string;
        sellingMark: string;
        bags: number;
        totalWeight: number;
        invoiceNo: string | null;
        askingPrice: number;
        category: TeaCategory;
        grade: TeaGrade;
        country: string | null; // Renamed from origin
        manufactureDate: Date;
        broker: Broker;
        tareWeight: number;
        reprint: number;
        favorites: { userCognitoId: string }[];
    };
}

export interface ShipmentDetails {
    id: number;
    shipmentDate: string;
    status: ShipmentStatus;
    userCognitoId: string;
    consignee: string;
    vessel: Vessel;
    shipmark: string;
    packagingInstructions: PackagingInstructions;
    additionalInstructions: string | null;
    items: Array<{
        lotNo: string;
        quantity: number;
        catalog: {
            id: number;
            lotNo: string;
            sellingMark: string;
            bags: number;
            totalWeight: number;
        };
    }>;
    client: {
        id: number;
        userCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    };
}

export interface UpdateStockInput {
    id: number;
    lotNo?: string;
    batchNumber?: string;
    warehouse?: string;
    lowStockThreshold?: number | null;
}

interface InitialStateTypes {
    filters: FiltersState;
    isFiltersFullOpen: boolean;
    viewMode: "grid" | "list";
}

export const initialState: InitialStateTypes = {
    filters: {
        lotNo: undefined,
        sellingMark: undefined,
        country: undefined,
        manufactureDate: undefined,
        category: undefined,
        grade: undefined,
        broker: undefined,
        invoiceNo: undefined,
        askingPrice: undefined,
        bags: undefined,
        totalWeight: undefined,
        tareWeight: undefined,
        reprint: undefined,
        search: undefined,
        warehouse: undefined,
    },
    isFiltersFullOpen: false,
    viewMode: "grid",
};

export const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<FiltersState>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        toggleFiltersFullOpen: (state) => {
            state.isFiltersFullOpen = !state.isFiltersFullOpen;
        },
        setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
            state.viewMode = action.payload;
        },
    },
});

export const { setFilters, toggleFiltersFullOpen, setViewMode } = globalSlice.actions;

export default globalSlice.reducer;