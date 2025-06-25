import { Shipment } from "@/state/shipment";
import {Fragment} from "react";
import {XMarkIcon} from "@heroicons/react/24/outline";
import {format} from "date-fns";
import {Stock} from "@/state/stock";

class ReactI18NextChildren {
}

export interface AuthUserResponse {
    cognitoInfo: {
        signInDetails: {
            loginId: string;
        };
        username: string;
        userId: string;
    };
    userInfo: {
        userId: string;
        username: string;
        name: string;
        data: {
            data: User | Admin;
        };
        meta: {
            request: Record<string, any>;
            response: Record<string, any>;
        };
    };
    userRole: string;
}

export interface Admin {
    id: number;
    adminCognitoId: string;
    email: string;
    name: string;
    phoneNumber: string;
    role?: string;
    createdAt?: string;
}

export interface UserResponse {
    id: number;
    userCognitoId: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: "user" | "admin";
    createdAt: string;
    shipments?: Shipment[];
    assignedStocks?: Array<{
        id: number;
        stocksId: number;
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
        stocks: Stock | null;
    }>;
    favoritedStocks?: [];
}

export interface AuthenticatedUser {
    cognitoInfo: {
        userId: string;
    };
    userInfo: {
        id: number;
        userCognitoId: string;
        name: string;
        email: string;
        phoneNumber: string;
    };
    userRole: string;
}

export interface User {
    id: number;
    userCognitoId: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    createdAt: string;
    shipments?: Array<{
        id: number;
        shipmentDate: string;
        status: string;
        consignee: string;
        vessel: string;
        shipmark: string;
        packagingInstructions: string;
        additionalInstructions: string;
    }>;
    favoritedStocks?: Stock[];
    assignedStocks?: Array<{
        id: number;
        stocksId: number;
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
        stocks: Stock | null;
    }>;
}

export interface GetLoggedInUsersParams {
    page?: number;
    limit?: number;
    search?: string;
    includeShipments?: boolean;
    includeFavoritedStocks?: boolean;
    includeAssignedStocks?: boolean;
}

export interface GetLoggedInUsersResponse {
    status: string;
    data: {
        data: User[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages?: number;
        };
    };
}

export interface GetUserParams {
    userCognitoId: string;
    includeShipments?: boolean;
    includeAssignedStocks?: boolean;
}

export interface GetUserResponse {
    status: string;
    data: {
        cognitoInfo: { userId: string };
        userInfo: User;
        userRole: string;
    };
}
