"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySchema = exports.csvRecordSchema = exports.createOutLotSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const catalogSchemas_1 = require("./catalogSchemas");
const teaGradeValues = Object.values(client_1.TeaGrade);
const brokerValues = Object.values(client_1.Broker);
exports.createOutLotSchema = zod_1.z.object({
    auction: zod_1.z.string().min(1, "Auction is required"),
    lotNo: zod_1.z.string().min(1, "Lot number is required"),
    grade: zod_1.z.enum([...teaGradeValues, "any"]).optional(),
    broker: zod_1.z.enum([...brokerValues, "any"]).optional(),
    sellingMark: zod_1.z.string().min(1, "Selling mark is required"),
    invoiceNo: zod_1.z.string().min(1, "Invoice number is required"),
    bags: zod_1.z.number().int().min(0, "Bags must be a non-negative integer"),
    netWeight: zod_1.z.number().min(0, "Net weight must be non-negative"),
    totalWeight: zod_1.z.number().min(0, "Total weight must be non-negative"),
    baselinePrice: zod_1.z.number().min(0, "Baseline price must be non-negative"),
    manufactureDate: catalogSchemas_1.dateFormat.optional(),
    adminCognitoId: zod_1.z.string().min(1, "Admin Cognito ID is required"),
});
exports.csvRecordSchema = zod_1.z.object({
    auction: zod_1.z.string().min(1, "Auction is required"),
    broker: zod_1.z.enum(brokerValues, { message: "Invalid broker value" }),
    sellingMark: zod_1.z.string().min(1, "Selling mark is required"),
    lotNo: zod_1.z.string().min(1, "Lot number is required"),
    bags: zod_1.z.number().int().positive("Bags must be a positive integer"),
    netWeight: zod_1.z.number().positive("Net weight must be positive"),
    totalWeight: zod_1.z.number().positive("Total weight must be positive"),
    invoiceNo: zod_1.z.string().min(1, "Invoice number is required"),
    adminCognitoId: zod_1.z.string().uuid("Admin Cognito ID must be a valid UUID"),
    baselinePrice: zod_1.z.coerce.number().min(0).optional(),
    manufactureDate: catalogSchemas_1.dateFormat.optional(),
    grade: zod_1.z.enum(teaGradeValues, { message: "Invalid tea grade" }),
}).strict();
exports.querySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(0).max(10000).optional().default(100), // Changed max from 1000 to 10000
    auction: zod_1.z.string().optional(),
    lotNo: zod_1.z.string().optional(),
    sellingMark: zod_1.z.string().optional(),
    grade: zod_1.z.enum([...teaGradeValues, "any"]).optional(),
    broker: zod_1.z.enum([...brokerValues, "any"]).optional(),
    invoiceNo: zod_1.z.string().optional(),
    bags: zod_1.z.coerce.number().int().min(0).optional(),
    netWeight: zod_1.z.coerce.number().min(0).optional(),
    totalWeight: zod_1.z.coerce.number().min(0).optional(),
    baselinePrice: zod_1.z.coerce.number().min(0).optional(),
    manufactureDate: catalogSchemas_1.dateFormat.optional(),
    search: zod_1.z.string().optional(),
    ids: zod_1.z.array(zod_1.z.number().int()).optional(),
});
