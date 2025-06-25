"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/", (0, authMiddleware_1.authMiddleware)(["admin"]), adminController_1.createAdmin);
router.get("/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), adminController_1.getAdmin);
router.post("/notify", (0, authMiddleware_1.authMiddleware)(["user"]), adminController_1.notifyAdmin);
router.put("/:id", (0, authMiddleware_1.authMiddleware)(["admin"]), adminController_1.updateAdmin);
exports.default = router;
