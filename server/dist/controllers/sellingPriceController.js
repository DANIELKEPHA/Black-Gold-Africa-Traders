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
exports.exportSellingPricesCsv = exports.deleteSellingPrices = exports.getSellingPricesById = exports.createSellingPrices = exports.getSellingPricesFilterOptions = exports.getSellingPrices = exports.serializeSellingPrice = void 0;
exports.uploadSellingPricesCsv = uploadSellingPricesCsv;
const stream_1 = require("stream");
const zod_1 = require("zod");
const csv_writer_1 = require("csv-writer");
const csv_parse_1 = require("csv-parse");
const client_1 = require("@prisma/client");
const controllerUtils_1 = require("../utils/controllerUtils");
const client_2 = require("@prisma/client");
const sellingPricesSchema_1 = require("../schemas/sellingPricesSchema");
const prisma = new client_2.PrismaClient();
// Schema for CSV upload request
const csvUploadSchema = zod_1.z.object({
    duplicateAction: zod_1.z.enum(['skip', 'replace']).optional().default('skip'),
});
const serializeSellingPrice = (sellingPrice) => {
    var _a, _b, _c, _d;
    return ({
        id: sellingPrice.id,
        lotNo: sellingPrice.lotNo,
        sellingMark: sellingPrice.sellingMark,
        bags: sellingPrice.bags,
        totalWeight: Number(sellingPrice.totalWeight),
        netWeight: Number(sellingPrice.netWeight),
        invoiceNo: (_a = sellingPrice.invoiceNo) !== null && _a !== void 0 ? _a : null,
        saleCode: sellingPrice.saleCode,
        askingPrice: Number(sellingPrice.askingPrice),
        purchasePrice: sellingPrice.purchasePrice ? Number(sellingPrice.purchasePrice) : null,
        adminCognitoId: (_b = sellingPrice.adminCognitoId) !== null && _b !== void 0 ? _b : null,
        producerCountry: (_c = sellingPrice.producerCountry) !== null && _c !== void 0 ? _c : null,
        manufactureDate: sellingPrice.manufactureDate.toISOString(),
        category: sellingPrice.category,
        grade: sellingPrice.grade,
        broker: sellingPrice.broker,
        reprint: sellingPrice.reprint,
        admin: (_d = sellingPrice.admin) !== null && _d !== void 0 ? _d : null,
    });
};
exports.serializeSellingPrice = serializeSellingPrice;
const buildWhereConditions = (params) => {
    const conditions = {};
    const filterMap = {
        ids: (value) => { if (value === null || value === void 0 ? void 0 : value.length)
            conditions.id = { in: value }; },
        lotNo: (value) => { if (value)
            conditions.lotNo = { equals: value }; },
        sellingMark: (value) => { if (value)
            conditions.sellingMark = { equals: value }; },
        bags: (value) => { if (value)
            conditions.bags = value; },
        totalWeight: (value) => { if (value)
            conditions.totalWeight = value; },
        netWeight: (value) => { if (value)
            conditions.netWeight = value; },
        askingPrice: (value) => { if (value)
            conditions.askingPrice = value; },
        purchasePrice: (value) => { if (value)
            conditions.purchasePrice = value; },
        producerCountry: (value) => { if (value)
            conditions.producerCountry = { equals: value }; },
        manufactureDate: (value) => { if (value)
            conditions.manufactureDate = new Date(value); },
        saleCode: (value) => { if (value)
            conditions.saleCode = value; },
        category: (value) => { if (value && value !== 'any')
            conditions.category = value; },
        grade: (value) => { if (value && value !== 'any')
            conditions.grade = value; },
        broker: (value) => { if (value && value !== 'any')
            conditions.broker = value; },
        invoiceNo: (value) => { if (value)
            conditions.invoiceNo = { equals: value }; },
        reprint: (value) => { if (value !== undefined)
            conditions.reprint = value; },
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
            { producerCountry: { contains: params.search, mode: 'insensitive' } },
        ];
        if (Object.values(client_1.TeaCategory).includes(params.search)) {
            orConditions.push({ category: params.search });
        }
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
const getSellingPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let rawIds = req.query.ids;
        if (typeof rawIds === 'string') {
            rawIds = rawIds.split(',').map(id => id.trim());
        }
        else if (!Array.isArray(rawIds)) {
            rawIds = rawIds ? [rawIds] : undefined;
        }
        const params = sellingPricesSchema_1.querySchema.safeParse(Object.assign(Object.assign({}, req.query), { ids: rawIds ? rawIds.map(id => Number(id)) : undefined }));
        if (!params.success) {
            return res.status(400).json({
                message: 'Invalid query parameters',
                details: params.error.errors,
            });
        }
        const { ids, lotNo, sellingMark, bags, totalWeight, netWeight, askingPrice, purchasePrice, producerCountry, manufactureDate, saleCode, category, grade, broker, invoiceNo, reprint, page = 1, limit = 20, } = params.data;
        const where = buildWhereConditions({
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
        const [sellingPrices, total] = yield Promise.all([
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
        const normalizedSellingPrices = sellingPrices.map((sellingPrice) => {
            var _a;
            return (Object.assign(Object.assign({}, sellingPrice), { admin: (_a = sellingPrice.admin) !== null && _a !== void 0 ? _a : undefined }));
        });
        return res.status(200).json({
            data: normalizedSellingPrices.map(exports.serializeSellingPrice),
            meta: { page, limit, total, totalPages },
        });
    }
    catch (error) {
        return res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSellingPrices = getSellingPrices;
const getSellingPricesFilterOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    try {
        const where = {
            AND: [{ producerCountry: { not: undefined } }, { invoiceNo: { not: undefined } }],
        };
        const [distinctValues, aggregates] = yield Promise.all([
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
        const countries = [...new Set(distinctValues.map((o) => o.producerCountry).filter((o) => !!o))];
        const grades = [...new Set(distinctValues.map((g) => g.grade))];
        const categories = [...new Set(distinctValues.map((c) => c.category))];
        const saleCodes = [...new Set(distinctValues.map((s) => s.saleCode))];
        const brokers = [...new Set(distinctValues.map((b) => b.broker))];
        const sellingMarks = [...new Set(distinctValues.map((sm) => sm.sellingMark))];
        const invoiceNos = [...new Set(distinctValues.map((inv) => inv.invoiceNo).filter((inv) => !!inv))];
        res.status(200).json({
            countries,
            grades,
            categories,
            saleCodes,
            brokers,
            sellingMarks,
            invoiceNos,
            askingPrice: { min: (_a = Number(aggregates._min.askingPrice)) !== null && _a !== void 0 ? _a : 0, max: (_b = Number(aggregates._max.askingPrice)) !== null && _b !== void 0 ? _b : 1000 },
            purchasePrice: { min: (_c = Number(aggregates._min.purchasePrice)) !== null && _c !== void 0 ? _c : 0, max: (_d = Number(aggregates._max.purchasePrice)) !== null && _d !== void 0 ? _d : 1000 },
            manufactureDate: {
                min: (_f = (_e = aggregates._min.manufactureDate) === null || _e === void 0 ? void 0 : _e.toISOString()) !== null && _f !== void 0 ? _f : '2020-01-01T00:00:00Z',
                max: (_h = (_g = aggregates._max.manufactureDate) === null || _g === void 0 ? void 0 : _g.toISOString()) !== null && _h !== void 0 ? _h : new Date().toISOString(),
            },
            bags: { min: (_j = aggregates._min.bags) !== null && _j !== void 0 ? _j : 0, max: (_k = aggregates._max.bags) !== null && _k !== void 0 ? _k : 1000 },
            totalWeight: { min: (_l = Number(aggregates._min.totalWeight)) !== null && _l !== void 0 ? _l : 0, max: (_m = Number(aggregates._max.totalWeight)) !== null && _m !== void 0 ? _m : 100000 },
            netWeight: { min: (_o = Number(aggregates._min.netWeight)) !== null && _o !== void 0 ? _o : 0, max: (_p = Number(aggregates._max.netWeight)) !== null && _p !== void 0 ? _p : 1000 },
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSellingPricesFilterOptions = getSellingPricesFilterOptions;
const createSellingPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // Restrict creation to admins
        if (authenticatedUser.role.toLowerCase() !== 'admin') {
            res.status(403).json({ message: 'Forbidden: Only admins can create selling prices' });
            return;
        }
        const sellingPriceData = sellingPricesSchema_1.createSellingPriceSchema.safeParse(Object.assign(Object.assign({}, req.body), { adminCognitoId: authenticatedUser.userId }));
        if (!sellingPriceData.success) {
            res.status(400).json({ message: 'Invalid request body', details: sellingPriceData.error.errors });
            return;
        }
        const admin = yield prisma.admin.findUnique({
            where: { adminCognitoId: sellingPriceData.data.adminCognitoId },
        });
        if (!admin) {
            res.status(404).json({ message: `Admin with cognitoId ${sellingPriceData.data.adminCognitoId} not found` });
            return;
        }
        const newSellingPrice = yield prisma.sellingPrice.create({
            data: {
                broker: sellingPriceData.data.broker,
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
                category: sellingPriceData.data.category,
                grade: sellingPriceData.data.grade,
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
        const normalizedSellingPrice = Object.assign(Object.assign({}, newSellingPrice), { admin: (_a = newSellingPrice.admin) !== null && _a !== void 0 ? _a : undefined });
        res.status(201).json({ data: (0, exports.serializeSellingPrice)(normalizedSellingPrice) });
    }
    catch (error) {
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: 'Duplicate selling price entry', details: error.meta });
            return;
        }
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.createSellingPrices = createSellingPrices;
const getSellingPricesById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const idSchema = zod_1.z.string().regex(/^\d+$/, 'Selling price ID must be a positive integer');
        const parsedId = idSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            res.status(400).json({ message: 'Invalid selling price ID', details: parsedId.error.errors });
            return;
        }
        const id = parseInt(parsedId.data);
        const sellingPrice = yield prisma.sellingPrice.findUnique({
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
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSellingPricesById = getSellingPricesById;
const deleteSellingPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser)
            return;
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No selling price IDs provided" });
            return;
        }
        const sellingPriceIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
        if (sellingPriceIds.length === 0) {
            res.status(400).json({ message: "Invalid selling price IDs" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const sellingPrices = yield tx.sellingPrice.findMany({
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
            yield tx.sellingPrice.deleteMany({ where: { id: { in: sellingPriceIds } } });
            return { deletedCount: sellingPrices.length, associations };
        }));
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} selling price(s)`,
            associations: result.associations,
        });
    }
    catch (error) {
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No selling prices found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
});
exports.deleteSellingPrices = deleteSellingPrices;
function uploadSellingPricesCsv(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        try {
            const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
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
            const errors = [];
            const validSellingPrices = [];
            let rowIndex = 1;
            const parser = new csv_parse_1.Parser({
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true, // Handle UTF-8 BOM
            });
            // Header normalization map
            const headerMap = {
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
            const stream = stream_1.Readable.from(req.file.buffer.toString('utf8').replace(/^\uFEFF/, '')); // Strip BOM
            stream.pipe(parser);
            try {
                for (var _d = true, parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), _a = parser_1_1.done, !_a; _d = true) {
                    _c = parser_1_1.value;
                    _d = false;
                    const record = _c;
                    rowIndex++;
                    try {
                        // Normalize headers
                        const normalizedRecord = {};
                        for (const [key, value] of Object.entries(record)) {
                            const lowerKey = key.toLowerCase().trim().replace(/﻿/g, '');
                            const mappedKey = headerMap[lowerKey] || lowerKey;
                            if (typeof value === "string") {
                                normalizedRecord[mappedKey] = value;
                            }
                        }
                        const parsed = sellingPricesSchema_1.csvRecordSchema.safeParse(Object.assign(Object.assign({}, normalizedRecord), { bags: normalizedRecord.bags ? parseInt(normalizedRecord.bags, 10) : undefined, totalWeight: normalizedRecord.totalWeight ? parseFloat(normalizedRecord.totalWeight) : undefined, netWeight: normalizedRecord.netWeight ? parseFloat(normalizedRecord.netWeight) : undefined, askingPrice: normalizedRecord.askingPrice ? parseFloat(normalizedRecord.askingPrice) : undefined, purchasePrice: normalizedRecord.purchasePrice ? parseFloat(normalizedRecord.purchasePrice) : undefined, reprint: normalizedRecord.reprint ? parseInt(normalizedRecord.reprint, 10) : 0, saleCode: normalizedRecord.saleCode, adminCognitoId: authenticatedUser.userId }));
                        if (!parsed.success) {
                            throw new Error(parsed.error.errors.map((err) => err.message).join(', '));
                        }
                        const data = parsed.data;
                        const admin = yield prisma.admin.findUnique({ where: { adminCognitoId: authenticatedUser.userId } });
                        if (!admin) {
                            throw new Error(`Admin with adminCognitoId ${authenticatedUser.userId} not found`);
                        }
                        validSellingPrices.push({
                            sellingPrice: {
                                broker: data.broker,
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
                                category: data.category,
                                grade: data.grade,
                                admin: {
                                    connect: { adminCognitoId: authenticatedUser.userId },
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
                    if (!_d && !_a && (_b = parser_1.return)) yield _b.call(parser_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (validSellingPrices.length === 0) {
                res.status(400).json({ success: 0, errors });
                return;
            }
            const result = yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                let createdCount = 0;
                let skippedCount = 0;
                let replacedCount = 0;
                for (const { sellingPrice, rowIndex } of validSellingPrices) {
                    const existing = yield tx.sellingPrice.findUnique({
                        where: { lotNo: sellingPrice.lotNo },
                    });
                    if (existing) {
                        if (duplicateAction === 'skip') {
                            skippedCount++;
                            continue;
                        }
                        else if (duplicateAction === 'replace') {
                            yield tx.sellingPrice.delete({ where: { id: existing.id } });
                            replacedCount++;
                        }
                    }
                    yield tx.sellingPrice.create({ data: sellingPrice });
                    createdCount++;
                }
                return { createdCount, skippedCount, replacedCount };
            }));
            res.status(201).json({
                success: {
                    created: result.createdCount,
                    skipped: result.skippedCount,
                    replaced: result.replacedCount,
                },
                errors,
            });
        }
        catch (error) {
            if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                res.status(409).json({ message: 'One or more selling prices have duplicate lotNo', details: error.meta });
                return;
            }
            res.status(500).json({
                message: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
            });
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
const exportSellingPricesCsv = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const params = sellingPricesSchema_1.querySchema
            .extend({ sellingPriceIds: zod_1.z.string().optional() })
            .safeParse(req.body);
        if (!params.success) {
            res.status(400).json({
                message: 'Invalid query parameters',
                details: params.error.errors,
            });
            return;
        }
        const _a = params.data, { page = 1, limit = 1000, sellingPriceIds } = _a, filterParams = __rest(_a, ["page", "limit", "sellingPriceIds"]);
        const maxRecords = 10000;
        if (limit > maxRecords) {
            res.status(400).json({ message: `Export limit cannot exceed ${maxRecords} records` });
            return;
        }
        let where = {};
        if (sellingPriceIds) {
            const ids = [...new Set(sellingPriceIds.split(',').map(id => parseInt(id.trim())))]
                .filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: 'Invalid sellingPriceIds provided' });
                return;
            }
            where = { id: { in: ids } };
        }
        else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams);
        }
        const sellingPrices = yield prisma.sellingPrice.findMany(Object.assign({ where, select: {
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
            } }, (sellingPriceIds ? {} : { skip: (page - 1) * limit, take: limit })));
        if (!sellingPrices.length) {
            res.status(404).json({
                message: 'No selling prices found for the provided filters or IDs',
            });
            return;
        }
        const csvStringifier = (0, csv_writer_1.createObjectCsvStringifier)({
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
        const csvContent = csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(sellingPrices.map(s => (Object.assign(Object.assign({}, s), { manufactureDate: new Date(s.manufactureDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                }), totalWeight: Number(s.totalWeight), netWeight: Number(s.netWeight), askingPrice: Number(s.askingPrice), purchasePrice: Number(s.purchasePrice) }))));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="selling_prices_${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.exportSellingPricesCsv = exportSellingPricesCsv;
