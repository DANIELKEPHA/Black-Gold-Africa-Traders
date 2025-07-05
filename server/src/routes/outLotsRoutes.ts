import express from "express";
import {
    getOutLots,
    getOutLotsFilterOptions,
    createOutLot,
    getOutLotById,
    deleteOutLots,
    uploadOutLotsCsv, exportOutLotsXlsx,
} from "../controllers/outLotsContoller";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

// Configure multer with file size limit and type validation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
            cb(null, true);
        } else {
            cb(new Error("Only CSV files are allowed"));
        }
    },
});

// Get filter options for outLots
router.get("/filters", asyncHandler(getOutLotsFilterOptions));

// Export outLots as CSV
router.post("/export-xlsx", authMiddleware(["admin", "user"]), asyncHandler(exportOutLotsXlsx));

// Get all outLots with filters and pagination
router.get("/", asyncHandler(getOutLots));

// Get a single outlot by ID
router.get("/:id", asyncHandler(getOutLotById));

// Create a new outlot
router.post("/", authMiddleware(["admin"]), asyncHandler(createOutLot));

// Upload outLots via CSV
router.post("/upload", authMiddleware(["admin"]), upload.single("file"), asyncHandler(uploadOutLotsCsv));

// Delete multiple outLots
router.delete("/", authMiddleware(["admin"]), asyncHandler(deleteOutLots));

export default router;