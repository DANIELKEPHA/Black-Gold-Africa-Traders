"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filtersStateSchema = exports.updateSchema = exports.csvRecordSchema = exports.createSellingPriceSchema = exports.exportQuerySchema = exports.querySchema = exports.csvUploadSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const shipmentSchemas_1 = require("./shipmentSchemas");
const catalogSchemas_1 = require("./catalogSchemas");
const teaCategoryValues = Object.values(client_1.TeaCategory);
const teaGradeValues = Object.values(client_1.TeaGrade);
const brokerValues = Object.values(client_1.Broker);
// CSV upload schema (unchanged)
exports.csvUploadSchema = zod_1.z.object({
    duplicateAction: zod_1.z.literal('replace', {
        errorMap: () => ({ message: "duplicateAction must be 'replace'" }),
    }),
});
exports.querySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().positive('Page must be a positive integer').optional().default(1),
    limit: zod_1.z.coerce.number().int().positive('Limit must be a positive integer').optional().default(20),
    lotNo: zod_1.z.string().min(1, 'Lot number must not be empty').optional(),
    sellingMark: zod_1.z.string().min(1, 'Selling mark must not be empty').optional(),
    bags: zod_1.z.coerce.number().int().positive('Bags must be a positive integer').optional(),
    totalWeight: zod_1.z.coerce.number().positive('Total weight must be positive').optional(),
    netWeight: zod_1.z.coerce.number().positive('Net weight must be positive').optional(),
    askingPrice: zod_1.z.coerce.number().positive('Asking price must be positive').optional(),
    purchasePrice: zod_1.z.coerce.number().positive('Purchase price must be positive').optional(),
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: catalogSchemas_1.dateFormat.optional(),
    saleCode: zod_1.z.string().min(1, 'Sale code must not be empty').optional(),
    category: zod_1.z.enum([...teaCategoryValues, 'any']).optional().default('any'),
    grade: zod_1.z.enum([...teaGradeValues, 'any']).optional().default('any'),
    broker: zod_1.z.enum([...brokerValues, 'any']).optional().default('any'),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number must not be empty').optional(),
    reprint: catalogSchemas_1.reprintSchema.optional(), // Make reprint optional
    search: zod_1.z.string().min(1, 'Search term must not be empty').optional(),
    ids: zod_1.z.array(zod_1.z.number().int().positive('IDs must be positive integers')).optional(),
    sortBy: zod_1.z.string().optional().default(''),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
})
    .strict();
exports.exportQuerySchema = zod_1.z
    .object({
    adminCognitoId: shipmentSchemas_1.cognitoIdSchema, // Required for security
    sellingPriceIds: zod_1.z.string().optional(), // Comma-separated IDs
    category: zod_1.z.enum(teaCategoryValues).optional(),
    lotNo: zod_1.z.string().min(1, 'Lot number must not be empty').optional(),
    saleCode: zod_1.z.string().min(1, 'Sale code must not be empty').optional(),
    page: zod_1.z.coerce.number().int().positive('Page must be a positive integer').optional().default(1),
    limit: zod_1.z.coerce.number().int().positive('Limit must be a positive integer').optional().default(Number.MAX_SAFE_INTEGER),
})
    .strict();
exports.createSellingPriceSchema = zod_1.z.object({
    broker: zod_1.z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: zod_1.z.string().min(1, 'Selling mark is required'),
    lotNo: zod_1.z.string().min(1, 'Lot number is required'),
    reprint: catalogSchemas_1.reprintSchema,
    bags: zod_1.z.number().int().positive('Bags must be a positive integer'),
    netWeight: zod_1.z.number().positive('Net weight must be positive'),
    totalWeight: zod_1.z.number().positive('Total weight must be positive'),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number is required'),
    saleCode: zod_1.z.string().min(1, 'Sale code is required'),
    askingPrice: zod_1.z.number().positive('Asking price must be positive'),
    purchasePrice: zod_1.z.number().positive('Purchase price must be positive'),
    adminCognitoId: zod_1.z.string().uuid('Admin Cognito ID must be a valid UUID'),
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: catalogSchemas_1.dateFormat,
    category: zod_1.z.enum(teaCategoryValues, { message: 'Invalid tea category' }),
    grade: zod_1.z.enum(teaGradeValues, { message: 'Invalid tea grade' }),
}).strict();
exports.csvRecordSchema = zod_1.z.object({
    broker: zod_1.z.enum(brokerValues, { message: "Invalid broker value. Must be one of: " + brokerValues.join(", ") }),
    sellingMark: zod_1.z.string().min(1, "Selling mark is required and cannot be empty"),
    lotNo: zod_1.z.string().min(1, "Lot number is required and cannot be empty"),
    reprint: catalogSchemas_1.reprintSchema,
    bags: zod_1.z.number().int().positive("Bags must be a positive integer"),
    netWeight: zod_1.z.number().positive("Net weight must be a positive number"),
    totalWeight: zod_1.z.number().positive("Total weight must be a positive number"),
    invoiceNo: zod_1.z.string().min(1, "Invoice number is required and cannot be empty"),
    saleCode: zod_1.z.string().min(1, "Sale code is required and cannot be empty"),
    askingPrice: zod_1.z.number().positive("Asking price must be a positive number"),
    purchasePrice: zod_1.z.number().positive("Purchase price must be a positive number"),
    producerCountry: zod_1.z.string().min(1, "Producer country cannot be empty").optional(),
    manufactureDate: catalogSchemas_1.dateFormat.refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format (YYYY/MM/DD or DD/MM/YYYY)"),
    category: zod_1.z.enum(teaCategoryValues, { message: "Invalid tea category. Must be one of: " + teaCategoryValues.join(", ") }),
    grade: zod_1.z.enum(teaGradeValues, { message: "Invalid tea grade. Must be one of: " + teaGradeValues.join(", ") }),
}).strict();
exports.updateSchema = zod_1.z.object({
    broker: zod_1.z.enum(brokerValues, { message: 'Invalid broker value' }).optional(),
    sellingMark: zod_1.z.string().min(1, 'Selling mark must not be empty').optional(),
    reprint: catalogSchemas_1.reprintSchema,
    bags: zod_1.z.number().int().positive('Bags must be a positive integer').optional(),
    totalWeight: zod_1.z.number().positive('Total weight must be positive').optional(),
    netWeight: zod_1.z.number().positive('Net weight must be positive').optional(),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number must not be empty').optional(),
    saleCode: zod_1.z.string().min(1, 'Sale code must not be empty').optional(),
    askingPrice: zod_1.z.number().positive('Asking price must be positive').optional(),
    purchasePrice: zod_1.z.number().positive('Purchase price must be positive').optional(),
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: catalogSchemas_1.dateFormat.optional(),
    category: zod_1.z.enum(teaCategoryValues).optional(),
    grade: zod_1.z.enum(teaGradeValues).optional(),
}).strict();
exports.filtersStateSchema = zod_1.z.object({
    lotNo: zod_1.z.string().optional().nullable(),
    sellingMark: zod_1.z.string().min(1, 'Selling mark must not be empty').optional(),
    producerCountry: zod_1.z.string().nullable().optional(),
    manufactureDate: catalogSchemas_1.dateFormat.optional().nullable(),
    saleCode: zod_1.z.string().min(1).optional(),
    category: zod_1.z.enum([...teaCategoryValues, 'any']).optional(),
    grade: zod_1.z.enum([...teaGradeValues, 'any']).optional(),
    broker: zod_1.z.enum([...brokerValues, 'any']).optional(),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number must not be empty').optional(),
    askingPrice: zod_1.z.number().positive('').optional(),
    purchasePrice: zod_1.z.number().positive('').optional(),
    bags: zod_1.z.number().int().positive('Bags').optional(),
    totalWeight: zod_1.z.number().positive('').optional(),
    netWeight: zod_1.z.number().positive('').optional(),
    reprint: catalogSchemas_1.reprintSchema,
    search: zod_1.z.string().optional(),
}).strict();
