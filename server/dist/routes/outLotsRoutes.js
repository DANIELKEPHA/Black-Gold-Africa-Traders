"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const outLotsContoller_1 = require("../controllers/outLotsContoller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
// Configure multer with file size limit and type validation
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only CSV files are allowed"));
        }
    },
});
// Get filter options for outLots
router.get("/filters", (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.getOutLotsFilterOptions));
// Export outLots as CSV
router.post("/export-csv", (0, authMiddleware_1.authMiddleware)(["admin", "user"]), (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.exportOutLotsCsv));
// Get all outLots with filters and pagination
router.get("/", (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.getOutLots));
// Get a single outlot by ID
router.get("/:id", (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.getOutLotById));
// Create a new outlot
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.createOutLot));
// Upload outLots via CSV
router.post("/upload", (0, authMiddleware_1.authMiddleware)(["admin"]), upload.single("file"), (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.uploadOutLotsCsv));
// Delete multiple outLots
router.delete("/", (0, authMiddleware_1.authMiddleware)(["admin"]), (0, asyncHandler_1.asyncHandler)(outLotsContoller_1.deleteOutLots));
exports.default = router;
