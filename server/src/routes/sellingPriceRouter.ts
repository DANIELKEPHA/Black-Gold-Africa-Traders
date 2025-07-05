import express from "express";
import {
    getSellingPrices,
    getSellingPricesFilterOptions,
    createSellingPrice,
    getSellingPriceById,
    deleteSellingPrices,
    uploadSellingPricesCsv,
    exportSellingPricesXlsx, deleteAllSellingPrices,
} from "../controllers/sellingPriceController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get filter options for selling prices
router.get("/filters", asyncHandler(getSellingPricesFilterOptions));

// Export selling prices as XLSX (corrected from CSV)
router.post("/export-xlsx", authMiddleware(["admin", "user"]), asyncHandler(exportSellingPricesXlsx));

// Get all selling prices with filters and pagination
router.get("/", asyncHandler(getSellingPrices));

// Get a single selling price by ID
router.get("/:id", asyncHandler(getSellingPriceById));

// Create a new selling price (corrected from plural)
router.post("/", authMiddleware(["admin"]), asyncHandler(createSellingPrice));

// Upload selling prices via CSV
router.post("/upload", authMiddleware(["admin"]), upload.single("file"), asyncHandler(uploadSellingPricesCsv));

// Delete multiple selling prices
router.delete("/", authMiddleware(["admin"]), asyncHandler(deleteSellingPrices));

// Delete all selling prices (new route)
router.delete("/deleteAll", authMiddleware(["admin"]), asyncHandler(deleteAllSellingPrices));

export default router;