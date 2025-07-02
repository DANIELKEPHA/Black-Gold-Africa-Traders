import { z } from "zod";
import { Broker, PackagingInstructions, TeaCategory, TeaGrade, Vessel } from "@/state/enums";

const teaCategoryValues = Object.values(TeaCategory) as [string, ...string[]];
const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];
const brokerValues = Object.values(Broker) as [string, ...string[]];

export const settingsSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

export const createCatalogSchema = z.object({
    broker: z.enum(brokerValues, { message: "Invalid Broker" }),
    lotNo: z.string().min(1, "Lot number is required"),
    sellingMark: z.string().min(1, "Selling mark is required"),
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade" }),
    invoiceNo: z.string().min(1, "Invoice number is required").nullable(),
    saleCode: z.string().min(1, "Sale code is required"),
    category: z.enum(teaCategoryValues, { message: "Invalid tea category" }),
    reprint: z.number().int().min(0, "Reprint must be non-negative"),
    bags: z.number().int().min(1, "Bags must be at least 1"),
    netWeight: z.number().min(0, "Net weight must be non-negative"),
    totalWeight: z.number().min(0, "Total weight must be non-negative"),
    askingPrice: z.number().min(0, "Asking price must be non-negative"),
    producerCountry: z.string().nullable().optional(),
    manufactureDate: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format. Use ISO string (e.g., YYYY-MM-DD)" })
        .transform((val) => new Date(val).toISOString()),
    adminCognitoId: z.string().min(1, "Admin ID is required"),
});

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

export const createStockSchema = z.object({
    saleCode: z.string().min(1, "Sale code is required"),
    broker: z.enum(brokerValues, { message: "Invalid broker" }),
    lotNo: z.string().min(1, "Lot number is required"),
    mark: z.string().min(1, "Mark is required"),
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade" }),
    invoiceNo: z.string().min(1, "Invoice number is required").nullable(),
    bags: z.number().int().min(1, "Bags must be at least 1"),
    weight: z.number().min(0, "Weight must be non-negative"),
    purchaseValue: z.number().min(0, "Purchase value must be non-negative"),
    totalPurchaseValue: z.number().min(0, "Total purchase value must be non-negative").optional(),
    agingDays: z.number().int().min(0, "Aging days must be non-negative").optional(),
    penalty: z.number().min(0, "Penalty must be non-negative").optional(),
    bgtCommission: z.number().min(0, "BGT commission must be non-negative").optional(),
    maerskFee: z.number().min(0, "Maersk fee must be non-negative").optional(),
    commission: z.number().min(0, "Commission must be non-negative").optional(),
    netPrice: z.number().min(0, "Net price must be non-negative").optional(),
    total: z.number().min(0, "Total must be non-negative").optional(),
    batchNumber: z.string().min(1, "Batch number cannot be empty").optional(),
    lowStockThreshold: z.number().nonnegative("Low stock threshold cannot be negative").nullable().optional(),
    category: z.enum(teaCategoryValues, { message: "Invalid tea category" }),
    adminCognitoId: z.string().min(1, "Admin ID is required"),
});

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

export const createSellingPriceSchema = z.object({
    lotNo: z.string().min(1, "Lot number is required"),
    sellingMark: z.string().min(1, "Selling mark is required"),
    grade: z.enum(Object.values(TeaGrade) as [string, ...string[]], { message: "Invalid grade" }),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    saleCode: z.string().min(1, "Sale code is required"),
    category: z.enum(Object.values(TeaCategory) as [string, ...string[]], { message: "Invalid category" }),
    broker: z.enum(Object.values(Broker) as [string, ...string[]], { message: "Invalid broker" }),
    bags: z.number().int().min(1, "Bags must be at least 1"),
    netWeight: z.number().min(0, "Net weight must be non-negative"),
    totalWeight: z.number().min(0, "Total weight must be non-negative"),
    askingPrice: z.number().min(0, "Asking price must be non-negative"),
    purchasePrice: z.number().min(0, "Purchase price must be non-negative"),
    producerCountry: z.string().min(1, "Country is required"),
    manufactureDate: z.string().min(1, "Manufacture date is required"),
    reprint: z.number().int().min(0, "Reprint must be non-negative"),
    adminCognitoId: z.string().min(1, "Admin ID is required"),
});

export const createOutlotSchema = z.object({
    auction: z.string().min(1, "Auction is required"),
    lotNo: z.string().min(1, "Lot number is required"),
    broker: z.enum(Object.values(Broker) as [string, ...string[]], { message: "Invalid broker" }),
    sellingMark: z.string().min(1, "Selling mark is required"),
    grade: z.enum(Object.values(TeaGrade) as [string, ...string[]], { message: "Invalid grade" }),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    bags: z.number().int().min(1, "Bags must be at least 1"),
    netWeight: z.number().min(0, "Net weight must be non-negative"),
    totalWeight: z.number().min(0, "Total weight must be non-negative"),
    baselinePrice: z.number().min(0, "Baseline price must be non-negative"),
    manufactureDate: z.string().min(1, "Manufacture date is required"),
    adminCognitoId: z.string().min(1, "Admin ID is required"),
});

// export const adjustStockSchema = z.object({
//     catalogId: z
//         .number({
//             required_error: "SellingPrice ID is required",
//             invalid_type_error: "SellingPrice ID must be a number",
//         })
//         .int()
//         .positive("SellingPrice ID must be a positive integer"),
//     totalWeight: z
//         .number({
//             required_error: "Weight adjustment is required",
//             invalid_type_error: "Weight must be a number",
//         })
//         .nonnegative("Weight adjustment cannot be negative"),
//     reason: z
//         .string({
//             required_error: "Reason is required",
//         })
//         .min(1, "Reason cannot be empty"),
//     adminCognitoId: z
//         .string({
//             required_error: "Admin ID is required",
//         })
//         .min(1, "Admin ID cannot be empty"),
//     shipmentId: z
//         .number({
//             invalid_type_error: "Shipment ID must be a number",
//         })
//         .int()
//         .positive("Shipment ID must be a positive integer")
//         .optional(),
// });
//
// export const updateStockBodySchema = z.object({
//     batchNumber: z
//         .string({
//             invalid_type_error: "Batch number must be a string",
//         })
//         .min(1, "Batch number cannot be empty")
//         .optional(),
//     lowStockThreshold: z
//         .number({
//             invalid_type_error: "Low stock threshold must be a number",
//         })
//         .nonnegative("Low stock threshold cannot be negative")
//         .nullable()
//         .optional(),
// });

export const shipmentSchema = z.object({
    consignee: z.string().min(1, "Consignee is required"),
    vessel: z.nativeEnum(Vessel, {
        required_error: "Vessel is required",
        invalid_type_error: "Invalid vessel selected",
    }),
    shipmark: z.string().min(1, "Shipmark is required"),
    packagingInstructions: z.nativeEnum(PackagingInstructions, {
        required_error: "Packaging instructions are required",
        invalid_type_error: "Invalid packaging instructions",
    }),
    additionalInstructions: z.string().optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
export type ShipmentFormData = z.infer<typeof shipmentSchema>;
export type CatalogFormData = z.infer<typeof createCatalogSchema>;
export type StockFormData = z.infer<typeof createStockSchema>;
export type SellingPriceFormData = z.infer<typeof createSellingPriceSchema>;
export type OutlotFormData = z.infer<typeof createOutlotSchema>;
export type CatalogFormInput = z.input<typeof createCatalogSchema>;