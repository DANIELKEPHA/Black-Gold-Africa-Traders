"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryTransaction = retryTransaction;
const client_1 = require("@prisma/client");
function retryTransaction(operation_1) {
    return __awaiter(this, arguments, void 0, function* (operation, maxRetries = 3, client = new client_1.PrismaClient(), providedTx) {
        if (providedTx) {
            return yield operation(providedTx);
        }
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return yield client.$transaction(operation); // Removed invalid timeout option
            }
            catch (error) {
                lastError = error;
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2034') {
                        console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Transaction conflict on attempt ${attempt}, retrying...`);
                        yield new Promise((res) => setTimeout(res, 100 * attempt));
                        continue;
                    }
                    else if (error.code === 'P2002') {
                        console.error('Unique constraint violation, aborting retries:', error.meta);
                        throw error;
                    }
                }
                throw error;
            }
        }
        throw lastError instanceof Error ? lastError : new Error(`Transaction failed after ${maxRetries} attempts: ${String(lastError)}`);
    });
}
