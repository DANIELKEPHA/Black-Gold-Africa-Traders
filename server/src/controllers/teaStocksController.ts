import {NextFunction, Request, Response} from "express";
import {Broker, TeaGrade, Prisma, PrismaClient} from "@prisma/client";
import {z, ZodError} from "zod";
import { Parser } from "csv-parse";
import { Readable } from "stream";
import {
    getStockQuerySchema,
    createStockSchema,
    updateStockParamsSchema,
    updateStockBodySchema,
    getStockHistoryQuerySchema,
    toggleFavoriteSchema,
    assignStockSchema,
    unassignStockSchema,
    csvUploadSchema,
    uploadStocksCsvSchema, bulkAssignStockSchema,
} from "../schemas/teaStockSchemas";
import { createObjectCsvStringifier } from "csv-writer";
import { retryTransaction } from "../utils/database";
import {authenticateUser, logError, sendErrorResponse} from "../utils/controllerUtils";
import {UserDetails} from "../types";
import ExcelJS from "exceljs";

const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});

const logWithTimestamp = (message: string, data?: any) => {
    console.log(
        `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi", hour12: true })}] ${message}`,
        data ? JSON.stringify(data, null, 2) : "",
    );
};

const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
};

// Normalize field names for CSV headers
const normalizeFieldName = (field: string): string => {
    const cleanField = field.replace(/^\uFEFF/, "").trim();
    return cleanField
        .toLowerCase()
        .replace(/\s+|_+/g, "")
        .replace(/([a-z])([A-Z])/g, "$1$2")
        .replace(/^(.)/, (match) => match.toLowerCase());
};

// Mapping of normalized CSV field names to schema field names
const fieldNameMapping: { [key: string]: string } = {
    salecode: "saleCode",
    broker: "broker",
    lotno: "lotNo",
    mark: "mark",
    grade: "grade",
    invoiceno: "invoiceNo",
    bags: "bags",
    weight: "weight",
    purchasevalue: "purchaseValue",
    totalpurchasevalue: "totalPurchaseValue",
    agingdays: "agingDays",
    penalty: "penalty",
    bgtcommission: "bgtCommission",
    maerskfee: "maerskFee",
    commission: "commission",
    netprice: "netPrice",
    total: "total",
    batchnumber: "batchNumber",
    lowstockthreshold: "lowStockThreshold",
    admincognitoid: "adminCognitoId",
};

export const getStocks = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedQuery = getStockQuerySchema.safeParse({
            ...req.query,
            assignmentStatus: req.query.assignmentStatus || "all",
        });
        if (!parsedQuery.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                details: parsedQuery.error.errors,
            });
            return;
        }

        const {
            minWeight,
            batchNumber,
            lotNo,
            page = 1,
            limit = 10,
            grade,
            broker,
            search,
            onlyFavorites,
            assignmentStatus,
        } = parsedQuery.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized: No valid token provided" });
            return;
        }

        const userId = authenticatedUser.userId;
        const isAdmin = authenticatedUser.role.toLowerCase() === "admin";

        const where: Prisma.StocksWhereInput = {};
        if (minWeight !== undefined) {
            where.weight = { gte: minWeight };
        }
        if (batchNumber) {
            where.batchNumber = batchNumber;
        }
        if (lotNo) {
            where.lotNo = lotNo;
        }
        if (grade && grade !== "any") {
            where.grade = grade as TeaGrade;
        }
        if (broker && broker !== "any") {
            where.broker = broker as Broker;
        }
        if (search) {
            where.OR = [
                { lotNo: { contains: search, mode: "insensitive" } },
                { mark: { contains: search, mode: "insensitive" } },
                { saleCode: { contains: search, mode: "insensitive" } },
                { invoiceNo: { contains: search, mode: "insensitive" } },
            ];
        }
        if (onlyFavorites) {
            where.favorites = { some: { userCognitoId: userId } };
        }
        if (assignmentStatus !== "all") {
            where.assignments = assignmentStatus === "assigned" ? { some: {} } : { none: {} };
        }
        if (!isAdmin) {
            where.assignments = {
                some: { userCognitoId: userId },
            };
        }

        const [stocks, total] = await Promise.all([
            prisma.stocks.findMany({
                where,
                include: {
                    assignments: {
                        take: 1, // Ensure only one assignment per stock
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { updatedAt: "desc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            prisma.stocks.count({ where }),
        ]);

        res.status(200).json({
            data: stocks.map((stock) => ({
                id: stock.id,
                saleCode: stock.saleCode,
                broker: stock.broker,
                lotNo: stock.lotNo,
                mark: stock.mark,
                grade: stock.grade,
                invoiceNo: stock.invoiceNo,
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
                batchNumber: stock.batchNumber,
                lowStockThreshold: stock.lowStockThreshold ? Number(stock.lowStockThreshold) : null,
                createdAt: stock.createdAt.toISOString(),
                updatedAt: stock.updatedAt.toISOString(),
                assignments: stock.assignments.map((assignment) => ({
                    userCognitoId: assignment.userCognitoId,
                    assignedWeight: Number(assignment.assignedWeight),
                    assignedAt: assignment.assignedAt?.toISOString() ?? null,
                    user: assignment.user
                        ? {
                            name: assignment.user.name,
                            email: assignment.user.email,
                        }
                        : null,
                })),
            })),
            meta: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp(`Error retrieving stocks:`, error);
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};

export const createStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedBody = createStockSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid stock data", details: parsedBody.error.errors });
            return;
        }
        const {
            saleCode,
            broker,
            lotNo,
            mark,
            grade,
            invoiceNo,
            bags,
            weight,
            purchaseValue,
            batchNumber,
            lowStockThreshold,
            assignments,
        } = parsedBody.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser || authenticatedUser.role.toLowerCase() !== "admin") {
            res.status(403).json({ message: "Forbidden: Only admins can create stock" });
            return;
        }

        const stock = await retryTransaction(async (tx) => {
            const newStock = await tx.stocks.create({
                data: {
                    saleCode,
                    broker: broker as Broker,
                    lotNo,
                    mark,
                    grade: grade as TeaGrade,
                    invoiceNo,
                    bags,
                    weight,
                    purchaseValue,
                    totalPurchaseValue: purchaseValue * weight,
                    agingDays: 0,
                    penalty: 0,
                    bgtCommission: 0,
                    maerskFee: 0,
                    commission: 0,
                    netPrice: purchaseValue,
                    total: purchaseValue * weight,
                    batchNumber,
                    lowStockThreshold,
                    adminCognitoId: authenticatedUser.userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            if (assignments && assignments.length > 0) {
                // Ensure stock is not already assigned (unlikely for new stock, but included for consistency)
                const existingAssignments = await tx.stockAssignment.findMany({
                    where: { stocksId: newStock.id },
                    select: { userCognitoId: true },
                });
                if (existingAssignments.length > 0) {
                    logWithTimestamp('createStock: Stock already assigned', {
                        stockId: newStock.id,
                        assignedTo: existingAssignments.map(a => a.userCognitoId),
                    });
                    throw new Error(`Stock ${newStock.id} is already assigned to user(s): ${existingAssignments.map(a => a.userCognitoId).join(', ')}`);
                }

                const totalAssigned = assignments.reduce((sum, a) => sum + a.assignedWeight, 0);
                if (totalAssigned > newStock.weight) {
                    throw new Error(`Total assigned weight (${totalAssigned}) exceeds stock weight (${newStock.weight})`);
                }
                for (const assignment of assignments) {
                    const user = await tx.user.findUnique({
                        where: { userCognitoId: assignment.userCognitoId },
                        select: { userCognitoId: true },
                    });
                    if (!user) {
                        throw new Error(`User with Cognito ID ${assignment.userCognitoId} not found`);
                    }
                    await tx.stockAssignment.create({
                        data: {
                            stocksId: newStock.id,
                            userCognitoId: assignment.userCognitoId,
                            assignedWeight: assignment.assignedWeight,
                            assignedAt: new Date(),
                        },
                    });
                    await tx.stockHistory.create({
                        data: {
                            stocksId: newStock.id,
                            action: "Stock Assigned",
                            adminCognitoId: authenticatedUser.userId,
                            userCognitoId: assignment.userCognitoId,
                            timestamp: new Date(),
                            details: { assignedWeight: assignment.assignedWeight },
                        },
                    });
                }
            }

            return newStock;
        }, 3, prisma);

        res.status(201).json({
            id: stock.id,
            saleCode: stock.saleCode,
            broker: stock.broker,
            lotNo: stock.lotNo,
            mark: stock.mark,
            grade: stock.grade,
            invoiceNo: stock.invoiceNo,
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
            batchNumber: stock.batchNumber,
            lowStockThreshold: stock.lowStockThreshold ? Number(stock.lowStockThreshold) : null,
            createdAt: stock.createdAt.toISOString(),
            updatedAt: stock.updatedAt.toISOString(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp(`Error creating stock:`, error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Invalid stock data", details: error.errors });
            return;
        }
        if (error instanceof Error && error.message.includes('Stock is already assigned')) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};

export const updateStock = async (req: Request, res: Response): Promise<void> => {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        console.log(`[${time}] Parsing params:`, req.params);
        const parsedParams = updateStockParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            console.error(`[${time}] Invalid parameters:`, parsedParams.error.errors);
            res.status(400).json({ message: 'Invalid parameters', details: parsedParams.error.errors });
            return;
        }

        console.log(`[${time}] Parsing body:`, req.body);
        const parsedBody = updateStockBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            console.error(`[${time}] Invalid stock data:`, parsedBody.error.errors);
            res.status(400).json({ message: 'Invalid stock data', details: parsedBody.error.errors });
            return;
        }

        const { id } = parsedParams.data;
        const {
            saleCode,
            broker,
            lotNo,
            mark,
            grade,
            invoiceNo,
            bags,
            weight,
            purchaseValue,
            totalPurchaseValue,
            agingDays,
            penalty,
            bgtCommission,
            maerskFee,
            commission,
            netPrice,
            total,
            batchNumber,
            lowStockThreshold,
            adminCognitoId,
            assignments,
        } = parsedBody.data;

        console.log(`[${time}] Authenticating user`);
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            console.log(`[${time}] Authentication failed`);
            return;
        }

        if (authenticatedUser.role.toLowerCase() !== 'admin') {
            console.log(`[${time}] Forbidden: User role=${authenticatedUser.role}`);
            res.status(403).json({ message: 'Forbidden: Only admins can update stock' });
            return;
        }

        const updatedStock = await retryTransaction(async (tx) => {
            console.log(`[${time}] Finding stock: ${id}`);
            const stock = await tx.stocks.findUnique({
                where: { id },
                include: { assignments: true },
            });

            if (!stock) {
                console.log(`[${time}] Stock not found: ${id}`);
                throw new Error(`Stock with ID ${id} not found`);
            }

            if (adminCognitoId) {
                const admin = await tx.admin.findUnique({ where: { adminCognitoId } });
                if (!admin) {
                    console.log(`[${time}] Admin not found: ${adminCognitoId}`);
                    throw new Error(`Admin with Cognito ID ${adminCognitoId} not found`);
                }
            }

            if (assignments && assignments.length > 0) {
                // Check for existing assignments
                const existingAssignments = await tx.stockAssignment.findMany({
                    where: { stocksId: id },
                    select: { userCognitoId: true },
                });
                if (existingAssignments.length > 0) {
                    console.log(`[${time}] Stock already assigned`, {
                        stockId: id,
                        assignedTo: existingAssignments.map(a => a.userCognitoId),
                    });
                    throw new Error(`Stock ${id} is already assigned to user(s): ${existingAssignments.map(a => a.userCognitoId).join(', ')}`);
                }

                const totalAssigned = assignments.reduce((sum, a) => sum + a.assignedWeight, 0);
                const effectiveWeight = weight ?? stock.weight;
                if (totalAssigned > effectiveWeight) {
                    console.log(`[${time}] Total assigned weight (${totalAssigned}) exceeds stock weight (${effectiveWeight})`);
                    throw new Error(`Total assigned weight (${totalAssigned}) exceeds stock weight (${effectiveWeight})`);
                }
                for (const assignment of assignments) {
                    const user = await tx.user.findUnique({
                        where: { userCognitoId: assignment.userCognitoId },
                        select: { userCognitoId: true },
                    });
                    if (!user) {
                        console.log(`[${time}] User not found: ${assignment.userCognitoId}`);
                        throw new Error(`User with Cognito ID ${assignment.userCognitoId} not found`);
                    }
                    await tx.stockAssignment.create({
                        data: {
                            stocksId: id,
                            userCognitoId: assignment.userCognitoId,
                            assignedWeight: assignment.assignedWeight,
                            assignedAt: new Date(),
                        },
                    });
                    await tx.stockHistory.create({
                        data: {
                            stocksId: id,
                            action: 'Stock Assigned',
                            adminCognitoId: authenticatedUser.userId,
                            userCognitoId: assignment.userCognitoId,
                            timestamp: new Date(),
                            details: { assignedWeight: assignment.assignedWeight },
                        },
                    });
                }
            }

            console.log(`[${time}] Updating stock: ${id}`);
            const updated = await tx.stocks.update({
                where: { id },
                data: {
                    saleCode,
                    broker: broker as Broker,
                    lotNo,
                    mark,
                    grade: grade as TeaGrade,
                    invoiceNo,
                    bags,
                    weight,
                    purchaseValue,
                    totalPurchaseValue,
                    agingDays,
                    penalty,
                    bgtCommission,
                    maerskFee,
                    commission,
                    netPrice,
                    total,
                    batchNumber,
                    lowStockThreshold,
                    adminCognitoId,
                    updatedAt: new Date(),
                },
                include: {
                    assignments: {
                        select: { userCognitoId: true, assignedWeight: true, assignedAt: true },
                    },
                },
            });

            console.log(`[${time}] Creating stock history for update`);
            await tx.stockHistory.create({
                data: {
                    stocksId: id,
                    action: 'UPDATED',
                    userCognitoId: authenticatedUser.userId,
                    details: {
                        saleCode: updated.saleCode,
                        broker: updated.broker,
                        lotNo: updated.lotNo,
                        mark: updated.mark,
                        grade: updated.grade,
                        invoiceNo: updated.invoiceNo,
                        bags: updated.bags,
                        weight: updated.weight,
                        purchaseValue: updated.purchaseValue,
                        totalPurchaseValue: updated.totalPurchaseValue,
                        agingDays: updated.agingDays,
                        penalty: updated.penalty,
                        bgtCommission: updated.bgtCommission,
                        maerskFee: updated.maerskFee,
                        commission: updated.commission,
                        netPrice: updated.netPrice,
                        total: updated.total,
                        batchNumber: updated.batchNumber,
                        lowStockThreshold: updated.lowStockThreshold,
                        adminCognitoId: updated.adminCognitoId,
                        reason: 'Stock updated by admin',
                    },
                    timestamp: new Date(),
                },
            });

            return updated;
        }, 3, prisma);

        console.log(`[${time}] Stock updated: ${id}`);
        res.status(200).json({
            id: updatedStock.id,
            saleCode: updatedStock.saleCode,
            broker: updatedStock.broker,
            lotNo: updatedStock.lotNo,
            mark: updatedStock.mark,
            grade: updatedStock.grade,
            invoiceNo: updatedStock.invoiceNo,
            bags: updatedStock.bags,
            weight: Number(updatedStock.weight),
            purchaseValue: Number(updatedStock.purchaseValue),
            totalPurchaseValue: Number(updatedStock.totalPurchaseValue),
            agingDays: updatedStock.agingDays,
            penalty: Number(updatedStock.penalty),
            bgtCommission: Number(updatedStock.bgtCommission),
            maerskFee: Number(updatedStock.maerskFee),
            commission: Number(updatedStock.commission),
            netPrice: Number(updatedStock.netPrice),
            total: Number(updatedStock.total),
            batchNumber: updatedStock.batchNumber,
            lowStockThreshold: updatedStock.lowStockThreshold ? Number(updatedStock.lowStockThreshold) : null,
            adminCognitoId: updatedStock.adminCognitoId,
            createdAt: updatedStock.createdAt.toISOString(),
            updatedAt: updatedStock.updatedAt.toISOString(),
            assignments: updatedStock.assignments.map((assignment) => ({
                userCognitoId: assignment.userCognitoId,
                assignedWeight: Number(assignment.assignedWeight),
                assignedAt: assignment.assignedAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error(`[${time}] Error updating stock with ID ${req.params.id}:`, error);
        logError(`Error updating stock with ID ${req.params.id}`, error);
        if (error instanceof Error && error.message.includes('Stock is already assigned')) {
            res.status(400).json({ message: error.message });
            return;
        }
        sendErrorResponse(res, error);
    } finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        await prisma.$disconnect();
    }
};

export const deleteStocks = async (req: Request, res: Response): Promise<void> => {
    const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });

    try {
        console.log(`[${time}] [DELETE /stocks] Raw request body:`, req.body);

        const parsedBody = z.object({
            ids: z.array(z.number().int().positive("Stock IDs must be positive integers")),
        }).safeParse(req.body);

        if (!parsedBody.success) {
            console.error(`[${time}] Validation failed:`, parsedBody.error.errors);
            res.status(400).json({ message: "Invalid input data", details: parsedBody.error.errors });
            return;

        }

        const { ids } = parsedBody.data;
        console.log(`[${time}] Validated IDs for deletion:`, ids);

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            console.error(`[${time}] No authenticated user found.`);
            res.status(401).json({ message: "Authentication failed" });
            return;
        }

        if (authenticatedUser.role.toLowerCase() !== "admin") {
            console.warn(`[${time}] Forbidden: Non-admin attempted deletion. Role: ${authenticatedUser.role}`);
            res.status(403).json({ message: "Forbidden: Only admins can delete stocks" });
            return;
        }


        console.log(`[${time}] Authenticated admin:`, authenticatedUser.userId);

        const result = await retryTransaction(async (tx) => {
            console.log(`[${time}] Fetching stock records for IDs:`, ids);
            const stockRecords = await tx.stocks.findMany({
                where: { id: { in: ids } },
                select: { id: true, lotNo: true },
            });

            console.log(`[${time}] Found ${stockRecords.length} stock records to delete`);

            for (const stock of stockRecords) {
                console.log(`[${time}] Logging deletion in stockHistory for lotNo ${stock.lotNo}`);
                await tx.stockHistory.create({
                    data: {
                        stocksId: stock.id,
                        action: "Stock Deleted",
                        adminCognitoId: authenticatedUser.userId,
                        timestamp: new Date(),
                        details: { lotNo: stock.lotNo },
                    },
                });
            }

            console.log(`[${time}] Deleting stock assignments...`);
            await tx.stockAssignment.deleteMany({
                where: { stocksId: { in: ids } },
            });

            console.log(`[${time}] Deleting stocks...`);
            await tx.stocks.deleteMany({
                where: { id: { in: ids } },
            });

            console.log(`[${time}] Stocks and assignments deleted successfully.`);
            return stockRecords;
        }, 3, prisma);

        console.log(`[${time}] Transaction completed. Returning response...`);
        res.status(200).json({
            message: "Stocks and associated assignments deleted successfully",
            associations: result.map((s) => ({ id: s.id, lotNo: s.lotNo })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[${time}] Error deleting stocks:`, error);
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        await prisma.$disconnect();
    }
};

export async function adjustStock(
    stocksId: number,
    weight: number,
    reason: string,
    userCognitoId: string,
    shipmentId: number | undefined,
    tx: PrismaClient | Prisma.TransactionClient
): Promise<void> {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    console.log(`[${time}] Adjusting stock: stocksId=${stocksId}, weight=${weight}, reason=${reason}`);

    try {
        const stock = await tx.stocks.findUnique({
            where: { id: stocksId },
            select: {
                id: true,
                lotNo: true,
                mark: true,
                bags: true,
                weight: true,
                purchaseValue: true,
                grade: true,
                broker: true,
                saleCode: true,
            },
        });

        if (!stock) {
            console.error(`[${time}] Stock not found: stocksId=${stocksId}`);
            throw new Error(`Stock with ID ${stocksId} not found`);
        }

        const weightPerBag = stock.bags > 0 ? Number((stock.weight / stock.bags).toFixed(2)) : 0;
        const bagsToAdjust = weightPerBag > 0 ? Math.ceil(Math.abs(weight) / weightPerBag) * (weight >= 0 ? 1 : -1) : 0;

        const newWeight = stock.weight + weight;
        const newBags = stock.bags + bagsToAdjust;

        if (newWeight < 0 || newBags < 0) {
            console.error(`[${time}] Invalid adjustment: newWeight=${newWeight}, newBags=${newBags}`);
            throw new Error(`Adjustment would result in negative weight (${newWeight}) or bags (${newBags})`);
        }

        await tx.stocks.update({
            where: { id: stocksId },
            data: {
                weight: newWeight,
                bags: newBags,
                updatedAt: new Date(),
            },
        });

        await tx.stockHistory.create({
            data: {
                stocksId,
                action: weight >= 0 ? 'RESTORED' : 'REDUCED',
                userCognitoId,
                shipmentId,
                details: {
                    lotNo: stock.lotNo,
                    mark: stock.mark,
                    bags: newBags,
                    weight: newWeight,
                    purchaseValue: stock.purchaseValue,
                    grade: stock.grade,
                    broker: stock.broker,
                    saleCode: stock.saleCode,
                    reason,
                },
                timestamp: new Date(),
            },
        });

        console.log(`[${time}] Stock adjusted successfully: stocksId=${stocksId}, weight=${weight}, bags=${bagsToAdjust}`);
    } catch (error) {
        console.error(`[${time}] Error adjusting stock: stocksId=${stocksId}`, error);
        throw error;
    }
}

export async function adjustStockHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        console.log(`[${time}] Handling POST /stocks/adjust, body:`, req.body);

        const { stocksId, weight, reason, shipmentId } = req.body;
        const user = req.user as UserDetails;

        if (!user) {
            console.log(`[${time}] Authentication failed`);
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        if (user.role.toLowerCase() !== 'admin') {
            console.log(`[${time}] Forbidden: User role=${user.role}`);
            res.status(403).json({ message: 'Forbidden: Only admins can adjust stock' });
            return;
        }

        await retryTransaction(async (tx) => {
            await adjustStock(stocksId, weight, reason, user.userId, shipmentId, tx);
        }, 3, prisma);

        console.log(`[${time}] Stock adjustment completed: stocksId=${stocksId}`);
        res.status(200).json({ message: `Stock ${stocksId} adjusted successfully` });
    } catch (error) {
        console.error(`[${time}] Error in adjustStockHandler:`, error);
        logError('Error adjusting stock', error);
        sendErrorResponse(res, error);
    } finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        await prisma.$disconnect();
    }
}

export const getStockHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedQuery = getStockHistoryQuerySchema.safeParse({
            ...req.query,
            stockId: req.params.id ? parseInt(req.params.id, 10) : undefined,
        });
        if (!parsedQuery.success) {
            res.status(400).json({ message: "Invalid query parameters", details: parsedQuery.error.errors });
            return;
        }

        const { stockId, shipmentId, adminCognitoId, page, limit, includeStock, includeShipment, includeAdmin } = parsedQuery.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized: No valid token provided" });
            return;
        }

        const isAdmin = authenticatedUser.role.toLowerCase() === "admin";
        let effectiveAdminCognitoId = adminCognitoId;
        if (!isAdmin && !adminCognitoId) {
            effectiveAdminCognitoId = authenticatedUser.userId;
        } else if (!isAdmin && adminCognitoId && adminCognitoId !== authenticatedUser.userId) {
            res.status(403).json({
                message: "Forbidden: You can only access your own stock history or need admin privileges",
            });
            return;
        }

        const where: Prisma.StockHistoryWhereInput = {};
        if (stockId) {
            where.stocksId = stockId;
        }
        if (shipmentId) {
            where.shipmentId = shipmentId;
        }
        if (effectiveAdminCognitoId) {
            where.adminCognitoId = effectiveAdminCognitoId;
        }

        const [stockHistories, total] = await Promise.all([
            prisma.stockHistory.findMany({
                where,
                include: {
                    stocks: includeStock
                        ? {
                            select: {
                                id: true,
                                lotNo: true,
                                batchNumber: true,
                                lowStockThreshold: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        }
                        : undefined,
                    shipment: includeShipment
                        ? {
                            select: {
                                id: true,
                                shipmentDate: true,
                                status: true,
                                userCognitoId: true,
                                consignee: true,
                                vessel: true,
                                shipmark: true,
                            },
                        }
                        : undefined,
                    admin: includeAdmin
                        ? {
                            select: {
                                id: true,
                                adminCognitoId: true,
                                name: true,
                                email: true,
                                phoneNumber: true,
                            },
                        }
                        : undefined,
                },
                orderBy: { timestamp: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.stockHistory.count({ where }),
        ]);

        res.status(200).json({
            data: stockHistories.map((history) => ({
                id: history.id,
                stockId: history.stocksId,
                action: history.action,
                timestamp: history.timestamp.toISOString(),
                userCognitoId: history.userCognitoId,
                adminCognitoId: history.adminCognitoId,
                details: history.details,
                stock: history.stocks
                    ? {
                        id: history.stocks.id,
                        lotNo: history.stocks.lotNo,
                        batchNumber: history.stocks.batchNumber,
                        lowStockThreshold: history.stocks.lowStockThreshold !== null ? Number(history.stocks.lowStockThreshold) : null,
                        createdAt: history.stocks.createdAt.toISOString(),
                        updatedAt: history.stocks.updatedAt.toISOString(),
                    }
                    : undefined,
                shipment: history.shipment
                    ? {
                        id: history.shipment.id,
                        shipmentDate: history.shipment.shipmentDate.toISOString(),
                        status: history.shipment.status,
                        userCognitoId: history.shipment.userCognitoId,
                        consignee: history.shipment.consignee,
                        vessel: history.shipment.vessel,
                        shipmark: history.shipment.shipmark,
                    }
                    : undefined,
                admin: history.admin
                    ? {
                        id: history.admin.id,
                        adminCognitoId: history.admin.adminCognitoId,
                        name: history.admin.name,
                        email: history.admin.email,
                        phoneNumber: history.admin.phoneNumber,
                    }
                    : undefined,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp(`Error retrieving stock history:`, error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Invalid query parameters", details: error.errors });
            return;
        }
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};

export const uploadStocksCsv = async (req: Request, res: Response): Promise<void> => {
    const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi", hour12: true });
    try {
        logWithTimestamp(`Starting uploadStocksCsv:`, {
            method: req.method,
            headers: req.headers,
            body: req.body,
            file: req.file
                ? {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                }
                : "No file provided",
        });

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            logWithTimestamp(`Authentication failed: No authenticated user found`);
            res.status(401).json({ message: "Authentication failed: No authenticated user found" });
            return;
        }
        logWithTimestamp(`Authenticated user:`, {
            userId: authenticatedUser.userId,
            role: authenticatedUser.role,
        });

        if (authenticatedUser.role.toLowerCase() !== "admin") {
            logWithTimestamp(`Forbidden: Only admins can upload stocks`, {
                userRole: authenticatedUser.role,
            });
            res.status(403).json({ message: "Forbidden: Only admins can upload stocks" });
            return;
        }

        if (!req.file) {
            logWithTimestamp(`No CSV file provided in request`);
            res.status(400).json({ message: "CSV file required" });
            return;
        }
        logWithTimestamp(`File received:`, {
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });

        const parsedParams = csvUploadSchema.safeParse(req.body);
        if (!parsedParams.success) {
            logWithTimestamp(`Invalid duplicateAction:`, {
                body: req.body,
                errors: parsedParams.error.errors,
            });
            res.status(400).json({ message: "Invalid duplicateAction", details: parsedParams.error.errors });
            return;
        }
        const { duplicateAction } = parsedParams.data;
        logWithTimestamp(`Duplicate action: ${duplicateAction}`);

        const errors: Array<{ row: number; message: string }> = [];
        const validStocks: Array<{
            stock: Prisma.StocksCreateInput;
            rowIndex: number;
        }> = [];

        let rowIndex = 1;

        // Remove BOM from the file buffer if present
        let csvBuffer = req.file.buffer;
        if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
            csvBuffer = csvBuffer.slice(3);
            logWithTimestamp(`Removed BOM from CSV file`);
        }

        const parser = new Parser({
            columns: (header) => {
                const normalizedHeaders = header.map((field: string) => {
                    const normalized = normalizeFieldName(field);
                    const mappedField = fieldNameMapping[normalized] || normalized;
                    logWithTimestamp(`Mapping CSV header '${field}' to '${mappedField}'`);
                    return mappedField;
                });
                return normalizedHeaders;
            },
            skip_empty_lines: true,
            trim: true,
        });

        const stream = Readable.from(csvBuffer);
        stream.pipe(parser);

        logWithTimestamp(`Starting CSV parsing`);
        for await (const record of parser) {
            rowIndex++;
            logWithTimestamp(`Row ${rowIndex}: Raw record:`, record);

            try {
                const parsedRecord = {
                    ...record,
                    bags: record.bags ? Number(record.bags) : undefined,
                    weight: record.weight ? Number(record.weight) : undefined,
                    purchaseValue: record.purchaseValue ? Number(record.purchaseValue) : undefined,
                    totalPurchaseValue: record.totalPurchaseValue ? Number(record.totalPurchaseValue) : undefined,
                    agingDays: record.agingDays ? Number(record.agingDays) : undefined,
                    penalty: record.penalty ? Number(record.penalty) : undefined,
                    bgtCommission: record.bgtCommission ? Number(record.bgtCommission) : undefined,
                    maerskFee: record.maerskFee ? Number(record.maerskFee) : undefined,
                    commission: record.commission ? Number(record.commission) : undefined,
                    netPrice: record.netPrice ? Number(record.netPrice) : undefined,
                    total: record.total ? Number(record.total) : undefined,
                    lowStockThreshold: record.lowStockThreshold ? Number(record.lowStockThreshold) : undefined,
                    batchNumber: record.batchNumber || undefined,
                    adminCognitoId: authenticatedUser.userId,
                };

                if (parsedRecord.bags && isNaN(parsedRecord.bags)) throw new Error("Invalid number format for bags");
                if (parsedRecord.weight && isNaN(parsedRecord.weight)) throw new Error("Invalid number format for weight");
                if (parsedRecord.purchaseValue && isNaN(parsedRecord.purchaseValue)) throw new Error("Invalid number format for purchaseValue");
                if (parsedRecord.totalPurchaseValue && isNaN(parsedRecord.totalPurchaseValue)) throw new Error("Invalid number format for totalPurchaseValue");
                if (parsedRecord.agingDays && isNaN(parsedRecord.agingDays)) throw new Error("Invalid number format for agingDays");
                if (parsedRecord.penalty && isNaN(parsedRecord.penalty)) throw new Error("Invalid number format for penalty");
                if (parsedRecord.bgtCommission && isNaN(parsedRecord.bgtCommission)) throw new Error("Invalid number format for bgtCommission");
                if (parsedRecord.maerskFee && isNaN(parsedRecord.maerskFee)) throw new Error("Invalid number format for maerskFee");
                if (parsedRecord.commission && isNaN(parsedRecord.commission)) throw new Error("Invalid number format for commission");
                if (parsedRecord.netPrice && isNaN(parsedRecord.netPrice)) throw new Error("Invalid number format for netPrice");
                if (parsedRecord.total && isNaN(parsedRecord.total)) throw new Error("Invalid number format for total");
                if (parsedRecord.lowStockThreshold && isNaN(parsedRecord.lowStockThreshold)) throw new Error("Invalid number format for lowStockThreshold");

                const parsed = uploadStocksCsvSchema.safeParse(parsedRecord);

                if (!parsed.success) {
                    logWithTimestamp(`Row ${rowIndex}: Parse error:`, {
                        errors: parsed.error.errors,
                        rawRecord: record,
                    });
                    throw new Error(parsed.error.errors.map((err) => err.message).join(", "));
                }

                const data = parsed.data;
                validStocks.push({
                    stock: {
                        saleCode: data.saleCode,
                        broker: data.broker as Broker,
                        lotNo: data.lotNo,
                        mark: data.mark,
                        grade: data.grade as TeaGrade,
                        invoiceNo: data.invoiceNo,
                        bags: data.bags,
                        weight: data.weight,
                        purchaseValue: data.purchaseValue,
                        totalPurchaseValue: data.totalPurchaseValue || data.purchaseValue * data.weight,
                        agingDays: data.agingDays || 0,
                        penalty: data.penalty || 0,
                        bgtCommission: data.bgtCommission || 0,
                        maerskFee: data.maerskFee || 0,
                        commission: data.commission || 0,
                        netPrice: data.netPrice || data.purchaseValue,
                        total: data.total || data.purchaseValue * data.weight,
                        batchNumber: data.batchNumber,
                        lowStockThreshold: data.lowStockThreshold,
                        admin: {
                            connect: {
                                adminCognitoId: data.adminCognitoId,
                            },
                        },
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    rowIndex,
                });
                logWithTimestamp(`Row ${rowIndex}: Added to valid stocks`);
            } catch (error) {
                logWithTimestamp(`Error processing row ${rowIndex}:`, {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
            }
        }

        if (validStocks.length === 0) {
            logWithTimestamp(`No valid stocks found in CSV`, { errors });
            res.status(400).json({ success: 0, errors });
            return;
        }

        logWithTimestamp(`Found ${validStocks.length} valid stocks to process`);

        // Process in batches to avoid transaction timeout
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < validStocks.length; i += BATCH_SIZE) {
            batches.push(validStocks.slice(i, i + BATCH_SIZE));
        }

        let createdCount = 0;
        let skippedCount = 0;
        let replacedCount = 0;

        for (const batch of batches) {
            await prisma.$transaction(
                async (tx) => {
                    for (const { stock, rowIndex } of batch) {
                        logWithTimestamp(`Checking for existing stock with lotNo ${stock.lotNo} at row ${rowIndex}`);
                        const existing = await tx.stocks.findUnique({
                            where: { lotNo: stock.lotNo },
                        });

                        if (existing) {
                            if (duplicateAction === "skip") {
                                logWithTimestamp(`Skipping existing stock with lotNo ${stock.lotNo} at row ${rowIndex}`);
                                skippedCount++;
                                continue;
                            } else if (duplicateAction === "replace") {
                                logWithTimestamp(`Replacing existing stock with lotNo ${stock.lotNo} at row ${rowIndex}`);
                                await tx.stocks.delete({ where: { id: existing.id } });
                                replacedCount++;
                            }
                        }

                        const createdStock = await tx.stocks.create({ data: stock });
                        await tx.stockHistory.create({
                            data: {
                                stocksId: createdStock.id,
                                action: "Stock Created via CSV",
                                adminCognitoId: authenticatedUser.userId,
                                timestamp: new Date(),
                                details: { lotNo: stock.lotNo },
                            },
                        });
                        createdCount++;
                        logWithTimestamp(`Created stock with lotNo ${stock.lotNo} at row ${rowIndex}`);
                    }
                },
                { timeout: 30000 } // 30-second timeout
            );
        }

        logWithTimestamp(
            `Successfully created ${createdCount} stocks, ` +
            `skipped ${skippedCount}, replaced ${replacedCount}`
        );
        res.status(201).json({
            success: {
                created: createdCount,
                skipped: skippedCount,
                replaced: replacedCount,
            },
            errors,
        });
    } catch (error) {
        logWithTimestamp(`Error processing CSV:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            details: error instanceof Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "One or more stocks have duplicate lotNo", details: error.meta });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        logWithTimestamp(`Disconnecting Prisma client`);
        await prisma.$disconnect();
    }
};

export const exportStocksXlsx = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedQuery = getStockQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            res.status(400).json({ message: "Invalid query parameters", details: parsedQuery.error.errors });
            return;
        }

        const {
            minWeight,
            batchNumber,
            lotNo,
            page,
            limit,
            grade,
            broker,
            search,
            onlyFavorites,
        } = parsedQuery.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized: No valid token provided" });
            return;
        }

        const isAdmin = authenticatedUser.role.toLowerCase() === "admin";
        const userId = authenticatedUser.userId;

        const where: Prisma.StocksWhereInput = {};
        if (minWeight !== undefined) where.weight = { gte: minWeight };
        if (batchNumber) where.batchNumber = batchNumber;
        if (lotNo) where.lotNo = lotNo;
        if (grade) where.grade = grade as TeaGrade;
        if (broker) where.broker = broker as Broker;
        if (search) {
            where.OR = [
                { lotNo: { contains: search, mode: "insensitive" } },
                { mark: { contains: search, mode: "insensitive" } },
            ];
        }
        if (onlyFavorites) where.favorites = { some: { userCognitoId: userId } };
        if (!isAdmin) where.assignments = { some: { userCognitoId: userId } };

        const stocks = await prisma.stocks.findMany({
            where,
            include: {
                assignments: {
                    select: { userCognitoId: true, assignedWeight: true },
                },
            },
            skip: lotNo ? undefined : (page - 1) * limit,
            take: lotNo ? undefined : limit,
        });

        if (!stocks.length) {
            res.status(404).json({ message: "No stocks found for the provided filters" });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tea Stocks");

        worksheet.addRow(["Black Gold Africa Traders Ltd - Stocks"]);
        worksheet.mergeCells("A1:Q1");
        worksheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
        worksheet.getCell("A1").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "1E88E5" },
        };
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;
        worksheet.addRow([]);

        const headers = [
            "Sale Code",
            "Broker",
            "Lot Number",
            "Mark",
            "Grade",
            "Invoice No",
            "Bags",
            "Weight",
            "Purchase Value",
            "Total Purchase Value",
            "Aging Days",
            "Penalty",
            "BGT Commission",
            "Maersk Fee",
            "Commission",
            "Net Price",
            "Total",
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "D3D3D3" },
            };
            cell.font = { name: "Calibri", size: 11, bold: true };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cell.alignment = { horizontal: "center" };
        });

        stocks.forEach((stock) => {
            worksheet.addRow([
                stock.saleCode || "N/A",
                stock.broker || "N/A",
                stock.lotNo || "N/A",
                stock.mark || "N/A",
                stock.grade || "N/A",
                stock.invoiceNo || "N/A",
                stock.bags ?? "N/A",
                Number(stock.weight) ?? "N/A",
                Number(stock.purchaseValue) ?? "N/A",
                Number(stock.totalPurchaseValue) ?? "N/A",
                stock.agingDays ?? "N/A",
                Number(stock.penalty) ?? "N/A",
                Number(stock.bgtCommission) ?? "N/A",
                Number(stock.maerskFee) ?? "N/A",
                Number(stock.commission) ?? "N/A",
                Number(stock.netPrice) ?? "N/A",
                Number(stock.total) ?? "N/A",
            ]);
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    cell.alignment = { horizontal: "left" };
                });
            }
        });

        // Adjusted column widths for remaining fields
        [14, 14, 14, 14, 12, 14, 10, 12, 14, 16, 12, 12, 14, 14, 14, 14, 14].forEach((w, i) => worksheet.getColumn(i + 1).width = w);

        const lastRow = worksheet.addRow([]);
        lastRow.getCell(1).value = `Generated from bgatltd.com on ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`;
        lastRow.getCell(1).font = { name: "Calibri", size: 8, italic: true };
        lastRow.getCell(1).alignment = { horizontal: "center" };
        worksheet.mergeCells(`A${lastRow.number}:Q${lastRow.number}`);

        worksheet.views = [{ state: "frozen", ySplit: 3 }];
        worksheet.protect("bgatltd2025", { selectLockedCells: false, selectUnlockedCells: false });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=stocks_${new Date().toISOString().split("T")[0]}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Export XLSX error:", error);
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};

export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedBody = toggleFavoriteSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid favorite data", details: parsedBody.error.errors });
            return;
        }

        const { userCognitoId, stockId } = parsedBody.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized: No valid token provided" });
            return;
        }

        if (authenticatedUser.userId !== userCognitoId) {
            res.status(403).json({ message: "Forbidden: Cannot modify favorites for another user" });
            return;
        }

        const stock = await prisma.stocks.findUnique({
            where: { id: stockId },
            select: { id: true },
        });

        if (!stock) {
            res.status(404).json({ message: `Stock with ID ${stockId} not found` });
            return;
        }

        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                user_stocks_favorite: { userCognitoId, stocksId: stockId },
            },
        });

        if (existingFavorite) {
            await prisma.favorite.delete({
                where: {
                    user_stocks_favorite: { userCognitoId, stocksId: stockId },
                },
            });
            res.status(200).json({
                message: "Unfavorited successfully",
                stockId,
                userCognitoId,
                favorited: false,
            });
            return;
        }

        const favorite = await prisma.favorite.create({
            data: {
                userCognitoId,
                stocksId: stockId,
                createdAt: new Date(),
            },
            select: {
                id: true,
                userCognitoId: true,
                stocksId: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            data: {
                id: favorite.id,
                userCognitoId: favorite.userCognitoId,
                stocksId: favorite.stocksId,
                createdAt: favorite.createdAt.toISOString(),
                favorited: true,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp(`Error toggling favorite:`, error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Invalid favorite data", details: error.errors });
            return;
        }
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};

export const assignStock = async (req: Request, res: Response) => {
    let parsedBody: z.infer<typeof assignStockSchema> | undefined;

    try {
        logWithTimestamp('assignStock: Received request', {
            rawBody: JSON.stringify(req.body, null, 2),
            headers: req.headers.authorization ? 'Authorization header present' : 'No Authorization header',
        });

        const parseResult = assignStockSchema.safeParse(req.body);
        if (!parseResult.success) {
            logWithTimestamp('assignStock: Validation failed', {
                errors: parseResult.error.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                    code: e.code,
                    ...(e.code === z.ZodIssueCode.invalid_type
                        ? {
                            expected: (e as z.ZodInvalidTypeIssue).expected,
                            received: (e as z.ZodInvalidTypeIssue).received,
                        }
                        : {}),
                    ...(e.code === z.ZodIssueCode.unrecognized_keys
                        ? { keys: (e as z.ZodUnrecognizedKeysIssue).keys }
                        : {}),
                })),
                rawBody: JSON.stringify(req.body, null, 2),
            });
            res.status(400).json({ message: 'Invalid request body', details: parseResult.error.errors });
            return;
        }

        parsedBody = parseResult.data;
        logWithTimestamp('assignStock: Parsed payload', { parsedData: parsedBody });

        const { stockId, userCognitoId } = parsedBody;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser || authenticatedUser.role.toLowerCase() !== 'admin') {
            logWithTimestamp('assignStock: Authentication failed', {
                authenticatedUser: authenticatedUser ? authenticatedUser.userId : null,
                role: authenticatedUser?.role,
            });
            res.status(403).json({ message: 'Forbidden: Only admins can assign stock' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { userCognitoId },
            select: { userCognitoId: true },
        });
        if (!user) {
            logWithTimestamp('assignStock: User not found', { userCognitoId });
            res.status(404).json({ message: `User with Cognito ID ${userCognitoId} not found` });
            return;
        }

        const stock = await prisma.stocks.findUnique({
            where: { id: stockId },
        });
        if (!stock) {
            logWithTimestamp('assignStock: Stock not found', { stockId });
            res.status(404).json({ message: `Stock with ID ${stockId} not found` });
            return;
        }

        logWithTimestamp('assignStock: Found user and stock', { userCognitoId, stockId, stockWeight: stock.weight });

        await retryTransaction(async (tx) => {
            // Check for any existing assignments for this stock
            const existingAssignments = await tx.stockAssignment.findMany({
                where: { stocksId: stockId },
                select: { userCognitoId: true },
            });

            if (existingAssignments.length > 0) {
                logWithTimestamp('assignStock: Stock already assigned', {
                    stockId,
                    assignedTo: existingAssignments.map(a => a.userCognitoId),
                });
                throw new Error(`Stock ${stockId} is already assigned to user(s): ${existingAssignments.map(a => a.userCognitoId).join(', ')}`);
            }

            // Create StockAssignment record
            await tx.stockAssignment.create({
                data: {
                    stocksId: stockId,
                    userCognitoId,
                    assignedWeight: stock.weight,
                    assignedAt: new Date(),
                },
            });

            // Create StockHistory entry
            await tx.stockHistory.create({
                data: {
                    stocksId: stockId,
                    action: 'Stock Assigned',
                    adminCognitoId: authenticatedUser.userId,
                    userCognitoId,
                    timestamp: new Date(),
                    details: {
                        ...stock,
                        assignedWeight: stock.weight,
                    },
                },
            });
        }, 3, prisma);

        logWithTimestamp('assignStock: Stock assigned', { stockId, userCognitoId });
        res.status(200).json({
            message: 'Stock assigned successfully',
            assignment: {
                stockId,
                userCognitoId,
                assignedWeight: stock.weight,
                assignedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logWithTimestamp('assignStock: Error occurred', {
            error: message,
            stack: error instanceof Error ? error.stack : null,
            rawBody: JSON.stringify(req.body, null, 2),
        });

        if (error instanceof ZodError) {
            res.status(400).json({ message: 'Invalid request body', details: error.errors });
            return;
        }
        if (error instanceof Error && error.message.includes('Stock is already assigned')) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Internal server error', details: message });
    } finally {
        await prisma.$disconnect();
        logWithTimestamp('assignStock: Prisma disconnected');
    }
};

export const bulkAssignStocks = async (req: Request, res: Response) => {
    try {
        logWithTimestamp("bulkAssignStocks: Received request", {
            rawBody: JSON.stringify(req.body, null, 2),
            headers: req.headers.authorization ? "Authorization header present" : "No Authorization header",
        });

        const parsedBody = bulkAssignStockSchema.safeParse(req.body);
        if (!parsedBody.success) {
            logWithTimestamp("bulkAssignStocks: Validation failed", {
                errors: parsedBody.error.errors.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                    code: e.code,
                    ...(e.code === z.ZodIssueCode.invalid_type ? {
                        expected: (e as z.ZodInvalidTypeIssue).expected,
                        received: (e as z.ZodInvalidTypeIssue).received,
                    } : {}),
                    ...(e.code === z.ZodIssueCode.unrecognized_keys ? {
                        keys: (e as z.ZodUnrecognizedKeysIssue).keys,
                    } : {}),
                })),
                rawBody: JSON.stringify(req.body, null, 2),
            });
            res.status(400).json({ message: "Invalid request body", details: parsedBody.error.errors });
            return;
        }

        logWithTimestamp("bulkAssignStocks: Parsed payload", { parsedData: parsedBody.data });

        const { userCognitoId, assignments } = parsedBody.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser || authenticatedUser.role.toLowerCase() !== "admin") {
            logWithTimestamp("bulkAssignStocks: Authentication failed", {
                authenticatedUser: authenticatedUser ? authenticatedUser.userId : null,
                role: authenticatedUser?.role,
            });
            res.status(403).json({ message: "Forbidden: Only admins can assign stocks" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { userCognitoId },
            select: { userCognitoId: true },
        });
        if (!user) {
            logWithTimestamp("bulkAssignStocks: User not found", { userCognitoId });
            res.status(404).json({ message: `User with Cognito ID ${userCognitoId} not found` });
            return;
        }

        const stockIds = assignments.map((a) => a.stockId);
        logWithTimestamp("bulkAssignStocks: Checking stocks", { stockIds });

        const stocks = await prisma.stocks.findMany({
            where: { id: { in: stockIds } },
        });
        if (stocks.length !== stockIds.length) {
            const missingIds = stockIds.filter((id) => !stocks.some((s) => s.id === id));
            logWithTimestamp("bulkAssignStocks: Stocks not found", { missingIds });
            res.status(404).json({ message: `Stocks with IDs ${missingIds.join(", ")} not found` });
            return;
        }

        // Check for any existing assignments for these stocks
        const existingAssignments = await prisma.stockAssignment.findMany({
            where: { stocksId: { in: stockIds } },
            select: { stocksId: true, userCognitoId: true },
        });
        if (existingAssignments.length > 0) {
            const assignedStockIds = existingAssignments.map(a => ({
                stockId: a.stocksId,
                userCognitoId: a.userCognitoId,
            }));
            logWithTimestamp("bulkAssignStocks: Some stocks already assigned", { assignedStockIds });
            res.status(400).json({
                message: "Some stocks are already assigned",
                details: assignedStockIds.map(a => `Stock ${a.stockId} is assigned to user ${a.userCognitoId}`).join("; "),
            });
            return;
        }

        logWithTimestamp("bulkAssignStocks: Found stocks", {
            stockIds: stocks.map((s) => s.id),
            weights: stocks.map((s) => s.weight),
        });

        const createdAssignments = await retryTransaction(async (tx) => {
            const assignmentsData = [];
            for (const assignment of assignments) {
                const stock = stocks.find((s) => s.id === assignment.stockId);
                if (!stock) continue;

                const effectiveWeight = assignment.assignedWeight ?? stock.weight;

                logWithTimestamp("bulkAssignStocks: Processing assignment", {
                    stockId: assignment.stockId,
                    userCognitoId,
                    assignedWeight: effectiveWeight,
                });

                // Create StockAssignment record
                await tx.stockAssignment.create({
                    data: {
                        stocksId: assignment.stockId,
                        userCognitoId,
                        assignedWeight: effectiveWeight,
                        assignedAt: new Date(),
                    },
                });

                // Create StockHistory entry
                const historyEntry = await tx.stockHistory.create({
                    data: {
                        stocksId: assignment.stockId,
                        action: "Stock Assigned",
                        adminCognitoId: authenticatedUser.userId,
                        userCognitoId,
                        timestamp: new Date(),
                        details: {
                            ...stock,
                            assignedWeight: effectiveWeight,
                        },
                    },
                });

                assignmentsData.push({
                    stockId: assignment.stockId,
                    userCognitoId,
                    assignedWeight: effectiveWeight,
                    assignedAt: historyEntry.timestamp,
                });
            }
            return assignmentsData;
        }, 3, prisma);

        logWithTimestamp("bulkAssignStocks: Stocks assigned", {
            stockIds,
            userCognitoId,
            createdAssignments: createdAssignments.length,
        });
        if (createdAssignments.length === 0) {
            res.status(200).json({
                message: "No assignments created",
                assignments: [],
            });
            return;
        }

        res.status(201).json({
            message: "Stocks assigned successfully",
            assignments: createdAssignments.map((a) => ({
                stockId: a.stockId,
                userCognitoId: a.userCognitoId,
                assignedWeight: Number(a.assignedWeight),
                assignedAt: a.assignedAt.toISOString(),
            })),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp("bulkAssignStocks: Error occurred", {
            error: message,
            stack: error instanceof Error ? error.stack : null,
            rawBody: JSON.stringify(req.body, null, 2),
        });
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Invalid request body", details: error.errors });
            return;
        }
        if (error instanceof Error && error.message.includes("Some stocks are already assigned")) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
        logWithTimestamp("bulkAssignStocks: Prisma disconnected");
    }
};

export const getUserStockHistory = async (req: Request, res: Response) => {
    try {
        const authenticatedUser = req.user || (await authenticateUser(req, res));
        logWithTimestamp("getUserStockHistory: Authentication attempt", {
            authHeader: req.headers.authorization ? "Present" : "Missing",
            authenticatedUser: authenticatedUser ? { userId: authenticatedUser.userId, role: authenticatedUser.role } : null,
            userCognitoId: req.params.userCognitoId,
        });

        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized: No valid token provided" });
            return;
        }

        const { userCognitoId } = req.params;
        const { page = 1, limit = 10, search = '', sortBy = 'assignedAt', sortOrder = 'desc' } = req.query;

        if (authenticatedUser.userId !== userCognitoId && authenticatedUser.role.toLowerCase() !== "admin") {
            logWithTimestamp("getUserStockHistory: Forbidden access", {
                userId: authenticatedUser.userId,
                requestedUserCognitoId: userCognitoId,
                role: authenticatedUser.role,
            });
            res.status(403).json({ message: "Forbidden: Admin role or self-access required" });
            return;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const where: any = {
            userCognitoId,
        };

        if (search) {
            where.stocks = {
                OR: [
                    { lotNo: { contains: search, mode: 'insensitive' } },
                    { saleCode: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [assignments, total] = await Promise.all([
            prisma.stockAssignment.findMany({
                where,
                include: {
                    stocks: true,
                },
                orderBy: {
                    [sortBy === 'assignedAt' ? 'assignedAt' : sortBy === 'stocksId' ? 'stocksId' : 'assignedWeight']: sortOrder,
                },
                skip,
                take: Number(limit),
            }),
            prisma.stockAssignment.count({ where }),
        ]);

        logWithTimestamp("getUserStockHistory: Stock history retrieved", {
            userCognitoId,
            totalAssignments: total,
            page: Number(page),
            limit: Number(limit),
            stockIds: assignments.map((a) => a.stocksId),
        });

        res.status(200).json({
            message: "Stock history retrieved successfully",
            data: assignments.map((assignment) => ({
                stocksId: assignment.stocksId,
                assignedAt: assignment.assignedAt.toISOString(),
                details: {
                    ...assignment.stocks,
                    assignedWeight: assignment.assignedWeight,
                },
            })),
            meta: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp("getUserStockHistory: Error occurred", {
            error: message,
            stack: error instanceof Error ? error.stack : null,
            params: req.params,
            query: req.query,
        });
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};

export const unassignStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsedBody = unassignStockSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ message: "Invalid unassignment data", details: parsedBody.error.errors });
            return;
        }

        const { stockId, userCognitoId } = parsedBody.data;

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser || authenticatedUser.role.toLowerCase() !== "admin") {
            res.status(403).json({ message: "Forbidden: Only admins can unassign stock" });
            return;
        }

        const assignment = await prisma.stockAssignment.findUnique({
            where: { stocksId_userCognitoId: { stocksId: stockId, userCognitoId } },
        });
        if (!assignment) {
            res.status(404).json({ message: `No assignment found for stock ID ${stockId} and user ${userCognitoId}` });
            return;
        }

        await retryTransaction(async (tx) => {
            await tx.stockAssignment.delete({
                where: { stocksId_userCognitoId: { stocksId: stockId, userCognitoId } },
            });
        }, 3, prisma);

        await prisma.stockHistory.create({
            data: {
                stocksId: stockId,
                action: "Stock Unassigned",
                adminCognitoId: authenticatedUser.userId,
                userCognitoId,
                timestamp: new Date(),
            },
        });

        res.status(200).json({ message: "Stock unassigned successfully" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp(`Error unassigning stock:`, error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Invalid unassignment data", details: error.errors });
            return;
        }
        res.status(500).json({ message: "Internal server error", details: message });
    } finally {
        await prisma.$disconnect();
    }
};