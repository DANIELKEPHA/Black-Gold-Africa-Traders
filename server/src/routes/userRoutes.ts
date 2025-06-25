import express from "express";
import {
    getUserById,
    createUser,
    updateUser,
    getLoggedInUsers,
    getUserStockHistory,
    createContact,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { contactLimiter } from "../middleware/rateLimit";

// Async handler wrapper
const asyncHandler =
    (fn: Function) =>
        (req: express.Request, res: express.Response, next: express.NextFunction) =>
            Promise.resolve(fn(req, res, next)).catch(next);

const router = express.Router();

// Zod schema for GET /users/logged-in query parameters
const loggedInUsersSchema = z.object({
    query: z.object({
        page: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => val === undefined || val > 0, {
                message: "Page must be a positive integer",
            }),
        limit: z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => val === undefined || (val >= 1 && val <= 100), {
                message: "Limit must be between 1 and 100",
            }),
        search: z
            .string()
            .max(100, "Search term must be up to 100 characters")
            .optional(),
        includeShipments: z.string().optional().transform((val) => val === "true"),
        includeFilterPresets: z.string().optional().transform((val) => val === "true"),
        includeFavoritedCatalogs: z.string().optional().transform((val) => val === "true"),
    }),
    body: z.object({}).optional(),
    params: z.object({}).optional(),
});

const createContactSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").max(100, "Name is too long"),
        email: z.string().email("Invalid email address").min(1, "Email is required"),
        subject: z.string().max(200, "Subject is too long").optional(),
        message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
        privacyConsent: z
            .boolean()
            .refine((val) => val, "Privacy policy consent is required"),
        userCognitoId: z.string().optional().nullable(),
        // recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});

// POST /contact - Create a new contact submission (no auth required)
router.post(
    "/",
    contactLimiter,
    validate(createContactSchema),
    asyncHandler(createContact)
);

// Routes
router.get(
    "/logged-in",
    authMiddleware(["admin"]),
    validate(loggedInUsersSchema),
    asyncHandler(getLoggedInUsers),
);

router.get(
    "/:userCognitoId",
    authMiddleware(["admin", "user"]),
    asyncHandler(getUserById),
);

router.post(
    "/register",
    asyncHandler(createUser),
);

router.put(
    "/:userCognitoId",
    authMiddleware(["admin", "user"]),
    asyncHandler(updateUser),
);

router.get(
    "/:userCognitoId/stock-history",
    authMiddleware(["admin", "user"]),
    asyncHandler(getUserStockHistory),
);

export default router;