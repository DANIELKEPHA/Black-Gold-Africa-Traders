import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

import {
    createUserSchema,
    getUserParamsSchema,
    getUserQuerySchema,
    updateUserParamsSchema,
    updateUserBodySchema,
    getLoggedInUsersQuerySchema,
    getUserStockHistoryQuerySchema,
    createContactSchema,
    getContactsSchema,
    deleteContactSchema,
} from "../schemas/userSchema";
import { UserDetails, ErrorResponse } from "../types";
import { successResponse, errorResponse } from "../lib/response";
import { logInfo, logError } from "../lib/logger";
import sanitizeHtml from "sanitize-html";


declare module "express-serve-static-core" {
    interface Request {
        user?: UserDetails;
    }
}

const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});

const checkAuth = (
    user: UserDetails | undefined,
    userCognitoId?: string,
    allowSelf: boolean = false,
): ErrorResponse | null => {
    if (!user) {
        return { message: "Unauthorized: No valid token provided" };
    }
    const isAdmin = user.role.toLowerCase() === "admin";
    const isSelf = allowSelf && user.userId === userCognitoId;
    if (!isAdmin && !isSelf) {
        return { message: "Forbidden: Admin role or self-access required" };
    }
    return null;
};

const serializeStocks = (stock: Prisma.StocksGetPayload<{}>) => ({
    id: stock.id,
    lotNo: stock.lotNo,
    mark: stock.mark || null,
    grade: stock.grade,
    invoiceNo: stock.invoiceNo || null,
    saleCode: stock.saleCode,
    broker: stock.broker,
    bags: stock.bags,
    weight: Number(stock.weight),
    purchaseValue: Number(stock.purchaseValue),
    totalPurchaseValue: Number(stock.totalPurchaseValue),
    agingDays: stock.agingDays,
    penalty: Number(stock.penalty),
    bgtCommission: Number(stock.bgtCommission),
    maerskFee: Number(stock.maerskFee),
    commission: Number(stock.commission),
    netPrice: Number(stock.netPrice),
    total: Number(stock.total),
    batchNumber: stock.batchNumber || null,
    lowStockThreshold: stock.lowStockThreshold ? Number(stock.lowStockThreshold) : null,
    adminCognitoId: stock.adminCognitoId,
    createdAt: stock.createdAt.toISOString(),
    updatedAt: stock.updatedAt.toISOString(),
});

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = getUserParamsSchema.safeParse(req.params);
        const query = getUserQuerySchema.safeParse(req.query);
        if (!params.success) {
            res.status(400).json(errorResponse("Invalid parameters", params.error.errors));
            return;
        }
        if (!query.success) {
            res.status(400).json(errorResponse("Invalid query parameters", query.error.errors));
            return;
        }
        const { userCognitoId } = params.data;
        const { includeShipments, includeAssignedStocks } = query.data;

        logInfo("Fetching user", {
            userCognitoId,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        const authError = checkAuth(req.user, userCognitoId, true);
        if (authError) {
            res.status(401).json(errorResponse(authError.message));
            return;
        }

        // Explicitly type the user query result to include relations
        type UserWithRelations = Prisma.UserGetPayload<{
            include: {
                shipments: boolean | {
                    select: {
                        id: true;
                        shipmentDate: true;
                        status: true;
                        consignee: true;
                        vessel: true;
                        shipmark: true;
                        packagingInstructions: true;
                        additionalInstructions: true;
                    };
                };
                assignments: boolean | {
                    select: {
                        id: true;
                        stocksId: true;
                        userCognitoId: true;
                        assignedWeight: true;
                        assignedAt: true;
                        stocks: {
                            select: {
                                id: true;
                                lotNo: true;
                                mark: true;
                                grade: true;
                                invoiceNo: true;
                                saleCode: true;
                                broker: true;
                                bags: true;
                                weight: true;
                                purchaseValue: true;
                                totalPurchaseValue: true;
                                agingDays: true;
                                penalty: true;
                                bgtCommission: true;
                                maerskFee: true;
                                commission: true;
                                netPrice: true;
                                total: true;
                                batchNumber: true;
                                lowStockThreshold: true;
                                adminCognitoId: true;
                                createdAt: true;
                                updatedAt: true;
                            };
                        };
                    };
                };
                favorites: boolean | {
                    select: {
                        id: true;
                        userCognitoId: true;
                        stocksId: true;
                        createdAt: true;
                        stocks: {
                            select: {
                                id: true;
                                lotNo: true;
                                mark: true;
                                grade: true;
                                invoiceNo: true;
                                saleCode: true;
                                broker: true;
                                bags: true;
                                weight: true;
                                purchaseValue: true;
                                totalPurchaseValue: true;
                                agingDays: true;
                                penalty: true;
                                bgtCommission: true;
                                maerskFee: true;
                                commission: true;
                                netPrice: true;
                                total: true;
                                batchNumber: true;
                                lowStockThreshold: true;
                                adminCognitoId: true;
                                createdAt: true;
                                updatedAt: true;
                            };
                        };
                    };
                };
            };
        }>;

        const user: UserWithRelations | null = await prisma.user.findUnique({
            where: { userCognitoId },
            include: {
                shipments: includeShipments
                    ? {
                        select: {
                            id: true,
                            shipmentDate: true,
                            status: true,
                            consignee: true,
                            vessel: true,
                            shipmark: true,
                            packagingInstructions: true,
                            additionalInstructions: true,
                        },
                    }
                    : false,
                assignments: includeAssignedStocks
                    ? {
                        select: {
                            id: true,
                            stocksId: true,
                            userCognitoId: true,
                            assignedWeight: true,
                            assignedAt: true,
                            stocks: true, // Simplified to reduce type complexity
                        },
                    }
                    : false,
                favorites: includeAssignedStocks
                    ? {
                        select: {
                            id: true,
                            userCognitoId: true,
                            stocksId: true,
                            createdAt: true,
                            stocks: true, // Simplified to reduce type complexity
                        },
                    }
                    : false,
            },
        });

        // Log raw assignments data for debugging
        if (includeAssignedStocks && user && user.assignments) {
            logInfo("Raw assignments data", {
                userCognitoId,
                assignments: user.assignments.map((a) => ({
                    id: a.id,
                    stocksId: a.stocksId,
                    hasStocks: !!(a as any).stocks,
                    stocksData: (a as any).stocks ? { id: (a as any).stocks.id, lotNo: (a as any).stocks.lotNo } : null,
                })),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
        }

        if (!user) {
            logInfo("User not found", {
                userCognitoId,
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
            res.status(404).json(errorResponse("User not found"));
            return;
        }

        logInfo("User retrieved", {
            userCognitoId,
            name: user.name,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(200).json(
            successResponse({
                cognitoInfo: { userId: user.userCognitoId },
                userInfo: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    createdAt: user.createdAt.toISOString(),
                    ...(includeShipments && {
                        shipments: user.shipments?.map((s) => ({
                            ...s,
                            shipmentDate: s.shipmentDate.toISOString(),
                        })) ?? [],
                    }),
                    ...(includeAssignedStocks && {
                        assignedStocks: user.assignments
                            ?.map((a) => ({
                                id: a.id,
                                stocksId: a.stocksId,
                                userCognitoId: a.userCognitoId,
                                assignedWeight: Number(a.assignedWeight),
                                assignedAt: a.assignedAt.toISOString(),
                                stocks: (a as any).stocks ? serializeStocks((a as any).stocks as Prisma.StocksGetPayload<{}>) : null,
                            }))
                            .filter((a) => a.stocks != null) ?? [],
                        favoritedStocks: user.favorites
                            ?.map((f) => ((f as any).stocks ? serializeStocks((f as any).stocks as Prisma.StocksGetPayload<{}>) : null))
                            .filter((f): f is NonNullable<typeof f> => f != null) ?? [],
                    }),
                },
                userRole: user.role,
            }),
        );
    } catch (error) {
        logError("Error retrieving user", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json(errorResponse("Internal server error"));
    } finally {
        await prisma.$disconnect();
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse("Invalid user data", parsed.error.errors));
            return;
        }

        const { userCognitoId, name, email, phoneNumber, role } = parsed.data;

        logInfo("Creating user", { userCognitoId, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });

        const user = await prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findFirst({
                where: {
                    OR: [{ userCognitoId }, { email: email ?? undefined }],
                },
            });
            if (existingUser) {
                throw new Error("User with this userCognitoId or email already exists");
            }

            return tx.user.create({
                data: {
                    userCognitoId,
                    name,
                    email,
                    phoneNumber,
                    role: role || "user",
                    createdAt: new Date(),
                },
                select: {
                    id: true,
                    userCognitoId: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                },
            });
        });

        logInfo("User created", { userCognitoId, name, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        res.status(201).json(
            successResponse({
                ...user,
                createdAt: user.createdAt.toISOString(),
            }),
        );
    } catch (error) {
        logError("Error creating user", { error, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        if (error instanceof Error && error.message.includes("already exists")) {
            res.status(409).json(errorResponse(error.message));
            return;
        }
        res.status(500).json(errorResponse("Internal server error"));
    } finally {
        await prisma.$disconnect();
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = updateUserParamsSchema.safeParse(req.params);
        const body = updateUserBodySchema.safeParse(req.body);
        if (!params.success) {
            res.status(400).json(errorResponse("Invalid parameters", params.error.errors));
            return;
        }
        if (!body.success) {
            res.status(400).json(errorResponse("Invalid user data", body.error.errors));
            return;
        }
        const { userCognitoId } = params.data;
        const data = body.data;

        logInfo("Updating user", { userCognitoId, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });

        const authError = checkAuth(req.user, userCognitoId, true);
        if (authError) {
            res.status(401).json(errorResponse(authError.message));
            return;
        }

        if (data.email) {
            const existingUser = await prisma.user.findFirst({
                where: { email: data.email, userCognitoId: { not: userCognitoId } },
            });
            if (existingUser) {
                res.status(409).json(errorResponse("Email is already in use by another user"));
                return;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { userCognitoId },
            data,
            select: {
                id: true,
                userCognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
            },
        });

        logInfo("User updated", { userCognitoId, name: updatedUser.name, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        res.status(200).json(
            successResponse({
                ...updatedUser,
                createdAt: updatedUser.createdAt.toISOString(),
            }),
        );
    } catch (error) {
        logError("Error updating user", { error, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json(errorResponse("User not found"));
                return;
            }
            if (error.code === "P2002") {
                res.status(409).json(errorResponse("Email is already in use"));
                return;
            }
        }
        res.status(500).json(errorResponse("Internal server error"));
    } finally {
        await prisma.$disconnect();
    }
};

export const getLoggedInUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = getLoggedInUsersQuerySchema.safeParse(req.query);
        if (!query.success) {
            res.status(400).json(errorResponse("Invalid query parameters", query.error.errors));
            return;
        }

        const { page, limit, search, includeShipments, includeFavoritedStocks, includeAssignedStocks } = query.data;

        logInfo("Fetching logged-in contact-forms", {
            page,
            limit,
            search,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        const authError = checkAuth(req.user, undefined, false);
        if (authError) {
            res.status(401).json(errorResponse(authError.message));
            return;
        }

        const where: Prisma.UserWhereInput = {
            role: { not: "admin" },
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            }),
        };

        // Explicitly type the user query result
        type UserWithRelations = Prisma.UserGetPayload<{
            include: {
                shipments: boolean | {
                    select: {
                        id: true;
                        shipmentDate: true;
                        status: true;
                        consignee: true;
                        vessel: true;
                        shipmark: true;
                        packagingInstructions: true;
                        additionalInstructions: true;
                    };
                };
                favorites: boolean | {
                    select: {
                        id: true;
                        userCognitoId: true;
                        stocksId: true;
                        createdAt: true;
                        stocks: {
                            select: {
                                id: true;
                                lotNo: true;
                                mark: true;
                                grade: true;
                                invoiceNo: true;
                                saleCode: true;
                                broker: true;
                                bags: true;
                                weight: true;
                                purchaseValue: true;
                                totalPurchaseValue: true;
                                agingDays: true;
                                penalty: true;
                                bgtCommission: true;
                                maerskFee: true;
                                commission: true;
                                netPrice: true;
                                total: true;
                                batchNumber: true;
                                lowStockThreshold: true;
                                adminCognitoId: true;
                                createdAt: true;
                                updatedAt: true;
                            };
                        };
                    };
                };
                assignments: boolean | {
                    select: {
                        id: true;
                        stocksId: true;
                        userCognitoId: true;
                        assignedWeight: true;
                        assignedAt: true;
                        stocks: {
                            select: {
                                id: true;
                                lotNo: true;
                                mark: true;
                                grade: true;
                                invoiceNo: true;
                                saleCode: true;
                                broker: true;
                                bags: true;
                                weight: true;
                                purchaseValue: true;
                                totalPurchaseValue: true;
                                agingDays: true;
                                penalty: true;
                                bgtCommission: true;
                                maerskFee: true;
                                commission: true;
                                netPrice: true;
                                total: true;
                                batchNumber: true;
                                lowStockThreshold: true;
                                adminCognitoId: true;
                                createdAt: true;
                                updatedAt: true;
                            };
                        };
                    };
                };
            };
        }>;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    shipments: includeShipments
                        ? {
                            select: {
                                id: true,
                                shipmentDate: true,
                                status: true,
                                consignee: true,
                                vessel: true,
                                shipmark: true,
                                packagingInstructions: true,
                                additionalInstructions: true,
                            },
                        }
                        : false,
                    favorites: includeFavoritedStocks
                        ? {
                            select: {
                                id: true,
                                userCognitoId: true,
                                stocksId: true,
                                createdAt: true,
                                stocks: true, // Simplified to reduce type complexity
                            },
                        }
                        : false,
                    assignments: includeAssignedStocks
                        ? {
                            select: {
                                id: true,
                                stocksId: true,
                                userCognitoId: true,
                                assignedWeight: true,
                                assignedAt: true,
                                stocks: true, // Simplified to reduce type complexity
                            },
                        }
                        : false,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }) as Promise<UserWithRelations[]>,
            prisma.user.count({ where }),
        ]);

        // Log raw assignments data for debugging
        if (includeAssignedStocks && users.length > 0) {
            logInfo("Raw assignments data", {
                assignments: users.map((u) => ({
                    userCognitoId: u.userCognitoId,
                    assignments: u.assignments?.map((a) => ({
                        id: a.id,
                        stocksId: a.stocksId,
                        hasStocks: !!(a as any).stocks, // Use type assertion for logging
                        stocksData: (a as any).stocks ? { id: (a as any).stocks.id, lotNo: (a as any).stocks.lotNo } : null,
                    })) ?? [],
                })),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
        }

        if (users.length === 0) {
            logInfo("No contact-forms found", {
                page,
                limit,
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
            res.status(404).json(errorResponse("No contact-forms found"));
            return;
        }

        logInfo(`Retrieved ${users.length} users`, {
            page,
            limit,
            total,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        res.status(200).json(
            successResponse({
                data: users.map((user) => ({
                    id: user.id,
                    userCognitoId: user.userCognitoId,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    createdAt: user.createdAt.toISOString(),
                    ...(includeShipments && {
                        shipments: user.shipments?.map((s) => ({
                            ...s,
                            shipmentDate: s.shipmentDate.toISOString(),
                        })) ?? [],
                    }),
                    ...(includeFavoritedStocks && {
                        favoritedStocks: user.favorites
                            ?.map((f) => ((f as any).stocks ? serializeStocks((f as any).stocks as Prisma.StocksGetPayload<{}>) : null))
                            .filter((f): f is NonNullable<typeof f> => f != null) ?? [],
                    }),
                    ...(includeAssignedStocks && {
                        assignedStocks: user.assignments
                            ?.map((a) => ({
                                id: a.id,
                                stocksId: a.stocksId,
                                userCognitoId: a.userCognitoId,
                                assignedWeight: Number(a.assignedWeight),
                                assignedAt: a.assignedAt.toISOString(),
                                stocks: (a as any).stocks ? serializeStocks((a as any).stocks as Prisma.StocksGetPayload<{}>) : null,
                            }))
                            .filter((a) => a.stocks != null) ?? [],
                    }),
                })),
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }),
        );
    } catch (error) {
        logError("Error retrieving logged-in contact-forms", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json(errorResponse("Internal server error"));
    } finally {
        await prisma.$disconnect();
    }
};

export const getUserStockHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const params = getUserParamsSchema.safeParse(req.params);
        const query = getUserStockHistoryQuerySchema.safeParse(req.query);
        if (!params.success) {
            res.status(400).json(errorResponse("Invalid parameters", params.error.errors));
            return;
        }
        if (!query.success) {
            res.status(400).json(errorResponse("Invalid query parameters", query.error.errors));
            return;
        }
        const { userCognitoId } = params.data;
        const { page, limit, search, sortBy, sortOrder } = query.data;

        logInfo("Fetching user stock assignment history", {
            userCognitoId,
            page,
            limit,
            search,
            sortBy,
            sortOrder,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        const authError = checkAuth(req.user, undefined, false);
        if (authError) {
            res.status(401).json(errorResponse(authError.message));
            return;
        }

        const where: Prisma.StockAssignmentWhereInput = {
            userCognitoId,
            ...(search && {
                stocks: {
                    OR: [
                        { lotNo: { contains: search, mode: "insensitive" } },
                        { invoiceNo: { contains: search, mode: "insensitive" } },
                        { saleCode: { contains: search, mode: "insensitive" } },
                    ],
                },
            }),
        };

        type StockAssignmentWithRelations = Prisma.StockAssignmentGetPayload<{
            include: {
                stocks: true;
            };
        }>;

        const [assignments, total] = await Promise.all([
            prisma.stockAssignment.findMany({
                where,
                include: {
                    stocks: true,
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }) as Promise<StockAssignmentWithRelations[]>,
            prisma.stockAssignment.count({ where }),
        ]);

        // Log raw assignments data for debugging
        if (assignments.length > 0) {
            logInfo("Raw stock assignment history", {
                userCognitoId,
                assignments: assignments.map((a) => ({
                    id: a.id,
                    stocksId: a.stocksId,
                    hasStocks: !!(a as any).stocks,
                    stocksData: (a as any).stocks ? { id: (a as any).stocks.id, lotNo: (a as any).stocks.lotNo } : null,
                })),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
        }

        if (assignments.length === 0) {
            logInfo("No stock assignments found", {
                userCognitoId,
                page,
                limit,
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
            res.status(404).json(errorResponse("No stock assignments found"));
            return;
        }

        logInfo(`Retrieved ${assignments.length} stock assignments`, {
            userCognitoId,
            page,
            limit,
            total,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        res.status(200).json(
            successResponse({
                data: assignments.map((a) => ({
                    id: a.id,
                    stocksId: a.stocksId,
                    userCognitoId: a.userCognitoId,
                    assignedWeight: Number(a.assignedWeight),
                    assignedAt: a.assignedAt.toISOString(),
                    stocks: (a as any).stocks ? serializeStocks((a as any).stocks as Prisma.StocksGetPayload<{}>) : null,
                })),
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }),
        );
    } catch (error) {
        logError("Error retrieving user stock assignment history", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json(errorResponse("Internal server error"));
    } finally {
        await prisma.$disconnect();
    }
};

// reCAPTCHA verification utility
// async function verifyRecaptcha(token: string): Promise<boolean> {
//     try {
//         const response = await axios.post(
//             `https://www.google.com/recaptcha/api/siteverify`,
//             null,
//             {
//                 params: {
//                     secret: process.env.RECAPTCHA_SECRET_KEY,
//                     response: token,
//                 },
//             }
//         );
//         return response.data.success && response.data.score >= 0.5;
//     } catch (error) {
//         logError("reCAPTCHA verification failed", {
//             error,
//             timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
//         });
//         return false;
//     }
// }

export const createContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = createContactSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse("Invalid contact data", parsed.error.errors));
            return;
        }

        const { name, email, subject, message, privacyConsent, userCognitoId } = parsed.data;

        logInfo("Processing contact form submission", {
            email,
            userCognitoId: userCognitoId || "anonymous",
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        // Verify reCAPTCHA
        // const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        // if (!isValidRecaptcha) {
        //     res.status(400).json(errorResponse("reCAPTCHA verification failed"));
        //     return;
        // }

        // Sanitize inputs
        const sanitizedData = {
            name: sanitizeHtml(name),
            email: sanitizeHtml(email),
            subject: subject ? sanitizeHtml(subject) : undefined,
            message: sanitizeHtml(message),
            privacyConsent,
            userCognitoId,
        };

        // Save to database
        const contact = await prisma.contact.create({
            data: {
                name: sanitizedData.name,
                email: sanitizedData.email,
                subject: sanitizedData.subject,
                message: sanitizedData.message,
                privacyConsent: sanitizedData.privacyConsent,
                userCognitoId: sanitizedData.userCognitoId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                subject: true,
                message: true,
                privacyConsent: true,
                userCognitoId: true,
                createdAt: true,
            },
        });

        logInfo("Contact submission created", {
            id: contact.id,
            email: contact.email,
            userCognitoId: contact.userCognitoId || "anonymous",
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });

        // Optional: Send email notification (e.g., using Nodemailer)
        /*
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: email,
          to: "admin@example.com",
          subject: subject || "New Contact Form Submission",
          text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}\nUserCognitoId: ${userCognitoId || "anonymous"}`,
        });
        */

        res.status(201).json(
            successResponse({
                id: contact.id,
                name: contact.name,
                email: contact.email,
                subject: contact.subject,
                message: contact.message,
                privacyConsent: contact.privacyConsent,
                userCognitoId: contact.userCognitoId,
                createdAt: contact.createdAt.toISOString(),
            })
        );
    } catch (error) {
        logError("Error creating contact submission", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json(errorResponse("Internal server error"));
    } finally {
        await prisma.$disconnect();
    }
};

export const getContacts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page, limit, search } = getContactsSchema.parse(req).query;

        logInfo('Fetching contact submissions', {
            page,
            limit,
            search,
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
        });

        const where: Prisma.ContactWhereInput = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                    {
                        subject: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
                    },
                ],
            }
            : {};

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    subject: true,
                    message: true,
                    privacyConsent: true,
                    userCognitoId: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.contact.count({ where }),
        ]);

        if (contacts.length === 0) {
            logInfo('No contact submissions found', {
                page,
                limit,
                timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
            });
            res.status(404).json({
                status: 'fail',
                message: 'No contact submissions found',
            });
            return;
        }

        logInfo(`Retrieved ${contacts.length} contact submissions`, {
            page,
            limit,
            total,
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
        });

        res.status(200).json({
            status: 'success',
            data: contacts.map((contact) => ({
                ...contact,
                createdAt: contact.createdAt.toISOString(),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logError('Error retrieving contact submissions', {
            error,
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
        });
        res.status(500).json({
            status: 'fail',
            message: 'Internal server error',
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteContact = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = deleteContactSchema.parse(req).params;

        logInfo('Deleting contact submission', {
            id,
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
        });

        const contact = await prisma.contact.delete({
            where: { id },
            select: { id: true },
        });

        logInfo('Contact submission deleted', {
            id: contact.id,
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
        });

        res.status(200).json({
            status: 'success',
            message: 'Contact submission deleted successfully',
        });
    } catch (error) {
        logError('Error deleting contact submission', {
            error,
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({
                status: 'fail',
                message: 'Contact submission not found',
            });
            return;
        }
        res.status(500).json({
            status: 'fail',
            message: 'Internal server error',
        });
    } finally {
        await prisma.$disconnect();
    }
};