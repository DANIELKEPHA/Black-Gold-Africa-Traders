"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
// Get all reports with filters and pagination
router.get("/", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(reportController_1.getReports));
// Get filter options for reports
router.get("/filters", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(reportController_1.getReportFilterOptions));
// Create a new report
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(reportController_1.createReport));
// Get a single report by ID
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(reportController_1.getReportById));
// Delete multiple reports
router.delete("/bulk", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(reportController_1.deleteReports));
// Export reports as XLSX
router.post("/export/xlsx", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(reportController_1.exportReportsXlsx));
// Generate presigned URL for S3 upload
router.post("/upload-presigned-url", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(reportController_1.generatePresignedUrl));
router.post("/download-presigned-url", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(reportController_1.generateDownloadPresignedUrl));
exports.default = router;
