import { Request, Response } from "express";
import { Readable } from "stream";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";
import { Parser } from "csv-parse";
import { Broker, OutLots, TeaGrade } from "@prisma/client";
import { authenticateUser } from "../utils/controllerUtils";
import { PrismaClient, Prisma } from '@prisma/client';
import { createOutLotSchema, csvRecordSchema, querySchema } from "../schemas/outLotsSchema";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

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

export async function getOutLots(req: Request, res: Response): Promise<void> {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Raw query params:`, req.query);

        // Parse query parameters with coercion
        const parsedParams = querySchema.safeParse({
            ...req.query,
            page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
            ids: req.query.ids ? (Array.isArray(req.query.ids) ? req.query.ids.map(Number) : [parseInt(req.query.ids as string, 10)]) : undefined,
            bags: req.query.bags ? parseInt(req.query.bags as string, 10) : undefined,
            netWeight: req.query.netWeight ? parseFloat(req.query.netWeight as string) : undefined,
            totalWeight: req.query.totalWeight ? parseFloat(req.query.totalWeight as string) : undefined,
            baselinePrice: req.query.baselinePrice ? parseFloat(req.query.baselinePrice as string) : undefined,
        });

        if (!parsedParams.success) {
            const errors = parsedParams.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
                value: (req.query as any)[err.path[0]] ?? "undefined",
                schemaCode: err.code,
            }));
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Validation errors:`, JSON.stringify(errors, null, 2));
            res.status(400).json({
                message: "Invalid query parameters",
                details: errors,
            });
            return;
        }

        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Parsed params:`, parsedParams.data);

        const { page, limit, auction, broker, sellingMark, grade, invoiceNo, bags, netWeight, totalWeight, baselinePrice, manufactureDate, search, ids } = parsedParams.data;

        const where: any = {};
        if (auction) where.auction = { contains: auction, mode: "insensitive" };
        if (broker && broker !== "any") where.broker = broker;
        if (sellingMark) where.sellingMark = { contains: sellingMark, mode: "insensitive" };
        if (grade && grade !== "any") where.grade = grade;
        if (invoiceNo) where.invoiceNo = { contains: invoiceNo, mode: "insensitive" };
        if (bags !== undefined) where.bags = bags;
        if (netWeight !== undefined) where.netWeight = netWeight;
        if (totalWeight !== undefined) where.totalWeight = totalWeight;
        if (baselinePrice !== undefined) where.baselinePrice = baselinePrice;
        if (manufactureDate) where.manufactureDate = { gte: new Date(manufactureDate) };
        if (search) {
            where.OR = [
                { auction: { contains: search, mode: "insensitive" } },
                { lotNo: { contains: search, mode: "insensitive" } },
                { sellingMark: { contains: search, mode: "insensitive" } },
                { invoiceNo: { contains: search, mode: "insensitive" } },
            ];
        }
        if (ids && ids.length > 0) where.id = { in: ids };

        const skip = limit > 0 ? (page - 1) * limit : undefined;
        const take = limit > 0 ? limit : undefined;

        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Querying with where:`, where, `skip: ${skip}, take: ${take}`);

        const [outLots, total] = await Promise.all([
            prisma.outLots.findMany({
                where,
                skip,
                take,
                orderBy: { id: "asc" },
                select: {
                    id: true,
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
            }),
            prisma.outLots.count({ where }),
        ]);

        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Found ${outLots.length} records, total: ${total}`);

        res.status(200).json({
            data: outLots,
            meta: {
                total,
                page,
                limit: limit || total,
                totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
            },
        });
    } catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Error:`, error);
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await prisma.$disconnect();
    }
}

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
                manufactureDate: new Date(outLotData.data.manufactureDate ?? new Date()),
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
    const errors: Array<{ row: number; message: string }> = [];
    let createdCount = 0;
    let skippedCount = 0;
    let replacedCount = 0;

    try {
        const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
        console.log(`[${time}] Starting CSV upload:`, {
            file: req.file?.originalname,
            size: req.file?.size,
            body: req.body,
        });

        // Validate authenticated user
        const user = (req as any).user;
        if (!user || !user.userId || !user.role) {
            console.error(`[${time}] Authentication failed`);
            res.status(401).json({ message: "Unauthorized: No authenticated user found" });
            return;
        }

        if (user.role.toLowerCase() !== "admin") {
            console.error(`[${time}] Forbidden: User role ${user.role}`);
            res.status(403).json({ message: "Forbidden: Only admins can upload outLots" });
            return;
        }

        if (!req.file) {
            console.error(`[${time}] No CSV file provided`, { body: req.body });
            res.status(400).json({ message: "CSV file required" });
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (req.file.size > MAX_FILE_SIZE) {
            console.error(`[${time}] File too large: ${req.file.size} bytes`);
            res.status(400).json({ message: `File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
            return;
        }

        const parsedParams = csvUploadSchema.safeParse(req.body);
        if (!parsedParams.success) {
            console.error(`[${time}] Invalid duplicateAction:`, {
                body: req.body,
                errors: parsedParams.error.errors,
            });
            res.status(400).json({ message: "Invalid duplicateAction", details: parsedParams.error.errors });
            return;
        }
        const { duplicateAction } = parsedParams.data;
        console.log(`[${time}] Parsed duplicateAction:`, duplicateAction);

        const admin = await prisma.admin.findUnique({ where: { adminCognitoId: user.userId } });
        if (!admin) {
            console.error(`[${time}] Admin with adminCognitoId ${user.userId} not found`);
            res.status(403).json({ message: `Admin with adminCognitoId ${user.userId} not found` });
            return;
        }

        let rowIndex = 1;
        let batch: Array<{ outLot: Prisma.OutLotsCreateInput; rowIndex: number }> = [];
        const BATCH_SIZE = 50;
        const MAX_CONCURRENT_BATCHES = 2;

        let csvBuffer = req.file.buffer;
        if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
            csvBuffer = csvBuffer.slice(3);
        }

        console.log(`[${time}] Parsing CSV file: ${req.file.originalname}`);

        const parser = new Parser({
            columns: (header) => {
                console.log(`[${time}] CSV headers:`, header);
                return header.map((h: string) =>
                    h
                        .replace(/^\ufeff/, "")
                        .trim()
                        .replace(/\s+/g, "")
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
                );
            },
            skip_empty_lines: true,
            trim: true,
        });

        const stream = Readable.from(csvBuffer);
        stream.pipe(parser);

        const processBatch = async (batch: Array<{ outLot: Prisma.OutLotsCreateInput; rowIndex: number }>) => {
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
                            const lotNos = batch.map((item) => item.outLot.lotNo);
                            const existing = await tx.outLots.findMany({
                                where: { lotNo: { in: lotNos } },
                                select: { lotNo: true },
                            });
                            const existingLotNos = new Set(existing.map((item) => item.lotNo));

                            const toCreate = batch.filter((item) => !existingLotNos.has(item.outLot.lotNo));
                            batchSkipped += batch.length - toCreate.length;

                            if (toCreate.length > 0) {
                                await tx.outLots.createMany({
                                    data: toCreate.map((item) => item.outLot),
                                    skipDuplicates: true,
                                });
                                batchCreated += toCreate.length;
                            }
                        } else if (duplicateAction === "replace") {
                            for (const { outLot, rowIndex } of batch) {
                                try {
                                    await tx.outLots.upsert({
                                        where: { lotNo: outLot.lotNo },
                                        update: { ...outLot, updatedAt: new Date() },
                                        create: outLot,
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
                            await tx.outLots.createMany({
                                data: batch.map((item) => item.outLot),
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
                    console.warn(`[${time}] Batch ${Math.floor(rowIndex / BATCH_SIZE)} failed, retries left: ${retries}`, {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
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
                console.log(`[${time}] Processing row ${rowIndex}:`, record);
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
                        `Invalid data at row ${rowIndex}: ${parsed.error.errors.map((err) => err.message).join(", ")}. ` +
                        `Expected headers: auction, lotNo, broker, sellingMark, grade, invoiceNo, bags, netWeight, totalWeight, baselinePrice, manufactureDate. ` +
                        `Manufacture Date should be YYYY/MM/DD, DD/MM/YYYY, or M/D/YYYY. Check for trailing commas or invalid dates.`
                    );
                }

                const data = parsed.data;
                const outLot: Prisma.OutLotsCreateInput = {
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
                    manufactureDate: new Date(data.manufactureDate ?? new Date()),
                };

                batch.push({ outLot, rowIndex });

                if (batch.length >= BATCH_SIZE) {
                    console.log(`[${time}] Processing batch ${Math.floor(rowIndex / BATCH_SIZE)} (${batch.length} items)`);
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
                console.error(`[${time}] Error processing row ${rowIndex}:`, {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
            }
        }

        if (batch.length > 0) {
            console.log(`[${time}] Processing final batch (${batch.length} items)`);
            batchPromises.push(processBatch(batch));
        }

        await Promise.all(batchPromises);

        console.log(`[${time}] Parsed ${rowIndex - 1} rows, ${createdCount + skippedCount + replacedCount} processed, ${errors.length} errors`);

        if (createdCount + skippedCount + replacedCount === 0) {
            console.error(`[${time}] No valid outLots processed`);
            res.status(400).json({ success: 0, errors });
            return;
        }

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
        const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
        console.error(`[${time}] Upload outLots error:`, {
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
                message: "One or more outLots have duplicate lotNo",
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
    } finally {
        await prisma.$disconnect();
    }
}

export const exportOutLotsXlsx = async (req: Request, res: Response): Promise<void> => {
    try {
        const authenticatedUser = authenticateUser(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const paramsSource = req.method === 'POST' ? req.body : req.query;
        const params = querySchema.extend({ outLotIds: z.string().optional() }).safeParse(paramsSource);

        if (!params.success) {
            res.status(400).json({ message: "Invalid parameters", details: params.error.errors });
            return;
        }

        const { page = 1, limit = 100, outLotIds, ...filterParams } = params.data;
        const maxRecords = 10000;
        if (limit > maxRecords) {
            res.status(400).json({ message: `Export limit cannot exceed ${maxRecords} records` });
            return;
        }

        let where: Prisma.OutLotsWhereInput = {};
        if (outLotIds) {
            const ids = [...new Set(outLotIds.split(',').map(id => parseInt(id.trim())))].filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid outLotIds provided" });
                return;
            }
            where = { id: { in: ids } };
        } else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams); // ✅ FIXED
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
            res.status(404).json({ message: "No OutLots found for the provided filters or IDs" });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("OutLots");

        worksheet.addRow(["Official Black Gold Africa Traders Ltd OutLots"]);
        worksheet.mergeCells("A1:K1");
        worksheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
        worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;
        worksheet.addRow([]);

        const headers = [
            "Auction", "Lot Number", "Broker", "Selling Mark", "Grade",
            "Invoice No", "Bags", "Net Weight", "Total Weight", "Baseline Price", "Mft Date"
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D3D3D3" } };
            cell.font = { name: "Calibri", size: 11, bold: true };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
            cell.alignment = { horizontal: "center" };
        });

        outLots.forEach((item) => {
            worksheet.addRow([
                item.auction || "",
                item.lotNo || "",
                item.broker || "",
                item.sellingMark || "",
                item.grade || "",
                item.invoiceNo || "",
                item.bags ?? "",
                item.netWeight?.toFixed(2) ?? "",
                item.totalWeight?.toFixed(2) ?? "",
                item.baselinePrice?.toFixed(2) ?? "",
                item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString("en-GB") : "",
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

        const widths = [12, 14, 12, 14, 10, 14, 8, 12, 12, 14, 12];
        widths.forEach((width, i) => {
            worksheet.getColumn(i + 1).width = width;
        });

        const lastRow = worksheet.addRow([]);
        lastRow.getCell(1).value = `Generated from bgatltd.com on ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`;
        lastRow.getCell(1).font = { name: "Calibri", size: 8, italic: true };
        lastRow.getCell(1).alignment = { horizontal: "center" };
        worksheet.mergeCells(`A${lastRow.number}:K${lastRow.number}`);

        worksheet.views = [{ state: "frozen", ySplit: 3 }];

        worksheet.protect("bgatltd2025", {
            selectLockedCells: false,
            selectUnlockedCells: false,
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="outlots_${new Date().toISOString().split("T")[0]}.xlsx"`
        );

        await workbook.xlsx.write(res);
        res.end();

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