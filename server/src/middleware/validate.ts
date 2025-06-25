import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
    (schema: ZodSchema<any>) =>
        (req: Request, res: Response, next: NextFunction): void => {
            const result = schema.safeParse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (!result.success) {
                res.status(400).json({
                    status: "fail",
                    message: result.error.errors.map((e) => e.message).join(", "),
                });
                return; // ✅ Early return, but still returns void
            }

            next();
        };
