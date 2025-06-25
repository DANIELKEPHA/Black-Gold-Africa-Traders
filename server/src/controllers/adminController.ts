import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createAdminSchema, updateAdminSchema, adminCognitoIdSchema } from "../schemas/adminSchemas";
import { ErrorResponse, UserDetails } from "../types";
import { authenticateUser } from "../utils/controllerUtils";

const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});

// Utility Functions
const logWithTimestamp = (message: string, data?: any) => {
    console.log(
        `[${new Date().toLocaleString("en-GB", {
            timeZone: "Africa/Nairobi",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        })}] ${message}`,
        data ? JSON.stringify(data, null, 2) : "",
    );
};

const checkAuth = (user: UserDetails | undefined): ErrorResponse | null => {
    if (!user) {
        return { message: "Unauthorized: No user authenticated" };
    }
    if (user.role.toLowerCase() !== "admin") {
        return { message: "Forbidden: Admin role required" };
    }
    return null;
};

// Controllers
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        logWithTimestamp("createAdmin: Received request", { body: req.body });

        const parsed = createAdminSchema.safeParse(req.body);
        if (!parsed.success) {
            logWithTimestamp("createAdmin: Validation failed", { errors: parsed.error.errors });
            res.status(400).json({ message: "Invalid admin data", details: parsed.error.errors });
            return;
        }
        const { adminCognitoId, name, email, phoneNumber } = parsed.data;

        logWithTimestamp(`createAdmin: Creating admin with adminCognitoId: ${adminCognitoId}`);

        const authError = checkAuth(req.user as UserDetails);
        if (authError) {
            logWithTimestamp("createAdmin: Authentication failed", { error: authError });
            res.status(authError.message.includes("Unauthorized") ? 401 : 403).json(authError);
            return;
        }

        const admin = await prisma.$transaction(async (tx) => {
            const conditions: Prisma.AdminWhereInput[] = [];
            if (adminCognitoId) conditions.push({ adminCognitoId });
            if (email) conditions.push({ email });

            const existingAdmin = await tx.admin.findFirst({
                where: {
                    OR: conditions.length > 0 ? conditions : undefined,
                },
            });

            if (existingAdmin) {
                throw new Error("Admin with this Cognito ID or email already exists");
            }

            const data: Prisma.AdminCreateInput = {
                adminCognitoId,
                ...(name ? { name } : {}),
                ...(email ? { email } : {}),
                ...(phoneNumber ? { phoneNumber } : {}),
            };

            return tx.admin.create({
                data,
                select: {
                    id: true,
                    adminCognitoId: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                },
            });
        });

        logWithTimestamp("createAdmin: Created admin", { admin });
        res.status(201).json({ data: admin });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp("createAdmin: Error occurred", { error: message, stack: error instanceof Error ? error.stack : null });
        if (
            message.includes("already exists") ||
            (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
        ) {
            res.status(409).json({ message: "Admin with this Cognito ID or email already exists" });
            return;
        }
        res.status(500).json({ message: `Error creating admin: ${message}` });
    } finally {
        await prisma.$disconnect();
        logWithTimestamp("createAdmin: Prisma disconnected");
    }
};

export const getAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        logWithTimestamp("getAdmin: Received request", { params: req.params });

        const parsedId = adminCognitoIdSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            logWithTimestamp("getAdmin: Validation failed", { errors: parsedId.error.errors });
            res.status(400).json({ message: "Invalid adminCognitoId", details: parsedId.error.errors });
            return;
        }
        const adminCognitoId = parsedId.data;

        logWithTimestamp(`getAdmin: Fetching admin with adminCognitoId: ${adminCognitoId}`);

        const authError = checkAuth(req.user as UserDetails);
        if (authError) {
            logWithTimestamp("getAdmin: Authentication failed", { error: authError });
            res.status(authError.message.includes("Unauthorized") ? 401 : 403).json(authError);
            return;
        }

        const admin = await prisma.admin.findUnique({
            where: { adminCognitoId },
            select: {
                id: true,
                adminCognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });

        if (!admin) {
            logWithTimestamp(`getAdmin: Admin not found for adminCognitoId: ${adminCognitoId}`);
            res.status(404).json({ message: "Admin not found" });
            return;
        }

        logWithTimestamp("getAdmin: Admin retrieved", { admin });
        res.status(200).json({ data: admin });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp("getAdmin: Error occurred", { error: message, stack: error instanceof Error ? error.stack : null });
        res.status(500).json({ message: `Error retrieving admin: ${message}` });
    } finally {
        await prisma.$disconnect();
        logWithTimestamp("getAdmin: Prisma disconnected");
    }
};

export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        logWithTimestamp("updateAdmin: Received request", { params: req.params, body: req.body });

        const parsedId = adminCognitoIdSchema.safeParse(req.params.id);
        if (!parsedId.success) {
            logWithTimestamp("updateAdmin: Validation failed for adminCognitoId", { errors: parsedId.error.errors });
            res.status(400).json({ message: "Invalid adminCognitoId", details: parsedId.error.errors });
            return;
        }
        const adminCognitoId = parsedId.data;

        const parsed = updateAdminSchema.safeParse(req.body);
        if (!parsed.success) {
            logWithTimestamp("updateAdmin: Validation failed for body", { errors: parsed.error.errors });
            res.status(400).json({ message: "Invalid admin data", details: parsed.error.errors });
            return;
        }
        const data = parsed.data;

        logWithTimestamp(`updateAdmin: Updating admin with adminCognitoId: ${adminCognitoId}`);

        const authError = checkAuth(req.user as UserDetails);
        if (authError) {
            logWithTimestamp("updateAdmin: Authentication failed", { error: authError });
            res.status(authError.message.includes("Unauthorized") ? 401 : 403).json(authError);
            return;
        }

        const admin = await prisma.admin.findUnique({
            where: { adminCognitoId },
        });
        if (!admin) {
            logWithTimestamp(`updateAdmin: Admin not found for adminCognitoId: ${adminCognitoId}`);
            res.status(404).json({ message: "Admin not found" });
            return;
        }

        if (data.email && data.email !== admin.email) {
            const existingAdmin = await prisma.admin.findFirst({
                where: { email: data.email, adminCognitoId: { not: adminCognitoId } },
            });
            if (existingAdmin) {
                logWithTimestamp("updateAdmin: Email conflict", { email: data.email });
                res.status(409).json({ message: "Email already in use by another admin" });
                return;
            }
        }

        const updatedAdmin = await prisma.admin.update({
            where: { adminCognitoId },
            data: {
                name: data.name ?? undefined,
                email: data.email ?? undefined,
                phoneNumber: data.phoneNumber ?? undefined,
            },
            select: {
                id: true,
                adminCognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
            },
        });

        logWithTimestamp("updateAdmin: Updated admin", { updatedAdmin });
        res.status(200).json({ data: updatedAdmin });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp("updateAdmin: Error occurred", { error: message, stack: error instanceof Error ? error.stack : null });
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                res.status(409).json({ message: "Email already in use" });
                return;
            }
            if (error.code === "P2025") {
                res.status(404).json({ message: "Admin not found" });
                return;
            }
        }
        res.status(500).json({ message: `Error updating admin: ${message}` });
    } finally {
        await prisma.$disconnect();
        logWithTimestamp("updateAdmin: Prisma disconnected");
    }
};

export const notifyAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        logWithTimestamp("notifyAdmin: Received request", { body: req.body });

        const authenticatedUser = authenticateUser(req, res) as UserDetails | undefined;
        if (!authenticatedUser) {
            logWithTimestamp("notifyAdmin: Authentication failed");
            res.status(401).json({ message: "Unauthorized: No valid token provided" });
            return;
        }

        const notificationSchema = z.object({
            shipmentId: z.number().int().positive("Shipment ID must be a positive integer"),
            consignee: z.string().min(1, "Consignee is required"),
            vessel: z.enum(["first", "second", "third", "fourth"], { message: "Invalid vessel" }),
            shipmark: z.string().min(1, "Shipmark is required"),
            packagingInstructions: z.enum(["oneJutetwoPolly", "oneJuteOnePolly"], {
                message: "Invalid packaging instructions",
            }),
            additionalInstructions: z.string().optional().nullable(),
            items: z.array(
                z.object({
                    stocksId: z.number().int().positive().optional(),
                    lotNo: z.string().min(1, "Lot number is required"),
                    invoiceNo: z.string().min(1, "Invoice number is required"),
                    bags: z.number().int().nonnegative("Bags must be non-negative"),
                    netWeight: z.number().nonnegative("Tare weight must be non-negative"),
                    totalWeight: z.number().positive("Total weight must be positive"),
                })
            ).min(1, "At least one item is required"),
        }).strict();

        const parsed = notificationSchema.safeParse(req.body);
        if (!parsed.success) {
            logWithTimestamp("notifyAdmin: Validation failed", { errors: parsed.error.errors });
            res.status(400).json({ message: "Invalid notification data", details: parsed.error.errors });
            return;
        }

        const { shipmentId, consignee, vessel, shipmark, packagingInstructions, additionalInstructions, items } = parsed.data;

        logWithTimestamp(`notifyAdmin: Creating notification for shipment ${shipmentId}`);

        // Dynamically select the admin to notify (e.g., the authenticated admin or a specific admin)
        const targetAdminCognitoId = authenticatedUser.role.toLowerCase() === "admin"
            ? authenticatedUser.userId
            : "04e8d4b8-90e1-704e-4ea4-746a81eedcd0"; // Fallback to a default admin ID

        const admin = await prisma.admin.findUnique({
            where: { adminCognitoId: targetAdminCognitoId },
            select: { adminCognitoId: true },
        });
        if (!admin) {
            logWithTimestamp(`notifyAdmin: Admin not found for adminCognitoId: ${targetAdminCognitoId}`);
            res.status(404).json({ message: `Admin with Cognito ID ${targetAdminCognitoId} not found` });
            return;
        }

        await prisma.adminNotification.create({
            data: {
                adminCognitoId: targetAdminCognitoId,
                message: `New shipment created: ${shipmark} by ${authenticatedUser.userId}`,
                details: {
                    shipmentId,
                    consignee,
                    vessel,
                    shipmark,
                    packagingInstructions,
                    additionalInstructions,
                    items: items.map((item) => ({
                        stocksId: item.stocksId,
                        lotNo: item.lotNo,
                        invoiceNo: item.invoiceNo,
                        bags: item.bags,
                        netWeight: item.totalWeight,
                        totalWeight: item.totalWeight,
                    })),
                },
                createdAt: new Date(),
            },
        });

        logWithTimestamp(`notifyAdmin: Notification sent for shipment ${shipmentId}`);
        res.status(200).json({ message: "Admin notified successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logWithTimestamp("notifyAdmin: Error occurred", { error: message, stack: error instanceof Error ? error.stack : null });
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Invalid notification data", details: error.errors });
            return;
        }
        res.status(500).json({ message: `Error sending admin notification: ${message}` });
    } finally {
        await prisma.$disconnect();
        logWithTimestamp("notifyAdmin: Prisma disconnected");
    }
};