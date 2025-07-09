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
exports.exportCatalogsXlsx = exports.deleteAllCatalogs = exports.deleteCatalogs = exports.getCatalogById = exports.createCatalog = exports.getCatalogFilterOptions = exports.getCatalogs = exports.serializeCatalog = void 0;
exports.uploadCatalogsCsv = uploadCatalogsCsv;
const stream_1 = require("stream");
const zod_1 = require("zod");
const csv_parse_1 = require("csv-parse");
const client_1 = require("@prisma/client");
const exceljs_1 = __importDefault(require("exceljs"));
const catalogSchemas_1 = require("../schemas/catalogSchemas");
const controllerUtils_1 = require("../utils/controllerUtils");
const client_2 = require("@prisma/client");
const prisma = new client_2.PrismaClient();
// Schema for CSV upload request
const csvUploadSchema = zod_1.z.object({
    duplicateAction: zod_1.z.enum(["skip", "replace"]).optional().default("skip"),
});
const serializeCatalog = (catalog) => {
    var _a, _b;
    return ({
        id: catalog.id,
        lotNo: catalog.lotNo,
        sellingMark: catalog.sellingMark,
        bags: catalog.bags,
        totalWeight: catalog.totalWeight,
        netWeight: catalog.netWeight,
        invoiceNo: catalog.invoiceNo,
        saleCode: catalog.saleCode,
        askingPrice: catalog.askingPrice,
        adminCognitoId: catalog.adminCognitoId,
        producerCountry: (_a = catalog.producerCountry) !== null && _a !== void 0 ? _a : null,
        manufactureDate: catalog.manufactureDate.toISOString(),
        category: catalog.category,
        grade: catalog.grade,
        broker: catalog.broker,
        reprint: catalog.reprint,
        admin: (_b = catalog.admin) !== null && _b !== void 0 ? _b : null,
    });
};
exports.serializeCatalog = serializeCatalog;
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
        favoriteIds: (value) => {
            if (value === null || value === void 0 ? void 0 : value.length)
                conditions.id = { in: value };
        },
        lotNo: (value) => {
            if (value)
                conditions.lotNo = { equals: value };
        },
        sellingMark: (value) => {
            if (value)
                conditions.sellingMark = { equals: value };
        },
        bags: (value) => {
            if (value !== undefined) {
                const parsed = zod_1.z.coerce.number().int().positive('Bags must be a positive integer').safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid bags: ${value}. Must be a positive integer`);
                }
                conditions.bags = { equals: parsed.data };
            }
        },
        totalWeight: (value) => {
            if (value !== undefined) {
                const parsed = zod_1.z.coerce.number().positive('Total weight must be positive').safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid totalWeight: ${value}. Must be a positive number`);
                }
                conditions.totalWeight = { equals: parsed.data };
            }
        },
        netWeight: (value) => {
            if (value !== undefined) {
                const parsed = zod_1.z.coerce.number().positive('Net weight must be positive').safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid netWeight: ${value}. Must be a positive number`);
                }
                conditions.netWeight = { equals: parsed.data };
            }
        },
        askingPrice: (value) => {
            if (value !== undefined) {
                const parsed = zod_1.z.coerce.number().positive('Asking price must be positive').safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid askingPrice: ${value}. Must be a positive number`);
                }
                conditions.askingPrice = { equals: parsed.data };
            }
        },
        producerCountry: (value) => {
            if (value)
                conditions.producerCountry = { equals: value };
        },
        manufactureDate: (value) => {
            if (value)
                conditions.manufactureDate = new Date(value);
        },
        saleCode: (value) => {
            if (value)
                conditions.saleCode = value;
        },
        category: (value) => {
            if (value && value !== "any")
                conditions.category = value;
        },
        grade: (value) => {
            if (value && value !== "any")
                conditions.grade = value;
        },
        broker: (value) => {
            if (value && value !== "any")
                conditions.broker = value;
        },
        invoiceNo: (value) => {
            if (value)
                conditions.invoiceNo = { equals: value };
        },
        reprint: (value) => {
            if (value !== undefined) {
                const parsed = catalogSchemas_1.reprintSchema.safeParse(value);
                if (!parsed.success) {
                    throw new Error(`Invalid reprint: ${value}. Must be 'No', a positive integer string, or null`);
                }
                if (parsed.data !== null) {
                    conditions.reprint = parsed.data;
                }
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
        conditions.OR = [
            ...(conditions.OR || []),
            ...orConditions,
        ];
    }
    return conditions;
};
const getCatalogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let rawIds = req.query.ids;
        if (typeof rawIds === "string") {
            rawIds = rawIds.split(",").map((id) => id.trim());
        }
        else if (!Array.isArray(rawIds)) {
            rawIds = rawIds ? [rawIds] : undefined;
        }
        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalogs raw query:`, req.query);
        const params = catalogSchemas_1.querySchema.safeParse(Object.assign(Object.assign({}, req.query), { ids: rawIds ? rawIds.map((id) => Number(id)) : undefined }));
        if (!params.success) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalogs validation error:`, {
                errors: params.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                    received: 'received' in issue ? issue.received : req.query[issue.path[0]] || 'undefined', // Safe access
                })),
                query: req.query,
            });
            return res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                    received: 'received' in issue ? issue.received : req.query[issue.path[0]] || 'undefined', // Safe access
                })),
            });
        }
        const { ids, lotNo, sellingMark, bags, totalWeight, netWeight, askingPrice, producerCountry, manufactureDate, saleCode, category, grade, broker, invoiceNo, reprint, page = 1, limit = 100, } = params.data;
        const where = buildWhereConditions({
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
            sortBy: "",
            sortOrder: "asc"
        });
        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalogs where conditions:`, where);
        const skip = (page - 1) * limit;
        const take = limit;
        const [catalogs, total] = yield Promise.all([
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
        // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalogs response:`, {
        //     total,
        //     totalPages,
        //     returned: catalogs.length,
        //     reprintValues: catalogs.map(c => c.reprint)
        // });
        // Normalize admin property for serializeCatalog
        const normalizedCatalogs = catalogs.map((catalog) => {
            var _a;
            return (Object.assign(Object.assign({}, catalog), { admin: (_a = catalog.admin) !== null && _a !== void 0 ? _a : undefined }));
        });
        return res.status(200).json({
            data: normalizedCatalogs.map(exports.serializeCatalog),
            meta: { page, limit, total, totalPages },
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] getCatalogs error:`, error);
        return res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getCatalogs = getCatalogs;
const getCatalogFilterOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const [distinctValues, aggregates] = yield Promise.all([
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
                min: aggregates._min.askingPrice !== null ? aggregates._min.askingPrice : 0,
                max: aggregates._max.askingPrice !== null ? aggregates._max.askingPrice : 1000,
            },
            manufactureDate: {
                min: (_b = (_a = aggregates._min.manufactureDate) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : "2020-01-01T00:00:00Z",
                max: (_d = (_c = aggregates._max.manufactureDate) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : new Date().toISOString(),
            },
            bags: { min: (_e = aggregates._min.bags) !== null && _e !== void 0 ? _e : 0, max: (_f = aggregates._max.bags) !== null && _f !== void 0 ? _f : 10000 },
            totalWeight: {
                min: aggregates._min.totalWeight !== null ? aggregates._min.totalWeight : 0,
                max: aggregates._max.totalWeight !== null ? aggregates._max.totalWeight : 100000,
            },
            netWeight: {
                min: aggregates._min.netWeight !== null ? aggregates._min.netWeight : 0,
                max: aggregates._max.netWeight !== null ? aggregates._max.netWeight : 1000,
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
exports.getCatalogFilterOptions = getCatalogFilterOptions;
const createCatalog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const catalogData = catalogSchemas_1.createCatalogSchema.safeParse(Object.assign(Object.assign({}, req.body), { adminCognitoId: authenticatedUser.userId }));
        if (!catalogData.success) {
            res.status(400).json({ message: "Invalid request body", details: catalogData.error.errors });
            return;
        }
        const newCatalog = yield prisma.catalog.create({
            data: {
                broker: catalogData.data.broker,
                sellingMark: catalogData.data.sellingMark,
                lotNo: catalogData.data.lotNo,
                reprint: (_a = catalogData.data.reprint) !== null && _a !== void 0 ? _a : null,
                bags: catalogData.data.bags,
                totalWeight: catalogData.data.totalWeight,
                netWeight: catalogData.data.netWeight,
                invoiceNo: catalogData.data.invoiceNo,
                saleCode: catalogData.data.saleCode,
                askingPrice: catalogData.data.askingPrice,
                adminCognitoId: catalogData.data.adminCognitoId,
                producerCountry: catalogData.data.producerCountry,
                manufactureDate: new Date(catalogData.data.manufactureDate),
                category: catalogData.data.category,
                grade: catalogData.data.grade,
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
        const catalogWithAdmin = Object.assign(Object.assign({}, newCatalog), { admin: (_b = newCatalog.admin) !== null && _b !== void 0 ? _b : undefined });
        res.status(201).json({ data: (0, exports.serializeCatalog)(catalogWithAdmin) });
    }
    catch (error) {
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            res.status(409).json({ message: "Duplicate catalog entry", details: error.meta });
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
exports.createCatalog = createCatalog;
const getCatalogById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid catalog ID" });
            return;
        }
        const catalog = yield prisma.catalog.findUnique({
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
        const catalogWithAdmin = Object.assign(Object.assign({}, catalog), { admin: (_a = catalog.admin) !== null && _a !== void 0 ? _a : undefined });
        res.status(200).json((0, exports.serializeCatalog)(catalogWithAdmin));
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getCatalogById = getCatalogById;
const deleteCatalogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
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
        const catalogIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
        if (catalogIds.length === 0) {
            res.status(400).json({ message: "Invalid catalog IDs", details: { providedIds: ids } });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const catalogs = yield tx.catalog.findMany({
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
            yield tx.catalog.deleteMany({
                where: {
                    id: { in: catalogIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
            });
            return { deletedCount: catalogs.length, associations };
        }));
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} catalog(s)`,
            associations: result.associations,
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete catalogs error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ids: req.body.ids,
        });
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No catalogs found" });
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
exports.deleteCatalogs = deleteCatalogs;
const deleteAllCatalogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const filters = req.body || {}; // Default to empty object if req.body is undefined/null
        const where = buildWhereConditions(filters, authenticatedUser.userId);
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const catalogs = yield tx.catalog.findMany({
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
            const { count } = yield tx.catalog.deleteMany({ where });
            return { deletedCount: count, associations };
        }));
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} catalog(s)`,
            associations: result.associations,
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete all catalogs error:`, {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            filters: req.body,
        });
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No catalogs found", details: { filters: req.body } });
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
exports.deleteAllCatalogs = deleteAllCatalogs;
// Utility function to normalize field names (convert to camelCase, remove spaces, handle BOM)
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
    producercountry: "producerCountry",
    manufactureddate: "manufactureDate",
};
// Cache enum values for O(1) lookup
const teaCategories = new Set(Object.values(client_1.TeaCategory));
const teaGrades = new Set(Object.values(client_1.TeaGrade));
const brokers = new Set(Object.values(client_1.Broker));
function uploadCatalogsCsv(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h, _j;
        const errors = [];
        let createdCount = 0;
        let skippedCount = 0;
        let replacedCount = 0;
        try {
            // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting CSV upload:`, {
            //     file: req.file?.originalname,
            //     size: req.file?.size,
            //     body: req.body,
            // });
            const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
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
            let batch = [];
            const BATCH_SIZE = 200;
            const MAX_CONCURRENT_BATCHES = 2;
            let csvBuffer = req.file.buffer;
            if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
                csvBuffer = csvBuffer.slice(3);
            }
            // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Parsing CSV file: ${req.file.originalname}`);
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
                                const lotNos = batch.map((item) => item.catalog.lotNo);
                                const existing = yield tx.catalog.findMany({
                                    where: { lotNo: { in: lotNos } },
                                    select: { lotNo: true },
                                });
                                const existingLotNos = new Set(existing.map((item) => item.lotNo));
                                const toCreate = batch.filter((item) => !existingLotNos.has(item.catalog.lotNo));
                                batchSkipped += batch.length - toCreate.length;
                                if (toCreate.length > 0) {
                                    yield tx.catalog.createMany({
                                        data: toCreate.map((item) => item.catalog),
                                        skipDuplicates: true,
                                    });
                                    batchCreated += toCreate.length;
                                }
                            }
                            else if (duplicateAction === "replace") {
                                for (const { catalog, rowIndex } of batch) {
                                    try {
                                        yield tx.catalog.upsert({
                                            where: { lotNo: catalog.lotNo },
                                            update: Object.assign(Object.assign({}, catalog), { updatedAt: new Date() }),
                                            create: catalog,
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
                                yield tx.catalog.createMany({
                                    data: batch.map((item) => item.catalog),
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
                for (var _k = true, parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), _a = parser_1_1.done, !_a; _k = true) {
                    _c = parser_1_1.value;
                    _k = false;
                    const record = _c;
                    rowIndex++;
                    try {
                        if (!record.lotNo || !record.saleCode) {
                            throw new Error("Missing required fields: lotNo or saleCode");
                        }
                        const parsedRecord = Object.assign(Object.assign({}, record), { bags: record.bags ? Number(record.bags) : undefined, totalWeight: record.totalWeight ? Number(record.totalWeight) : undefined, netWeight: record.netWeight ? Number(record.netWeight) : undefined, askingPrice: record.askingPrice ? Number(record.askingPrice) : undefined, reprint: record.reprint, saleCode: record.saleCode, manufactureDate: record.manufactureDate, category: record.category, grade: record.grade, broker: record.broker });
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
                        if (parsedRecord.category && !teaCategories.has(parsedRecord.category)) {
                            throw new Error(`Invalid category: ${parsedRecord.category}`);
                        }
                        if (parsedRecord.grade && !teaGrades.has(parsedRecord.grade)) {
                            throw new Error(`Invalid grade: ${parsedRecord.grade}`);
                        }
                        if (parsedRecord.broker && !brokers.has(parsedRecord.broker)) {
                            throw new Error(`Invalid broker: ${parsedRecord.broker}`);
                        }
                        const parsed = catalogSchemas_1.csvRecordSchema.safeParse(parsedRecord);
                        if (!parsed.success) {
                            throw new Error(parsed.error.errors.map((err) => err.message).join(", "));
                        }
                        const data = parsed.data;
                        batch.push({
                            catalog: {
                                broker: data.broker,
                                sellingMark: data.sellingMark,
                                lotNo: data.lotNo,
                                reprint: (_d = data.reprint) !== null && _d !== void 0 ? _d : null,
                                bags: data.bags,
                                totalWeight: data.totalWeight,
                                netWeight: data.netWeight,
                                invoiceNo: data.invoiceNo,
                                saleCode: data.saleCode,
                                askingPrice: data.askingPrice,
                                producerCountry: data.producerCountry,
                                manufactureDate: new Date((_e = data.manufactureDate) !== null && _e !== void 0 ? _e : Date.now()),
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
                    if (!_k && !_a && (_b = parser_1.return)) yield _b.call(parser_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (batch.length > 0) {
                // console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Processing final batch (${batch.length} items)`);
                batchPromises.push(processBatch(batch));
            }
            yield Promise.all(batchPromises);
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
        }
        catch (error) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Upload catalogs error:`, {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                file: (_f = req.file) === null || _f === void 0 ? void 0 : _f.originalname,
                size: (_g = req.file) === null || _g === void 0 ? void 0 : _g.size,
                body: req.body,
                processedCount: createdCount + skippedCount + replacedCount,
                errorsCount: errors.length,
            });
            if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                res.status(409).json({
                    message: "One or more catalogs have duplicate lotNo",
                    details: error.meta,
                });
                return;
            }
            res.status(500).json({
                message: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
                file: (_h = req.file) === null || _h === void 0 ? void 0 : _h.originalname,
                size: (_j = req.file) === null || _j === void 0 ? void 0 : _j.size,
                body: req.body,
                processedCount: createdCount + skippedCount + replacedCount,
                errorsCount: errors.length,
            });
        }
    });
}
const exportCatalogsXlsx = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const params = catalogSchemas_1.querySchema.extend({ catalogIds: zod_1.z.string().optional() }).safeParse(req.body || {});
        if (!params.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
            return;
        }
        const _a = params.data, { page = 1, limit = 10000, catalogIds } = _a, filterParams = __rest(_a, ["page", "limit", "catalogIds"]);
        let where = {};
        if (catalogIds) {
            const ids = [...new Set(catalogIds.split(",").map(id => parseInt(id.trim())))].filter(id => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid catalogIds provided" });
                return;
            }
            where = { id: { in: ids } };
        }
        else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams, authenticatedUser.userId, authenticatedUser.role.toLowerCase());
        }
        const catalogs = yield prisma.catalog.findMany(Object.assign({ where, select: {
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
            } }, (catalogIds ? {} : { skip: (page - 1) * limit, take: limit })));
        if (!catalogs.length) {
            res.status(404).json({ message: "No catalogs found" });
            return;
        }
        const workbook = new exceljs_1.default.Workbook();
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
            var _a, _b, _c, _d, _e;
            worksheet.addRow([
                catalog.saleCode || "",
                catalog.lotNo || "",
                catalog.category || "",
                catalog.grade || "",
                catalog.broker || "",
                catalog.sellingMark || "",
                (_a = catalog.bags) !== null && _a !== void 0 ? _a : "",
                (_b = catalog.netWeight) !== null && _b !== void 0 ? _b : "",
                (_c = catalog.totalWeight) !== null && _c !== void 0 ? _c : "",
                catalog.producerCountry || "",
                (_d = catalog.askingPrice) !== null && _d !== void 0 ? _d : "",
                catalog.invoiceNo || "",
                catalog.manufactureDate
                    ? new Date(catalog.manufactureDate).toLocaleDateString("en-GB")
                    : "",
                (_e = catalog.reprint) !== null && _e !== void 0 ? _e : "",
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
        res.setHeader("Content-Disposition", `attachment; filename="tea_catalog_${new Date().toISOString().split("T")[0]}.xlsx"`);
        yield workbook.xlsx.write(res);
        res.end();
        // console.log(`[${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}] Exported ${catalogs.length} catalogs as XLSX`);
    }
    catch (error) {
        console.error("Export XLSX error:", error);
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.exportCatalogsXlsx = exportCatalogsXlsx;
