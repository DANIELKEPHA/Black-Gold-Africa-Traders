import { z } from 'zod';
import { Broker, TeaCategory, TeaGrade } from '@prisma/client';
import { cognitoIdSchema } from './shipmentSchemas';
import {dateFormat, reprintSchema} from "./catalogSchemas";

const teaCategoryValues = Object.values(TeaCategory) as [string, ...string[]];
const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];
const brokerValues = Object.values(Broker) as [string, ...string[]];

// CSV upload schema (unchanged)
export const csvUploadSchema = z.object({
    duplicateAction: z.literal('replace', {
        errorMap: () => ({ message: "duplicateAction must be 'replace'" }),
    }),
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

export const exportQuerySchema = z
    .object({
        adminCognitoId: cognitoIdSchema, // Required for security
        sellingPriceIds: z.string().optional(), // Comma-separated IDs
        category: z.enum(teaCategoryValues).optional(),
        lotNo: z.string().min(1, 'Lot number must not be empty').optional(),
        saleCode: z.string().min(1, 'Sale code must not be empty').optional(),
        page: z.coerce.number().int().positive('Page must be a positive integer').optional().default(1),
        limit: z.coerce.number().int().positive('Limit must be a positive integer').optional().default(Number.MAX_SAFE_INTEGER),
    })
    .strict();

export const createSellingPriceSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }),
    sellingMark: z.string().min(1, 'Selling mark is required'),
    lotNo: z.string().min(1, 'Lot number is required'),
    reprint: reprintSchema,
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
    broker: z.enum(brokerValues, { message: "Invalid broker value. Must be one of: " + brokerValues.join(", ") }),
    sellingMark: z.string().min(1, "Selling mark is required and cannot be empty"),
    lotNo: z.string().min(1, "Lot number is required and cannot be empty"),
    reprint: reprintSchema,
    bags: z.number().int().positive("Bags must be a positive integer"),
    netWeight: z.number().positive("Net weight must be a positive number"),
    totalWeight: z.number().positive("Total weight must be a positive number"),
    invoiceNo: z.string().min(1, "Invoice number is required and cannot be empty"),
    saleCode: z.string().min(1, "Sale code is required and cannot be empty"),
    askingPrice: z.number().positive("Asking price must be a positive number"),
    purchasePrice: z.number().positive("Purchase price must be a positive number"),
    producerCountry: z.string().min(1, "Producer country cannot be empty").optional(),
    manufactureDate: dateFormat.refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format (YYYY/MM/DD or DD/MM/YYYY)"),
    category: z.enum(teaCategoryValues, { message: "Invalid tea category. Must be one of: " + teaCategoryValues.join(", ") }),
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade. Must be one of: " + teaGradeValues.join(", ") }),
}).strict();

export const updateSchema = z.object({
    broker: z.enum(brokerValues, { message: 'Invalid broker value' }).optional(),
    sellingMark: z.string().min(1, 'Selling mark must not be empty').optional(),
    reprint: reprintSchema,
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
    reprint: reprintSchema,
    search: z.string().optional(),
}).strict();