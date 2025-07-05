import { Request, Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { Parser } from "csv-parse";
import { Broker, Catalog, TeaCategory, TeaGrade } from "@prisma/client";
import ExcelJS from "exceljs";
import {
    createCatalogSchema,
    csvRecordSchema,
    querySchema,
} from "../schemas/catalogSchemas";
import { authenticateUser } from "../utils/controllerUtils";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// Schema for CSV upload request
const csvUploadSchema = z.object({
    duplicateAction: z.enum(["skip", "replace"]).optional().default("skip"),
});

export const serializeCatalog = (
    catalog: Catalog & {
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
    invoiceNo: string;
    saleCode: string;
    askingPrice: number;
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
    id: catalog.id,
    lotNo: catalog.lotNo,
    sellingMark: catalog.sellingMark,
    bags: catalog.bags,
    totalWeight: Number(catalog.totalWeight),
    netWeight: Number(catalog.netWeight),
    invoiceNo: catalog.invoiceNo,
    saleCode: catalog.saleCode,
    askingPrice: Number(catalog.askingPrice),
    adminCognitoId: catalog.adminCognitoId,
    producerCountry: catalog.producerCountry ?? null,
    manufactureDate: catalog.manufactureDate.toISOString(),
    category: catalog.category,
    grade: catalog.grade,
    broker: catalog.broker,
    reprint: catalog.reprint,
    admin: catalog.admin ?? null,
});


// Build Where Conditions
const buildWhereConditions = (
    params: Omit<z.infer<typeof querySchema>, "page" | "limit"> & { shipmentId?: number } | undefined | null,
    userId?: string,
    role?: "admin" | "user"
): Prisma.CatalogWhereInput => {
    const conditions: Prisma.CatalogWhereInput = {};

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
        favoriteIds: (value) => {
            if (value?.length) conditions.id = { in: value };
        },
        lotNo: (value) => {
            if (value) conditions.lotNo = { equals: value };
        },
        sellingMark: (value) => {
            if (value) conditions.sellingMark = { equals: value };
        },
        bags: (value) => {
            if (value) conditions.bags = value;
        },
        totalWeight: (value) => {
            if (value) conditions.totalWeight = value;
        },
        netWeight: (value) => {
            if (value) conditions.netWeight = value;
        },
        askingPrice: (value) => {
            if (value) conditions.askingPrice = value;
        },
        producerCountry: (value) => {
            if (value) conditions.producerCountry = { equals: value };
        },
        manufactureDate: (value) => {
            if (value) conditions.manufactureDate = new Date(value);
        },
        saleCode: (value) => {
            if (value) conditions.saleCode = value;
        },
        category: (value) => {
            if (value && value !== "any") conditions.category = value as TeaCategory;
        },
        grade: (value) => {
            if (value && value !== "any") conditions.grade = value as TeaGrade;
        },
        broker: (value) => {
            if (value && value !== "any") conditions.broker = value as Broker;
        },
        invoiceNo: (value) => {
            if (value) conditions.invoiceNo = { equals: value };
        },
        reprint: (value) => {
            if (value !== undefined) {
                if (value !== "No" && isNaN(Number(value))) {
                    throw new Error(`Invalid reprint: ${value}. Must be "No" or a number`);
                }
                conditions.reprint = value;
            }
        },
    };

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && filterMap[key]) filterMap[key](value);
    });

    if (params.search) {
        const orConditions: Prisma.CatalogWhereInput[] = [
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

        conditions.OR = [
            ...(conditions.OR || []),
            ...orConditions,
        ];
    }

    return conditions;
};

export const getCatalogs = async (req: Request, res: Response) => {
    try {
        let rawIds = req.query.ids;
        if (typeof rawIds === "string") {
            rawIds = rawIds.split(",").map((id) => id.trim());
        } else if (!Array.isArray(rawIds)) {
            rawIds = rawIds ? [rawIds] : undefined;
        }

        const params = querySchema.safeParse({
            ...req.query,
            ids: rawIds ? rawIds.map((id) => Number(id)) : undefined,
        });

        if (!params.success) {
            return res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
        }

        const {
            ids,
            lotNo,
            sellingMark,
            bags,
            totalWeight,
            netWeight,
            askingPrice,
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

        const where: Prisma.CatalogWhereInput = buildWhereConditions({
            ids,
            lotNo,
            sellingMark,
            bags,
            totalWeight,
            netWeight,
            askingPrice,
            producerCountry,
            manufactureDate,
            saleCode,
            category,
            grade,
            broker,
            invoiceNo,
            reprint,
        });

        const skip = (page - 1) * limit;
        const take = limit;

        const [catalogs, total] = await Promise.all([
            prisma.catalog.findMany({
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
            prisma.catalog.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        // Normalize admin property for serializeCatalog
        const normalizedCatalogs = catalogs.map((catalog) => ({
            ...catalog,
            admin: catalog.admin ?? undefined,
        }));

        return res.status(200).json({
            data: normalizedCatalogs.map(serializeCatalog),
            meta: { page, limit, total, totalPages },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const getCatalogFilterOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const [distinctValues, aggregates] = await Promise.all([
            prisma.catalog.findMany({
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
            prisma.catalog.aggregate({
                _min: { askingPrice: true, manufactureDate: true, bags: true, totalWeight: true, netWeight: true },
                _max: { askingPrice: true, manufactureDate: true, bags: true, totalWeight: true, netWeight: true },
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
            askingPrice: { min: Number(aggregates._min.askingPrice) ?? 0, max: Number(aggregates._max.askingPrice) ?? 1000 },
            manufactureDate: {
                min: aggregates._min.manufactureDate?.toISOString() ?? "2020-01-01T00:00:00Z",
                max: aggregates._max.manufactureDate?.toISOString() ?? new Date().toISOString(),
            },
            bags: { min: aggregates._min.bags ?? 0, max: aggregates._max.bags ?? 10000 },
            totalWeight: { min: Number(aggregates._min.totalWeight) ?? 0, max: Number(aggregates._max.totalWeight) ?? 100000 },
            netWeight: { min: Number(aggregates._min.netWeight) ?? 0, max: Number(aggregates._max.netWeight) ?? 1000 },
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const createCatalog = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const catalogData = createCatalogSchema.safeParse({
            ...req.body,
            adminCognitoId: authenticatedUser.userId,
        });

        if (!catalogData.success) {
            res.status(400).json({ message: "Invalid request body", details: catalogData.error.errors });
            return;
        }

        const newCatalog = await prisma.catalog.create({
            data: {
                broker: catalogData.data.broker as Broker,
                sellingMark: catalogData.data.sellingMark,
                lotNo: catalogData.data.lotNo,
                reprint: catalogData.data.reprint ?? null,
                bags: catalogData.data.bags,
                totalWeight: catalogData.data.totalWeight,
                netWeight: catalogData.data.netWeight,
                invoiceNo: catalogData.data.invoiceNo,
                saleCode: catalogData.data.saleCode,
                askingPrice: catalogData.data.askingPrice,
                adminCognitoId: catalogData.data.adminCognitoId,
                producerCountry: catalogData.data.producerCountry,
                manufactureDate: new Date(catalogData.data.manufactureDate),
                category: catalogData.data.category as TeaCategory,
                grade: catalogData.data.grade as TeaGrade,
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

        // Ensure admin is typed correctly for serializeCatalog
        const catalogWithAdmin = {
            ...newCatalog,
            admin: newCatalog.admin ?? undefined,
        };

        res.status(201).json({ data: serializeCatalog(catalogWithAdmin) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "Duplicate catalog entry", details: error.meta });
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

export const getCatalogById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid catalog ID" });
            return;
        }

        const catalog = await prisma.catalog.findUnique({
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

        if (!catalog) {
            res.status(404).json({ message: "Catalog not found" });
            return;
        }

        // Normalize admin property for serializeCatalog
        const catalogWithAdmin = {
            ...catalog,
            admin: catalog.admin ?? undefined,
        };

        res.status(200).json(serializeCatalog(catalogWithAdmin));
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const deleteCatalogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { ids } = req.body;
        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Deleting catalogs with ids:`, ids);

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No catalog IDs provided" });
            return;
        }

        const catalogIds = ids.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
        if (catalogIds.length === 0) {
            res.status(400).json({ message: "Invalid catalog IDs", details: { providedIds: ids } });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const catalogs = await tx.catalog.findMany({
                where: {
                    id: { in: catalogIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
                select: { id: true, lotNo: true, adminCognitoId: true },
            });

            if (catalogs.length === 0) {
                throw new Error("No catalogs found or unauthorized");
            }

            const associations = catalogs.map((catalog) => ({
                id: catalog.id,
                lotNo: catalog.lotNo,
            }));

            await tx.catalog.deleteMany({
                where: {
                    id: { in: catalogIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
            });

            return { deletedCount: catalogs.length, associations };
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} catalog(s)`,
            associations: result.associations,
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete catalogs error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ids: req.body.ids,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No catalogs found" });
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

export const deleteAllCatalogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const filters = req.body || {}; // Default to empty object if req.body is undefined/null
        const where = buildWhereConditions(filters, authenticatedUser.userId);

        const result = await prisma.$transaction(async (tx) => {
            const catalogs = await tx.catalog.findMany({
                where,
                select: { id: true, lotNo: true },
            });

            if (catalogs.length === 0) {
                throw new Error("No catalogs found or unauthorized");
            }

            const associations = catalogs.map((catalog) => ({
                id: catalog.id,
                lotNo: catalog.lotNo,
            }));

            const { count } = await tx.catalog.deleteMany({ where });

            return { deletedCount: count, associations };
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} catalog(s)`,
            associations: result.associations,
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete all catalogs error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            filters: req.body,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No catalogs found", details: { filters: req.body } });
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

// Utility function to normalize field names (convert to camelCase, remove spaces, handle BOM)
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
    producercountry: "producerCountry",
    manufactureddate: "manufactureDate",
};

// Cache enum values for O(1) lookup
const teaCategories = new Set(Object.values(TeaCategory));
const teaGrades = new Set(Object.values(TeaGrade));
const brokers = new Set(Object.values(Broker));

export async function uploadCatalogsCsv(req: Request, res: Response): Promise<void> {
    const errors: Array<{ row: number; message: string }> = [];
    let createdCount = 0;
    let skippedCount = 0;
    let replacedCount = 0;

    try {
        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting CSV upload:`, {
        //     file: req.file?.originalname,
        //     size: req.file?.size,
        //     body: req.body,
        // });

        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Authentication failed`);
            res.status(401).json({ message: "Authentication failed: No authenticated user found" });
            return;
        }

        if (authenticatedUser.role.toLowerCase() !== "admin") {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Forbidden: User role ${authenticatedUser.role}`);
            res.status(403).json({ message: "Forbidden: Only admins can upload catalogs" });
            return;
        }

        if (!req.file) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] No CSV file provided`);
            res.status(400).json({ message: "CSV file required" });
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_FILE_SIZE) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] File too large: ${req.file.size} bytes`);
            res.status(400).json({ message: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
            return;
        }

        const parsedParams = csvUploadSchema.safeParse(req.body);
        if (!parsedParams.success) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Invalid duplicateAction:`, parsedParams.error.errors);
            res.status(400).json({ message: "Invalid duplicateAction", details: parsedParams.error.errors });
            return;
        }
        const { duplicateAction } = parsedParams.data;

        let rowIndex = 1;
        let batch: Array<{ catalog: Prisma.CatalogCreateInput; rowIndex: number }> = [];
        const BATCH_SIZE = 50;
        const MAX_CONCURRENT_BATCHES = 2;

        let csvBuffer = req.file.buffer;
        if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
            csvBuffer = csvBuffer.slice(3);
        }

        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Parsing CSV file: ${req.file.originalname}`);

        const parser = new Parser({
            columns: (header) => {
                console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] CSV headers:`, header);
                const normalizedHeaders = header.map((field: string) => {
                    const normalized = normalizeFieldName(field);
                    return fieldNameMapping[normalized] || normalized;
                });
                return normalizedHeaders;
            },
            skip_empty_lines: true,
            trim: true,
        });

        const stream = Readable.from(csvBuffer);
        stream.pipe(parser);

        const processBatch = async (batch: Array<{ catalog: Prisma.CatalogCreateInput; rowIndex: number }>) => {
            let retries = 3;
            let success = false;
            let lastError: unknown;

            while (retries > 0 && !success) {
                try {
                    const result = await prisma.$transaction(async (tx) => {
                        let batchCreated = 0;
                        let batchSkipped = 0;
                        let batchReplaced = 0;

                        if (duplicateAction === "skip") {
                            const lotNos = batch.map((item) => item.catalog.lotNo);
                            const existing = await tx.catalog.findMany({
                                where: { lotNo: { in: lotNos } },
                                select: { lotNo: true },
                            });
                            const existingLotNos = new Set(existing.map((item) => item.lotNo));

                            const toCreate = batch.filter((item) => !existingLotNos.has(item.catalog.lotNo));
                            batchSkipped += batch.length - toCreate.length;

                            if (toCreate.length > 0) {
                                await tx.catalog.createMany({
                                    data: toCreate.map((item) => item.catalog),
                                    skipDuplicates: true,
                                });
                                batchCreated += toCreate.length;
                            }
                        } else if (duplicateAction === "replace") {
                            for (const { catalog, rowIndex } of batch) {
                                try {
                                    await tx.catalog.upsert({
                                        where: { lotNo: catalog.lotNo },
                                        update: { ...catalog, updatedAt: new Date() },
                                        create: catalog,
                                    });
                                    batchReplaced++;
                                } catch (error) {
                                    errors.push({
                                        row: rowIndex,
                                        message: error instanceof Error ? error.message : String(error),
                                    });
                                }
                            }
                        } else {
                            await tx.catalog.createMany({
                                data: batch.map((item) => item.catalog),
                                skipDuplicates: true,
                            });
                            batchCreated += batch.length;
                        }

                        return { batchCreated, batchSkipped, batchReplaced };
                    }, { timeout: 60000 });

                    createdCount += result.batchCreated;
                    skippedCount += result.batchSkipped;
                    replacedCount += result.batchReplaced;
                    success = true;
                } catch (error) {
                    lastError = error;
                    retries--;
                    console.warn(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Batch ${Math.floor(rowIndex / BATCH_SIZE)} failed, retries left: ${retries}`, {
                        message: error instanceof Error ? error.message : String(error),
                    });
                    if (retries === 0) {
                        throw lastError;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
        };

        let activeBatches = 0;
        const batchPromises: Promise<void>[] = [];

        for await (const record of parser) {
            rowIndex++;
            try {
                if (!record.lotNo || !record.saleCode) {
                    throw new Error("Missing required fields: lotNo or saleCode");
                }

                const parsedRecord = {
                    ...record,
                    bags: record.bags ? Number(record.bags) : undefined,
                    totalWeight: record.totalWeight ? Number(record.totalWeight) : undefined,
                    netWeight: record.netWeight ? Number(record.netWeight) : undefined,
                    askingPrice: record.askingPrice ? Number(record.askingPrice) : undefined,
                    reprint: record.reprint !== undefined ? String(record.reprint) : undefined,
                    saleCode: record.saleCode,
                    manufactureDate: record.manufactureDate,
                    category: record.category,
                    grade: record.grade,
                    broker: record.broker,
                };

                if (parsedRecord.reprint && parsedRecord.reprint !== "No" && isNaN(Number(parsedRecord.reprint))) {
                    throw new Error(`Invalid reprint value: ${parsedRecord.reprint}. Must be "No" or a number`);
                }

                if (parsedRecord.bags && isNaN(parsedRecord.bags)) {
                    throw new Error("Invalid number format for bags");
                }
                if (parsedRecord.totalWeight && isNaN(parsedRecord.totalWeight)) {
                    throw new Error("Invalid number format for totalWeight");
                }
                if (parsedRecord.netWeight && isNaN(parsedRecord.netWeight)) {
                    throw new Error("Invalid number format for netWeight");
                }
                if (parsedRecord.askingPrice && isNaN(parsedRecord.askingPrice)) {
                    throw new Error("Invalid number format for askingPrice");
                }

                if (parsedRecord.category && !teaCategories.has(parsedRecord.category as TeaCategory)) {
                    throw new Error(`Invalid category: ${parsedRecord.category}`);
                }
                if (parsedRecord.grade && !teaGrades.has(parsedRecord.grade as TeaGrade)) {
                    throw new Error(`Invalid grade: ${parsedRecord.grade}`);
                }
                if (parsedRecord.broker && !brokers.has(parsedRecord.broker as Broker)) {
                    throw new Error(`Invalid broker: ${parsedRecord.broker}`);
                }

                const parsed = csvRecordSchema.safeParse(parsedRecord);
                if (!parsed.success) {
                    throw new Error(parsed.error.errors.map((err) => err.message).join(", "));
                }

                const data = parsed.data;

                batch.push({
                    catalog: {
                        broker: data.broker as Broker,
                        sellingMark: data.sellingMark,
                        lotNo: data.lotNo,
                        reprint: data.reprint ?? null,
                        bags: data.bags,
                        totalWeight: data.totalWeight,
                        netWeight: data.netWeight,
                        invoiceNo: data.invoiceNo,
                        saleCode: data.saleCode,
                        askingPrice: data.askingPrice,
                        producerCountry: data.producerCountry,
                        manufactureDate: new Date(data.manufactureDate ?? Date.now()),
                        category: data.category as TeaCategory,
                        grade: data.grade as TeaGrade,
                    },
                    rowIndex,
                });

                if (batch.length >= BATCH_SIZE) {
                    console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Processing batch ${Math.floor(rowIndex / BATCH_SIZE)} (${batch.length} items)`);
                    batchPromises.push(processBatch(batch));
                    batch = [];
                    activeBatches++;

                    if (activeBatches >= MAX_CONCURRENT_BATCHES) {
                        await Promise.all(batchPromises);
                        batchPromises.length = 0;
                        activeBatches = 0;
                    }
                }
            } catch (error) {
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
            }
        }

        if (batch.length > 0) {
            // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Processing final batch (${batch.length} items)`);
            batchPromises.push(processBatch(batch));
        }

        await Promise.all(batchPromises);

        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Parsed ${rowIndex - 1} rows, ${createdCount + skippedCount + replacedCount} processed, ${errors.length} errors`);

        if (createdCount + skippedCount + replacedCount === 0) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] No valid catalogs processed`);
            res.status(400).json({ success: 0, errors });
            return;
        }

        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Transaction complete:`, {
        //     createdCount,
        //     skippedCount,
        //     replacedCount,
        //     errors: errors.length,
        // });

        if (errors.length > 0) {
            res.status(207).json({
                success: { created: createdCount, skipped: skippedCount, replaced: replacedCount },
                errors,
            });
            return;
        }

        res.status(201).json({
            success: { created: createdCount, skipped: skippedCount, replaced: replacedCount },
            errors,
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Upload catalogs error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            file: req.file?.originalname,
            size: req.file?.size,
            body: req.body,
            processedCount: createdCount + skippedCount + replacedCount,
            errorsCount: errors.length,
        });
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({
                message: "One or more catalogs have duplicate lotNo",
                details: error.meta,
            });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
            file: req.file?.originalname,
            size: req.file?.size,
            body: req.body,
            processedCount: createdCount + skippedCount + replacedCount,
            errorsCount: errors.length,
        });
    }
}

export const exportCatalogsXlsx = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const params = querySchema.extend({ catalogIds: z.string().optional() }).safeParse(req.body || {});
        if (!params.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
            return;
        }

        const { page = 1, limit = 10000, catalogIds, ...filterParams } = params.data;

        let where: Prisma.CatalogWhereInput = {};
        if (catalogIds) {
            const ids = [...new Set(catalogIds.split(",").map(id => parseInt(id.trim())))].filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid catalogIds provided" });
                return;
            }
            where = { id: { in: ids } };
        } else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams, authenticatedUser.userId, authenticatedUser.role.toLowerCase() as "admin" | "user");
        }

        const catalogs = await prisma.catalog.findMany({
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
                invoiceNo: true,
                manufactureDate: true,
                reprint: true,
            },
            ...(catalogIds ? {} : { skip: (page - 1) * limit, take: limit }),
        });

        if (!catalogs.length) {
            res.status(404).json({ message: "No catalogs found" });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tea Catalog");

        // ✅ Title row
        worksheet.addRow(["Official Black Gold Africa Traders Ltd Catalog"]);
        worksheet.mergeCells("A1:N1");
        worksheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
        worksheet.getCell("A1").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4CAF50" },
        };
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;
        worksheet.addRow([]); // Blank row

        // ✅ Header row
        const headers = [
            "Sale Code", "Lot Number", "Category", "Grade", "Broker", "Selling Mark",
            "Bags", "Net Weight", "Total Weight", "Country", "Asking Price",
            "Invoice No", "Mft Date", "Reprint"
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

        // ✅ Data rows
        catalogs.forEach((catalog) => {
            worksheet.addRow([
                catalog.saleCode || "",
                catalog.lotNo || "",
                catalog.category || "",
                catalog.grade || "",
                catalog.broker || "",
                catalog.sellingMark || "",
                catalog.bags ?? "",
                catalog.netWeight ?? "",
                catalog.totalWeight ?? "",
                catalog.producerCountry || "",
                catalog.askingPrice ?? "",
                catalog.invoiceNo || "",
                catalog.manufactureDate
                    ? new Date(catalog.manufactureDate).toLocaleDateString("en-GB")
                    : "",
                catalog.reprint ?? "",
            ]);
        });

        // ✅ Style data rows
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

        // ✅ Set manual column widths
        const widths = [14, 12, 10, 10, 12, 14, 8, 12, 14, 12, 14, 12, 12, 10];
        widths.forEach((width, i) => {
            worksheet.getColumn(i + 1).width = width;
        });

        // ✅ Footer
        const lastRow = worksheet.addRow([]);
        lastRow.getCell(1).value = `Generated from bgatltd.com on ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`;
        lastRow.getCell(1).font = { name: "Calibri", size: 8, italic: true };
        lastRow.getCell(1).alignment = { horizontal: "center" };
        worksheet.mergeCells(`A${lastRow.number}:N${lastRow.number}`);

        // ✅ Freeze top rows
        worksheet.views = [{ state: "frozen", ySplit: 3 }];

        // ✅ Protect worksheet (optional)
        worksheet.protect("bgatltd2025", {
            selectLockedCells: false,
            selectUnlockedCells: false,
        });

        // ✅ Send file
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="tea_catalog_${new Date().toISOString().split("T")[0]}.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();

        // console.log(`[${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}] Exported ${catalogs.length} catalogs as XLSX`);
    } catch (error) {
        console.error("Export XLSX error:", error);
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
};