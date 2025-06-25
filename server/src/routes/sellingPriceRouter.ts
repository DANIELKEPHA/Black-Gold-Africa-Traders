import express from "express";
import {
    getSellingPrices,
    getSellingPricesFilterOptions,
    createSellingPrices,
    getSellingPricesById,
    deleteSellingPrices,
    uploadSellingPricesCsv,
    exportSellingPricesCsv,
} from "../controllers/sellingPriceController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get filter options for selling prices
router.get("/filters", asyncHandler(getSellingPricesFilterOptions));

// Export selling prices as CSV
router.post("/export-csv", authMiddleware(["admin", "user"]), asyncHandler(exportSellingPricesCsv));

// Get all selling prices with filters and pagination
router.get("/", asyncHandler(getSellingPrices));

// Get a single selling price by ID
router.get("/:id", asyncHandler(getSellingPricesById));

// Create a new selling price
router.post("/", authMiddleware(["admin"]), asyncHandler(createSellingPrices));

// Upload selling prices via CSV
router.post("/upload", authMiddleware(["admin"]), upload.single("file"), asyncHandler(uploadSellingPricesCsv));

// Delete multiple selling prices
router.delete("/", authMiddleware(["admin"]), asyncHandler(deleteSellingPrices));

export default router;