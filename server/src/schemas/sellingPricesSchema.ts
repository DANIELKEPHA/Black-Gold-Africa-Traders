import { z } from 'zod';
import { Broker, TeaCategory, TeaGrade } from '@prisma/client';
import { cognitoIdSchema } from './shipmentSchemas';

const teaCategoryValues = Object.values(TeaCategory) as [string, ...string[]];
const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];
const brokerValues = Object.values(Broker) as [string, ...string[]];

// Custom validator for YYYY/MM/DD format (accepts single-digit month/day)
const dateFormat = z
    .string()
    .regex(
        /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])$/,
        'Invalid date format (YYYY/MM/DD)'
    )
    .transform((val) => {
        // Split the date and ensure leading zeros for month and day
        const [year, month, day] = val.split('/').map(Number);
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        console.log(`[Schema] Transforming date: ${val} to ${formattedDate}`);

        // Validate the date is valid
        const date = new Date(formattedDate);
        if (isNaN(date.getTime())) {
            console.error(`[Schema] Invalid date: ${formattedDate}`);
            throw new Error('Invalid date');
        }

        // Return in YYYY/MM/DD format for consistency
        return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
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
        purchasePrice: z.coerce.number().positive('Purchase price must be positive').optional(),
        producerCountry: z.string().min(1, 'Producer country must not be empty').optional(),
        manufactureDate: dateFormat.optional(),
        saleCode: z.string().min(1, 'Sale code must not be empty').optional(),
        category: z.enum([...teaCategoryValues, 'any'] as const).optional(),
        grade: z.enum([...teaGradeValues, 'any'] as const).optional(),
        broker: z.enum([...brokerValues, 'any'] as const).optional(),
        invoiceNo: z.string().min(1, 'Invoice number must not be empty').optional(),
        reprint: z.coerce.number().int().nonnegative('Reprint must be non-negative').optional(),
        search: z.string().min(1, 'Search term must not be empty').optional(),
        ids: z.array(z.number().int().positive('IDs must be positive integers')).optional(),
        adminCognitoId: cognitoIdSchema.optional(),
        userCognitoId: cognitoIdSchema.optional(),
    })
    .strict();

export const exportQuerySchema = z
    .object({
        adminCognitoId: cognitoIdSchema, // Required for security
        sellingPriceIds: z.string().optional(), // Comma-separated IDs
        category: z.enum(teaCategoryValues).optional(),
        lotNo: z.string().min(1, 'Lot number must not be empty').optional(),
        saleCode: z.string().min(1, 'Sale code must not be empty').optional(),
        page: z.coerce.number().int().positive('Page must be a positive integer').optional().default(1),
        limit: z.coerce.number().int().positive('Limit must be a positive integer').max(10000).optional().default(1000),
    })
    .strict();

// ... rest of the schemas (createSellingPriceSchema, csvRecordSchema, updateSchema, filtersStateSchema)

export const createSellingPriceSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: z.string().min(1, 'Selling mark is required'),
    lotNo: z.string().min(1, 'Lot number is required'),
    reprint: z.number().int().nonnegative('Reprint must be non-negative').default(0),
    bags: z.number().int().positive('Bags must be a positive integer'),
    netWeight: z.number().positive('Net weight must be positive'),
    totalWeight: z.number().positive('Total weight must be positive'),
    invoiceNo: z.string().min(1, 'Invoice number is required'),
    saleCode: z.string().min(1, 'Sale code is required'),
    askingPrice: z.number().positive('Asking price must be positive'),
    purchasePrice: z.number().positive('Purchase price must be positive'),
    adminCognitoId: z.string().uuid('Admin Cognito ID must be a valid UUID'),
    producerCountry: z.string().min(1, 'Producer country must not be empty').optional(),
    manufactureDate: dateFormat,
    category: z.enum(teaCategoryValues, { message: 'Invalid tea category' }),
    grade: z.enum(teaGradeValues, { message: 'Invalid tea grade' }),
}).strict();

export const csvRecordSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value. Must be one of: ' + brokerValues.join(', ') }),
    sellingMark: z.string().min(1, 'Selling mark is required and cannot be empty'),
    lotNo: z.string().min(1, 'Lot number is required and cannot be empty'),
    reprint: z.number().int().nonnegative('Reprint must be a non-negative integer').default(0),
    bags: z.number().int().positive('Bags must be a positive integer'),
    netWeight: z.number().positive('Net weight must be a positive number'),
    totalWeight: z.number().positive('Total weight must be a positive number'),
    invoiceNo: z.string().min(1, 'Invoice number is required and cannot be empty'),
    saleCode: z.string().min(1, 'Sale code is required and cannot be empty'),
    askingPrice: z.number().positive('Asking price must be a positive number'),
    purchasePrice: z.number().positive('Purchase price must be a positive number'),
    adminCognitoId: z.string().uuid('Admin Cognito ID must be a valid UUID'),
    producerCountry: z.string().min(1, 'Producer country cannot be empty').optional(),
    manufactureDate: dateFormat.refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format (M/D/YYYY)'),
    category: z.enum(teaCategoryValues, { message: 'Invalid tea category. Must be one of: ' + teaCategoryValues.join(', ') }),
    grade: z.enum(teaGradeValues, { message: 'Invalid tea grade. Must be one of: ' + teaGradeValues.join(', ') }),
}).strict();

export const updateSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }).optional(),
    sellingMark: z.string().min(1, 'Selling mark must not be empty').optional(),
    reprint: z.number().int().nonnegative('Reprint must be non-negative').optional(),
    bags: z.number().int().positive('Bags must be a positive integer').optional(),
    totalWeight: z.number().positive('Total weight must be positive').optional(),
    netWeight: z.number().positive('Net weight must be positive').optional(),
    invoiceNo: z.string().min(1, 'Invoice number must not be empty').optional(),
    saleCode: z.string().min(1, 'Sale code must not be empty').optional(),
    askingPrice: z.number().positive('Asking price must be positive').optional(),
    purchasePrice: z.number().positive('Purchase price must be positive').optional(),
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
    purchasePrice: z.number().positive('').optional(),
    bags: z.number().int().positive('Bags').optional(),
    totalWeight: z.number().positive('').optional(),
    netWeight: z.number().positive('').optional(),
    reprint: z.number().int().nonnegative('').optional(),
    search: z.string().optional(),
}).strict();