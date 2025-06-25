import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

// Configure multer to use memory storage (stores file in memory as a Buffer)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel") {
            cb(null, true);
        } else {
            cb(null, false); // Reject without an error
        }
    }

});

// Middleware for single file upload with field name "file"
export const uploadSingleFile = upload.single("file");