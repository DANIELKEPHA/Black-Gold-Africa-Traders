import express from "express";
import {
    getCatalogs,
    getCatalogFilterOptions,
    createCatalog,
    getCatalogById,
    deleteCatalogs,
    uploadCatalogsCsv,
    exportCatalogsXlsx, deleteAllCatalogs,
} from "../controllers/catalogController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all catalogs with filters and pagination
router.get("/", asyncHandler(getCatalogs));

// Get filter options for catalogs
router.get("/filters", asyncHandler(getCatalogFilterOptions));

// Create a new catalog
router.post("/", authMiddleware(["admin"]), asyncHandler(createCatalog));

// Get a single catalog by ID
router.get("/:id", asyncHandler(getCatalogById));

// Delete multiple catalogs
router.delete("/bulk", authMiddleware(["admin"]), asyncHandler(deleteCatalogs));

router.delete("/bulk/delete-all", authMiddleware(["admin"]), asyncHandler(deleteAllCatalogs));

// Upload catalogs via CSV
router.post("/upload", authMiddleware(["admin"]), upload.single("file"), asyncHandler(uploadCatalogsCsv));

// Export multiple catalogs as CSV
router.post("/export/xlsx", authMiddleware(["admin", "user"]), asyncHandler(exportCatalogsXlsx));

export default router;