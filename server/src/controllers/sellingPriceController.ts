import { Request, Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";
import { Parser } from "csv-parse";
import { Broker, SellingPrice, TeaCategory, TeaGrade } from "@prisma/client";
import { authenticateUser } from "../utils/controllerUtils";
import { PrismaClient, Prisma } from '@prisma/client';
import { createSellingPriceSchema, csvRecordSchema, querySchema } from "../schemas/sellingPricesSchema";

const prisma = new PrismaClient();

// Schema for CSV upload request
const csvUploadSchema = z.object({
    duplicateAction: z.enum(['skip', 'replace']).optional().default('skip'),
});

export const serializeSellingPrice = (
    sellingPrice: SellingPrice & {
        admin?: { id: number; adminCognitoId: string; name: string | null; email: string | null; phoneNumber: string | null } | undefined;
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
    reprint: number;
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
    reprint: sellingPrice.reprint,
    admin: sellingPrice.admin ?? null,
});

const buildWhereConditions = (
    params: Omit<z.infer<typeof querySchema>, 'page' | 'limit'> & { shipmentId?: number }
): Prisma.SellingPriceWhereInput => {
    const conditions: Prisma.SellingPriceWhereInput = {};
    const filterMap: Record<string, (value: any) => void> = {
        ids: (value) => { if (value?.length) conditions.id = { in: value }; },
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
        category: (value) => { if (value && value !== 'any') conditions.category = value as TeaCategory; },
        grade: (value) => { if (value && value !== 'any') conditions.grade = value as TeaGrade; },
        broker: (value) => { if (value && value !== 'any') conditions.broker = value as Broker; },
        invoiceNo: (value) => { if (value) conditions.invoiceNo = { equals: value }; },
        reprint: (value) => { if (value !== undefined) conditions.reprint = value; },
    };

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && filterMap[key]) filterMap[key](value);
    });

    if (params.search) {
        const orConditions: Prisma.SellingPriceWhereInput[] = [
            { lotNo: { contains: params.search, mode: 'insensitive' } },
            { invoiceNo: { contains: params.search, mode: 'insensitive' } },
            { sellingMark: { contains: params.search, mode: 'insensitive' } },
            { producerCountry: { contains: params.search, mode: 'insensitive' } },
        ];
        if (Object.values(TeaCategory).includes(params.search as TeaCategory)) {
            orConditions.push({ category: params.search as TeaCategory });
        }
        if (Object.values(Broker).includes(params.search as Broker)) {
            orConditions.push({ broker: params.search as Broker });
        }
        if (Object.values(TeaGrade).includes(params.search as TeaGrade)) {
            orConditions.push({ grade: params.search as TeaGrade });
        }
        conditions.OR = orConditions;
    }

    return conditions;
};

export const getSellingPrices = async (req: Request, res: Response) => {
    try {
        let rawIds = req.query.ids;
        if (typeof rawIds === 'string') {
            rawIds = rawIds.split(',').map(id => id.trim());
        } else if (!Array.isArray(rawIds)) {
            rawIds = rawIds ? [rawIds] : undefined;
        }

        const params = querySchema.safeParse({
            ...req.query,
            ids: rawIds ? rawIds.map(id => Number(id)) : undefined,
        });

        if (!params.success) {
            return res.status(400).json({
                message: 'Invalid query parameters',
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
            limit = 20,
        } = params.data;

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
        });

        const skip = (page - 1) * limit;
        const take = limit;

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

        const totalPages = Math.ceil(total / limit);

        // Normalize admin property for serializeSellingPrice
        const normalizedSellingPrices = sellingPrices.map((sellingPrice) => ({
            ...sellingPrice,
            admin: sellingPrice.admin ?? undefined,
        }));

        return res.status(200).json({
            data: normalizedSellingPrices.map(serializeSellingPrice),
            meta: { page, limit, total, totalPages },
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const getSellingPricesFilterOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const where: Prisma.SellingPriceWhereInput = {
            AND: [{ producerCountry: { not: undefined } }, { invoiceNo: { not: undefined } }],
        };

        const [distinctValues, aggregates] = await Promise.all([
            prisma.sellingPrice.findMany({
                where,
                select: {
                    producerCountry: true,
                    grade: true,
                    category: true,
                    saleCode: true,
                    broker: true,
                    sellingMark: true,
                    invoiceNo: true,
                },
                distinct: ['producerCountry', 'grade', 'category', 'saleCode', 'broker', 'sellingMark', 'invoiceNo'],
                orderBy: { producerCountry: 'asc' },
            }),
            prisma.sellingPrice.aggregate({
                where,
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
            askingPrice: { min: Number(aggregates._min.askingPrice) ?? 0, max: Number(aggregates._max.askingPrice) ?? 1000 },
            purchasePrice: { min: Number(aggregates._min.purchasePrice) ?? 0, max: Number(aggregates._max.purchasePrice) ?? 1000 },
            manufactureDate: {
                min: aggregates._min.manufactureDate?.toISOString() ?? '2020-01-01T00:00:00Z',
                max: aggregates._max.manufactureDate?.toISOString() ?? new Date().toISOString(),
            },
            bags: { min: aggregates._min.bags ?? 0, max: aggregates._max.bags ?? 1000 },
            totalWeight: { min: Number(aggregates._min.totalWeight) ?? 0, max: Number(aggregates._max.totalWeight) ?? 100000 },
            netWeight: { min: Number(aggregates._min.netWeight) ?? 0, max: Number(aggregates._max.netWeight) ?? 1000 },
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const createSellingPrices = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Restrict creation to admins
        if (authenticatedUser.role.toLowerCase() !== 'admin') {
            res.status(403).json({ message: 'Forbidden: Only admins can create selling prices' });
            return;
        }

        const sellingPriceData = createSellingPriceSchema.safeParse({
            ...req.body,
            adminCognitoId: authenticatedUser.userId, // Always use authenticated admin's ID
        });

        if (!sellingPriceData.success) {
            res.status(400).json({ message: 'Invalid request body', details: sellingPriceData.error.errors });
            return;
        }

        const admin = await prisma.admin.findUnique({
            where: { adminCognitoId: sellingPriceData.data.adminCognitoId },
        });
        if (!admin) {
            res.status(404).json({ message: `Admin with cognitoId ${sellingPriceData.data.adminCognitoId} not found` });
            return;
        }

        const newSellingPrice = await prisma.sellingPrice.create({
            data: {
                broker: sellingPriceData.data.broker as Broker,
                sellingMark: sellingPriceData.data.sellingMark,
                lotNo: sellingPriceData.data.lotNo,
                reprint: sellingPriceData.data.reprint,
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

        // Normalize admin property for serializeSellingPrice
        const normalizedSellingPrice = {
            ...newSellingPrice,
            admin: newSellingPrice.admin ?? undefined,
        };

        res.status(201).json({ data: serializeSellingPrice(normalizedSellingPrice) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: 'Duplicate selling price entry', details: error.meta });
            return;
        }
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const getSellingPricesById = async (req: Request, res: Response): Promise<void> => {
    try {
        const idSchema = z.string().regex(/^\d+$/, 'Selling price ID must be a positive integer');
        const parsedId = idSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            res.status(400).json({ message: 'Invalid selling price ID', details: parsedId.error.errors });
            return;
        }

        const id = parseInt(parsedId.data);

        const sellingPrice = await prisma.sellingPrice.findUnique({
            where: { id },
            select: {
                id: true,
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
                adminCognitoId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!sellingPrice) {
            res.status(404).json({ message: `Selling price with ID ${id} not found` });
            return;
        }

        res.status(200).json(sellingPrice);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const deleteSellingPrices = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) return;

        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No selling price IDs provided" });
            return;
        }

        const sellingPriceIds = ids.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
        if (sellingPriceIds.length === 0) {
            res.status(400).json({ message: "Invalid selling price IDs" });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const sellingPrices = await tx.sellingPrice.findMany({
                where: { id: { in: sellingPriceIds } },
                select: { id: true, lotNo: true },
            });

            if (sellingPrices.length === 0) {
                throw new Error("No selling prices found");
            }

            const associations = sellingPrices.map((sellingPrice) => ({
                id: sellingPrice.id,
                lotNo: sellingPrice.lotNo,
            }));

            await tx.sellingPrice.deleteMany({ where: { id: { in: sellingPriceIds } } });

            return { deletedCount: sellingPrices.length, associations };
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} selling price(s)`,
            associations: result.associations,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No selling prices found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

export async function uploadSellingPricesCsv(req: Request, res: Response): Promise<void> {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            return;
        }

        if (authenticatedUser.role.toLowerCase() !== 'admin') {
            res.status(403).json({ message: 'Forbidden: Only admins can upload selling prices' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: 'CSV file required' });
            return;
        }

        const parsedParams = csvUploadSchema.safeParse(req.body);
        if (!parsedParams.success) {
            res.status(400).json({ message: 'Invalid duplicateAction', details: parsedParams.error.errors });
            return;
        }
        const { duplicateAction } = parsedParams.data;

        const errors: Array<{ row: number; message: string }> = [];
        const validSellingPrices: Array<{
            sellingPrice: Prisma.SellingPriceCreateInput;
            rowIndex: number;
        }> = [];

        let rowIndex = 1;
        const parser = new Parser({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true, // Handle UTF-8 BOM
        });

        // Header normalization map
        const headerMap: Record<string, string> = {
            'broker': 'broker',
            'lot no': 'lotNo',
            'selling mark': 'sellingMark',
            'grade': 'grade',
            'invoice no': 'invoiceNo',
            'sale code': 'saleCode',
            'category': 'category',
            'rp': 'reprint',
            'bags': 'bags',
            'net weight': 'netWeight',
            'total weight': 'totalWeight',
            'asking price': 'askingPrice',
            'purchase price': 'purchasePrice',
            'producer country': 'producerCountry',
            'manufactured date': 'manufactureDate',
            'manufacture date': 'manufactureDate',
        };

        const stream = Readable.from(req.file.buffer.toString('utf8').replace(/^\uFEFF/, '')); // Strip BOM
        stream.pipe(parser);

        for await (const record of parser) {
            rowIndex++;
            try {
                // Normalize headers
                const normalizedRecord: Record<string, string> = {};
                for (const [key, value] of Object.entries(record)) {
                    const lowerKey = key.toLowerCase().trim().replace(/﻿/g, '');
                    const mappedKey = headerMap[lowerKey] || lowerKey;
                    if (typeof value === "string") {
                        normalizedRecord[mappedKey] = value;
                    }
                }

                const parsed = csvRecordSchema.safeParse({
                    ...normalizedRecord,
                    bags: normalizedRecord.bags ? parseInt(normalizedRecord.bags, 10) : undefined,
                    totalWeight: normalizedRecord.totalWeight ? parseFloat(normalizedRecord.totalWeight) : undefined,
                    netWeight: normalizedRecord.netWeight ? parseFloat(normalizedRecord.netWeight) : undefined,
                    askingPrice: normalizedRecord.askingPrice ? parseFloat(normalizedRecord.askingPrice) : undefined,
                    purchasePrice: normalizedRecord.purchasePrice ? parseFloat(normalizedRecord.purchasePrice) : undefined,
                    reprint: normalizedRecord.reprint ? (normalizedRecord.reprint.toLowerCase() === 'true' ? 1 : normalizedRecord.reprint.toLowerCase() === 'false' ? 0 : parseInt(normalizedRecord.reprint, 10)) : 0,
                    saleCode: normalizedRecord.saleCode,
                    adminCognitoId: authenticatedUser.userId,
                });

                if (!parsed.success) {
                    throw new Error(parsed.error.errors.map((err) => err.message).join(', '));
                }

                const data = parsed.data;

                const admin = await prisma.admin.findUnique({ where: { adminCognitoId: authenticatedUser.userId } });
                if (!admin) {
                    throw new Error(`Admin with adminCognitoId ${authenticatedUser.userId} not found`);
                }

                validSellingPrices.push({
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
                        admin: {
                            connect: { adminCognitoId: authenticatedUser.userId },
                        },
                    },
                    rowIndex,
                });

            } catch (error) {
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
            }
        }

        if (validSellingPrices.length === 0) {
            res.status(400).json({ success: 0, errors });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            let createdCount = 0;
            let skippedCount = 0;
            let replacedCount = 0;

            for (const { sellingPrice, rowIndex } of validSellingPrices) {
                const existing = await tx.sellingPrice.findUnique({
                    where: { lotNo: sellingPrice.lotNo },
                });

                if (existing) {
                    if (duplicateAction === 'skip') {
                        skippedCount++;
                        continue;
                    } else if (duplicateAction === 'replace') {
                        await tx.sellingPrice.delete({ where: { id: existing.id } });
                        replacedCount++;
                    }
                }

                await tx.sellingPrice.create({ data: sellingPrice });
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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: 'One or more selling prices have duplicate lotNo', details: error.meta });
            return;
        }
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
}

export const exportSellingPricesCsv = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const params = querySchema
            .extend({ sellingPriceIds: z.string().optional() })
            .safeParse(req.body);

        if (!params.success) {
            res.status(400).json({
                message: 'Invalid query parameters',
                details: params.error.errors,
            });
            return;
        }

        const { page = 1, limit = Number.MAX_SAFE_INTEGER, sellingPriceIds, ...filterParams } = params.data;

        let where: Prisma.SellingPriceWhereInput = {};

        if (sellingPriceIds) {
            const ids = [...new Set(sellingPriceIds.split(',').map(id => parseInt(id.trim())))]
                .filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: 'Invalid sellingPriceIds provided' });
                return;
            }
            where = { id: { in: ids } };
        } else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams);
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
        });

        if (!sellingPrices.length) {
            res.status(404).json({
                message: 'No selling prices found for the provided filters or IDs',
            });
            return;
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'saleCode', title: 'Sale Code' },
                { id: 'lotNo', title: 'Lot Number' },
                { id: 'category', title: 'Category' },
                { id: 'grade', title: 'Grade' },
                { id: 'broker', title: 'Broker' },
                { id: 'sellingMark', title: 'Selling Mark' },
                { id: 'bags', title: 'Bags' },
                { id: 'netWeight', title: 'Net Weight' },
                { id: 'totalWeight', title: 'Total Weight' },
                { id: 'producerCountry', title: 'Producer Country' },
                { id: 'askingPrice', title: 'Asking Price' },
                { id: 'purchasePrice', title: 'Purchase Price' },
                { id: 'invoiceNo', title: 'Invoice Number' },
                { id: 'manufactureDate', title: 'Manufacture Date' },
                { id: 'reprint', title: 'Reprint' },
            ],
        });

        const csvContent =
            csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(
                sellingPrices.map(s => ({
                    ...s,
                    manufactureDate: new Date(s.manufactureDate).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    }).split('/').join('/'),
                    totalWeight: Number(s.totalWeight),
                    netWeight: Number(s.netWeight),
                    askingPrice: Number(s.askingPrice),
                    purchasePrice: Number(s.purchasePrice),
                }))
            );

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="selling_prices_${new Date().toISOString().split('T')[0]}.csv"`
        );

        res.status(200).send(csvContent);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
};