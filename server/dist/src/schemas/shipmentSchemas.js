"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeShipmentParamsSchema = exports.updateShipmentBodySchema = exports.updateShipmentParamsSchema = exports.getShipmentsQuerySchema = exports.createFavoritesShipmentSchema = exports.updateShipmentStatusSchema = exports.createShipmentSchema = exports.cognitoIdSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.cognitoIdSchema = zod_1.z
    .string()
    .regex(/^([a-z]+-[a-z0-9-]+:)?[0-9a-f-]{36}$/, "Invalid Cognito ID format");
exports.createShipmentSchema = zod_1.z
    .object({
    items: zod_1.z
        .array(zod_1.z.object({
        stocksId: zod_1.z.number().int().positive("stocksId must be a positive integer"),
        totalWeight: zod_1.z.number().positive("Total weight must be a positive number"),
    }))
        .min(1, "At least one stock item is required"),
    shipmentDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .default(() => new Date().toISOString())
        .transform((val) => new Date(val)),
    status: zod_1.z
        .enum([
        client_1.ShipmentStatus.Pending,
        client_1.ShipmentStatus.Approved,
        client_1.ShipmentStatus.Shipped,
        client_1.ShipmentStatus.Delivered,
        client_1.ShipmentStatus.Cancelled,
    ])
        .default(client_1.ShipmentStatus.Pending),
    consignee: zod_1.z.string().min(1, "Consignee is required"),
    vessel: zod_1.z.enum([client_1.Vessel.first, client_1.Vessel.second, client_1.Vessel.third, client_1.Vessel.fourth]),
    shipmark: zod_1.z.string().min(1, "Shipmark is required"),
    packagingInstructions: zod_1.z.enum([
        client_1.PackagingInstructions.oneJutetwoPolly,
        client_1.PackagingInstructions.oneJuteOnePolly,
    ]),
    additionalInstructions: zod_1.z.string().optional(),
    userCognitoId: exports.cognitoIdSchema,
})
    .strict();
exports.updateShipmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled']),
});
exports.createFavoritesShipmentSchema = zod_1.z
    .object({
    items: zod_1.z
        .array(zod_1.z.object({
        stocksId: zod_1.z.number().int().positive("stocksId must be a positive integer"),
        totalWeight: zod_1.z.number().positive("Total weight must be a positive number"),
    }))
        .min(1, "At least one stock item is required"),
    shipmentDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .default(() => new Date().toISOString())
        .transform((val) => new Date(val)),
    status: zod_1.z
        .enum([
        client_1.ShipmentStatus.Pending,
        client_1.ShipmentStatus.Approved,
        client_1.ShipmentStatus.Shipped,
        client_1.ShipmentStatus.Delivered,
        client_1.ShipmentStatus.Cancelled,
    ])
        .default(client_1.ShipmentStatus.Pending),
    consignee: zod_1.z.string().min(1, "Consignee is required"),
    vessel: zod_1.z.enum([client_1.Vessel.first, client_1.Vessel.second, client_1.Vessel.third, client_1.Vessel.fourth]),
    shipmark: zod_1.z.string().min(1, "Shipmark is required"),
    packagingInstructions: zod_1.z.enum([
        client_1.PackagingInstructions.oneJutetwoPolly,
        client_1.PackagingInstructions.oneJuteOnePolly,
    ]),
    additionalInstructions: zod_1.z.string().optional(),
    userCognitoId: exports.cognitoIdSchema,
})
    .strict();
exports.getShipmentsQuerySchema = zod_1.z
    .object({
    stocksId: zod_1.z.coerce.number().int().positive().optional(),
    status: zod_1.z
        .enum([
        client_1.ShipmentStatus.Pending,
        client_1.ShipmentStatus.Approved,
        client_1.ShipmentStatus.Shipped,
        client_1.ShipmentStatus.Delivered,
        client_1.ShipmentStatus.Cancelled,
    ])
        .optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(20),
    search: zod_1.z.string().optional(),
})
    .strict();
exports.updateShipmentParamsSchema = zod_1.z
    .object({
    id: zod_1.z.coerce.number().int().positive("Invalid shipment ID"),
})
    .strict();
exports.updateShipmentBodySchema = zod_1.z
    .object({
    status: zod_1.z
        .enum([
        client_1.ShipmentStatus.Pending,
        client_1.ShipmentStatus.Approved,
        client_1.ShipmentStatus.Shipped,
        client_1.ShipmentStatus.Delivered,
        client_1.ShipmentStatus.Cancelled,
    ])
        .optional(),
    packagingInstructions: zod_1.z
        .enum([client_1.PackagingInstructions.oneJutetwoPolly, client_1.PackagingInstructions.oneJuteOnePolly])
        .optional(),
    additionalInstructions: zod_1.z.string().optional(),
    consignee: zod_1.z.string().min(1, "Consignee is required").optional(),
    vessel: zod_1.z.enum([client_1.Vessel.first, client_1.Vessel.second, client_1.Vessel.third, client_1.Vessel.fourth]).optional(),
    shipmark: zod_1.z.string().min(1, "Shipmark is required").optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        stocksId: zod_1.z.number().int().positive("stocksId must be a positive integer"),
        totalWeight: zod_1.z.number().positive("Total weight must be a positive number"),
    }))
        .optional(),
})
    .strict();
exports.removeShipmentParamsSchema = zod_1.z
    .object({
    id: zod_1.z.coerce.number().int().positive("Invalid shipment ID"),
})
    .strict();
