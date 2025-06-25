import { z } from "zod";
import { Broker, TeaGrade } from "@prisma/client";

const brokerValues = Object.values(Broker) as [string, ...string[]];
const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];

export const getStockQuerySchema = z.object({
    minWeight: z.coerce.number().nonnegative("Minimum weight must be non-negative").optional(),
    batchNumber: z.string().min(1, "Batch number must not be empty").optional(),
    lotNo: z.string().min(1, "Lot number must not be empty").optional(),
    page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
    limit: z.coerce.number().int().positive("Limit must be a positive integer").default(20),
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade" }).optional(),
    broker: z.enum(brokerValues, { message: "Invalid broker" }).optional(),
    search: z.string().min(1, "Search term must not be empty").optional(),
    onlyFavorites: z
        .enum(["true", "false"])
        .optional()
        .transform((val) => val === "true"),
}).strict();

export const assignStockSchema = z.object({
    stockId: z.number().int().positive("Stock ID must be a positive integer"),
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
}).strict();


export const bulkAssignStockSchema = z.object({
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
    assignments: z.array(
        z.object({
            stockId: z.number().int().positive("Stock ID must be a positive integer"),
            assignedWeight: z.number().positive("Assigned weight must be positive").optional(),
        })
    ).min(1, "At least one assignment is required"),
}).strict();

export const createStockSchema = z.object({
    saleCode: z.string().min(1, "Sale code is required"),
    broker: z.enum(brokerValues, { message: "Invalid broker" }),
    lotNo: z.string().min(1, "Lot number is required"),
    mark: z.string().min(1, "Mark is required"),
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade" }),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    bags: z.number().int().positive("Bags must be a positive integer"),
    weight: z.number().positive("Weight must be positive"),
    purchaseValue: z.number().nonnegative("Purchase value must be non-negative"),
    batchNumber: z.string().min(1, "Batch number must not be empty").optional(),
    lowStockThreshold: z.number().nonnegative("Low stock threshold must be non-negative").optional(),
    assignments: z
        .array(
            z.object({
                userCognitoId: z.string().min(1, "User Cognito ID is required"),
                assignedWeight: z.number().positive("Assigned weight must be positive"),
            }),
        )
        .optional(),
}).strict();

export const updateStockParamsSchema = z.object({
    id: z.string().transform((val) => parseInt(val, 10)),
});

export const updateStockBodySchema = z.object({
    saleCode: z.string().optional(),
    broker: z.string().optional(),
    lotNo: z.string().optional(),
    mark: z.string().optional(),
    grade: z.string().optional(),
    invoiceNo: z.string().optional(),
    bags: z.number().int().min(0).optional(),
    weight: z.number().min(0).optional(),
    purchaseValue: z.number().min(0).optional(),
    totalPurchaseValue: z.number().min(0).optional(),
    agingDays: z.number().int().min(0).optional(),
    penalty: z.number().min(0).optional(),
    bgtCommission: z.number().min(0).optional(),
    maerskFee: z.number().min(0).optional(),
    commission: z.number().min(0).optional(),
    netPrice: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    batchNumber: z.string().nullable().optional(),
    lowStockThreshold: z.number().min(0).nullable().optional(),
    adminCognitoId: z.string().optional(),
    assignments: z
        .array(
            z.object({
                userCognitoId: z.string(),
                assignedWeight: z.number().min(0),
            }),
        )
        .optional(),
});

export const adjustStockSchema = z.object({
    stocksId: z.number().int().positive(),
    weight: z.number(),
    reason: z.string().min(1),
    shipmentId: z.number().int().positive().optional(),
});

export const getStockHistoryQuerySchema = z.object({
    stockId: z.number().int().positive("Stock ID must be a positive integer").optional(),
    shipmentId: z.number().int().positive("Shipment ID must be a positive integer").optional(),
    adminCognitoId: z.string().min(1, "Admin Cognito ID must not be empty").optional(),
    page: z.coerce.number().int().positive("Page must be a positive integer").default(1),
    limit: z.coerce.number().int().positive("Limit must be a positive integer").default(20),
    includeStock: z.coerce.boolean().default(false),
    includeShipment: z.coerce.boolean().default(false),
    includeAdmin: z.coerce.boolean().default(false),
}).strict();

export const toggleFavoriteSchema = z.object({
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
    stockId: z.number().int().positive("Stock ID must be a positive integer"),
}).strict();

export const unassignStockSchema = z.object({
    stockId: z.number().int().positive("Stock ID must be a positive integer"),
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
}).strict();

export const csvUploadSchema = z.object({
    duplicateAction: z.enum(["skip", "replace"]).optional().default("skip"),
}).strict();

export const uploadStocksCsvSchema = z.object({
    saleCode: z.string().min(1, "Sale code is required"),
    broker: z.string().refine((val) => brokerValues.includes(val), { message: "Invalid broker" }),
    lotNo: z.string().min(1, "Lot number is required"),
    mark: z.string().min(1, "Mark is required"),
    grade: z.string().refine((val) => teaGradeValues.includes(val), { message: "Invalid tea grade" }),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    bags: z.coerce.number().int().positive("Bags must be a positive integer"),
    weight: z.coerce.number().positive("Weight must be positive"),
    purchaseValue: z.coerce.number().nonnegative("Purchase value must be non-negative"),
    totalPurchaseValue: z.coerce.number().nonnegative("Total purchase value must be non-negative").optional(),
    agingDays: z.coerce.number().int().nonnegative("Aging days must be non-negative").optional(),
    penalty: z.coerce.number().nonnegative("Penalty must be non-negative").optional(),
    bgtCommission: z.coerce.number().nonnegative("BGT commission must be non-negative").optional(),
    maerskFee: z.coerce.number().nonnegative("Maersk fee must be non-negative").optional(),
    commission: z.coerce.number().nonnegative("Commission must be non-negative").optional(),
    netPrice: z.coerce.number().nonnegative("Net price must be non-negative").optional(),
    total: z.coerce.number().nonnegative("Total must be non-negative").optional(),
    batchNumber: z.string().min(1, "Batch number must not be empty").optional(),
    lowStockThreshold: z.coerce.number().int().nonnegative("Low stock threshold must be non-negative").optional(),
    adminCognitoId: z.string().min(1, "Admin Cognito ID must be a valid string").optional(),
}).strict();