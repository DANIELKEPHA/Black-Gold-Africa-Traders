import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

// Extend Express Request interface to include requestId
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    req.requestId = req.header("X-Request-ID") || uuidv4();
    res.setHeader("X-Request-ID", req.requestId);
    next();
};