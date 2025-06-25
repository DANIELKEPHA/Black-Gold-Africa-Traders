// server/src/types/express.d.ts
import { z } from "zod";
import {getStockQuerySchema} from "../schemas/teaStockSchemas";

declare module "express" {
    interface Request {
        validatedQuery?: z.infer<typeof getStockQuerySchema>;
    }
}