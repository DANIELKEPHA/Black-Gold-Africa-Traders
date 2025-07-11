"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teaStocksController_1 = require("../controllers/teaStocksController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const zod_1 = require("zod");
const teaStockSchemas_1 = require("../schemas/teaStockSchemas");
const multer_1 = __importDefault(require("multer"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Validation middleware for query parameters
const validateQuery = (schema) => {
    return (req, res, next) => {
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
const validateBody = (schema) => {
    return (req, res, next) => {
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
const validateParams = (schema) => {
    return (req, res, next) => {
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
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), validateQuery(teaStockSchemas_1.getStockQuerySchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.getStocks));
/**
 * @route POST /stocks
 * @desc Create a new stock record
 * @access Authenticated (Admin only)
 */
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), validateBody(teaStockSchemas_1.createStockSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.createStock));
/**
 * @route PUT /stocks/:id
 * @desc Update an existing stock record
 * @access Authenticated (Admin only)
 */
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), validateParams(teaStockSchemas_1.updateStockParamsSchema), validateBody(teaStockSchemas_1.updateStockBodySchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.updateStock));
/**
 * @route GET /stocks/:id/history
 * @desc Retrieve stock history for a given stock ID
 * @access Authenticated (Admin or User)
 */
router.get("/:id/history", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), validateParams(zod_1.z.object({ id: zod_1.z.coerce.number().int().positive() })), validateQuery(teaStockSchemas_1.getStockHistoryQuerySchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.getStockHistory));
/**
 * @route POST /stocks/adjust
 * @desc Adjust stock weight
 * @access Authenticated (Admin only)
 */
router.post("/adjust", (0, authMiddleware_1.authMiddleware)(["admin"]), validateBody(teaStockSchemas_1.adjustStockSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.adjustStockHandler));
/**
 * @route POST /stocks/upload
 * @desc Upload stock records via CSV
 * @access Authenticated (Admin only)
 */
router.post("/upload", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.single("file"), validateBody(teaStockSchemas_1.csvUploadSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.uploadStocksCsv));
/**
 * @route POST /stocks/export-csv
 * @desc Export stock records as CSV based on query parameters (lotNo, onlyFavorites, filters)
 * @access Authenticated (Admin or User)
 */
router.post("/export-xlsx", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), validateQuery(teaStockSchemas_1.getStockQuerySchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.exportStocksXlsx));
/**
 * @route DELETE /stocks
 * @desc Delete multiple stock records by IDs
 * @access Authenticated (Admin only)
 */
router.delete("/", (0, authMiddleware_1.authMiddleware)(["admin"]), validateBody(zod_1.z.object({ ids: zod_1.z.array(zod_1.z.number().int().positive()) })), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.deleteStocks));
/**
 * @route POST /stocks/favorites/toggle
 * @desc Toggle a favorite for a stock (create if not exists, delete if exists)
 * @access Authenticated (Admin or User)
 */
router.post("/toggle-favorite", // ✅ Match the client expectation
(0, authMiddleware_1.authMiddleware)(["admin", "user"]), validateBody(teaStockSchemas_1.toggleFavoriteSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.toggleFavorite));
/**
 * @route POST /stocks/assign
 * @desc Assign stock to a user
 * @access Authenticated (Admin only)
 */
router.post("/assign", (0, authMiddleware_1.authMiddleware)(["admin"]), validateBody(teaStockSchemas_1.assignStockSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.assignStock));
/**
 * @route POST /stocks/bulk-assign
 * @desc Assign multiple stocks to a user
 * @access Authenticated (Admin only)
 */
router.post("/bulk-assign", (0, authMiddleware_1.authMiddleware)(["admin"]), validateBody(teaStockSchemas_1.bulkAssignStockSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.bulkAssignStocks));
/**
 * @route POST /stocks/unassign
 * @desc Unassign stock from a user
 * @access Authenticated (Admin only)
 */
router.post("/unassign", (0, authMiddleware_1.authMiddleware)(["admin"]), validateBody(teaStockSchemas_1.unassignStockSchema), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.unassignStock));
/**
 * @route GET /contact-forms/:userCognitoId/stock-history
 * @desc Retrieve stock history for a user
 * @access Authenticated (User or Admin)
 */
router.get("/users/:userCognitoId/stock-history", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), validateParams(zod_1.z.object({ userCognitoId: zod_1.z.string().uuid() })), validateQuery(zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().default(10).optional(),
    search: zod_1.z.string().default('').optional(),
    sortBy: zod_1.z.enum(['assignedAt', 'stocksId', 'assignedWeight']).default('assignedAt').optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc').optional(),
})), (0, asyncHandler_1.asyncHandler)(teaStocksController_1.getUserStockHistory));
exports.default = router;
