"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const catalogController_1 = require("../controllers/catalogController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Get all catalogs with filters and pagination
router.get("/", (0, asyncHandler_1.asyncHandler)(catalogController_1.getCatalogs));
// Get filter options for catalogs
router.get("/filters", (0, asyncHandler_1.asyncHandler)(catalogController_1.getCatalogFilterOptions));
// Create a new catalog
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(catalogController_1.createCatalog));
// Get a single catalog by ID
router.get("/:id", (0, asyncHandler_1.asyncHandler)(catalogController_1.getCatalogById));
// Delete multiple catalogs
router.delete("/bulk", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(catalogController_1.deleteCatalogs));
// Upload catalogs via CSV
router.post("/upload", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.single("file"), (0, asyncHandler_1.asyncHandler)(catalogController_1.uploadCatalogsCsv));
// Export multiple catalogs as CSV
router.post("/export", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(catalogController_1.exportCatalogsCsv));
exports.default = router;
