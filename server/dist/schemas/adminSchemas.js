"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSchema = exports.createAdminSchema = exports.adminCognitoIdSchema = void 0;
const zod_1 = require("zod");
exports.adminCognitoIdSchema = zod_1.z.string().min(1, "Admin Cognito ID is required");
exports.createAdminSchema = zod_1.z.object({
    adminCognitoId: exports.adminCognitoIdSchema,
    name: zod_1.z.string().min(1, "Name must be non-empty").nullable().optional(),
    email: zod_1.z.string().email("Invalid email format").nullable().optional(),
    phoneNumber: zod_1.z.string().min(1, "Phone number must be non-empty").nullable().optional(),
}).strict();
exports.updateAdminSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name must be non-empty").nullable().optional(),
    email: zod_1.z.string().email("Invalid email format").nullable().optional(),
    phoneNumber: zod_1.z.string().min(1, "Phone number must be non-empty").nullable().optional(),
}).strict().refine((data) => Object.keys(data).some((key) => data[key] !== undefined), { message: "At least one field must be provided for update" });
