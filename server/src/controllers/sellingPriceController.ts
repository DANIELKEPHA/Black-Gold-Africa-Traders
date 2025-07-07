import { Request, Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { Parser } from "csv-parse";
import { Broker, SellingPrice, TeaCategory, TeaGrade } from "@prisma/client";
import ExcelJS from "exceljs";
import { createSellingPriceSchema, csvRecordSchema, querySchema } from "../schemas/sellingPricesSchema";
import { authenticateUser } from "../utils/controllerUtils";
import { PrismaClient, Prisma } from "@prisma/client";
import {reprintSchema} from "../schemas/catalogSchemas";

const prisma = new PrismaClient();

// Schema for CSV upload request
const csvUploadSchema = z.object({
    duplicateAction: z.enum(["skip", "replace"]).optional().default("skip"),
});

export const serializeSellingPrice = (
    sellingPrice: SellingPrice & {
        admin?: {
            id: number;
            adminCognitoId: string;
            name: string | null;
            email: string | null;
            phoneNumber: string | null;
        };
    }
): {
    id: number;
    lotNo: string;
    sellingMark: string;
    bags: number;
    totalWeight: number;
    netWeight: number;
    invoiceNo: string | null;
    saleCode: string;
    askingPrice: number;
    purchasePrice: number | null;
    adminCognitoId: string | null;
    producerCountry: string | null;
    manufactureDate: string;
    category: TeaCategory;
    grade: TeaGrade;
    broker: Broker;
    reprint: string | null;
    admin: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
} => ({
    id: sellingPrice.id,
    lotNo: sellingPrice.lotNo,
    sellingMark: sellingPrice.sellingMark,
    bags: sellingPrice.bags,
    totalWeight: Number(sellingPrice.totalWeight),
    netWeight: Number(sellingPrice.netWeight),
    invoiceNo: sellingPrice.invoiceNo ?? null,
    saleCode: sellingPrice.saleCode,
    askingPrice: Number(sellingPrice.askingPrice),
    purchasePrice: sellingPrice.purchasePrice ? Number(sellingPrice.purchasePrice) : null,
    adminCognitoId: sellingPrice.adminCognitoId ?? null,
    producerCountry: sellingPrice.producerCountry ?? null,
    manufactureDate: sellingPrice.manufactureDate.toISOString(),
    category: sellingPrice.category,
    grade: sellingPrice.grade,
    broker: sellingPrice.broker,
    reprint: sellingPrice.reprint ?? null,
    admin: sellingPrice.admin ?? null,
});

// Build Where Conditions
const buildWhereConditions = (
    params: Omit<z.infer<typeof querySchema>, "page" | "limit"> & { shipmentId?: number } | undefined | null,
    userId?: string,
    role?: "admin" | "user"
): Prisma.SellingPriceWhereInput => {
    const conditions: Prisma.SellingPriceWhereInput = {};

    if (userId && role === "admin") {
        conditions.OR = [
            { adminCognitoId: userId },
            { adminCognitoId: null },
        ];
    } else if (userId && role === "user") {
        conditions.userCognitoId = userId;
    }

    if (!params || typeof params !== "object") {
        return conditions;
    }

    const filterMap: Record<string, (value: any) => void> = {
        favoriteIds: (value) => { if (value?.length) conditions.id = { in: value }; },
        lotNo: (value) => { if (value) conditions.lotNo = { equals: value }; },
        sellingMark: (value) => { if (value) conditions.sellingMark = { equals: value }; },
        bags: (value) => { if (value) conditions.bags = value; },
        totalWeight: (value) => { if (value) conditions.totalWeight = value; },
        netWeight: (value) => { if (value) conditions.netWeight = value; },
        askingPrice: (value) => { if (value) conditions.askingPrice = value; },
        purchasePrice: (value) => { if (value) conditions.purchasePrice = value; },
        producerCountry: (value) => { if (value) conditions.producerCountry = { equals: value }; },
        manufactureDate: (value) => { if (value) conditions.manufactureDate = new Date(value); },
        saleCode: (value) => { if (value) conditions.saleCode = value; },
        category: (value) => { if (value && value !== "any") conditions.category = value as TeaCategory; },
        grade: (value) => { if (value && value !== "any") conditions.grade = value as TeaGrade; },
        broker: (value) => { if (value && value !== "any") conditions.broker = value as Broker; },
        invoiceNo: (value) => { if (value) conditions.invoiceNo = { equals: value }; },
        reprint: (value) => {
            if (value !== undefined) {
                const parsed = reprintSchema.safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid reprint: ${value}. Must be "No" or a positive integer`);
                }
                conditions.reprint = parsed.data;
            }
        },
    };

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && filterMap[key]) filterMap[key](value);
    });

    if (params.search) {
        const orConditions: Prisma.SellingPriceWhereInput[] = [
            { lotNo: { contains: params.search, mode: "insensitive" } },
            { invoiceNo: { contains: params.search, mode: "insensitive" } },
            { sellingMark: { contains: params.search, mode: "insensitive" } },
            { producerCountry: { contains: params.search, mode: "insensitive" } },
        ];

        if (Object.values(TeaCategory).includes(params.search as TeaCategory)) {
            orConditions.push({ category: params.search as TeaCategory });
        }
        if (Object.values(Broker).includes(params.search as Broker)) {
            orConditions.push({ broker: params.search as Broker });
        }

        conditions.OR = [...(conditions.OR || []), ...orConditions];
    }

    return conditions;
};

export const getSellingPrices = async (req: Request, res: Response) => {
    const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
    // console.log(`[${time}] Received getSellingPrices request:`, {
    //     method: req.method,
    //     url: req.url,
    //     query: req.query,
    //     headers: req.headers,
    // });

    try {
        let rawIds = req.query.ids;
        if (typeof rawIds === "string") {
            rawIds = rawIds.split(",").map((id) => id.trim());
        } else if (!Array.isArray(rawIds)) {
            rawIds = rawIds ? [rawIds] : undefined;
        }

        // console.log(`[${time}] Parsed rawIds:`, rawIds);

        const params = querySchema.safeParse({
            ...req.query,
            ids: rawIds ? rawIds.map((id) => Number(id)) : undefined,
        });

        if (!params.success) {
            console.error(`[${time}] Invalid query parameters:`, params.error.errors);
            return res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
        }

        // console.log(`[${time}] Validated params:`, params.data);

        const {
            ids,
            lotNo,
            sellingMark,
            bags,
            totalWeight,
            netWeight,
            askingPrice,
            purchasePrice,
            producerCountry,
            manufactureDate,
            saleCode,
            category,
            grade,
            broker,
            invoiceNo,
            reprint,
            page = 1,
            limit = 100,
        } = params.data;

        // Removed authentication check
        // const authenticatedUser = authenticateUser(req, res);
        // if (!authenticatedUser) {
        //     console.error(`[${time}] Authentication failed: No authenticated user`);
        //     return res.status(401).json({ message: "Unauthorized" });
        // }
        // console.log(`[${time}] Authenticated user:`, {
        //     userId: authenticatedUser.userId,
        //     role: authenticatedUser.role,
        // });

        // Adjusted where conditions to remove user-specific filters
        const where: Prisma.SellingPriceWhereInput = buildWhereConditions({
            ids,
            lotNo,
            sellingMark,
            bags,
            totalWeight,
            netWeight,
            askingPrice,
            purchasePrice,
            producerCountry,
            manufactureDate,
            saleCode,
            category,
            grade,
            broker,
            invoiceNo,
            reprint,
        }, undefined, undefined); // Passing undefined for userId and role

        // console.log(`[${time}] Built where conditions:`, where);

        const skip = (page - 1) * limit;
        const take = limit;

        // console.log(`[${time}] Querying database with skip: ${skip}, take: ${take}`);

        const [sellingPrices, total] = await Promise.all([
            prisma.sellingPrice.findMany({
                where,
                skip,
                take,
                include: {
                    admin: {
                        select: {
                            id: true,
                            adminCognitoId: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                },
            }),
            prisma.sellingPrice.count({ where }),
        ]);

        // console.log(`[${time}] Database query result:`, { count: sellingPrices.length, total });

        const totalPages = Math.ceil(total / limit);

        const normalizedSellingPrices = sellingPrices.map((sellingPrice) => ({
            ...sellingPrice,
            admin: sellingPrice.admin ?? undefined,
        }));

        // console.log(`[${time}] Sending response with totalPages: ${totalPages}, data length: ${normalizedSellingPrices.length}`);

        return res.status(200).json({
            data: normalizedSellingPrices.map(serializeSellingPrice),
            meta: { page, limit, total, totalPages },
        });
    } catch (error) {
        console.error(`[${time}] Internal server error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const getSellingPricesFilterOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const [distinctValues, aggregates] = await Promise.all([
            prisma.sellingPrice.findMany({
                select: {
                    producerCountry: true,
                    grade: true,
                    category: true,
                    saleCode: true,
                    broker: true,
                    sellingMark: true,
                    invoiceNo: true,
                },
                distinct: ["producerCountry", "grade", "category", "saleCode", "broker", "sellingMark", "invoiceNo"],
                orderBy: { producerCountry: "asc" },
            }),
            prisma.sellingPrice.aggregate({
                _min: { askingPrice: true, purchasePrice: true, manufactureDate: true, bags: true, totalWeight: true, netWeight: true },
                _max: { askingPrice: true, purchasePrice: true, manufactureDate: true, bags: true, totalWeight: true, netWeight: true },
            }),
        ]);

        const countries = [...new Set(distinctValues.map((o) => o.producerCountry).filter((o): o is string => !!o))];
        const grades = [...new Set(distinctValues.map((g) => g.grade))];
        const categories = [...new Set(distinctValues.map((c) => c.category))];
        const saleCodes = [...new Set(distinctValues.map((s) => s.saleCode))];
        const brokers = [...new Set(distinctValues.map((b) => b.broker))];
        const sellingMarks = [...new Set(distinctValues.map((sm) => sm.sellingMark))];
        const invoiceNos = [...new Set(distinctValues.map((inv) => inv.invoiceNo).filter((inv): inv is string => !!inv))];

        res.status(200).json({
            countries,
            grades,
            categories,
            saleCodes,
            brokers,
            sellingMarks,
            invoiceNos,
            askingPrice: {
                min: aggregates._min.askingPrice !== null ? Number(aggregates._min.askingPrice) : 0,
                max: aggregates._max.askingPrice !== null ? Number(aggregates._max.askingPrice) : 1000,
            },
            purchasePrice: {
                min: aggregates._min.purchasePrice !== null ? Number(aggregates._min.purchasePrice) : 0,
                max: aggregates._max.purchasePrice !== null ? Number(aggregates._max.purchasePrice) : 1000,
            },
            manufactureDate: {
                min: aggregates._min.manufactureDate?.toISOString() ?? "2020-01-01T00:00:00Z",
                max: aggregates._max.manufactureDate?.toISOString() ?? new Date().toISOString(),
            },
            bags: { min: aggregates._min.bags ?? 0, max: aggregates._max.bags ?? 10000 },
            totalWeight: {
                min: aggregates._min.totalWeight !== null ? Number(aggregates._min.totalWeight) : 0,
                max: aggregates._max.totalWeight !== null ? Number(aggregates._max.totalWeight) : 100000,
            },
            netWeight: {
                min: aggregates._min.netWeight !== null ? Number(aggregates._min.netWeight) : 0,
                max: aggregates._max.netWeight !== null ? Number(aggregates._max.netWeight) : 1000,
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const createSellingPrice = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const sellingPriceData = createSellingPriceSchema.safeParse({
            ...req.body,
            adminCognitoId: authenticatedUser.userId,
            purchasePrice: req.body.purchasePrice || null,
        });

        if (!sellingPriceData.success) {
            res.status(400).json({ message: "Invalid request body", details: sellingPriceData.error.errors });
            return;
        }

        // Define the type for newSellingPrice with the admin relation
        type SellingPriceWithAdmin = SellingPrice & {
            admin: {
                id: number;
                adminCognitoId: string;
                name: string | null;
                email: string | null;
                phoneNumber: string | null;
            } | null;
        };

        const newSellingPrice: SellingPriceWithAdmin = await prisma.sellingPrice.create({
            data: {
                broker: sellingPriceData.data.broker as Broker,
                sellingMark: sellingPriceData.data.sellingMark,
                lotNo: sellingPriceData.data.lotNo,
                reprint: sellingPriceData.data.reprint ?? null,
                bags: sellingPriceData.data.bags,
                totalWeight: sellingPriceData.data.totalWeight,
                netWeight: sellingPriceData.data.netWeight,
                invoiceNo: sellingPriceData.data.invoiceNo,
                saleCode: sellingPriceData.data.saleCode,
                askingPrice: sellingPriceData.data.askingPrice,
                purchasePrice: sellingPriceData.data.purchasePrice,
                adminCognitoId: sellingPriceData.data.adminCognitoId,
                producerCountry: sellingPriceData.data.producerCountry,
                manufactureDate: new Date(sellingPriceData.data.manufactureDate),
                category: sellingPriceData.data.category as TeaCategory,
                grade: sellingPriceData.data.grade as TeaGrade,
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        adminCognitoId: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
            },
        });

        const sellingPriceWithAdmin = {
            ...newSellingPrice,
            admin: newSellingPrice.admin ?? undefined,
        };

        res.status(201).json({ data: serializeSellingPrice(sellingPriceWithAdmin) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "Duplicate selling price entry", details: error.meta });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const getSellingPriceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid selling price ID" });
            return;
        }

        const sellingPrice = await prisma.sellingPrice.findUnique({
            where: { id },
            include: {
                admin: {
                    select: {
                        id: true,
                        adminCognitoId: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                    },
                },
            },
        });

        if (!sellingPrice) {
            res.status(404).json({ message: "Selling price not found" });
            return;
        }

        const sellingPriceWithAdmin = {
            ...sellingPrice,
            admin: sellingPrice.admin ?? undefined,
        };

        res.status(200).json(serializeSellingPrice(sellingPriceWithAdmin));
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const deleteSellingPrices = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { ids } = req.body;
        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Deleting selling prices with ids:`, ids);

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No selling price IDs provided" });
            return;
        }

        const sellingPriceIds = ids.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
        if (sellingPriceIds.length === 0) {
            res.status(400).json({ message: "Invalid selling price IDs", details: { providedIds: ids } });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const sellingPrices = await tx.sellingPrice.findMany({
                where: {
                    id: { in: sellingPriceIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
                select: { id: true, lotNo: true, adminCognitoId: true },
            });

            if (sellingPrices.length === 0) {
                throw new Error("No selling prices found or unauthorized");
            }

            const associations = sellingPrices.map((sellingPrice) => ({
                id: sellingPrice.id,
                lotNo: sellingPrice.lotNo,
            }));

            await tx.sellingPrice.deleteMany({
                where: {
                    id: { in: sellingPriceIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
            });

            return { deletedCount: sellingPrices.length, associations };
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} selling price(s)`,
            associations: result.associations,
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete selling prices error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ids: req.body.ids,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No selling prices found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            details: { ids: req.body.ids },
        });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteAllSellingPrices = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const filters = req.body || {};
        const where = buildWhereConditions(filters, authenticatedUser.userId);

        const result = await prisma.$transaction(async (tx) => {
            const sellingPrices = await tx.sellingPrice.findMany({
                where,
                select: { id: true, lotNo: true },
            });

            if (sellingPrices.length === 0) {
                throw new Error("No selling prices found or unauthorized");
            }

            const associations = sellingPrices.map((sellingPrice) => ({
                id: sellingPrice.id,
                lotNo: sellingPrice.lotNo,
            }));

            const { count } = await tx.sellingPrice.deleteMany({ where });

            return { deletedCount: count, associations };
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} selling price(s)`,
            associations: result.associations,
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete all selling prices error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            filters: req.body,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No selling prices found", details: { filters: req.body } });
            return;
        }
        res.status(400).json({
            message: error instanceof Error ? error.message : "Internal server error",
            details: { filters: req.body },
        });
    } finally {
        await prisma.$disconnect();
    }
};

// Utility function to normalize field names
function normalizeFieldName(field: string): string {
    const cleanField = field.replace(/^\uFEFF/, "").trim();
    return cleanField
        .toLowerCase()
        .replace(/\s+|_+/g, "")
        .replace(/([a-z])([A-Z])/g, "$1$2")
        .replace(/^(.)/, (match) => match.toLowerCase());
}

// Mapping of normalized CSV field names to schema field names
const fieldNameMapping: { [key: string]: string } = {
    broker: "broker",
    lotno: "lotNo",
    sellingmark: "sellingMark",
    grade: "grade",
    invoiceno: "invoiceNo",
    salecode: "saleCode",
    category: "category",
    rp: "reprint",
    bags: "bags",
    netweight: "netWeight",
    totalweight: "totalWeight",
    askingprice: "askingPrice",
    purchaseprice: "purchasePrice",
    producercountry: "producerCountry",
    manufactureddate: "manufactureDate",
};

// Cache enum values
const teaCategories = new Set(Object.values(TeaCategory));
const teaGrades = new Set(Object.values(TeaGrade));
const brokers = new Set(Object.values(Broker));


export async function uploadSellingPricesCsv(req: Request, res: Response): Promise<void> {
    const errors: Array<{ row: number; message: string }> = [];
    let createdCount = 0;
    let skippedCount = 0;
    let replacedCount = 0;

    const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });

    try {
        // Log request initiation
        console.log(`[${time}] Starting CSV upload:`, {
            fileName: req.file?.originalname,
            fileSize: req.file?.size,
            duplicateAction: req.body.duplicateAction,
        });

        if (!req.file) {
            console.error(`[${time}] No CSV file provided`);
            res.status(400).json({ message: "CSV file required" });
            return;
        }

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            console.error(`[${time}] Authentication failed`);
            res.status(401).json({ message: "Authentication failed: No authenticated user found" });
            return;
        }

        if (authenticatedUser.role.toLowerCase() !== "admin") {
            console.error(`[${time}] Forbidden: User is not admin`);
            res.status(403).json({ message: "Forbidden: Only admins can upload selling prices" });
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_FILE_SIZE) {
            console.error(`[${time}] File too large`);
            res.status(400).json({ message: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
            return;
        }

        const parsedParams = csvUploadSchema.safeParse(req.body);
        if (!parsedParams.success) {
            console.error(`[${time}] Invalid duplicateAction:`, {
                errors: parsedParams.error.errors,
            });
            res.status(400).json({ message: "Invalid duplicateAction", details: parsedParams.error.errors });
            return;
        }
        const { duplicateAction } = parsedParams.data;

        let csvBuffer = req.file.buffer;
        if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
            csvBuffer = csvBuffer.slice(3);
        }

        // Log raw CSV content (first 1000 characters to avoid flooding logs)
        console.log(`[${time}] Raw CSV content (truncated):`, csvBuffer.toString("utf8").slice(0, 1000));

        // Define required schema fields for validation
        const requiredSchemaFields = new Set(Object.values(fieldNameMapping));

        const parser = new Parser({
            columns: (header: string[]) => {
                // Log parsed headers
                console.log(`[${time}] CSV headers:`, header);
                const mappedHeaders = header.map((field: string) => {
                    const normalized = normalizeFieldName(field);
                    return fieldNameMapping[normalized] || normalized;
                });
                // Log mapped headers
                console.log(`[${time}] Mapped headers:`, mappedHeaders);
                const missingFields = Array.from(requiredSchemaFields).filter(
                    (field) => !mappedHeaders.includes(field)
                );
                if (missingFields.length > 0) {
                    console.error(`[${time}] Missing required CSV columns:`, missingFields);
                    throw new Error(`Missing required CSV columns: ${missingFields.join(", ")}`);
                }
                return mappedHeaders;
            },
            skip_empty_lines: true,
            trim: true,
            cast: false, // Disable automatic type casting
        });

        const stream = Readable.from(csvBuffer);
        const records: Array<{ record: any; rowIndex: number }> = [];
        let rowIndex = 0;

        // Pre-collect and validate records
        try {
            for await (const record of stream.pipe(parser)) {
                rowIndex++;
                // Log raw parsed record
                console.log(`[${time}] Raw parsed record for row ${rowIndex}:`, record);
                records.push({ record, rowIndex });
            }
        } catch (error) {
            console.error(`[${time}] CSV parsing error:`, {
                message: error instanceof Error ? error.message : String(error),
            });
            res.status(400).json({ message: "Invalid CSV format", details: error instanceof Error ? error.message : String(error) });
            return;
        }

        // Log total records parsed
        console.log(`[${time}] Total records parsed: ${records.length}`);

        const csvRecordSchema = z.object({
            broker: z.enum(Array.from(brokers) as [string, ...string[]], { message: "Invalid broker value" }),
            sellingMark: z.string().min(1, "Selling mark is required"),
            lotNo: z.string().min(1, "Lot number is required"),
            reprint: reprintSchema,
            bags: z.number().int().positive("Bags must be a positive integer"),
            netWeight: z.number().positive("Net weight must be a positive number"),
            totalWeight: z.number().positive("Total weight must be a positive number"),
            invoiceNo: z.string().min(1, "Invoice number is required"),
            saleCode: z.string().min(1, "Sale code is required"),
            askingPrice: z.number().positive("Asking price must be a positive number"),
            purchasePrice: z.number().positive("Purchase price must be a positive number"),
            producerCountry: z.string().min(1).optional(),
            manufactureDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format"),
            category: z.enum(Array.from(teaCategories) as [string, ...string[]], { message: "Invalid tea category" }),
            grade: z.enum(Array.from(teaGrades) as [string, ...string[]], { message: "Invalid tea grade" }),
        }).strict();

        const validatedRecords = records.map(({ record, rowIndex }) => {
            // Log raw record before processing
            console.log(`[${time}] Processing record for row ${rowIndex}:`, record);

            try {
                const parsedRecord = {
                    ...record,
                    bags: record.bags ? Number(record.bags) : undefined,
                    totalWeight: record.totalWeight ? Number(record.totalWeight) : undefined,
                    netWeight: record.netWeight ? Number(record.netWeight) : undefined,
                    askingPrice: record.askingPrice ? Number(record.askingPrice) : undefined,
                    purchasePrice: record.purchasePrice ? Number(record.purchasePrice) : undefined,
                    reprint: String(record.reprint ?? ""), // Ensure reprint is a string
                    manufactureDate: record.manufactureDate,
                };

                // Log parsed record before validation
                console.log(`[${time}] Parsed record for row ${rowIndex}:`, parsedRecord);

                const parsed = csvRecordSchema.safeParse(parsedRecord);
                if (!parsed.success) {
                    console.error(`[${time}] Validation failed for row ${rowIndex}:`, {
                        reprintValue: parsedRecord.reprint,
                        record: parsedRecord,
                        errors: parsed.error.errors,
                    });
                    throw new Error(parsed.error.errors.map(err => err.message).join(", "));
                }

                // Log successful validation
                console.log(`[${time}] Validation successful for row ${rowIndex}:`, parsed.data);

                const data = parsed.data;
                return {
                    sellingPrice: {
                        broker: data.broker as Broker,
                        sellingMark: data.sellingMark,
                        lotNo: data.lotNo,
                        reprint: data.reprint,
                        bags: data.bags,
                        totalWeight: data.totalWeight,
                        netWeight: data.netWeight,
                        invoiceNo: data.invoiceNo,
                        saleCode: data.saleCode,
                        askingPrice: data.askingPrice,
                        purchasePrice: data.purchasePrice,
                        producerCountry: data.producerCountry,
                        manufactureDate: new Date(data.manufactureDate),
                        category: data.category as TeaCategory,
                        grade: data.grade as TeaGrade,
                    },
                    rowIndex,
                };
            } catch (error) {
                console.error(`[${time}] Error processing row ${rowIndex}:`, {
                    message: error instanceof Error ? error.message : String(error),
                    reprintValue: record.reprint,
                });
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
                return null;
            }
        }).filter(Boolean) as Array<{ sellingPrice: Prisma.SellingPriceCreateInput; rowIndex: number }>;

        // Log validated records
        console.log(`[${time}] Total validated records: ${validatedRecords.length}`);

        const BATCH_SIZE = 500;
        const processBatch = async (batch: Array<{ sellingPrice: Prisma.SellingPriceCreateInput; rowIndex: number }>) => {
            try {
                const timeBatch = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
                console.log(`[${timeBatch}] Processing batch of ${batch.length} records`);
                const result = await prisma.$transaction(async (tx) => {
                    let batchCreated = 0;
                    let batchSkipped = 0;
                    let batchReplaced = 0;

                    if (duplicateAction === "skip") {
                        const lotNos = batch.map(item => item.sellingPrice.lotNo);
                        console.log(`[${timeBatch}] Checking for existing lotNos:`, lotNos);
                        const existing = await tx.sellingPrice.findMany({
                            where: { lotNo: { in: lotNos } },
                            select: { lotNo: true },
                        });
                        const existingLotNos = new Set(existing.map(item => item.lotNo));
                        console.log(`[${timeBatch}] Existing lotNos:`, Array.from(existingLotNos));

                        const toCreate = batch.filter(item => !existingLotNos.has(item.sellingPrice.lotNo));
                        batchSkipped += batch.length - toCreate.length;
                        console.log(`[${timeBatch}] Records to create: ${toCreate.length}, Skipped: ${batchSkipped}`);

                        if (toCreate.length > 0) {
                            console.log(`[${timeBatch}] Creating ${toCreate.length} records`);
                            const createResult = await tx.sellingPrice.createMany({
                                data: toCreate.map(item => item.sellingPrice),
                                skipDuplicates: true,
                            });
                            batchCreated += createResult.count;
                            console.log(`[${timeBatch}] Created ${batchCreated} records in batch`);
                        }
                    } else if (duplicateAction === "replace") {
                        console.log(`[${timeBatch}] Replacing records`);
                        await Promise.all(batch.map(async ({ sellingPrice, rowIndex }) => {
                            try {
                                console.log(`[${timeBatch}] Upserting record for lotNo: ${sellingPrice.lotNo}, reprint: ${sellingPrice.reprint}`);
                                await tx.sellingPrice.upsert({
                                    where: { lotNo: sellingPrice.lotNo },
                                    update: { ...sellingPrice, updatedAt: new Date() },
                                    create: sellingPrice,
                                });
                                batchReplaced++;
                            } catch (error) {
                                console.error(`[${timeBatch}] Error upserting row ${rowIndex}:`, {
                                    message: error instanceof Error ? error.message : String(error),
                                    lotNo: sellingPrice.lotNo,
                                    reprint: sellingPrice.reprint,
                                });
                                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
                            }
                        }));
                        console.log(`[${timeBatch}] Replaced ${batchReplaced} records in batch`);
                    } else {
                        console.log(`[${timeBatch}] Creating records without duplicate check`);
                        const createResult = await tx.sellingPrice.createMany({
                            data: batch.map(item => item.sellingPrice),
                            skipDuplicates: true,
                        });
                        batchCreated += createResult.count;
                        console.log(`[${timeBatch}] Created ${batchCreated} records in batch`);
                    }

                    return { batchCreated, batchSkipped, batchReplaced };
                }, { timeout: 30000 });

                createdCount += result.batchCreated;
                skippedCount += result.batchSkipped;
                replacedCount += result.batchReplaced;
                console.log(`[${timeBatch}] Batch processed:`, { batchCreated: result.batchCreated, batchSkipped: result.batchSkipped, batchReplaced: result.batchReplaced });
            } catch (error) {
                console.error(`[${time}] Batch failed:`, { message: error instanceof Error ? error.message : String(error) });
            }
        };

        // Log before processing batches
        console.log(`[${time}] Total batches to process: ${Math.ceil(validatedRecords.length / BATCH_SIZE)}`);
        const batches = [];
        for (let i = 0; i < validatedRecords.length; i += BATCH_SIZE) {
            batches.push(validatedRecords.slice(i, i + BATCH_SIZE));
        }

        await Promise.all(batches.map(batch => processBatch(batch)));

        // Log final counts before response
        console.log(`[${time}] Upload completed:`, {
            createdCount,
            skippedCount,
            replacedCount,
            totalProcessed: createdCount + skippedCount + replacedCount,
            errors: errors.length,
        });

        if (createdCount + skippedCount + replacedCount === 0) {
            console.error(`[${time}] No valid selling prices processed`);
            res.status(400).json({ success: { created: 0, skipped: 0, replaced: 0 }, errors });
            return;
        }

        res.status(errors.length > 0 ? 207 : 201).json({
            success: { created: createdCount, skipped: skippedCount, replaced: replacedCount },
            errors,
        });
    } catch (error) {
        console.error(`[${time}] Upload selling prices error:`, {
            message: error instanceof Error ? error.message : String(error),
            file: req.file?.originalname,
            size: req.file?.size,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "Duplicate lotNo", details: error.meta });
            return;
        }
        res.status(500).json({ message: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
}

export const exportSellingPricesXlsx = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const params = querySchema.extend({ sellingPriceIds: z.string().optional() }).safeParse(req.body || { page: 1, limit: 10000 });
        if (!params.success) {
            res.status(400).json({ message: "Invalid query parameters", details: params.error.errors });
            return;
        }

        const { page = 1, limit = 10000, sellingPriceIds, ...filterParams } = params.data;
        let where: Prisma.SellingPriceWhereInput = {};

        if (sellingPriceIds) {
            const ids = [...new Set(sellingPriceIds.split(",").map((id) => parseInt(id.trim())))].filter((id) => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid sellingPriceIds provided" });
                return;
            }
            where = { id: { in: ids } };
        } else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams, authenticatedUser.userId, authenticatedUser.role.toLowerCase() as "admin" | "user");
        }

        const sellingPrices = await prisma.sellingPrice.findMany({
            where,
            select: {
                saleCode: true,
                lotNo: true,
                category: true,
                grade: true,
                broker: true,
                sellingMark: true,
                bags: true,
                netWeight: true,
                totalWeight: true,
                producerCountry: true,
                askingPrice: true,
                purchasePrice: true,
                invoiceNo: true,
                manufactureDate: true,
                reprint: true,
            },
            ...(sellingPriceIds ? {} : { skip: (page - 1) * limit, take: limit }),
        });

        if (!sellingPrices.length) {
            res.status(404).json({ message: "No selling prices found for the provided filters or IDs" });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Selling Prices");

        const headers = [
            "Sale Code", "Lot Number", "Category", "Grade", "Broker", "Selling Mark", "Bags",
            "Net Weight", "Total Weight", "Country", "Asking Price", "Purchase Price",
            "Invoice No", "Mft Date", "Reprint"
        ];

        // Add title row
        const titleRow = worksheet.addRow(["Official Black Gold Africa Traders Ltd Selling Prices"]);
        worksheet.mergeCells("A1:O1");
        const titleCell = worksheet.getCell("A1");
        titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        worksheet.addRow([]); // Blank spacer row

        // Add column headers
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { name: "Calibri", size: 11, bold: true };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D3D3D3" } };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cell.alignment = { horizontal: "center" };
        });

        // Add data rows
        sellingPrices.forEach((item) => {
            worksheet.addRow([
                item.saleCode || "",
                item.lotNo || "",
                item.category || "",
                item.grade || "",
                item.broker || "",
                item.sellingMark || "",
                item.bags ?? "",
                item.netWeight ?? "",
                item.totalWeight ?? "",
                item.producerCountry || "",
                item.askingPrice ?? "",
                item.purchasePrice ?? "",
                item.invoiceNo || "",
                item.manufactureDate
                    ? new Date(item.manufactureDate).toLocaleDateString("en-GB")
                    : "",
                item.reprint ?? "",
            ]);
        });

        // Style data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 3) {
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: "left" };
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                });
            }
        });

        // Set fixed column widths for consistent professional layout
        const columnWidths = [
            14, // Sale Code
            12, // Lot Number
            10, // Category
            10, // Grade
            12, // Broker
            14, // Selling Mark
            8,  // Bags
            12, // Net Weight
            14, // Total Weight
            12, // Country
            14, // Asking Price
            14, // Purchase Price
            12, // Invoice No
            12, // Mft Date
            10  // Reprint
        ];

        columnWidths.forEach((width, i) => {
            worksheet.getColumn(i + 1).width = width;
        });


        // Add footer
        const lastRow = worksheet.addRow([]);
        lastRow.getCell(1).value = `Generated from bgatltd.com on ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`;
        lastRow.getCell(1).font = { name: "Calibri", size: 8, italic: true };
        lastRow.getCell(1).alignment = { horizontal: "center" };
        worksheet.mergeCells(`A${lastRow.number}:O${lastRow.number}`);

        // Freeze rows: title + spacer + header
        worksheet.views = [{ state: "frozen", ySplit: 3 }];

        worksheet.protect("bgatltd2025", {
            selectLockedCells: false,
            selectUnlockedCells: false,
        });

        // Send the file
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="selling_prices_${new Date().toISOString().split("T")[0]}.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();

        console.log(`[${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}] Exported ${sellingPrices.length} selling prices to XLSX`);
    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ message: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    } finally {
        await prisma.$disconnect();
    }
};
