"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filtersStateSchema = exports.updateSchema = exports.csvRecordSchema = exports.createCatalogSchema = exports.querySchema = exports.dateFormat = exports.reprintSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const teaCategoryValues = Object.values(client_1.TeaCategory);
const teaGradeValues = Object.values(client_1.TeaGrade);
const brokerValues = Object.values(client_1.Broker);
// Create a reusable reprint schema that matches your Prisma model (String type)
exports.reprintSchema = zod_1.z
    .union([
    zod_1.z.literal("No"),
    zod_1.z.string().regex(/^[1-9]\d*$/, {
        message: "Reprint must be 'No' or a positive integer string",
    }),
])
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .describe("Either 'No', a positive integer string, or null");
exports.dateFormat = zod_1.z
    .string()
    .regex(/^(?:\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])|(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/\d{4}|\d{4}\/([1-9]|1[0-2])\/([1-9]|[12]\d|3[01])|([1-9]|1[0-2])\/([1-9]|[12]\d|3[01])\/\d{4})$/, 'Invalid date format (expected YYYY/MM/DD, DD/MM/YYYY, M/D/YYYY, or YYYY/M/D)')
    .transform((val) => {
    let year, month, day;
    if (val.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        // YYYY/MM/DD or YYYY/M/D
        [year, month, day] = val.split('/').map(Number);
    }
    else if (val.match(/^([1-9]|[12]\d|3[01])\/([1-9]|1[0-2])\/\d{4}$/)) {
        // DD/MM/YYYY
        [day, month, year] = val.split('/').map(Number);
    }
    else {
        // M/D/YYYY
        [month, day, year] = val.split('/').map(Number);
    }
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Validate the date is valid
    const date = new Date(formattedDate);
    if (isNaN(date.getTime()) || date.getMonth() + 1 !== month || date.getDate() !== day) {
        console.error(`[Schema] Invalid date: ${formattedDate}`);
        throw new Error('Invalid date');
    }
    // Return in YYYY-MM-DD format for consistency
    return formattedDate;
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
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: exports.dateFormat.optional(),
    saleCode: zod_1.z.string().min(1, 'Sale code must not be empty').optional(),
    category: zod_1.z.enum([...teaCategoryValues, 'any']).optional().default('any'),
    grade: zod_1.z.enum([...teaGradeValues, 'any']).optional().default('any'),
    broker: zod_1.z.enum([...brokerValues, 'any']).optional().default('any'),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number must not be empty').optional(),
    reprint: exports.reprintSchema.optional(), // Make reprint optional
    search: zod_1.z.string().min(1, 'Search term must not be empty').optional(),
    ids: zod_1.z.array(zod_1.z.number().int().positive('IDs must be positive integers')).optional(),
    sortBy: zod_1.z.string().optional().default(''),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('asc'),
})
    .strict();
exports.createCatalogSchema = zod_1.z.object({
    broker: zod_1.z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: zod_1.z.string().min(1, 'Selling mark is required'),
    lotNo: zod_1.z.string().min(1, 'Lot number is required'),
    reprint: exports.reprintSchema.optional(),
    bags: zod_1.z.number().int().positive('Bags must be a positive integer'),
    netWeight: zod_1.z.number().positive('Net weight must be positive'),
    totalWeight: zod_1.z.number().positive('Total weight must be positive'),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number is required'),
    saleCode: zod_1.z.string().min(1, 'Sale code is required'),
    askingPrice: zod_1.z.number().positive('Asking price must be positive'),
    adminCognitoId: zod_1.z.string().uuid('Admin Cognito ID must be a valid UUID'),
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: exports.dateFormat,
    category: zod_1.z.enum(teaCategoryValues, { message: 'Invalid tea category' }),
    grade: zod_1.z.enum(teaGradeValues, { message: 'Invalid tea grade' }),
}).strict();
exports.csvRecordSchema = zod_1.z.object({
    broker: zod_1.z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: zod_1.z.string().min(1, 'Selling mark is required'),
    lotNo: zod_1.z.string().min(1, 'Lot number is required'),
    reprint: exports.reprintSchema.optional(),
    bags: zod_1.z.number().int().positive('Bags must be a positive integer'),
    netWeight: zod_1.z.number().positive('Net weight must be positive'),
    totalWeight: zod_1.z.number().positive('Total weight must be positive'),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number is required'),
    saleCode: zod_1.z.string().min(1, 'Sale code is required'),
    askingPrice: zod_1.z.number().positive('Asking price must be positive'),
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: exports.dateFormat,
    category: zod_1.z.enum(teaCategoryValues, { message: 'Invalid tea category' }),
    grade: zod_1.z.enum(teaGradeValues, { message: 'Invalid tea grade' }),
}).strict();
exports.updateSchema = zod_1.z.object({
    broker: zod_1.z.enum(brokerValues, { message: 'Invalid broker value' }).optional(),
    sellingMark: zod_1.z.string().min(1, 'Selling mark must not be empty').optional(),
    reprint: exports.reprintSchema.optional(),
    bags: zod_1.z.number().int().positive('Bags must be a positive integer').optional(),
    totalWeight: zod_1.z.number().positive('Total weight must be positive').optional(),
    netWeight: zod_1.z.number().positive('Net weight must be positive').optional(),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number must not be empty').optional(),
    saleCode: zod_1.z.string().min(1, 'Sale code must not be empty').optional(),
    askingPrice: zod_1.z.number().positive('Asking price must be positive').optional(),
    producerCountry: zod_1.z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: exports.dateFormat.optional(),
    category: zod_1.z.enum(teaCategoryValues).optional(),
    grade: zod_1.z.enum(teaGradeValues).optional(),
}).strict();
exports.filtersStateSchema = zod_1.z.object({
    lotNo: zod_1.z.string().optional().nullable(),
    sellingMark: zod_1.z.string().min(1, 'Selling mark must not be empty').optional(),
    producerCountry: zod_1.z.string().nullable().optional(),
    manufactureDate: exports.dateFormat.optional().nullable(),
    saleCode: zod_1.z.string().min(1).optional(),
    category: zod_1.z.enum([...teaCategoryValues, 'any']).optional(),
    grade: zod_1.z.enum([...teaGradeValues, 'any']).optional(),
    broker: zod_1.z.enum([...brokerValues, 'any']).optional(),
    invoiceNo: zod_1.z.string().min(1, 'Invoice number must not be empty').optional(),
    askingPrice: zod_1.z.number().positive('').optional(),
    bags: zod_1.z.number().int().positive('Bags').optional(),
    totalWeight: zod_1.z.number().positive('').optional(),
    netWeight: zod_1.z.number().positive('').optional(),
    reprint: exports.reprintSchema.optional(),
    search: zod_1.z.string().optional(),
}).strict();
