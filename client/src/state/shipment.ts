import { PackagingInstructions, ShipmentStatus, Vessel } from "@/state/enums";
import { Stock } from "@/state/stock";

export interface ShipmentFilters {
    stocksId?: number;
    status?: ShipmentStatus;
    page?: number;
    limit?: number;
    search?: string;
    userCognitoId?: string;
}

export interface ShipmentFormData {
    items: { stocksId: number; quantity: number }[];
    consignee: string;
    vessel: Vessel;
    shipmark: string;
    packagingInstructions: PackagingInstructions;
    additionalInstructions?: string;
    status?: ShipmentStatus;
}

export interface ShipmentHistory {
    id: number;
    shipmentId: number;
    userCognitoId: string;
    action: string;
    consignee?: string;
    vessel?: string;
    shipmark?: string;
    packagingInstructions?: string;
    additionalInstructions?: string;
    status?: string;
    item?: { stocksId: number; totalWeight: number }[];
    items?: any;
    createdAt: string;
}

export interface ShipmentItem {
    id: number;
    shipmentId: number;
    stocksId: number;
    quantity: number;
    stock: Stock;
}

export interface Shipment {
    id: number;
    status: ShipmentStatus;
    userCognitoId: string;
    shipmentDate: string;
    consignee: string;
    vessel: string;
    shipmark: string;
    packagingInstructions: string;
    additionalInstructions: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        userCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    };
    items: Array<{
        id: number;
        shipmentId: number;
        stocksId: number;
        quantity: number;
        stock: {
            id: number;
            saleCode: string | null;
            broker: string | null;
            lotNo: string;
            mark: string | null;
            grade: string | null;
            invoiceNo: string | null;
            bags: number;
            weight: number;
            purchaseValue: number;
            totalPurchaseValue: number;
            agingDays: number | null;
            penalty: number | null;
            bgtCommission: number | null;
            maerskFee: number | null;
            commission: number | null;
            netPrice: number | null;
            total: number | null;
            batchNumber: string | null;
            lowStockThreshold: number | null;
            adminCognitoId: string | null;
            createdAt: string;
            updatedAt: string;
        };
    }>;
}

export interface ShipmentResponse {
    data: Shipment[];
    meta: {
        page: number;
        limit: number;
        total?: number;
        totalPages?: number;
    };
}
