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
exports.exportCatalogsCsv = exports.deleteCatalogs = exports.getCatalogById = exports.createCatalog = exports.getCatalogFilterOptions = exports.getCatalogs = exports.serializeCatalog = void 0;
exports.uploadCatalogsCsv = uploadCatalogsCsv;
const stream_1 = require("stream");
const zod_1 = require("zod");
const csv_writer_1 = require("csv-writer");
const csv_parse_1 = require("csv-parse");
const client_1 = require("@prisma/client");
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
        totalWeight: Number(catalog.totalWeight),
        netWeight: Number(catalog.netWeight),
        invoiceNo: catalog.invoiceNo,
        saleCode: catalog.saleCode,
        askingPrice: Number(catalog.askingPrice),
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
const buildWhereConditions = (params) => {
    const conditions = {};
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
            if (value)
                conditions.bags = value;
        },
        totalWeight: (value) => {
            if (value)
                conditions.totalWeight = value;
        },
        netWeight: (value) => {
            if (value)
                conditions.netWeight = value;
        },
        askingPrice: (value) => {
            if (value)
                conditions.askingPrice = value;
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
            if (value !== undefined)
                conditions.reprint = value;
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
        conditions.OR = orConditions;
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
        const params = catalogSchemas_1.querySchema.safeParse(Object.assign(Object.assign({}, req.query), { ids: rawIds ? rawIds.map((id) => Number(id)) : undefined }));
        if (!params.success) {
            return res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
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
        });
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
        return res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
exports.getCatalogs = getCatalogs;
const getCatalogFilterOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
            askingPrice: { min: (_a = Number(aggregates._min.askingPrice)) !== null && _a !== void 0 ? _a : 0, max: (_b = Number(aggregates._max.askingPrice)) !== null && _b !== void 0 ? _b : 1000 },
            manufactureDate: {
                min: (_d = (_c = aggregates._min.manufactureDate) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : "2020-01-01T00:00:00Z",
                max: (_f = (_e = aggregates._max.manufactureDate) === null || _e === void 0 ? void 0 : _e.toISOString()) !== null && _f !== void 0 ? _f : new Date().toISOString(),
            },
            bags: { min: (_g = aggregates._min.bags) !== null && _g !== void 0 ? _g : 0, max: (_h = aggregates._max.bags) !== null && _h !== void 0 ? _h : 1000 },
            totalWeight: { min: (_j = Number(aggregates._min.totalWeight)) !== null && _j !== void 0 ? _j : 0, max: (_k = Number(aggregates._max.totalWeight)) !== null && _k !== void 0 ? _k : 100000 },
            netWeight: { min: (_l = Number(aggregates._min.netWeight)) !== null && _l !== void 0 ? _l : 0, max: (_m = Number(aggregates._max.netWeight)) !== null && _m !== void 0 ? _m : 1000 },
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
    var _a;
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
        // Ensure admin is typed correctly for serializeCatalog
        const catalogWithAdmin = Object.assign(Object.assign({}, newCatalog), { admin: (_a = newCatalog.admin) !== null && _a !== void 0 ? _a : undefined });
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
            res.status(404).json({ message: "Stocks not found" });
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
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ message: "No catalog IDs provided" });
            return;
        }
        const catalogIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
        if (catalogIds.length === 0) {
            res.status(400).json({ message: "Invalid catalog IDs" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Allow catalogs with null adminCognitoId or matching adminCognitoId
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
        if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "No catalogs found" });
            return;
        }
        res.status(error instanceof Error ? 400 : 500).json({
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteCatalogs = deleteCatalogs;
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
function uploadCatalogsCsv(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        try {
            const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
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
            const errors = [];
            const validCatalogs = [];
            let rowIndex = 1;
            // Remove BOM from the file buffer if present
            let csvBuffer = req.file.buffer;
            if (csvBuffer.toString("utf8", 0, 3) === "\uFEFF") {
                csvBuffer = csvBuffer.slice(3);
            }
            const parser = new csv_parse_1.Parser({
                columns: (header) => {
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
            try {
                for (var _d = true, parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), _a = parser_1_1.done, !_a; _d = true) {
                    _c = parser_1_1.value;
                    _d = false;
                    const record = _c;
                    rowIndex++;
                    try {
                        // Normalize and parse the record
                        const parsedRecord = Object.assign(Object.assign({}, record), { bags: record.bags ? Number(record.bags) : undefined, totalWeight: record.totalWeight ? Number(record.totalWeight) : undefined, netWeight: record.netWeight ? Number(record.netWeight) : undefined, askingPrice: record.askingPrice ? Number(record.askingPrice) : undefined, reprint: record.reprint ? Number(record.reprint) : 0, saleCode: record.saleCode, manufactureDate: record.manufactureDate
                                ? record.manufactureDate
                                    .split("/")
                                    .map((part, index) => (index === 0 ? part : part.padStart(2, "0")))
                                    .join("/")
                                : undefined });
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
                        const parsed = catalogSchemas_1.csvRecordSchema.safeParse(parsedRecord);
                        if (!parsed.success) {
                            throw new Error(parsed.error.errors.map((err) => err.message).join(", "));
                        }
                        const data = parsed.data;
                        validCatalogs.push({
                            catalog: {
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
                                producerCountry: data.producerCountry,
                                manufactureDate: new Date(data.manufactureDate.replace(/\//g, "-")), // Convert YYYY/MM/DD to YYYY-MM-DD
                                category: data.category,
                                grade: data.grade,
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
            if (validCatalogs.length === 0) {
                res.status(400).json({ success: 0, errors });
                return;
            }
            const result = yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                let createdCount = 0;
                let skippedCount = 0;
                let replacedCount = 0;
                for (const { catalog, rowIndex } of validCatalogs) {
                    const existing = yield tx.catalog.findUnique({
                        where: { lotNo: catalog.lotNo },
                    });
                    if (existing) {
                        if (duplicateAction === "skip") {
                            skippedCount++;
                            continue;
                        }
                        else if (duplicateAction === "replace") {
                            yield tx.catalog.delete({ where: { id: existing.id } });
                            replacedCount++;
                        }
                    }
                    yield tx.catalog.create({ data: catalog });
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
            if (error instanceof client_2.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                res.status(409).json({ message: "One or more catalogs have duplicate lotNo", details: error.meta });
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
const exportCatalogsCsv = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const params = catalogSchemas_1.querySchema.extend({ catalogIds: zod_1.z.string().optional() }).safeParse(req.body);
        if (!params.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                details: params.error.errors,
            });
            return;
        }
        const _a = params.data, { page = 1, limit = 1000, catalogIds } = _a, filterParams = __rest(_a, ["page", "limit", "catalogIds"]);
        const maxRecords = 10000;
        if (limit > maxRecords) {
            res.status(400).json({ message: `Export limit cannot exceed ${maxRecords} records` });
            return;
        }
        let where = {};
        if (catalogIds) {
            const ids = [...new Set(catalogIds.split(",").map((id) => parseInt(id.trim())))].filter((id) => !isNaN(id));
            if (ids.length === 0) {
                res.status(400).json({ message: "Invalid catalogIds provided" });
                return;
            }
            where = { id: { in: ids } };
        }
        else if (Object.keys(filterParams).length > 0) {
            where = buildWhereConditions(filterParams);
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
            res.status(404).json({
                message: "No catalogs found for the provided filters or IDs",
            });
            return;
        }
        const csvStringifier = (0, csv_writer_1.createObjectCsvStringifier)({
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
        const csvContent = csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(catalogs.map((catalog) => (Object.assign(Object.assign({}, catalog), { manufactureDate: new Date(catalog.manufactureDate).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                }), totalWeight: Number(catalog.totalWeight), netWeight: Number(catalog.netWeight), askingPrice: Number(catalog.askingPrice) }))));
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="tea_catalog_${new Date().toISOString().split("T")[0]}.csv"`);
        res.status(200).send(csvContent);
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.exportCatalogsCsv = exportCatalogsCsv;
