import express from "express";
import {
    getAdmin,
    updateAdmin,
    createAdmin, notifyAdmin, // Add new controller
} from "../controllers/adminController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authMiddleware(["admin"]), createAdmin);
router.get("/:id", authMiddleware(["admin"]), getAdmin);
router.post("/notify", authMiddleware(["user"]), notifyAdmin);
router.put("/:id", authMiddleware(["admin"]), updateAdmin);

export default router;