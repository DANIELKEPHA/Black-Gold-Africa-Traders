import { Request, Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";
import { Parser } from "csv-parse";
import { Broker, Catalog, TeaCategory, TeaGrade } from "@prisma/client";
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
    reprint: number;
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
    params: Omit<z.infer<typeof querySchema>, "page" | "limit"> & { shipmentId?: number }
): Prisma.CatalogWhereInput => {
    const conditions: Prisma.CatalogWhereInput = {};
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
            if (value !== undefined) conditions.reprint = value;
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
        conditions.OR = orConditions;
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
            bags: { min: aggregates._min.bags ?? 0, max: aggregates._max.bags ?? 1000 },
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
                reprint: catalogData.data.reprint,
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
            res.status(404).json({ message: "Stocks not found" });
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
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No catalog IDs provided" });
            return;
        }

        const catalogIds = ids.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
        if (catalogIds.length === 0) {
            res.status(400).json({ message: "Invalid catalog IDs" });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            // Allow catalogs with null adminCognitoId or matching adminCognitoId
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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No catalogs found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
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

export async function uploadCatalogsCsv(req: Request, res: Response): Promise<void> {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Authentication failed: No authenticated user found" });
            return;
        }

        if (authenticatedUser.role.toLowerCase() !== "admin") {
            res.status(403).json({ message: "Forbidden: Only admins can upload catalogs" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "CSV file required" });
            return;
        }

        const parsedParams = csvUploadSchema.safeParse(req.body);
        if (!parsedParams.success) {
            res.status(400).json({ message: "Invalid duplicateAction", details: parsedParams.error.errors });
            return;
        }
        const { duplicateAction } = parsedParams.data;

        const errors: Array<{ row: number; message: string }> = [];
        const validCatalogs: Array<{
            catalog: Prisma.CatalogCreateInput;
            rowIndex: number;
        }> = [];

        let rowIndex = 1;

        // Remove BOM from the file buffer if present
        let csvBuffer = req.file.buffer;
        if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
            csvBuffer = csvBuffer.slice(3);
        }

        const parser = new Parser({
            columns: (header) => {
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

        for await (const record of parser) {
            rowIndex++;
            try {
                // Normalize and parse the record
                const parsedRecord = {
                    ...record,
                    bags: record.bags ? Number(record.bags) : undefined,
                    totalWeight: record.totalWeight ? Number(record.totalWeight) : undefined,
                    netWeight: record.netWeight ? Number(record.netWeight) : undefined,
                    askingPrice: record.askingPrice ? Number(record.askingPrice) : undefined,
                    reprint: record.reprint ? Number(record.reprint) : 0,
                    saleCode: record.saleCode,
                    manufactureDate: record.manufactureDate
                        ? record.manufactureDate
                            .split("/")
                            .map((part: string, index: number) => (index === 0 ? part : part.padStart(2, "0")))
                            .join("/")
                        : undefined,
                };

                // Validate numeric fields to prevent NaN
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
                if (parsedRecord.reprint && isNaN(parsedRecord.reprint)) {
                    throw new Error("Invalid number format for reprint");
                }

                const parsed = csvRecordSchema.safeParse(parsedRecord);

                if (!parsed.success) {
                    throw new Error(parsed.error.errors.map((err) => err.message).join(", "));
                }

                const data = parsed.data;

                validCatalogs.push({
                    catalog: {
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
                        producerCountry: data.producerCountry,
                        manufactureDate: new Date(data.manufactureDate.replace(/\//g, "-")), // Convert YYYY/MM/DD to YYYY-MM-DD
                        category: data.category as TeaCategory,
                        grade: data.grade as TeaGrade,
                    },
                    rowIndex,
                });
            } catch (error) {
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
            }
        }

        if (validCatalogs.length === 0) {
            res.status(400).json({ success: 0, errors });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            let createdCount = 0;
            let skippedCount = 0;
            let replacedCount = 0;

            for (const { catalog, rowIndex } of validCatalogs) {
                const existing = await tx.catalog.findUnique({
                    where: { lotNo: catalog.lotNo },
                });

                if (existing) {
                    if (duplicateAction === "skip") {
                        skippedCount++;
                        continue;
                    } else if (duplicateAction === "replace") {
                        await tx.catalog.delete({ where: { id: existing.id } });
                        replacedCount++;
                    }
                }

                await tx.catalog.create({ data: catalog });
                createdCount++;
            }

            return { createdCount, skippedCount, replacedCount };
        });

        res.status(201).json({
            success: {
                created: result.createdCount,
                skipped: result.skippedCount,
                replaced: result.replacedCount,
            },
            errors,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "One or more catalogs have duplicate lotNo", details: error.meta });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
}

export const exportCatalogsCsv = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const params = querySchema.extend({ catalogIds: z.string().optional() }).safeParse(req.body);

        if (!params.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
            return;
        }

        const { page = 1, limit = 1000, catalogIds, ...filterParams } = params.data;

        const maxRecords = 10000;
        if (limit > maxRecords) {
            res.status(400).json({ message: `Export limit cannot exceed ${maxRecords} records` });
            return;
        }

        let where: Prisma.CatalogWhereInput = {};

        if (catalogIds) {
            const ids = [...new Set(catalogIds.split(",").map((id) => parseInt(id.trim())))].filter((id) => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid catalogIds provided" });
                return;
            }
            where = { id: { in: ids } };
        } else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams);
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
            res.status(404).json({
                message: "No catalogs found for the provided filters or IDs",
            });
            return;
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: "saleCode", title: "Sale Code" },
                { id: "lotNo", title: "Lot Number" },
                { id: "category", title: "Category" },
                { id: "grade", title: "Grade" },
                { id: "broker", title: "Broker" },
                { id: "sellingMark", title: "Selling Mark" },
                { id: "bags", title: "Bags" },
                { id: "netWeight", title: "Net Weight" },
                { id: "totalWeight", title: "Total Weight" },
                { id: "producerCountry", title: "Producer Country" },
                { id: "askingPrice", title: "Asking Price" },
                { id: "invoiceNo", title: "Invoice Number" },
                { id: "manufactureDate", title: "Manufacture Date" },
                { id: "reprint", title: "Reprint" },
            ],
        });

        const csvContent =
            csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(
                catalogs.map((catalog) => ({
                    ...catalog,
                    manufactureDate: new Date(catalog.manufactureDate).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                    }),
                    totalWeight: Number(catalog.totalWeight),
                    netWeight: Number(catalog.netWeight),
                    askingPrice: Number(catalog.askingPrice),
                }))
            );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="tea_catalog_${new Date().toISOString().split("T")[0]}.csv"`
        );

        res.status(200).send(csvContent);
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
};