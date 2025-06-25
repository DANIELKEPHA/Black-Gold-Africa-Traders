import { z } from "zod";

// Enum definitions to match Prisma schema
const teaGradeEnum = z.enum([
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

const teaCategoryEnum = z.enum(["M1", "M2", "M3", "S1"]);

const brokerEnum = z.enum([
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

export const createContactSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().email("Invalid email address").min(1, "Email is required"),
    subject: z.string().max(200, "Subject is too long").optional(),
    message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
    privacyConsent: z
        .boolean()
        .refine((val) => val === true, "Privacy policy consent is required"),
    userCognitoId: z.string().optional().nullable(),
    // recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
})

export const getUserStockHistoryQuerySchema = z.object({
    page: z.string().transform(Number).refine((val) => val > 0, { message: "Page must be greater than 0" }).optional().default("1"),
    limit: z.string().transform(Number).refine((val) => val > 0, { message: "Limit must be greater than 0" }).optional().default("10"),
    search: z.string().optional(),
    sortBy: z.enum(["assignedAt", "stocksId", "assignedWeight"]).optional().default("assignedAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createUserSchema = z.object({
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
    name: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    phoneNumber: z.string().optional(),
    role: z.enum(["user", "admin"]).optional().default("user"),
}).strict();

export const getUserParamsSchema = z.object({
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
}).strict();

export const getUserQuerySchema = z.object({
    includeShipments: z.coerce.boolean().optional().default(false),
    includeAssignedStocks: z.coerce.boolean().optional().default(false),
    includeFavoritedStocks: z.coerce.boolean().optional().default(false), // Added
}).strict();

export const updateUserParamsSchema = z.object({
    userCognitoId: z.string().min(1, "User Cognito ID is required"),
}).strict();

export const updateUserBodySchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    phoneNumber: z.string().optional(),
    role: z.enum(["user", "admin"]).optional(),
}).strict();

export const getLoggedInUsersQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(20),
    search: z.string().optional(),
    includeShipments: z.coerce.boolean().optional().default(false),
    includeFavoritedStocks: z.coerce.boolean().optional().default(false),
    includeAssignedStocks: z.coerce.boolean().optional().default(false),
}).strict();

export const getStocksQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(20),
    search: z.string().optional(),
    lotNo: z.string().optional(),
}).strict();