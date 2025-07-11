import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {Broker, ShipmentStatus, TeaCategory, TeaGrade, } from "@/state/enums";
import {Shipment} from "@/state/shipment";

// Define SellingPrice type based on Prisma schema
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
    reprint: string;
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
    reprint?: string;
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
    assignments: Array<{
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
        user?: {
            name?: string;
            email?: string;
        };
    }>;
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
    // Common fields across SellingPrice, OutLots, Catalog
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

    // SellingPrice and Catalog specific
    saleCode?: string;
    category?: TeaCategory | "any";
    reprint?: string | null;
    askingPrice?: number;
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
    selectAll?: boolean;
    assignmentStatus?: "all" | "assigned" | "unassigned";
    user?: string;
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
    isFiltersFullOpen: false,
    viewMode: "list",
};

export const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<FiltersState>>) => {
            const sanitizedPayload: Partial<FiltersState> = {
                lotNo: action.payload.lotNo ?? state.filters.lotNo,
                sellingMark: action.payload.sellingMark ?? state.filters.sellingMark,
                manufactureDate: action.payload.manufactureDate ?? state.filters.manufactureDate,
                category: action.payload.category ?? state.filters.category,
                grade: action.payload.grade ?? state.filters.grade,
                broker: action.payload.broker ?? state.filters.broker,
                invoiceNo: action.payload.invoiceNo ?? state.filters.invoiceNo,
                askingPrice: action.payload.askingPrice ?? state.filters.askingPrice,
                bags: action.payload.bags ?? state.filters.bags,
                totalWeight: action.payload.totalWeight ?? state.filters.totalWeight,
                netWeight: action.payload.netWeight ?? state.filters.netWeight,
                reprint: action.payload.reprint ?? state.filters.reprint,
                search: action.payload.search ?? state.filters.search,
                sortBy: action.payload.sortBy ?? state.filters.sortBy,
                sortOrder: action.payload.sortOrder ?? state.filters.sortOrder,
                saleCode: action.payload.saleCode ?? state.filters.saleCode,
                producerCountry: action.payload.producerCountry ?? state.filters.producerCountry,
                auction: action.payload.auction ?? state.filters.auction,
                baselinePrice: action.payload.baselinePrice ?? state.filters.baselinePrice,
                favoriteIds: action.payload.favoriteIds ?? state.filters.favoriteIds,
                userCognitoId: action.payload.userCognitoId ?? state.filters.userCognitoId,
                ids: action.payload.ids ?? state.filters.ids,
                showFavorites: action.payload.showFavorites ?? state.filters.showFavorites,
                shipmentId: action.payload.shipmentId ?? state.filters.shipmentId,
                status: action.payload.status ?? state.filters.status,
                weight: action.payload.weight ?? state.filters.weight,
                purchaseValue: action.payload.purchaseValue ?? state.filters.purchaseValue,
                totalPurchaseValue: action.payload.totalPurchaseValue ?? state.filters.totalPurchaseValue,
                agingDays: action.payload.agingDays ?? state.filters.agingDays,
                penalty: action.payload.penalty ?? state.filters.penalty,
                bgtCommission: action.payload.bgtCommission ?? state.filters.bgtCommission,
                maerskFee: action.payload.maerskFee ?? state.filters.maerskFee,
                commission: action.payload.commission ?? state.filters.commission,
                netPrice: action.payload.netPrice ?? state.filters.netPrice,
                total: action.payload.total ?? state.filters.total,
                batchNumber: action.payload.batchNumber ?? state.filters.batchNumber,
                lowStockThreshold: action.payload.lowStockThreshold ?? state.filters.lowStockThreshold,
                selectAll: action.payload.selectAll ?? state.filters.selectAll,
            };
            state.filters = { ...state.filters, ...sanitizedPayload };
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