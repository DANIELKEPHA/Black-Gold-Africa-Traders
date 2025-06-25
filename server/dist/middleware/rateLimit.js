"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactLimiter = void 0;
// Rate limiting middleware
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.contactLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute per IP
    message: {
        message: "Rate limit exceeded. Try again later.",
    },
});
