import winston from "winston";

// List of sensitive fields to redact
const sensitiveFields = ["userCognitoId", "email", "phoneNumber", "password", "token"];

// Redact sensitive data from objects
const redactSensitiveData = (data: any): any => {
    if (typeof data !== "object" || data === null) {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(redactSensitiveData);
    }
    const redacted: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.includes(key)) {
            redacted[key] = "[REDACTED]";
        } else if (typeof value === "object") {
            redacted[key] = redactSensitiveData(value);
        } else {
            redacted[key] = value;
        }
    }
    return redacted;
};

// Custom format to include Nairobi timezone
const nairobiTimestamp = winston.format((info) => {
    info.timestamp = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
    return info;
});

// Create Winston logger
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        nairobiTimestamp(),
        winston.format.json(),
        winston.format((info) => {
            // Redact sensitive data in metadata
            if (info.meta) {
                info.meta = redactSensitiveData(info.meta);
            }
            return info;
        })(),
    ),
    transports: [
        new winston.transports.Console(),
        // Optionally add file transport for production
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Log info messages
export const logInfo = (message: string, meta?: any) => {
    logger.info(message, { meta });
};

// Log error messages
export const logError = (message: string, error: any) => {
    logger.error(message, {
        meta: {
            error: error.message || String(error),
            stack: error.stack,
        },
    });
};