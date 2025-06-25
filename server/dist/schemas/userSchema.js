"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStocksQuerySchema = exports.getLoggedInUsersQuerySchema = exports.updateUserBodySchema = exports.updateUserParamsSchema = exports.getUserQuerySchema = exports.getUserParamsSchema = exports.createUserSchema = exports.getUserStockHistoryQuerySchema = exports.createContactSchema = void 0;
const zod_1 = require("zod");
// Enum definitions to match Prisma schema
const teaGradeEnum = zod_1.z.enum([
    "PD",
    "PD2",
    "DUST1",
    "DUST2",
    "PF1",
    "BP1",
    "FNGS",
    "FNGS1",
    "FNGS2",
    "BMF",
    "BMFD",
    "BP",
    "BP2",
    "DUST",
    "PF2",
    "PF",
    "BOP",
    "BOPF",
    "BMF1",
]);
const teaCategoryEnum = zod_1.z.enum(["M1", "M2", "M3", "S1"]);
const brokerEnum = zod_1.z.enum([
    "AMBR",
    "ANJL",
    "ATBL",
    "ATLS",
    "BICL",
    "BTBL",
    "CENT",
    "COMK",
    "CTBL",
    "PRME",
    "PTBL",
    "TBEA",
    "UNTB",
    "VENS",
    "TTBL",
]);
exports.createContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
    subject: zod_1.z.string().max(200, "Subject is too long").optional(),
    message: zod_1.z.string().min(1, "Message is required").max(1000, "Message is too long"),
    privacyConsent: zod_1.z
        .boolean()
        .refine((val) => val === true, "Privacy policy consent is required"),
    userCognitoId: zod_1.z.string().optional().nullable(),
    // recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
});
exports.getUserStockHistoryQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).refine((val) => val > 0, { message: "Page must be greater than 0" }).optional().default("1"),
    limit: zod_1.z.string().transform(Number).refine((val) => val > 0, { message: "Limit must be greater than 0" }).optional().default("10"),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(["assignedAt", "stocksId", "assignedWeight"]).optional().default("assignedAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
});
exports.createUserSchema = zod_1.z.object({
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Invalid email address").optional(),
    phoneNumber: zod_1.z.string().optional(),
    role: zod_1.z.enum(["user", "admin"]).optional().default("user"),
}).strict();
exports.getUserParamsSchema = zod_1.z.object({
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
}).strict();
exports.getUserQuerySchema = zod_1.z.object({
    includeShipments: zod_1.z.coerce.boolean().optional().default(false),
    includeAssignedStocks: zod_1.z.coerce.boolean().optional().default(false),
    includeFavoritedStocks: zod_1.z.coerce.boolean().optional().default(false), // Added
}).strict();
exports.updateUserParamsSchema = zod_1.z.object({
    userCognitoId: zod_1.z.string().min(1, "User Cognito ID is required"),
}).strict();
exports.updateUserBodySchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Invalid email address").optional(),
    phoneNumber: zod_1.z.string().optional(),
    role: zod_1.z.enum(["user", "admin"]).optional(),
}).strict();
exports.getLoggedInUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().optional().default(20),
    search: zod_1.z.string().optional(),
    includeShipments: zod_1.z.coerce.boolean().optional().default(false),
    includeFavoritedStocks: zod_1.z.coerce.boolean().optional().default(false),
    includeAssignedStocks: zod_1.z.coerce.boolean().optional().default(false),
}).strict();
exports.getStocksQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().optional().default(20),
    search: zod_1.z.string().optional(),
    lotNo: zod_1.z.string().optional(),
}).strict();
