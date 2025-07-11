"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStocksCsvSchema = exports.csvUploadSchema = exports.unassignStockSchema = exports.toggleFavoriteSchema = exports.getStockHistoryQuerySchema = exports.adjustStockSchema = exports.updateStockBodySchema = exports.updateStockParamsSchema = exports.createStockSchema = exports.bulkAssignStockSchema = exports.assignStockSchema = exports.getStockQuerySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const brokerValues = Object.values(client_1.Broker);
const teaGradeValues = Object.values(client_1.TeaGrade);
// Schema for user details included in assignments
const userSchema = zod_1.z.object({
    name: zod_1.z.string().nullable(),
    email: zod_1.z.string().nullable(),
}).optional();
// Schema for a single assignment
const assignmentSchema = zod_1.z.object({
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
    assignedWeight: zod_1.z.number().positive("Assigned weight must be positive"),
    assignedAt: zod_1.z.string().datetime().optional(), // ISO string for assignedAt
    user: userSchema,
});
exports.getStockQuerySchema = zod_1.z.object({
    minWeight: zod_1.z.coerce.number().nonnegative("Minimum weight must be non-negative").optional(),
    batchNumber: zod_1.z.string().min(1, "Batch number must not be empty").optional(),
    lotNo: zod_1.z.string().min(1, "Lot number must not be empty").optional(),
    page: zod_1.z.coerce.number().int().positive("Page must be a positive integer").default(1),
    limit: zod_1.z.coerce.number().int().positive("Limit must be a positive integer").default(100),
    grade: zod_1.z.enum(teaGradeValues, { message: "Invalid tea grade" }).optional(),
    broker: zod_1.z.enum(brokerValues, { message: "Invalid broker" }).optional(),
    search: zod_1.z.string().min(1, "Search term must not be empty").optional(),
    assignmentStatus: zod_1.z.enum(["all", "assigned", "unassigned"]).optional().default("all"),
    onlyFavorites: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((val) => val === "true"),
}).strict();
exports.assignStockSchema = zod_1.z.object({
    stockId: zod_1.z.number().int().positive("Stock ID must be a positive integer"),
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
    assignedWeight: zod_1.z.number().positive("Assigned weight must be positive").optional(),
}).strict();
exports.bulkAssignStockSchema = zod_1.z.object({
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
    assignments: zod_1.z
        .array(zod_1.z.object({
        stockId: zod_1.z.number().int().positive("Stock ID must be a positive integer"),
        assignedWeight: zod_1.z.number().positive("Assigned weight must be positive").optional(),
    }))
        .min(1, "At least one assignment is required"),
}).strict();
exports.createStockSchema = zod_1.z.object({
    saleCode: zod_1.z.string().min(1, "Sale code is required"),
    broker: zod_1.z.enum(brokerValues, { message: "Invalid broker" }),
    lotNo: zod_1.z.string().min(1, "Lot number is required"),
    mark: zod_1.z.string().min(1, "Mark is required"),
    grade: zod_1.z.enum(teaGradeValues, { message: "Invalid tea grade" }),
    invoiceNo: zod_1.z.string().min(1, "Invoice number is required"),
    bags: zod_1.z.number().int().positive("Bags must be a positive integer"),
    weight: zod_1.z.number().positive("Weight must be positive"),
    purchaseValue: zod_1.z.number().nonnegative("Purchase value must be non-negative"),
    batchNumber: zod_1.z.string().min(1, "Batch number must not be empty").optional(),
    lowStockThreshold: zod_1.z.number().nonnegative("Low stock threshold must be non-negative").optional(),
    assignments: zod_1.z
        .array(assignmentSchema)
        .max(1, "A stock can only be assigned to one user") // Enforce single assignment
        .optional(),
}).strict();
exports.updateStockParamsSchema = zod_1.z.object({
    id: zod_1.z.string().transform((val) => parseInt(val, 10)),
});
exports.updateStockBodySchema = zod_1.z.object({
    saleCode: zod_1.z.string().min(1, "Sale code must not be empty").optional(),
    broker: zod_1.z.enum(brokerValues, { message: "Invalid broker" }).optional(),
    lotNo: zod_1.z.string().min(1, "Lot number must not be empty").optional(),
    mark: zod_1.z.string().min(1, "Mark must not be empty").optional(),
    grade: zod_1.z.enum(teaGradeValues, { message: "Invalid tea grade" }).optional(),
    invoiceNo: zod_1.z.string().min(1, "Invoice number must not be empty").optional(),
    bags: zod_1.z.number().int().min(0, "Bags must be non-negative").optional(),
    weight: zod_1.z.number().min(0, "Weight must be non-negative").optional(),
    purchaseValue: zod_1.z.number().min(0, "Purchase value must be non-negative").optional(),
    totalPurchaseValue: zod_1.z.number().min(0, "Total purchase value must be non-negative").optional(),
    agingDays: zod_1.z.number().int().min(0, "Aging days must be non-negative").optional(),
    penalty: zod_1.z.number().min(0, "Penalty must be non-negative").optional(),
    bgtCommission: zod_1.z.number().min(0, "BGT commission must be non-negative").optional(),
    maerskFee: zod_1.z.number().min(0, "Maersk fee must be non-negative").optional(),
    commission: zod_1.z.number().min(0, "Commission must be non-negative").optional(),
    netPrice: zod_1.z.number().min(0, "Net price must be non-negative").optional(),
    total: zod_1.z.number().min(0, "Total must be non-negative").optional(),
    batchNumber: zod_1.z.string().nullable().optional(),
    lowStockThreshold: zod_1.z.number().min(0, "Low stock threshold must be non-negative").nullable().optional(),
    adminCognitoId: zod_1.z.string().min(1, "Admin Cognito ID must be a valid string").optional(),
    assignments: zod_1.z
        .array(assignmentSchema)
        .max(1, "A stock can only be assigned to one user") // Enforce single assignment
        .optional(),
}).strict();
exports.adjustStockSchema = zod_1.z.object({
    stocksId: zod_1.z.number().int().positive(),
    weight: zod_1.z.number(),
    reason: zod_1.z.string().min(1),
    shipmentId: zod_1.z.number().int().positive().optional(),
}).strict();
exports.getStockHistoryQuerySchema = zod_1.z.object({
    stockId: zod_1.z.number().int().positive("Stock ID must be a positive integer").optional(),
    shipmentId: zod_1.z.number().int().positive("Shipment ID must be a positive integer").optional(),
    adminCognitoId: zod_1.z.string().min(1, "Admin Cognito ID must not be empty").optional(),
    page: zod_1.z.coerce.number().int().positive("Page must be a positive integer").default(1),
    limit: zod_1.z.coerce.number().int().positive("Limit must be a positive integer").default(20),
    includeStock: zod_1.z.coerce.boolean().default(false),
    includeShipment: zod_1.z.coerce.boolean().default(false),
    includeAdmin: zod_1.z.coerce.boolean().default(false),
}).strict();
exports.toggleFavoriteSchema = zod_1.z.object({
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
    stockId: zod_1.z.number().int().positive("Stock ID must be a positive integer"),
}).strict();
exports.unassignStockSchema = zod_1.z.object({
    stockId: zod_1.z.number().int().positive("Stock ID must be a positive integer"),
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
}).strict();
exports.csvUploadSchema = zod_1.z.object({
    duplicateAction: zod_1.z.enum(["skip", "replace"]).optional().default("skip"),
}).strict();
exports.uploadStocksCsvSchema = zod_1.z.object({
    saleCode: zod_1.z.string().min(1, "Sale code is required"),
    broker: zod_1.z.string().refine((val) => brokerValues.includes(val), { message: "Invalid broker" }),
    lotNo: zod_1.z.string().min(1, "Lot number is required"),
    mark: zod_1.z.string().min(1, "Mark is required"),
    grade: zod_1.z.string().refine((val) => teaGradeValues.includes(val), { message: "Invalid tea grade" }),
    invoiceNo: zod_1.z.string().min(1, "Invoice number is required"),
    bags: zod_1.z.coerce.number().int().positive("Bags must be a positive integer"),
    weight: zod_1.z.coerce.number().positive("Weight must be positive"),
    purchaseValue: zod_1.z.coerce.number().nonnegative("Purchase value must be non-negative"),
    totalPurchaseValue: zod_1.z.coerce.number().nonnegative("Total purchase value must be non-negative").optional(),
    agingDays: zod_1.z.coerce.number().int().nonnegative("Aging days must be non-negative").optional(),
    penalty: zod_1.z.coerce.number().nonnegative("Penalty must be non-negative").optional(),
    bgtCommission: zod_1.z.coerce.number().nonnegative("BGT commission must be non-negative").optional(),
    maerskFee: zod_1.z.coerce.number().nonnegative("Maersk fee must be non-negative").optional(),
    commission: zod_1.z.coerce.number().nonnegative("Commission must be non-negative").optional(),
    netPrice: zod_1.z.coerce.number().nonnegative("Net price must be non-negative").optional(),
    total: zod_1.z.coerce.number().nonnegative("Total must be non-negative").optional(),
    batchNumber: zod_1.z.string().min(1, "Batch number must not be empty").optional(),
    lowStockThreshold: zod_1.z.coerce.number().int().nonnegative("Low stock threshold must be non-negative").optional(),
    adminCognitoId: zod_1.z.string().min(1, "Admin Cognito ID must be a valid string").optional(),
}).strict();
