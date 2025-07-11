"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = require("../middleware/validate");
const zod_1 = require("zod");
const rateLimit_1 = require("../middleware/rateLimit");
const userSchema_1 = require("../schemas/userSchema");
// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const router = express_1.default.Router();
// Zod schema for GET /contact-forms/logged-in query parameters
const loggedInUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => val === undefined || val > 0, {
            message: "Page must be a positive integer",
        }),
        limit: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => val === undefined || (val >= 1 && val <= 100), {
            message: "Limit must be between 1 and 100",
        }),
        search: zod_1.z
            .string()
            .max(100, "Search term must be up to 100 characters")
            .optional(),
        includeShipments: zod_1.z.string().optional().transform((val) => val === "true"),
        includeFilterPresets: zod_1.z.string().optional().transform((val) => val === "true"),
        includeFavoritedCatalogs: zod_1.z.string().optional().transform((val) => val === "true"),
    }),
    body: zod_1.z.object({}).optional(),
    params: zod_1.z.object({}).optional(),
});
const createContactSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").max(100, "Name is too long"),
        email: zod_1.z.string().email("Invalid email address").min(1, "Email is required"),
        subject: zod_1.z.string().max(200, "Subject is too long").optional(),
        message: zod_1.z.string().min(1, "Message is required").max(1000, "Message is too long"),
        privacyConsent: zod_1.z
            .boolean()
            .refine((val) => val, "Privacy policy consent is required"),
        userCognitoId: zod_1.z.string().optional().nullable(),
        // recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
    }),
    query: zod_1.z.object({}).optional(),
    params: zod_1.z.object({}).optional(),
});
// POST /contact - Create a new contact submission (no auth required)
router.post("/", rateLimit_1.contactLimiter, (0, validate_1.validate)(createContactSchema), asyncHandler(userController_1.createContact));
// Routes
router.get("/logged-in", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, validate_1.validate)(loggedInUsersSchema), asyncHandler(userController_1.getLoggedInUsers));
router.get("/:userCognitoId", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), asyncHandler(userController_1.getUserById));
router.post("/register", asyncHandler(userController_1.createUser));
router.put("/:userCognitoId", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), asyncHandler(userController_1.updateUser));
router.get("/:userCognitoId/stock-history", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), asyncHandler(userController_1.getUserStockHistory));
router.get('/', (0, authMiddleware_1.authMiddleware)(['admin']), (0, validate_1.validate)(userSchema_1.getContactsSchema), userController_1.getContacts);
router.delete('/:id', (0, authMiddleware_1.authMiddleware)(['admin']), (0, validate_1.validate)(userSchema_1.deleteContactSchema), userController_1.deleteContact);
exports.default = router;
