
import { Request, Response } from 'express';
import { UserDetails } from '../types';
import {Broker, Prisma, Shipment, ShipmentStatus, TeaGrade} from "@prisma/client";
import {z} from "zod";

export function authenticateUser(req: Request, res: Response): UserDetails | undefined {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    console.log(`[${time}] AuthenticateUser - Authorization Header:`, req.headers.authorization);
    console.log(`[${time}] AuthenticateUser - req.user:`, req.user);

    const authenticatedUser = req.user as UserDetails | undefined;
    if (!authenticatedUser) {
        console.log(`[${time}] No authenticated user found`);
        res.status(401).json({ message: 'Unauthorized: No valid token provided' });
        return undefined;
    }

    console.log(`[${time}] Authenticated user:`, authenticatedUser);
    return authenticatedUser;
}

export function buildShipmentWhereClause({
                                             stocksId,
                                             status,
                                             userCognitoId,
                                             search,
                                         }: {
    stocksId?: number;
    status?: ShipmentStatus;
    userCognitoId?: string;
    search?: string;
}): Prisma.ShipmentWhereInput {
    const where: Prisma.ShipmentWhereInput = {};

    if (userCognitoId) {
        where.userCognitoId = userCognitoId;
    }

    if (status) {
        where.status = status;
    }

    if (stocksId) {
        where.stocks = { some: { stocksId } };
    }

    if (search) {
        where.OR = [
            { shipmark: { contains: search, mode: 'insensitive' } },
            { consignee: { contains: search, mode: 'insensitive' } },
            {
                user: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                },
            },
            {
                stocks: {
                    some: {
                        stocks: {
                            OR: [
                                { lotNo: { contains: search, mode: 'insensitive' } },
                                { mark: { contains: search, mode: 'insensitive' } },
                                {
                                    grade: {
                                        equals: search as TeaGrade,
                                    }
                                },
                                {
                                    broker: {
                                        equals: search as Broker,
                                    }
                                },

                                { saleCode: { contains: search, mode: 'insensitive' } },
                            ],
                        },
                    },
                },
            },
        ];
    }

    return where;
}

export function formatPaginatedResponse(
    shipments: (Shipment & {
        user: {
            id: number;
            userCognitoId: string;
            name: string | null;
            email: string | null;
            phoneNumber: string | null;
        };
        stocks: {
            stocks: {
                id: number;
                lotNo: string;
                mark: string | null;
                bags: number;
                weight: number;
                purchaseValue: number | null;
                grade: string | null;
                broker: string | null;
                saleCode: string | null;
            };
            assignedWeight: number;
        }[];
    })[],
    page: number,
    limit: number,
    total?: number
): {
    data: {
        id: number;
        status: ShipmentStatus;
        userCognitoId: string;
        shipmentDate: string;
        consignee: string;
        vessel: string;
        shipmark: string;
        packagingInstructions: string;
        additionalInstructions: string | null;
        user: {
            id: number;
            userCognitoId: string;
            name: string | null;
            email: string | null;
            phoneNumber: string | null;
        };
        stocks: {
            stocks: {
                id: number;
                lotNo: string;
                mark: string | null;
                bags: number;
                weight: number;
                purchaseValue: number | null;
                grade: string | null;
                broker: string | null;
                saleCode: string | null;
            };
            assignedWeight: number;
        }[];
    }[];
    meta: {
        page: number;
        limit: number;
        total?: number;
        totalPages?: number;
    };
} {
    return {
        data: shipments.map((shipment) => ({
            ...shipment,
            shipmentDate: shipment.shipmentDate.toISOString(),
            user: {
                ...shipment.user,
                name: shipment.user.name,
                email: shipment.user.email,
                phoneNumber: shipment.user.phoneNumber,
            },
            stocks: shipment.stocks.map((item) => ({
                stocks: {
                    ...item.stocks,
                    mark: item.stocks.mark,
                    purchaseValue: item.stocks.purchaseValue,
                    grade: item.stocks.grade,
                    broker: item.stocks.broker,
                    saleCode: item.stocks.saleCode,
                },
                assignedWeight: item.assignedWeight,
            })),
        })),
        meta: {
            page,
            limit,
            ...(total !== undefined && {
                total,
                totalPages: Math.ceil(total / limit),
            }),
        },
    };
}

export function formatSingleShipmentResponse(
    shipment: Shipment & {
        user: {
            id: number;
            userCognitoId: string;
            name: string | null;
            email: string | null;
            phoneNumber: string | null;
        };
        stocks: {
            stocks: {
                id: number;
                lotNo: string;
                mark: string | null;
                bags: number;
                weight: number;
                purchaseValue: number | null;
                grade: string | null;
                broker: string | null;
                saleCode: string | null;
            };
            assignedWeight: number;
        }[];
    }
): {
    id: number;
    status: ShipmentStatus;
    userCognitoId: string;
    shipmentDate: string;
    consignee: string;
    vessel: string;
    shipmark: string;
    packagingInstructions: string;
    additionalInstructions: string | null;
    user: {
        id: number;
        userCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    };
    stocks: {
        stocks: {
            id: number;
            lotNo: string;
            mark: string | null;
            bags: number;
            weight: number;
            purchaseValue: number | null;
            grade: string | null;
            broker: string | null;
            saleCode: string | null;
        };
        assignedWeight: number;
    }[];
} {
    return {
        ...shipment,
        shipmentDate: shipment.shipmentDate.toISOString(),
        user: {
            ...shipment.user,
            name: shipment.user.name,
            email: shipment.user.email,
            phoneNumber: shipment.user.phoneNumber,
        },
        stocks: shipment.stocks.map((item) => ({
            stocks: {
                ...item.stocks,
                mark: item.stocks.mark,
                purchaseValue: item.stocks.purchaseValue,
                grade: item.stocks.grade,
                broker: item.stocks.broker,
                saleCode: item.stocks.saleCode,
            },
            assignedWeight: item.assignedWeight,
        })),
    };
}

export function logError(message: string, error: unknown) {
    const logTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    console.error(`[${logTime}] ${message}:`, error);
}

export function sendErrorResponse(res: Response, error: unknown) {
    if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid query parameters', details: error.errors });
        return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Shipment with shipmark already exists' });
            return;
        }
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Shipment not found' });
            return;
        }
    }
    res.status(500).json({
        message: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
    });
}