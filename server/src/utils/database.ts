import { PrismaClient, Prisma } from '@prisma/client';

export async function retryTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries = 3,
    client: PrismaClient = new PrismaClient(),
    providedTx?: Prisma.TransactionClient
): Promise<T> {
    if (providedTx) {
        return await operation(providedTx);
    }

    let lastError: Error | unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await client.$transaction(operation); // Removed invalid timeout option
        } catch (error) {
            lastError = error;
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2034') {
                    console.warn(
                        `[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Transaction conflict on attempt ${attempt}, retrying...`
                    );
                    await new Promise((res) => setTimeout(res, 100 * attempt));
                    continue;
                } else if (error.code === 'P2002') {
                    console.error('Unique constraint violation, aborting retries:', error.meta);
                    throw error;
                }
            }
            throw error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error(`Transaction failed after ${maxRetries} attempts: ${String(lastError)}`);
}