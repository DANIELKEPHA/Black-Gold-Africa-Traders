import express from "express";
import {
    getStock,
    createStock,
    updateStock,
    getStockHistory,
    exportStocksXlsx,
    toggleFavorite,
    deleteStocks,
    assignStock,
    unassignStock,
    adjustStockHandler,
    uploadStocksCsv,
    bulkAssignStocks,
    getUserStockHistory,
} from "../controllers/teaStocksController";
import { authMiddleware } from "../middleware/authMiddleware";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import {
    getStockQuerySchema,
    createStockSchema,
    updateStockParamsSchema,
    updateStockBodySchema,
    getStockHistoryQuerySchema,
    toggleFavoriteSchema,
    assignStockSchema,
    unassignStockSchema,
    csvUploadSchema,
    bulkAssignStockSchema,
    adjustStockSchema,
} from "../schemas/teaStockSchemas";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation middleware for query parameters
const validateQuery = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                details: result.error.errors,
            });
            return;
        }
        req.validatedQuery = result.data;
        next();
    };
};

// Validation middleware for request body
const validateBody = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                message: "Invalid request body",
                details: result.error.errors,
            });
            return;
        }
        req.body = result.data;
        next();
    };
};

// Validation middleware for request params
const validateParams = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            res.status(400).json({
                message: "Invalid request parameters",
                details: result.error.errors,
            });
            return;
        }
        req.params = result.data;
        next();
    };
};

/**
 * @route GET /stocks
 * @desc Retrieve stock records based on query parameters (lotNo, minWeight, batchNumber, etc.)
 * @access Authenticated (Admin or User)
 */
router.get(
    "/",
    authMiddleware(["admin", "user"]),
    validateQuery(getStockQuerySchema),
    asyncHandler(getStock)
);

/**
 * @route POST /stocks
 * @desc Create a new stock record
 * @access Authenticated (Admin only)
 */
router.post(
    "/",
    authMiddleware(["admin"]),
    validateBody(createStockSchema),
    asyncHandler(createStock)
);

/**
 * @route PUT /stocks/:id
 * @desc Update an existing stock record
 * @access Authenticated (Admin only)
 */
router.put(
    "/:id",
    authMiddleware(["admin"]),
    validateParams(updateStockParamsSchema),
    validateBody(updateStockBodySchema),
    asyncHandler(updateStock)
);

/**
 * @route GET /stocks/:id/history
 * @desc Retrieve stock history for a given stock ID
 * @access Authenticated (Admin or User)
 */
router.get(
    "/:id/history",
    authMiddleware(["admin", "user"]),
    validateParams(z.object({ id: z.coerce.number().int().positive() })),
    validateQuery(getStockHistoryQuerySchema),
    asyncHandler(getStockHistory)
);

/**
 * @route POST /stocks/adjust
 * @desc Adjust stock weight
 * @access Authenticated (Admin only)
 */
router.post(
    "/adjust",
    authMiddleware(["admin"]),
    validateBody(adjustStockSchema),
    asyncHandler(adjustStockHandler)
);

/**
 * @route POST /stocks/upload
 * @desc Upload stock records via CSV
 * @access Authenticated (Admin only)
 */
router.post(
    "/upload",
    authMiddleware(["admin"]),
    upload.single("file"),
    validateBody(csvUploadSchema),
    asyncHandler(uploadStocksCsv)
);

/**
 * @route POST /stocks/export-csv
 * @desc Export stock records as CSV based on query parameters (lotNo, onlyFavorites, filters)
 * @access Authenticated (Admin or User)
 */
router.post(
    "/export-xlsx",
    authMiddleware(["admin", "user"]),
    validateQuery(getStockQuerySchema),
    asyncHandler(exportStocksXlsx)
);

/**
 * @route DELETE /stocks
 * @desc Delete multiple stock records by IDs
 * @access Authenticated (Admin only)
 */
router.delete(
    "/",
    authMiddleware(["admin"]),
    validateBody(z.object({ ids: z.array(z.number().int().positive()) })),
    asyncHandler(deleteStocks)
);

/**
 * @route POST /stocks/favorites/toggle
 * @desc Toggle a favorite for a stock (create if not exists, delete if exists)
 * @access Authenticated (Admin or User)
 */
router.post(
    "/favorites/toggle",
    authMiddleware(["admin", "user"]),
    validateBody(toggleFavoriteSchema),
    asyncHandler(toggleFavorite)
);

/**
 * @route POST /stocks/assign
 * @desc Assign stock to a user
 * @access Authenticated (Admin only)
 */
router.post(
    "/assign",
    authMiddleware(["admin"]),
    validateBody(assignStockSchema),
    asyncHandler(assignStock)
);

/**
 * @route POST /stocks/bulk-assign
 * @desc Assign multiple stocks to a user
 * @access Authenticated (Admin only)
 */
router.post(
    "/bulk-assign",
    authMiddleware(["admin"]),
    validateBody(bulkAssignStockSchema),
    asyncHandler(bulkAssignStocks)
);

/**
 * @route POST /stocks/unassign
 * @desc Unassign stock from a user
 * @access Authenticated (Admin only)
 */
router.post(
    "/unassign",
    authMiddleware(["admin"]),
    validateBody(unassignStockSchema),
    asyncHandler(unassignStock)
);

/**
 * @route GET /users/:userCognitoId/stock-history
 * @desc Retrieve stock history for a user
 * @access Authenticated (User or Admin)
 */
router.get(
    "/users/:userCognitoId/stock-history",
    authMiddleware(["admin", "user"]),
    validateParams(z.object({ userCognitoId: z.string().uuid() })),
    validateQuery(z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce.number().int().positive().default(10).optional(),
        search: z.string().default('').optional(),
        sortBy: z.enum(['assignedAt', 'stocksId', 'assignedWeight']).default('assignedAt').optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
    })),
    asyncHandler(getUserStockHistory)
);

export default router;