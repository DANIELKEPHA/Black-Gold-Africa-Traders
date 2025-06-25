// Rate limiting middleware
import rateLimit from "express-rate-limit";

export const contactLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute per IP
    message: {
        message: "Rate limit exceeded. Try again later.",
    },
});