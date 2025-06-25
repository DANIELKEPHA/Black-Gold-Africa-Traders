import { z } from "zod";
import { getStockQuerySchema } from "../schemas/teaStockSchemas";

declare module "express-serve-static-core" {
    interface Request {
        validatedQuery?: z.infer<typeof getStockQuerySchema>;
    }
}