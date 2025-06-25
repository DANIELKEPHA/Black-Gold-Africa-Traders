import { z } from "zod";

export const adminCognitoIdSchema = z.string().min(1, "Admin Cognito ID is required");

export const createAdminSchema = z.object({
    adminCognitoId: adminCognitoIdSchema,
    name: z.string().min(1, "Name must be non-empty").nullable().optional(),
    email: z.string().email("Invalid email format").nullable().optional(),
    phoneNumber: z.string().min(1, "Phone number must be non-empty").nullable().optional(),
}).strict();

export const updateAdminSchema = z.object({
    name: z.string().min(1, "Name must be non-empty").nullable().optional(),
    email: z.string().email("Invalid email format").nullable().optional(),
    phoneNumber: z.string().min(1, "Phone number must be non-empty").nullable().optional(),
}).strict().refine(
    (data) => Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined),
    { message: "At least one field must be provided for update" },
);

