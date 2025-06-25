"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleFile = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer to use memory storage (stores file in memory as a Buffer)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel") {
            cb(null, true);
        }
        else {
            cb(null, false); // Reject without an error
        }
    }
});
// Middleware for single file upload with field name "file"
exports.uploadSingleFile = upload.single("file");
