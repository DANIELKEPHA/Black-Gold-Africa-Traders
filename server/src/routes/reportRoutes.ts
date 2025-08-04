import express from "express";
import {
    getReports,
    getReportFilterOptions,
    createReport,
    getReportById,
    deleteReports,
    exportReportsXlsx,
    generatePresignedUrl, generateDownloadPresignedUrl,
} from "../controllers/reportController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

// Get all reports with filters and pagination
router.get("/", authMiddleware(["admin", "user"]), asyncHandler(getReports));

// Get filter options for reports
router.get("/filters", authMiddleware(["admin", "user"]), asyncHandler(getReportFilterOptions));

// Create a new report
router.post("/", authMiddleware(["admin"]), asyncHandler(createReport));

// Get a single report by ID
router.get("/:id", authMiddleware(["admin", "user"]), asyncHandler(getReportById));

// Delete multiple reports
router.delete("/bulk", authMiddleware(["admin"]), asyncHandler(deleteReports));

// Export reports as XLSX
router.post("/export/xlsx", authMiddleware(["admin", "user"]), asyncHandler(exportReportsXlsx));

// Generate presigned URL for S3 upload
router.post("/upload-presigned-url", authMiddleware(["admin", "user"]), asyncHandler(generatePresignedUrl));

router.post("/download-presigned-url", authMiddleware(["admin", "user"]), asyncHandler(generateDownloadPresignedUrl));

export default router;