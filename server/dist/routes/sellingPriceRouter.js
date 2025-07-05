"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sellingPriceController_1 = require("../controllers/sellingPriceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Get filter options for selling prices
router.get("/filters", (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.getSellingPricesFilterOptions));
// Export selling prices as XLSX (corrected from CSV)
router.post("/export-xlsx", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.exportSellingPricesXlsx));
// Get all selling prices with filters and pagination
router.get("/", (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.getSellingPrices));
// Get a single selling price by ID
router.get("/:id", (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.getSellingPriceById));
// Create a new selling price (corrected from plural)
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.createSellingPrice));
// Upload selling prices via CSV
router.post("/upload", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.single("file"), (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.uploadSellingPricesCsv));
// Delete multiple selling prices
router.delete("/", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.deleteSellingPrices));
// Delete all selling prices (new route)
router.delete("/deleteAll", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(sellingPriceController_1.deleteAllSellingPrices));
exports.default = router;
