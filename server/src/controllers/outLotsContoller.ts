import { Request, Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";
import { Parser } from "csv-parse";
import { Broker, OutLots, TeaGrade } from "@prisma/client";
import { authenticateUser } from "../utils/controllerUtils";
import { PrismaClient, Prisma } from '@prisma/client';
import { createOutLotSchema, csvRecordSchema, querySchema } from "../schemas/outLotsSchema";
import { AuthenticatedUser } from "../types";

const prisma = new PrismaClient();

// Schema for CSV upload request
const csvUploadSchema = z.object({
    duplicateAction: z.enum(['skip', 'replace']).optional().default('skip'),
});

export const serializeOutLot = (
    outLot: OutLots & {
        admin?: { id: number; adminCognitoId: string; name: string | null; email: string | null; phoneNumber: string | null } | undefined;
    }
): {
    id: number;
    auction: string;
    lotNo: string;
    broker: Broker;
    sellingMark: string;
    grade: TeaGrade;
    invoiceNo: string | null;
    bags: number;
    netWeight: number;
    totalWeight: number;
    baselinePrice: number;
    manufactureDate: string;
    adminCognitoId: string | null;
    admin: {
        id: number;
        adminCognitoId: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
    } | null;
} => ({
    id: outLot.id,
    auction: outLot.auction,
    lotNo: outLot.lotNo,
    broker: outLot.broker,
    sellingMark: outLot.sellingMark,
    grade: outLot.grade,
    invoiceNo: outLot.invoiceNo ?? null,
    bags: outLot.bags,
    netWeight: Number(outLot.netWeight),
    totalWeight: Number(outLot.totalWeight),
    baselinePrice: Number(outLot.baselinePrice),
    manufactureDate: outLot.manufactureDate.toISOString(),
    adminCognitoId: outLot.adminCognitoId ?? null,
    admin: outLot.admin ?? null,
});

// Build Where Conditions for OutLots
const buildWhereConditions = (
    params: Omit<z.infer<typeof querySchema>, 'page' | 'limit'> & { shipmentId?: number }
): Prisma.OutLotsWhereInput => {
    const conditions: Prisma.OutLotsWhereInput = {};
    const filterMap: Record<string, (value: any) => void> = {
        ids: (value) => { if (value?.length) conditions.id = { in: value }; },
        auction: (value) => { if (value) conditions.auction = { equals: value }; },
        lotNo: (value) => { if (value) conditions.lotNo = { equals: value }; },
        sellingMark: (value) => { if (value) conditions.sellingMark = { equals: value }; },
        grade: (value) => { if (value && value !== 'any') conditions.grade = value as TeaGrade; },
        broker: (value) => { if (value && value !== 'any') conditions.broker = value as Broker; },
        invoiceNo: (value) => { if (value) conditions.invoiceNo = { equals: value }; },
        bags: (value) => { if (value) conditions.bags = value; },
        netWeight: (value) => { if (value) conditions.netWeight = value; },
        totalWeight: (value) => { if (value) conditions.totalWeight = value; },
        baselinePrice: (value) => { if (value) conditions.baselinePrice = value; },
        manufactureDate: (value) => { if (value) conditions.manufactureDate = new Date(value); },
    };

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && filterMap[key]) filterMap[key](value);
    });

    if (params.search) {
        const orConditions: Prisma.OutLotsWhereInput[] = [
            { lotNo: { contains: params.search, mode: 'insensitive' } },
            { invoiceNo: { contains: params.search, mode: 'insensitive' } },
            { sellingMark: { contains: params.search, mode: 'insensitive' } },
            { auction: { contains: params.search, mode: 'insensitive' } },
        ];
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

export const getOutLots = async (req: Request, res: Response) => {
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
            auction,
            lotNo,
            sellingMark,
            grade,
            broker,
            invoiceNo,
            bags,
            netWeight,
            totalWeight,
            baselinePrice,
            manufactureDate,
            page = 1,
            limit = 20,
        } = params.data;

        const where: Prisma.OutLotsWhereInput = buildWhereConditions({
            ids,
            auction,
            lotNo,
            sellingMark,
            grade,
            broker,
            invoiceNo,
            bags,
            netWeight,
            totalWeight,
            baselinePrice,
            manufactureDate,
        });

        const skip = (page - 1) * limit;
        const take = limit;

        const [outLots, total] = await Promise.all([
            prisma.outLots.findMany({
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
            prisma.outLots.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        // Normalize admin property for serializeOutLot
        const normalizedOutLots = outLots.map((outLot) => ({
            ...outLot,
            admin: outLot.admin ?? undefined,
        }));

        return res.status(200).json({
            data: normalizedOutLots.map(serializeOutLot),
            meta: { page, limit, total, totalPages },
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

// Get filter options for OutLots
export const getOutLotsFilterOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const where: Prisma.OutLotsWhereInput = {
            invoiceNo: { not: undefined },
        };

        const [distinctValues, aggregates] = await Promise.all([
            prisma.outLots.findMany({
                where,
                select: {
                    grade: true,
                    auction: true,
                    broker: true,
                    sellingMark: true,
                    invoiceNo: true,
                },
                distinct: ['grade', 'auction', 'broker', 'sellingMark', 'invoiceNo'],
                orderBy: { auction: 'asc' },
            }),
            prisma.outLots.aggregate({
                where,
                _min: { baselinePrice: true, manufactureDate: true, bags: true, netWeight: true, totalWeight: true },
                _max: { baselinePrice: true, manufactureDate: true, bags: true, netWeight: true, totalWeight: true },
            }),
        ]);

        const grades = [...new Set(distinctValues.map((g) => g.grade))];
        const auctions = [...new Set(distinctValues.map((a) => a.auction))];
        const brokers = [...new Set(distinctValues.map((b) => b.broker))];
        const sellingMarks = [...new Set(distinctValues.map((sm) => sm.sellingMark))];
        const invoiceNos = [...new Set(distinctValues.map((inv) => inv.invoiceNo).filter((inv): inv is string => !!inv))];

        res.status(200).json({
            grades,
            auctions,
            brokers,
            sellingMarks,
            invoiceNos,
            baselinePrice: { min: Number(aggregates._min.baselinePrice) ?? 0, max: Number(aggregates._max.baselinePrice) ?? 1000 },
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

export const createOutLot = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Restrict creation to admins
        if (authenticatedUser.role.toLowerCase() !== 'admin') {
            res.status(403).json({ message: 'Forbidden: Only admins can create outlots' });
            return;
        }

        const outLotData = createOutLotSchema.safeParse({
            ...req.body,
            adminCognitoId: authenticatedUser.userId, // Always use authenticated admin's ID
        });

        if (!outLotData.success) {
            res.status(400).json({ message: 'Invalid request body', details: outLotData.error.errors });
            return;
        }

        const admin = await prisma.admin.findUnique({
            where: { adminCognitoId: outLotData.data.adminCognitoId },
        });
        if (!admin) {
            res.status(404).json({ message: `Admin with cognitoId ${outLotData.data.adminCognitoId} not found` });
            return;
        }

        const newOutLot = await prisma.outLots.create({
            data: {
                auction: outLotData.data.auction,
                lotNo: outLotData.data.lotNo,
                broker: outLotData.data.broker as Broker,
                sellingMark: outLotData.data.sellingMark,
                grade: outLotData.data.grade as TeaGrade,
                invoiceNo: outLotData.data.invoiceNo,
                bags: outLotData.data.bags,
                netWeight: outLotData.data.netWeight,
                totalWeight: outLotData.data.totalWeight,
                baselinePrice: outLotData.data.baselinePrice,
                manufactureDate: new Date(outLotData.data.manufactureDate),
                adminCognitoId: outLotData.data.adminCognitoId,
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

        // Normalize admin property for serializeOutLot
        const normalizedOutLot = {
            ...newOutLot,
            admin: newOutLot.admin ?? undefined,
        };

        res.status(201).json({ data: serializeOutLot(normalizedOutLot) });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: 'Duplicate outlot entry', details: error.meta });
            return;
        }
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const getOutLotById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            res.status(400).json({ message: 'Invalid outlot ID' });
            return;
        }

        const outLot = await prisma.outLots.findUnique({
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

        if (!outLot) {
            res.status(404).json({ message: 'Outlot not found' });
            return;
        }

        // Normalize admin property for serializeOutLot
        const normalizedOutLot = {
            ...outLot,
            admin: outLot.admin ?? undefined,
        };

        res.status(200).json(serializeOutLot(normalizedOutLot));
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

// Delete multiple OutLots
export const deleteOutLots = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) return;

        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No outlot IDs provided" });
            return;
        }

        const outLotIds = ids.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
        if (outLotIds.length === 0) {
            res.status(400).json({ message: "Invalid outlot IDs" });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            const outLots = await tx.outLots.findMany({
                where: { id: { in: outLotIds } },
                select: { id: true, lotNo: true },
            });

            if (outLots.length === 0) {
                throw new Error("No outLots found");
            }

            const associations = outLots.map((outLot) => ({
                id: outLot.id,
                lotNo: outLot.lotNo,
            }));

            await tx.outLots.deleteMany({ where: { id: { in: outLotIds } } });

            return { deletedCount: outLots.length, associations };
        });

        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} outlot(s)`,
            associations: result.associations,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No outLots found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

export async function uploadOutLotsCsv(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;

    try {
        // Validate authenticated user
        if (!user || !user.userId || !user.role) {
            res.status(401).json({ message: "Unauthorized: No authenticated user found" });
            return;
        }

        if (user.role.toLowerCase() !== "admin") {
            res.status(403).json({ message: "Forbidden: Only admins can upload outLots" });
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
        const validOutLots: Array<{
            outLot: Prisma.OutLotsCreateInput;
            rowIndex: number;
        }> = [];

        let rowIndex = 1;
        const parser = new Parser({
            columns: (header) =>
                header.map((h: string) =>
                    h
                        .replace(/^\ufeff/, "") // Remove BOM
                        .trim()
                        .replace(/\s+/g, "") // Remove spaces
                        .replace(/^Auction$/i, "auction")
                        .replace(/^LotNo$/i, "lotNo")
                        .replace(/^Broker$/i, "broker")
                        .replace(/^SellingMark$/i, "sellingMark")
                        .replace(/^Grade$/i, "grade")
                        .replace(/^InvoiceNo$/i, "invoiceNo")
                        .replace(/^Bags$/i, "bags")
                        .replace(/^NetWeight$/i, "netWeight")
                        .replace(/^TotalWeight$/i, "totalWeight")
                        .replace(/^BaselinePrice$/i, "baselinePrice")
                        .replace(/^ManufactureDate$/i, "manufactureDate")
                ),
            skip_empty_lines: true,
            trim: true,
        });

        const stream = Readable.from(req.file.buffer);
        stream.pipe(parser);

        for await (const record of parser) {
            rowIndex++;
            try {
                // Filter out empty keys (e.g., '')
                const cleanedRecord = Object.fromEntries(
                    Object.entries(record).filter(([key]) => key.trim() !== "")
                );

                const parsed = csvRecordSchema.safeParse({
                    ...cleanedRecord,
                    bags: parseInt(<string>cleanedRecord.bags, 10),
                    netWeight: parseFloat(<string>cleanedRecord.netWeight),
                    totalWeight: parseFloat(<string>cleanedRecord.totalWeight),
                    baselinePrice: parseFloat(<string>cleanedRecord.baselinePrice),
                    auction: cleanedRecord.auction,
                    adminCognitoId: user.userId,
                });

                if (!parsed.success) {
                    throw new Error(
                        `Invalid data: ${parsed.error.errors.map((err) => err.message).join(", ")}. ` +
                        `Expected headers: auction, lotNo, broker, sellingMark, grade, invoiceNo, bags, netWeight, totalWeight, baselinePrice, manufactureDate. ` +
                        `Ensure no trailing commas in CSV rows.`
                    );
                }

                const data = parsed.data;

                const admin = await prisma.admin.findUnique({ where: { adminCognitoId: user.userId } });
                if (!admin) {
                    throw new Error(`Admin with adminCognitoId ${user.userId} not found`);
                }

                validOutLots.push({
                    outLot: {
                        auction: data.auction,
                        lotNo: data.lotNo,
                        broker: data.broker as Broker,
                        sellingMark: data.sellingMark,
                        grade: data.grade as TeaGrade,
                        invoiceNo: data.invoiceNo,
                        bags: data.bags,
                        netWeight: data.netWeight,
                        totalWeight: data.totalWeight,
                        baselinePrice: data.baselinePrice ?? 0,
                        manufactureDate: new Date(data.manufactureDate),
                        admin: {
                            connect: { adminCognitoId: user.userId },
                        },
                    },
                    rowIndex,
                });
            } catch (error) {
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
            }
        }

        if (validOutLots.length === 0) {
            res.status(400).json({
                success: { created: 0, skipped: 0, replaced: 0 },
                errors: errors.length > 0
                    ? errors
                    : [{
                        row: 0,
                        message: "No valid data found. Ensure CSV headers match: auction, lotNo, broker, sellingMark, grade, invoiceNo, bags, netWeight, totalWeight, baselinePrice, manufactureDate. Check for trailing commas."
                    }],
            });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            let createdCount = 0;
            let skippedCount = 0;
            let replacedCount = 0;

            for (const { outLot, rowIndex } of validOutLots) {
                const existing = await tx.outLots.findUnique({
                    where: { lotNo: outLot.lotNo },
                });

                if (existing) {
                    if (duplicateAction === "skip") {
                        skippedCount++;
                        continue;
                    } else if (duplicateAction === "replace") {
                        await tx.outLots.delete({ where: { id: existing.id } });
                        replacedCount++;
                    }
                }

                await tx.outLots.create({ data: outLot });
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
            res.status(409).json({ message: "One or more outLots have duplicate lotNo", details: error.meta });
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

// Export OutLots as CSV
export const exportOutLotsCsv = async (req: Request, res: Response): Promise<void> => {
    try {
        // Handle parameters from either query (GET) or body (POST)
        const paramsSource = req.method === 'POST' ? req.body : req.query;
        const params = querySchema.extend({ outLotIds: z.string().optional() }).safeParse(paramsSource);
        if (!params.success) {
            res.status(400).json({ message: 'Invalid parameters', details: params.error.errors });
            return;
        }

        const { page = 1, limit = 1000, outLotIds, ...filterParams } = params.data;
        const maxRecords = 10000;
        if (limit > maxRecords) {
            res.status(400).json({ message: `Export limit cannot exceed ${maxRecords} records` });
            return;
        }

        let where: Prisma.OutLotsWhereInput = {};
        if (outLotIds) {
            const ids = [...new Set(outLotIds.split(',').map(id => parseInt(id.trim())))]
                .filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: 'Invalid outLotIds provided' });
                return;
            }
            where = { id: { in: ids } };
        } else {
            where = buildWhereConditions(filterParams);
        }

        const outLots = await prisma.outLots.findMany({
            where,
            select: {
                auction: true,
                lotNo: true,
                broker: true,
                sellingMark: true,
                grade: true,
                invoiceNo: true,
                bags: true,
                netWeight: true,
                totalWeight: true,
                baselinePrice: true,
                manufactureDate: true,
            },
            ...(outLotIds ? {} : { skip: (page - 1) * limit, take: limit }),
        });

        if (!outLots.length) {
            res.status(404).json({ message: 'No outLots found for the provided filters or IDs' });
            return;
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'auction', title: 'Auction' },
                { id: 'lotNo', title: 'Lot Number' },
                { id: 'broker', title: 'Broker' },
                { id: 'sellingMark', title: 'Selling Mark' },
                { id: 'grade', title: 'Grade' },
                { id: 'invoiceNo', title: 'Invoice Number' },
                { id: 'bags', title: 'Bags' },
                { id: 'netWeight', title: 'Net Weight' },
                { id: 'totalWeight', title: 'Total Weight' },
                { id: 'baselinePrice', title: 'Baseline Price' },
                { id: 'manufactureDate', title: 'Manufacture Date' },
            ],
        });

        const csvContent =
            csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(
                outLots.map((outLot) => ({
                    ...outLot,
                    manufactureDate: new Date(outLot.manufactureDate).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                    }),
                    netWeight: Number(outLot.netWeight),
                    totalWeight: Number(outLot.totalWeight),
                    baselinePrice: Number(outLot.baselinePrice),
                }))
            );

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="outlots_${new Date().toISOString().split('T')[0]}.csv"`
        );

        res.status(200).send(csvContent);
    } catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
};