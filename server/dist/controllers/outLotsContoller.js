"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportOutLotsCsv = exports.deleteOutLots = exports.getOutLotById = exports.createOutLot = exports.getOutLotsFilterOptions = exports.serializeOutLot = void 0;
exports.getOutLots = getOutLots;
exports.uploadOutLotsCsv = uploadOutLotsCsv;
const stream_1 = require("stream");
const zod_1 = require("zod");
const csv_writer_1 = require("csv-writer");
const csv_parse_1 = require("csv-parse");
const client_1 = require("@prisma/client");
const controllerUtils_1 = require("../utils/controllerUtils");
const client_2 = require("@prisma/client");
const outLotsSchema_1 = require("../schemas/outLotsSchema");
const prisma = new client_2.PrismaClient();
// Schema for CSV upload request
const csvUploadSchema = zod_1.z.object({
    duplicateAction: zod_1.z.enum(['skip', 'replace']).optional().default('skip'),
});
const serializeOutLot = (outLot) => {
    var _a, _b, _c;
    return ({
        id: outLot.id,
        auction: outLot.auction,
        lotNo: outLot.lotNo,
        broker: outLot.broker,
        sellingMark: outLot.sellingMark,
        grade: outLot.grade,
        invoiceNo: (_a = outLot.invoiceNo) !== null && _a !== void 0 ? _a : null,
        bags: outLot.bags,
        netWeight: Number(outLot.netWeight),
        totalWeight: Number(outLot.totalWeight),
        baselinePrice: Number(outLot.baselinePrice),
        manufactureDate: outLot.manufactureDate.toISOString(),
        adminCognitoId: (_b = outLot.adminCognitoId) !== null && _b !== void 0 ? _b : null,
        admin: (_c = outLot.admin) !== null && _c !== void 0 ? _c : null,
    });
};
exports.serializeOutLot = serializeOutLot;
// Build Where Conditions for SellingPrice
const buildWhereConditions = (params) => {
    const conditions = {};
    const filterMap = {
        ids: (value) => { if (value === null || value === void 0 ? void 0 : value.length)
            conditions.id = { in: value }; },
        auction: (value) => { if (value)
            conditions.auction = { equals: value }; },
        lotNo: (value) => { if (value)
            conditions.lotNo = { equals: value }; },
        sellingMark: (value) => { if (value)
            conditions.sellingMark = { equals: value }; },
        grade: (value) => { if (value && value !== 'any')
            conditions.grade = value; },
        broker: (value) => { if (value && value !== 'any')
            conditions.broker = value; },
        invoiceNo: (value) => { if (value)
            conditions.invoiceNo = { equals: value }; },
        bags: (value) => { if (value)
            conditions.bags = value; },
        netWeight: (value) => { if (value)
            conditions.netWeight = value; },
        totalWeight: (value) => { if (value)
            conditions.totalWeight = value; },
        baselinePrice: (value) => { if (value)
            conditions.baselinePrice = value; },
        manufactureDate: (value) => { if (value)
            conditions.manufactureDate = new Date(value); },
    };
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && filterMap[key])
            filterMap[key](value);
    });
    if (params.search) {
        const orConditions = [
            { lotNo: { contains: params.search, mode: 'insensitive' } },
            { invoiceNo: { contains: params.search, mode: 'insensitive' } },
            { sellingMark: { contains: params.search, mode: 'insensitive' } },
            { auction: { contains: params.search, mode: 'insensitive' } },
        ];
        if (Object.values(client_1.Broker).includes(params.search)) {
            orConditions.push({ broker: params.search });
        }
        if (Object.values(client_1.TeaGrade).includes(params.search)) {
            orConditions.push({ grade: params.search });
        }
        conditions.OR = orConditions;
    }
    return conditions;
};
function getOutLots(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Raw query params:`, req.query);
            // Parse query parameters with coercion
            const parsedParams = outLotsSchema_1.querySchema.safeParse(Object.assign(Object.assign({}, req.query), { page: req.query.page ? parseInt(req.query.page, 10) : 1, limit: req.query.limit ? parseInt(req.query.limit, 10) : 100, ids: req.query.ids ? (Array.isArray(req.query.ids) ? req.query.ids.map(Number) : [parseInt(req.query.ids, 10)]) : undefined, bags: req.query.bags ? parseInt(req.query.bags, 10) : undefined, netWeight: req.query.netWeight ? parseFloat(req.query.netWeight) : undefined, totalWeight: req.query.totalWeight ? parseFloat(req.query.totalWeight) : undefined, baselinePrice: req.query.baselinePrice ? parseFloat(req.query.baselinePrice) : undefined }));
            if (!parsedParams.success) {
                const errors = parsedParams.error.errors.map((err) => {
                    var _a;
                    return ({
                        field: err.path.join("."),
                        message: err.message,
                        value: (_a = req.query[err.path[0]]) !== null && _a !== void 0 ? _a : "undefined",
                        schemaCode: err.code,
                    });
                });
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Validation errors:`, JSON.stringify(errors, null, 2));
                res.status(400).json({
                    message: "Invalid query parameters",
                    details: errors,
                });
                return;
            }
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Parsed params:`, parsedParams.data);
            const { page, limit, auction, broker, sellingMark, grade, invoiceNo, bags, netWeight, totalWeight, baselinePrice, manufactureDate, search, ids } = parsedParams.data;
            const where = {};
            if (auction)
                where.auction = { contains: auction, mode: "insensitive" };
            if (broker && broker !== "any")
                where.broker = broker;
            if (sellingMark)
                where.sellingMark = { contains: sellingMark, mode: "insensitive" };
            if (grade && grade !== "any")
                where.grade = grade;
            if (invoiceNo)
                where.invoiceNo = { contains: invoiceNo, mode: "insensitive" };
            if (bags !== undefined)
                where.bags = bags;
            if (netWeight !== undefined)
                where.netWeight = netWeight;
            if (totalWeight !== undefined)
                where.totalWeight = totalWeight;
            if (baselinePrice !== undefined)
                where.baselinePrice = baselinePrice;
            if (manufactureDate)
                where.manufactureDate = { gte: new Date(manufactureDate) };
            if (search) {
                where.OR = [
                    { auction: { contains: search, mode: "insensitive" } },
                    { lotNo: { contains: search, mode: "insensitive" } },
                    { sellingMark: { contains: search, mode: "insensitive" } },
                    { invoiceNo: { contains: search, mode: "insensitive" } },
                ];
            }
            if (ids && ids.length > 0)
                where.id = { in: ids };
            const skip = limit > 0 ? (page - 1) * limit : undefined;
            const take = limit > 0 ? limit : undefined;
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Querying with where:`, where, `skip: ${skip}, take: ${take}`);
            const [outLots, total] = yield Promise.all([
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
        }
        catch (error) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getOutLots: Error:`, error);
            res.status(500).json({
                message: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Get filter options for SellingPrice
const getOutLotsFilterOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        const where = {
            invoiceNo: { not: undefined },
        };
        const [distinctValues, aggregates] = yield Promise.all([
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
        const invoiceNos = [...new Set(distinctValues.map((inv) => inv.invoiceNo).filter((inv) => !!inv))];
        res.status(200).json({
            grades,
            auctions,
            brokers,
            sellingMarks,
            invoiceNos,
            baselinePrice: { min: (_a = Number(aggregates._min.baselinePrice)) !== null && _a !== void 0 ? _a : 0, max: (_b = Number(aggregates._max.baselinePrice)) !== null && _b !== void 0 ? _b : 1000 },
            manufactureDate: {
                min: (_d = (_c = aggregates._min.manufactureDate) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : '2020-01-01T00:00:00Z',
                max: (_f = (_e = aggregates._max.manufactureDate) === null || _e === void 0 ? void 0 : _e.toISOString()) !== null && _f !== void 0 ? _f : new Date().toISOString(),
            },
            bags: { min: (_g = aggregates._min.bags) !== null && _g !== void 0 ? _g : 0, max: (_h = aggregates._max.bags) !== null && _h !== void 0 ? _h : 1000 },
            totalWeight: { min: (_j = Number(aggregates._min.totalWeight)) !== null && _j !== void 0 ? _j : 0, max: (_k = Number(aggregates._max.totalWeight)) !== null && _k !== void 0 ? _k : 100000 },
            netWeight: { min: (_l = Number(aggregates._min.netWeight)) !== null && _l !== void 0 ? _l : 0, max: (_m = Number(aggregates._max.netWeight)) !== null && _m !== void 0 ? _m : 1000 },
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getOutLotsFilterOptions = getOutLotsFilterOptions;
const createOutLot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // Restrict creation to admins
        if (authenticatedUser.role.toLowerCase() !== 'admin') {
            res.status(403).json({ message: 'Forbidden: Only admins can create outlots' });
            return;
        }
        const outLotData = outLotsSchema_1.createOutLotSchema.safeParse(Object.assign(Object.assign({}, req.body), { adminCognitoId: authenticatedUser.userId }));
        if (!outLotData.success) {
            res.status(400).json({ message: 'Invalid request body', details: outLotData.error.errors });
            return;
        }
        const admin = yield prisma.admin.findUnique({
            where: { adminCognitoId: outLotData.data.adminCognitoId },
        });
        if (!admin) {
            res.status(404).json({ message: `Admin with cognitoId ${outLotData.data.adminCognitoId} not found` });
            return;
        }
        const newOutLot = yield prisma.outLots.create({
            data: {
                auction: outLotData.data.auction,
                lotNo: outLotData.data.lotNo,
                broker: outLotData.data.broker,
                sellingMark: outLotData.data.sellingMark,
                grade: outLotData.data.grade,
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
        const normalizedOutLot = Object.assign(Object.assign({}, newOutLot), { admin: (_a = newOutLot.admin) !== null && _a !== void 0 ? _a : undefined });
        res.status(201).json({ data: (0, exports.serializeOutLot)(normalizedOutLot) });
    }
    catch (error) {
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: 'Duplicate outlot entry', details: error.meta });
            return;
        }
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.createOutLot = createOutLot;
const getOutLotById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ message: 'Invalid outlot ID' });
            return;
        }
        const outLot = yield prisma.outLots.findUnique({
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
        const normalizedOutLot = Object.assign(Object.assign({}, outLot), { admin: (_a = outLot.admin) !== null && _a !== void 0 ? _a : undefined });
        res.status(200).json((0, exports.serializeOutLot)(normalizedOutLot));
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getOutLotById = getOutLotById;
// Delete multiple SellingPrice
const deleteOutLots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser)
            return;
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No outlot IDs provided" });
            return;
        }
        const outLotIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
        if (outLotIds.length === 0) {
            res.status(400).json({ message: "Invalid outlot IDs" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const outLots = yield tx.outLots.findMany({
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
            yield tx.outLots.deleteMany({ where: { id: { in: outLotIds } } });
            return { deletedCount: outLots.length, associations };
        }));
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} outlot(s)`,
            associations: result.associations,
        });
    }
    catch (error) {
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No outLots found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
});
exports.deleteOutLots = deleteOutLots;
function uploadOutLotsCsv(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d;
        const user = req.user;
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
            const errors = [];
            const validOutLots = [];
            let rowIndex = 1;
            const parser = new csv_parse_1.Parser({
                columns: (header) => header.map((h) => h
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
                    .replace(/^ManufactureDate$/i, "manufactureDate")),
                skip_empty_lines: true,
                trim: true,
            });
            const stream = stream_1.Readable.from(req.file.buffer);
            stream.pipe(parser);
            try {
                for (var _e = true, parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), _a = parser_1_1.done, !_a; _e = true) {
                    _c = parser_1_1.value;
                    _e = false;
                    const record = _c;
                    rowIndex++;
                    try {
                        // Filter out empty keys (e.g., '')
                        const cleanedRecord = Object.fromEntries(Object.entries(record).filter(([key]) => key.trim() !== ""));
                        const parsed = outLotsSchema_1.csvRecordSchema.safeParse(Object.assign(Object.assign({}, cleanedRecord), { bags: parseInt(cleanedRecord.bags, 10), netWeight: parseFloat(cleanedRecord.netWeight), totalWeight: parseFloat(cleanedRecord.totalWeight), baselinePrice: parseFloat(cleanedRecord.baselinePrice), auction: cleanedRecord.auction, adminCognitoId: user.userId }));
                        if (!parsed.success) {
                            throw new Error(`Invalid data: ${parsed.error.errors.map((err) => err.message).join(", ")}. ` +
                                `Expected headers: auction, lotNo, broker, sellingMark, grade, invoiceNo, bags, netWeight, totalWeight, baselinePrice, manufactureDate. ` +
                                `Ensure no trailing commas in CSV rows.`);
                        }
                        const data = parsed.data;
                        const admin = yield prisma.admin.findUnique({ where: { adminCognitoId: user.userId } });
                        if (!admin) {
                            throw new Error(`Admin with adminCognitoId ${user.userId} not found`);
                        }
                        validOutLots.push({
                            outLot: {
                                auction: data.auction,
                                lotNo: data.lotNo,
                                broker: data.broker,
                                sellingMark: data.sellingMark,
                                grade: data.grade,
                                invoiceNo: data.invoiceNo,
                                bags: data.bags,
                                netWeight: data.netWeight,
                                totalWeight: data.totalWeight,
                                baselinePrice: (_d = data.baselinePrice) !== null && _d !== void 0 ? _d : 0,
                                manufactureDate: new Date(data.manufactureDate),
                                admin: {
                                    connect: { adminCognitoId: user.userId },
                                },
                            },
                            rowIndex,
                        });
                    }
                    catch (error) {
                        errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_e && !_a && (_b = parser_1.return)) yield _b.call(parser_1);
                }
                finally { if (e_1) throw e_1.error; }
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
            // Process in batches to handle large uploads efficiently
            const BATCH_SIZE = 1000;
            let createdCount = 0;
            let skippedCount = 0;
            let replacedCount = 0;
            for (let i = 0; i < validOutLots.length; i += BATCH_SIZE) {
                const batch = validOutLots.slice(i, i + BATCH_SIZE);
                yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    for (const { outLot, rowIndex } of batch) {
                        const existing = yield tx.outLots.findUnique({
                            where: { lotNo: outLot.lotNo },
                        });
                        if (existing) {
                            if (duplicateAction === "skip") {
                                skippedCount++;
                                continue;
                            }
                            else if (duplicateAction === "replace") {
                                yield tx.outLots.delete({ where: { id: existing.id } });
                                replacedCount++;
                            }
                        }
                        yield tx.outLots.create({ data: outLot });
                        createdCount++;
                    }
                }));
            }
            res.status(201).json({
                success: {
                    created: createdCount,
                    skipped: skippedCount,
                    replaced: replacedCount,
                },
                errors,
            });
        }
        catch (error) {
            if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                res.status(409).json({ message: "One or more outLots have duplicate lotNo", details: error.meta });
                return;
            }
            res.status(500).json({
                message: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Export SellingPrice as CSV
const exportOutLotsCsv = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Handle parameters from either query (GET) or body (POST)
        const paramsSource = req.method === 'POST' ? req.body : req.query;
        const params = outLotsSchema_1.querySchema.extend({ outLotIds: zod_1.z.string().optional() }).safeParse(paramsSource);
        if (!params.success) {
            res.status(400).json({ message: 'Invalid parameters', details: params.error.errors });
            return;
        }
        const _a = params.data, { page = 1, limit = 100, outLotIds } = _a, filterParams = __rest(_a, ["page", "limit", "outLotIds"]);
        const maxRecords = 10000;
        if (limit > maxRecords) {
            res.status(400).json({ message: `Export limit cannot exceed ${maxRecords} records` });
            return;
        }
        let where = {};
        if (outLotIds) {
            const ids = [...new Set(outLotIds.split(',').map(id => parseInt(id.trim())))]
                .filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: 'Invalid outLotIds provided' });
                return;
            }
            where = { id: { in: ids } };
        }
        else {
            where = buildWhereConditions(filterParams);
        }
        const outLots = yield prisma.outLots.findMany(Object.assign({ where, select: {
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
            } }, (outLotIds ? {} : { skip: (page - 1) * limit, take: limit })));
        if (!outLots.length) {
            res.status(404).json({ message: 'No outLots found for the provided filters or IDs' });
            return;
        }
        const csvStringifier = (0, csv_writer_1.createObjectCsvStringifier)({
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
        const csvContent = csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(outLots.map((outLot) => (Object.assign(Object.assign({}, outLot), { manufactureDate: new Date(outLot.manufactureDate).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric',
                }), netWeight: Number(outLot.netWeight), totalWeight: Number(outLot.totalWeight), baselinePrice: Number(outLot.baselinePrice) }))));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="outlots_${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.exportOutLotsCsv = exportOutLotsCsv;
