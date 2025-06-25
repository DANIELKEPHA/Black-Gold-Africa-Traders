import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {Broker, ShipmentStatus, TeaCategory, TeaGrade, } from "@/state/enums";
import {Shipment} from "@/state/shipment";

// Define OutLots type based on Prisma schema
export type Outlot = {
    id: number;
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
    admin: { id: number; name: string | null; email: string | null } | null;
    createdAt: string;
    updatedAt: string;
};

export type CatalogResponse = {
    id: number;
    lotNo: string;
    sellingMark: string;
    grade: TeaGrade;
    invoiceNo: string | null;
    saleCode: string;
    category: TeaCategory;
    broker: Broker;
    reprint: number;
    bags: number;
    netWeight: number;
    totalWeight: number;
    askingPrice: number;
    producerCountry: string | null;
    manufactureDate: string;
    adminCognitoId: string;
    admin: { id: number; name: string | null; email: string | null } | null;
    createdAt: string;
    updatedAt: string;
};

export interface SellingPriceResponse {
    id: number;
    lotNo: string;
    sellingMark: string;
    bags: number;
    totalWeight: number;
    netWeight: number;
    invoiceNo: string;
    saleCode: string;
    askingPrice: number;
    purchasePrice: number;
    adminCognitoId: string;
    producerCountry: string | null;
    manufactureDate: string;
    category: string;
    grade: string;
    broker: string;
    reprint: number;
    createdAt: string;
    updatedAt: string;
    admin: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
}

// state/index.ts
export interface OutlotResponse {
    id: number;
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
    createdAt: string;
    updatedAt: string;
    admin: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
}

export interface StocksResponse {
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
    assignedWeight?: number | null;
    assignedAt?: string | null; // ← make optional
    assignments?: Array<{
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
    }>;
    adminCognitoId: string;
    admin?: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null; // ← make optional
    createdAt: string;
    updatedAt: string;
}

export interface FilterOptions {
    countries: string[];
    grades: TeaGrade[];
    categories: TeaCategory[];
    sale?: number;
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


export interface Notification {
    id: number;
    adminCognitoId: string;
    shipmentId: number;
    message: string;
    createdAt: string;
    read: boolean;
    shipment: Shipment;
}

export interface FiltersState {
    // Common fields across OutLots, SellingPrice, OutLots
    lotNo?: string;
    sellingMark?: string;
    grade?: TeaGrade | "any";
    invoiceNo?: string;
    broker?: Broker | "any";
    bags?: number;
    netWeight?: number;
    totalWeight?: number;
    manufactureDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    mark?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';

    // OutLots and SellingPrice specific
    saleCode?: string;
    category?: TeaCategory | "any";
    reprint?: number;
    askingPrice?: number;
    country?: string;
    purchasePrice?: number;
    producerCountry?: string;
    adminCognitoId?: string;

    // OutLots specific
    auction?: string;
    baselinePrice?: number;

    // RTK Query API specific
    favoriteIds?: number[];
    userCognitoId?: string;
    ids?: number[];
    showFavorites?: boolean;

    // Shipment-related (from existing FiltersState)
    shipmentId?: number;
    status?: ShipmentStatus;

    weight?: number;
    purchaseValue?: number;
    totalPurchaseValue?: number;
    agingDays?: number;
    penalty?: number;
    bgtCommission?: number;
    maerskFee?: number;
    commission?: number;
    netPrice?: number;
    total?: number;
    batchNumber?: string;
    lowStockThreshold?: number;

}

export interface AdminDetails {
    id: number;
    adminCognitoId: string;
    name: string;
    email: string;
    phoneNumber: string;
}

export interface StockHistoryDetails {
    id: number;
    stockId: number;
    quantity: number;
    reason: string;
    updatedAt: string;
    shipmentId: number | null;
    adminCognitoId: string | null;
    admin?: AdminDetails;
}

export interface OutLotsResponse {
    id: number;
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
    admin: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
}

export interface SellingPriceDetails {
    id: number;
    catalogId: number;
    price: number;
    effectiveDate: string;
}

interface InitialState {
    filters: FiltersState;
    isFiltersFullOpen: boolean;
    viewMode: "list" | "grid";
}

export const initialState: InitialState = {
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
        netWeight: undefined,
        reprint: undefined,
        search: undefined,
        sortBy: '',
        sortOrder: 'asc',
    },
    isFiltersFullOpen: true,
    viewMode: "list",
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