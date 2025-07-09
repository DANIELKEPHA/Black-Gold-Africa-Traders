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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSellingPricesXlsx = exports.deleteAllSellingPrices = exports.deleteSellingPrices = exports.getSellingPriceById = exports.createSellingPrice = exports.getSellingPricesFilterOptions = exports.getSellingPrices = exports.serializeSellingPrice = void 0;
exports.uploadSellingPricesCsv = uploadSellingPricesCsv;
const stream_1 = require("stream");
const zod_1 = require("zod");
const csv_parse_1 = require("csv-parse");
const client_1 = require("@prisma/client");
const exceljs_1 = __importDefault(require("exceljs"));
const sellingPricesSchema_1 = require("../schemas/sellingPricesSchema");
const controllerUtils_1 = require("../utils/controllerUtils");
const client_2 = require("@prisma/client");
const catalogSchemas_1 = require("../schemas/catalogSchemas");
const prisma = new client_2.PrismaClient();
// Schema for CSV upload request
const csvUploadSchema = zod_1.z.object({
    duplicateAction: zod_1.z.enum(["skip", "replace"]).optional().default("skip"),
});
const serializeSellingPrice = (sellingPrice) => {
    var _a, _b, _c, _d, _e;
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
        reprint: (_d = sellingPrice.reprint) !== null && _d !== void 0 ? _d : null,
        admin: (_e = sellingPrice.admin) !== null && _e !== void 0 ? _e : null,
    });
};
exports.serializeSellingPrice = serializeSellingPrice;
// Build Where Conditions
const buildWhereConditions = (params, userId, role) => {
    const conditions = {};
    if (userId && role === "admin") {
        conditions.OR = [
            { adminCognitoId: userId },
            { adminCognitoId: null },
        ];
    }
    else if (userId && role === "user") {
        conditions.userCognitoId = userId;
    }
    if (!params || typeof params !== "object") {
        return conditions;
    }
    const filterMap = {
        favoriteIds: (value) => { if (value === null || value === void 0 ? void 0 : value.length)
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
        category: (value) => { if (value && value !== "any")
            conditions.category = value; },
        grade: (value) => { if (value && value !== "any")
            conditions.grade = value; },
        broker: (value) => { if (value && value !== "any")
            conditions.broker = value; },
        invoiceNo: (value) => { if (value)
            conditions.invoiceNo = { equals: value }; },
        reprint: (value) => {
            if (value !== undefined) {
                const parsed = catalogSchemas_1.reprintSchema.safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid reprint: ${value}. Must be "No" or a positive integer`);
                }
                conditions.reprint = parsed.data;
            }
        },
    };
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && filterMap[key])
            filterMap[key](value);
    });
    if (params.search) {
        const orConditions = [
            { lotNo: { contains: params.search, mode: "insensitive" } },
            { invoiceNo: { contains: params.search, mode: "insensitive" } },
            { sellingMark: { contains: params.search, mode: "insensitive" } },
            { producerCountry: { contains: params.search, mode: "insensitive" } },
        ];
        if (Object.values(client_1.TeaCategory).includes(params.search)) {
            orConditions.push({ category: params.search });
        }
        if (Object.values(client_1.Broker).includes(params.search)) {
            orConditions.push({ broker: params.search });
        }
        conditions.OR = [...(conditions.OR || []), ...orConditions];
    }
    return conditions;
};
const getSellingPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else if (!Array.isArray(rawIds)) {
            rawIds = rawIds ? [rawIds] : undefined;
        }
        // console.log(`[${time}] Parsed rawIds:`, rawIds);
        const params = sellingPricesSchema_1.querySchema.safeParse(Object.assign(Object.assign({}, req.query), { ids: rawIds ? rawIds.map((id) => Number(id)) : undefined }));
        if (!params.success) {
            console.error(`[${time}] Invalid query parameters:`, params.error.errors);
            return res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
        }
        // console.log(`[${time}] Validated params:`, params.data);
        const { ids, lotNo, sellingMark, bags, totalWeight, netWeight, askingPrice, purchasePrice, producerCountry, manufactureDate, saleCode, category, grade, broker, invoiceNo, reprint, page = 1, limit = 100, } = params.data;
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
            sortBy: "",
            sortOrder: "asc"
        }, undefined, undefined); // Passing undefined for userId and role
        // console.log(`[${time}] Built where conditions:`, where);
        const skip = (page - 1) * limit;
        const take = limit;
        // console.log(`[${time}] Querying database with skip: ${skip}, take: ${take}`);
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
        // console.log(`[${time}] Database query result:`, { count: sellingPrices.length, total });
        const totalPages = Math.ceil(total / limit);
        const normalizedSellingPrices = sellingPrices.map((sellingPrice) => {
            var _a;
            return (Object.assign(Object.assign({}, sellingPrice), { admin: (_a = sellingPrice.admin) !== null && _a !== void 0 ? _a : undefined }));
        });
        // console.log(`[${time}] Sending response with totalPages: ${totalPages}, data length: ${normalizedSellingPrices.length}`);
        return res.status(200).json({
            data: normalizedSellingPrices.map(exports.serializeSellingPrice),
            meta: { page, limit, total, totalPages },
        });
    }
    catch (error) {
        console.error(`[${time}] Internal server error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSellingPrices = getSellingPrices;
const getSellingPricesFilterOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const [distinctValues, aggregates] = yield Promise.all([
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
            askingPrice: {
                min: aggregates._min.askingPrice !== null ? Number(aggregates._min.askingPrice) : 0,
                max: aggregates._max.askingPrice !== null ? Number(aggregates._max.askingPrice) : 1000,
            },
            purchasePrice: {
                min: aggregates._min.purchasePrice !== null ? Number(aggregates._min.purchasePrice) : 0,
                max: aggregates._max.purchasePrice !== null ? Number(aggregates._max.purchasePrice) : 1000,
            },
            manufactureDate: {
                min: (_b = (_a = aggregates._min.manufactureDate) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : "2020-01-01T00:00:00Z",
                max: (_d = (_c = aggregates._max.manufactureDate) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : new Date().toISOString(),
            },
            bags: { min: (_e = aggregates._min.bags) !== null && _e !== void 0 ? _e : 0, max: (_f = aggregates._max.bags) !== null && _f !== void 0 ? _f : 10000 },
            totalWeight: {
                min: aggregates._min.totalWeight !== null ? Number(aggregates._min.totalWeight) : 0,
                max: aggregates._max.totalWeight !== null ? Number(aggregates._max.totalWeight) : 100000,
            },
            netWeight: {
                min: aggregates._min.netWeight !== null ? Number(aggregates._min.netWeight) : 0,
                max: aggregates._max.netWeight !== null ? Number(aggregates._max.netWeight) : 1000,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSellingPricesFilterOptions = getSellingPricesFilterOptions;
const createSellingPrice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const sellingPriceData = sellingPricesSchema_1.createSellingPriceSchema.safeParse(Object.assign(Object.assign({}, req.body), { adminCognitoId: authenticatedUser.userId, purchasePrice: req.body.purchasePrice || null }));
        if (!sellingPriceData.success) {
            res.status(400).json({ message: "Invalid request body", details: sellingPriceData.error.errors });
            return;
        }
        const newSellingPrice = yield prisma.sellingPrice.create({
            data: {
                broker: sellingPriceData.data.broker,
                sellingMark: sellingPriceData.data.sellingMark,
                lotNo: sellingPriceData.data.lotNo,
                reprint: (_a = sellingPriceData.data.reprint) !== null && _a !== void 0 ? _a : null,
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
        const sellingPriceWithAdmin = Object.assign(Object.assign({}, newSellingPrice), { admin: (_b = newSellingPrice.admin) !== null && _b !== void 0 ? _b : undefined });
        res.status(201).json({ data: (0, exports.serializeSellingPrice)(sellingPriceWithAdmin) });
    }
    catch (error) {
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "Duplicate selling price entry", details: error.meta });
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
exports.createSellingPrice = createSellingPrice;
const getSellingPriceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid selling price ID" });
            return;
        }
        const sellingPrice = yield prisma.sellingPrice.findUnique({
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
        const sellingPriceWithAdmin = Object.assign(Object.assign({}, sellingPrice), { admin: (_a = sellingPrice.admin) !== null && _a !== void 0 ? _a : undefined });
        res.status(200).json((0, exports.serializeSellingPrice)(sellingPriceWithAdmin));
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getSellingPriceById = getSellingPriceById;
const deleteSellingPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
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
        const sellingPriceIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
        if (sellingPriceIds.length === 0) {
            res.status(400).json({ message: "Invalid selling price IDs", details: { providedIds: ids } });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const sellingPrices = yield tx.sellingPrice.findMany({
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
            yield tx.sellingPrice.deleteMany({
                where: {
                    id: { in: sellingPriceIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
            });
            return { deletedCount: sellingPrices.length, associations };
        }));
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} selling price(s)`,
            associations: result.associations,
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete selling prices error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ids: req.body.ids,
        });
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No selling prices found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
            details: { ids: req.body.ids },
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteSellingPrices = deleteSellingPrices;
const deleteAllSellingPrices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized", details: "Invalid or missing authentication token" });
            return;
        }
        if (!req.body.confirm) {
            res.status(400).json({ message: "Confirmation required for deleting all selling prices" });
            return;
        }
        const filters = req.body || {};
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Filters received:`, filters);
        const where = Object.assign({}, buildWhereConditions(filters, authenticatedUser.userId));
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Where conditions for deleteAll:`, where);
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Authenticated user ID:`, authenticatedUser.userId);
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const BATCH_SIZE = 1000;
            let deletedCount = 0;
            let skip = 0;
            const associations = [];
            // Log total records before deletion attempt
            const totalRecords = yield tx.sellingPrice.count({ where });
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Total records matching where clause:`, totalRecords);
            while (true) {
                const sellingPrices = yield tx.sellingPrice.findMany({
                    where,
                    select: { id: true, lotNo: true, adminCognitoId: true }, // Include adminCognitoId for debugging
                    take: BATCH_SIZE,
                    skip,
                });
                console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Found ${sellingPrices.length} records in batch (skip: ${skip}):`, sellingPrices);
                if (sellingPrices.length === 0)
                    break;
                associations.push(...sellingPrices.map((sp) => ({ id: sp.id, lotNo: sp.lotNo })));
                const deleteWhere = {
                    id: { in: sellingPrices.map((sp) => sp.id) },
                };
                console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete where clause:`, deleteWhere);
                const { count } = yield tx.sellingPrice.deleteMany({
                    where: deleteWhere,
                });
                console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Deleted ${count} records in batch`);
                deletedCount += count;
                skip += BATCH_SIZE;
                if (sellingPrices.length < BATCH_SIZE)
                    break;
            }
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Total deleted records:`, deletedCount);
            return { deletedCount, associations };
        }), { timeout: 10000 }); // 10-second transaction timeout
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} selling price(s)`,
            associations: result.associations,
            deletedCount: result.deletedCount,
        });
    }
    catch (error) {
        const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
        console.error(`[${time}] Delete all selling prices error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            filters: req.body,
        });
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No selling prices found", details: { filters: req.body } });
            return;
        }
        res.status(400).json({
            message: error instanceof Error ? error.message : "Internal server error",
            details: { filters: req.body },
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteAllSellingPrices = deleteAllSellingPrices;
// Utility function to normalize field names
function normalizeFieldName(field) {
    const cleanField = field.replace(/^\uFEFF/, "").trim();
    return cleanField
        .toLowerCase()
        .replace(/\s+|_+/g, "")
        .replace(/([a-z])([A-Z])/g, "$1$2")
        .replace(/^(.)/, (match) => match.toLowerCase());
}
// Mapping of normalized CSV field names to schema field names
const fieldNameMapping = {
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
// Cache enum values for O(1) lookup
const teaCategories = new Set(Object.values(client_1.TeaCategory));
const teaGrades = new Set(Object.values(client_1.TeaGrade));
const brokers = new Set(Object.values(client_1.Broker));
function uploadSellingPricesCsv(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j, _k, _l;
        const errors = [];
        let createdCount = 0;
        let skippedCount = 0;
        let replacedCount = 0;
        try {
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting CSV upload:`, {
                file: (_d = req.file) === null || _d === void 0 ? void 0 : _d.originalname,
                size: (_e = req.file) === null || _e === void 0 ? void 0 : _e.size,
                body: req.body,
            });
            const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
            if (!authenticatedUser) {
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Authentication failed`);
                res.status(401).json({ message: "Authentication failed: No authenticated user found" });
                return;
            }
            if (authenticatedUser.role.toLowerCase() !== "admin") {
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Forbidden: User role ${authenticatedUser.role}`);
                res.status(403).json({ message: "Forbidden: Only admins can upload selling prices" });
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
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Parsed duplicateAction:`, duplicateAction);
            let rowIndex = 1;
            let batch = [];
            const BATCH_SIZE = 200;
            const MAX_CONCURRENT_BATCHES = 2;
            let csvBuffer = req.file.buffer;
            if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
                csvBuffer = csvBuffer.slice(3);
            }
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Parsing CSV file: ${req.file.originalname}`);
            const parser = new csv_parse_1.Parser({
                columns: (header) => {
                    console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] CSV headers:`, header);
                    const normalizedHeaders = header.map((field) => {
                        const normalized = normalizeFieldName(field);
                        return fieldNameMapping[normalized] || normalized;
                    });
                    return normalizedHeaders;
                },
                skip_empty_lines: true,
                trim: true,
            });
            const stream = stream_1.Readable.from(csvBuffer);
            stream.pipe(parser);
            const processBatch = (batch) => __awaiter(this, void 0, void 0, function* () {
                let retries = 3;
                let success = false;
                let lastError;
                while (retries > 0 && !success) {
                    try {
                        const result = yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                            let batchCreated = 0;
                            let batchSkipped = 0;
                            let batchReplaced = 0;
                            if (duplicateAction === "skip") {
                                const lotNos = batch.map((item) => item.sellingPrice.lotNo);
                                const existing = yield tx.sellingPrice.findMany({
                                    where: { lotNo: { in: lotNos } },
                                    select: { lotNo: true },
                                });
                                const existingLotNos = new Set(existing.map((item) => item.lotNo));
                                const toCreate = batch.filter((item) => !existingLotNos.has(item.sellingPrice.lotNo));
                                batchSkipped += batch.length - toCreate.length;
                                if (toCreate.length > 0) {
                                    yield tx.sellingPrice.createMany({
                                        data: toCreate.map((item) => item.sellingPrice),
                                        skipDuplicates: true,
                                    });
                                    batchCreated += toCreate.length;
                                }
                            }
                            else if (duplicateAction === "replace") {
                                for (const { sellingPrice, rowIndex } of batch) {
                                    try {
                                        yield tx.sellingPrice.upsert({
                                            where: { lotNo: sellingPrice.lotNo },
                                            update: Object.assign(Object.assign({}, sellingPrice), { updatedAt: new Date() }),
                                            create: sellingPrice,
                                        });
                                        batchReplaced++;
                                    }
                                    catch (error) {
                                        errors.push({
                                            row: rowIndex,
                                            message: error instanceof Error ? error.message : String(error),
                                        });
                                    }
                                }
                            }
                            else {
                                yield tx.sellingPrice.createMany({
                                    data: batch.map((item) => item.sellingPrice),
                                    skipDuplicates: true,
                                });
                                batchCreated += batch.length;
                            }
                            return { batchCreated, batchSkipped, batchReplaced };
                        }), { timeout: 60000 });
                        createdCount += result.batchCreated;
                        skippedCount += result.batchSkipped;
                        replacedCount += result.batchReplaced;
                        success = true;
                    }
                    catch (error) {
                        lastError = error;
                        retries--;
                        console.warn(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Batch ${Math.floor(rowIndex / BATCH_SIZE)} failed, retries left: ${retries}`, {
                            message: error instanceof Error ? error.message : String(error),
                        });
                        if (retries === 0) {
                            throw lastError;
                        }
                        yield new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                }
            });
            let activeBatches = 0;
            const batchPromises = [];
            try {
                for (var _m = true, parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), _a = parser_1_1.done, !_a; _m = true) {
                    _c = parser_1_1.value;
                    _m = false;
                    const record = _c;
                    rowIndex++;
                    try {
                        if (!record.lotNo || !record.saleCode) {
                            throw new Error("Missing required fields: lotNo or saleCode");
                        }
                        const parsedRecord = Object.assign(Object.assign({}, record), { bags: record.bags ? Number(record.bags) : undefined, totalWeight: record.totalWeight ? Number(record.totalWeight) : undefined, netWeight: record.netWeight ? Number(record.netWeight) : undefined, askingPrice: record.askingPrice ? Number(record.askingPrice) : undefined, purchasePrice: record.purchasePrice ? Number(record.purchasePrice) : undefined, reprint: record.reprint, saleCode: record.saleCode, manufactureDate: record.manufactureDate, category: record.category, grade: record.grade, broker: record.broker });
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
                        if (parsedRecord.purchasePrice && isNaN(parsedRecord.purchasePrice)) {
                            throw new Error("Invalid number format for purchasePrice");
                        }
                        if (parsedRecord.category && !teaCategories.has(parsedRecord.category)) {
                            throw new Error(`Invalid category: ${parsedRecord.category}`);
                        }
                        if (parsedRecord.grade && !teaGrades.has(parsedRecord.grade)) {
                            throw new Error(`Invalid grade: ${parsedRecord.grade}`);
                        }
                        if (parsedRecord.broker && !brokers.has(parsedRecord.broker)) {
                            throw new Error(`Invalid broker: ${parsedRecord.broker}`);
                        }
                        const parsed = sellingPricesSchema_1.csvRecordSchema.safeParse(parsedRecord);
                        if (!parsed.success) {
                            throw new Error(parsed.error.errors.map((err) => err.message).join(", "));
                        }
                        const data = parsed.data;
                        batch.push({
                            sellingPrice: {
                                broker: data.broker,
                                sellingMark: data.sellingMark,
                                lotNo: data.lotNo,
                                reprint: (_f = data.reprint) !== null && _f !== void 0 ? _f : null,
                                bags: data.bags,
                                totalWeight: data.totalWeight,
                                netWeight: data.netWeight,
                                invoiceNo: data.invoiceNo,
                                saleCode: data.saleCode,
                                askingPrice: data.askingPrice,
                                purchasePrice: data.purchasePrice,
                                producerCountry: data.producerCountry,
                                manufactureDate: new Date((_g = data.manufactureDate) !== null && _g !== void 0 ? _g : Date.now()),
                                category: data.category,
                                grade: data.grade,
                            },
                            rowIndex,
                        });
                        if (batch.length >= BATCH_SIZE) {
                            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Processing batch ${Math.floor(rowIndex / BATCH_SIZE)} (${batch.length} items)`);
                            batchPromises.push(processBatch(batch));
                            batch = [];
                            activeBatches++;
                            if (activeBatches >= MAX_CONCURRENT_BATCHES) {
                                yield Promise.all(batchPromises);
                                batchPromises.length = 0;
                                activeBatches = 0;
                            }
                        }
                    }
                    catch (error) {
                        errors.push({ row: rowIndex, message: error instanceof Error ? error.message : String(error) });
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_m && !_a && (_b = parser_1.return)) yield _b.call(parser_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (batch.length > 0) {
                console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Processing final batch (${batch.length} items)`);
                batchPromises.push(processBatch(batch));
            }
            yield Promise.all(batchPromises);
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Parsed ${rowIndex - 1} rows, ${createdCount + skippedCount + replacedCount} processed, ${errors.length} errors`);
            if (createdCount + skippedCount + replacedCount === 0) {
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] No valid selling prices processed`);
                res.status(400).json({ success: 0, errors });
                return;
            }
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Transaction complete:`, {
                createdCount,
                skippedCount,
                replacedCount,
                errors: errors.length,
            });
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
        }
        catch (error) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Upload selling prices error:`, {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                file: (_h = req.file) === null || _h === void 0 ? void 0 : _h.originalname,
                size: (_j = req.file) === null || _j === void 0 ? void 0 : _j.size,
                body: req.body,
                processedCount: createdCount + skippedCount + replacedCount,
                errorsCount: errors.length,
            });
            if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                res.status(409).json({
                    message: "One or more selling prices have duplicate lotNo",
                    details: error.meta,
                });
                return;
            }
            res.status(500).json({
                message: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
                file: (_k = req.file) === null || _k === void 0 ? void 0 : _k.originalname,
                size: (_l = req.file) === null || _l === void 0 ? void 0 : _l.size,
                body: req.body,
                processedCount: createdCount + skippedCount + replacedCount,
                errorsCount: errors.length,
            });
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
const exportSellingPricesXlsx = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const params = sellingPricesSchema_1.querySchema.extend({ sellingPriceIds: zod_1.z.string().optional() }).safeParse(req.body || { page: 1, limit: 10000 });
        if (!params.success) {
            res.status(400).json({ message: "Invalid query parameters", details: params.error.errors });
            return;
        }
        const _a = params.data, { page = 1, limit = 10000, sellingPriceIds } = _a, filterParams = __rest(_a, ["page", "limit", "sellingPriceIds"]);
        let where = {};
        if (sellingPriceIds) {
            const ids = [...new Set(sellingPriceIds.split(",").map((id) => parseInt(id.trim())))].filter((id) => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid sellingPriceIds provided" });
                return;
            }
            where = { id: { in: ids } };
        }
        else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams, authenticatedUser.userId, authenticatedUser.role.toLowerCase());
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
            res.status(404).json({ message: "No selling prices found for the provided filters or IDs" });
            return;
        }
        const workbook = new exceljs_1.default.Workbook();
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
            var _a, _b, _c, _d, _e, _f;
            worksheet.addRow([
                item.saleCode || "",
                item.lotNo || "",
                item.category || "",
                item.grade || "",
                item.broker || "",
                item.sellingMark || "",
                (_a = item.bags) !== null && _a !== void 0 ? _a : "",
                (_b = item.netWeight) !== null && _b !== void 0 ? _b : "",
                (_c = item.totalWeight) !== null && _c !== void 0 ? _c : "",
                item.producerCountry || "",
                (_d = item.askingPrice) !== null && _d !== void 0 ? _d : "",
                (_e = item.purchasePrice) !== null && _e !== void 0 ? _e : "",
                item.invoiceNo || "",
                item.manufactureDate
                    ? new Date(item.manufactureDate).toLocaleDateString("en-GB")
                    : "",
                (_f = item.reprint) !== null && _f !== void 0 ? _f : "",
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
            8, // Bags
            12, // Net Weight
            14, // Total Weight
            12, // Country
            14, // Asking Price
            14, // Purchase Price
            12, // Invoice No
            12, // Mft Date
            10 // Reprint
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
        res.setHeader("Content-Disposition", `attachment; filename="selling_prices_${new Date().toISOString().split("T")[0]}.xlsx"`);
        yield workbook.xlsx.write(res);
        res.end();
        console.log(`[${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}] Exported ${sellingPrices.length} selling prices to XLSX`);
    }
    catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ message: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.exportSellingPricesXlsx = exportSellingPricesXlsx;
