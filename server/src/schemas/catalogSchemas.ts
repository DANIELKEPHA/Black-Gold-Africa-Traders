import { z } from 'zod';
import { Broker, TeaCategory, TeaGrade } from '@prisma/client';
import { cognitoIdSchema } from './shipmentSchemas';

const teaCategoryValues = Object.values(TeaCategory) as [string, ...string[]];
const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];
const brokerValues = Object.values(Broker) as [string, ...string[]];

// Create a reusable reprint schema that matches your Prisma model (String type)
export const reprintSchema = z
    .union([
        z.literal("No"),
        z.string().regex(/^[1-9]\d*$/, {
            message: "Reprint must be 'No' or a positive integer string",
        }),
    ])
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .describe("Either 'No', a positive integer string, or null");

export const dateFormat = z
    .string()
    .regex(
        /^(?:\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])|(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/\d{4}|\d{4}\/([1-9]|1[0-2])\/([1-9]|[12]\d|3[01])|([1-9]|1[0-2])\/([1-9]|[12]\d|3[01])\/\d{4})$/,
        'Invalid date format (expected YYYY/MM/DD, DD/MM/YYYY, M/D/YYYY, or YYYY/M/D)'
    )
    .transform((val) => {
        let year: number, month: number, day: number;
        if (val.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
            // YYYY/MM/DD or YYYY/M/D
            [year, month, day] = val.split('/').map(Number);
        } else if (val.match(/^([1-9]|[12]\d|3[01])\/([1-9]|1[0-2])\/\d{4}$/)) {
            // DD/MM/YYYY
            [day, month, year] = val.split('/').map(Number);
        } else {
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

export const querySchema = z
    .object({
        page: z.coerce.number().int().positive('Page must be a positive integer').optional().default(1),
        limit: z.coerce.number().int().positive('Limit must be a positive integer').optional().default(20),
        lotNo: z.string().min(1, 'Lot number must not be empty').optional(),
        sellingMark: z.string().min(1, 'Selling mark must not be empty').optional(),
        bags: z.coerce.number().int().positive('Bags must be a positive integer').optional(),
        totalWeight: z.coerce.number().positive('Total weight must be positive').optional(),
        netWeight: z.coerce.number().positive('Net weight must be positive').optional(),
        askingPrice: z.coerce.number().positive('Asking price must be positive').optional(),
        producerCountry: z.string().min(1, 'Producer country must not be empty').optional(),
        manufactureDate: dateFormat.optional(),
        saleCode: z.string().min(1, 'Sale code must not be empty').optional(),
        category: z.enum([...teaCategoryValues, 'any'] as const).optional().default('any'),
        grade: z.enum([...teaGradeValues, 'any'] as const).optional().default('any'),
        broker: z.enum([...brokerValues, 'any'] as const).optional().default('any'),
        invoiceNo: z.string().min(1, 'Invoice number must not be empty').optional(),
        reprint: reprintSchema.optional(), // Make reprint optional
        search: z.string().min(1, 'Search term must not be empty').optional(),
        ids: z.array(z.number().int().positive('IDs must be positive integers')).optional(),
        sortBy: z.string().optional().default(''),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    })
    .strict();

export const createCatalogSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: z.string().min(1, 'Selling mark is required'),
    lotNo: z.string().min(1, 'Lot number is required'),
    reprint: reprintSchema.optional(),
    bags: z.number().int().positive('Bags must be a positive integer'),
    netWeight: z.number().positive('Net weight must be positive'),
    totalWeight: z.number().positive('Total weight must be positive'),
    invoiceNo: z.string().min(1, 'Invoice number is required'),
    saleCode: z.string().min(1, 'Sale code is required'),
    askingPrice: z.number().positive('Asking price must be positive'),
    adminCognitoId: z.string().uuid('Admin Cognito ID must be a valid UUID'),
    producerCountry: z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: dateFormat,
    category: z.enum(teaCategoryValues, { message: 'Invalid tea category' }),
    grade: z.enum(teaGradeValues, { message: 'Invalid tea grade' }),
}).strict();

export const csvRecordSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: z.string().min(1, 'Selling mark is required'),
    lotNo: z.string().min(1, 'Lot number is required'),
    reprint: reprintSchema.optional(),
    bags: z.number().int().positive('Bags must be a positive integer'),
    netWeight: z.number().positive('Net weight must be positive'),
    totalWeight: z.number().positive('Total weight must be positive'),
    invoiceNo: z.string().min(1, 'Invoice number is required'),
    saleCode: z.string().min(1, 'Sale code is required'),
    askingPrice: z.number().positive('Asking price must be positive'),
    producerCountry: z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: dateFormat,
    category: z.enum(teaCategoryValues, { message: 'Invalid tea category' }),
    grade: z.enum(teaGradeValues, { message: 'Invalid tea grade' }),
}).strict();

export const updateSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }).optional(),
    sellingMark: z.string().min(1, 'Selling mark must not be empty').optional(),
    reprint: reprintSchema.optional(),
    bags: z.number().int().positive('Bags must be a positive integer').optional(),
    totalWeight: z.number().positive('Total weight must be positive').optional(),
    netWeight: z.number().positive('Net weight must be positive').optional(),
    invoiceNo: z.string().min(1, 'Invoice number must not be empty').optional(),
    saleCode: z.string().min(1, 'Sale code must not be empty').optional(),
    askingPrice: z.number().positive('Asking price must be positive').optional(),
    producerCountry: z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: dateFormat.optional(),
    category: z.enum(teaCategoryValues).optional(),
    grade: z.enum(teaGradeValues).optional(),
}).strict();

export const filtersStateSchema = z.object({
    lotNo: z.string().optional().nullable(),
    sellingMark: z.string().min(1, 'Selling mark must not be empty').optional(),
    producerCountry: z.string().nullable().optional(),
    manufactureDate: dateFormat.optional().nullable(),
    saleCode: z.string().min(1).optional(),
    category: z.enum([...teaCategoryValues, 'any'] as const).optional(),
    grade: z.enum([...teaGradeValues, 'any'] as const).optional(),
    broker: z.enum([...brokerValues, 'any'] as any).optional(),
    invoiceNo: z.string().min(1, 'Invoice number must not be empty').optional(),
    askingPrice: z.number().positive('').optional(),
    bags: z.number().int().positive('Bags').optional(),
    totalWeight: z.number().positive('').optional(),
    netWeight: z.number().positive('').optional(),
    reprint: reprintSchema.optional(),
    search: z.string().optional(),
}).strict();