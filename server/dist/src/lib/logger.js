"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logInfo = void 0;
const winston_1 = __importDefault(require("winston"));
// List of sensitive fields to redact
const sensitiveFields = ["userCognitoId", "email", "phoneNumber", "password", "token"];
// Redact sensitive data from objects
const redactSensitiveData = (data) => {
    if (typeof data !== "object" || data === null) {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(redactSensitiveData);
    }
    const redacted = {};
    for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.includes(key)) {
            redacted[key] = "[REDACTED]";
        }
        else if (typeof value === "object") {
            redacted[key] = redactSensitiveData(value);
        }
        else {
            redacted[key] = value;
        }
    }
    return redacted;
};
// Custom format to include Nairobi timezone
const nairobiTimestamp = winston_1.default.format((info) => {
    info.timestamp = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
    return info;
});
// Create Winston logger
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(nairobiTimestamp(), winston_1.default.format.json(), winston_1.default.format((info) => {
        // Redact sensitive data in metadata
        if (info.meta) {
            info.meta = redactSensitiveData(info.meta);
        }
        return info;
    })()),
    transports: [
        new winston_1.default.transports.Console(),
        // Optionally add file transport for production
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// Log info messages
const logInfo = (message, meta) => {
    logger.info(message, { meta });
};
exports.logInfo = logInfo;
// Log error messages
const logError = (message, error) => {
    logger.error(message, {
        meta: {
            error: error.message || String(error),
            stack: error.stack,
        },
    });
};
exports.logError = logError;
