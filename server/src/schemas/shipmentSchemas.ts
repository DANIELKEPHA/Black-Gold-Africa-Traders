import { z } from "zod";
import { PackagingInstructions, ShipmentStatus, Vessel } from "@prisma/client";

export const cognitoIdSchema = z
    .string()
    .regex(/^([a-z]+-[a-z0-9-]+:)?[0-9a-f-]{36}$/, "Invalid Cognito ID format");

export const createShipmentSchema = z
    .object({
        items: z
            .array(
                z.object({
                    stocksId: z.number().int().positive("stocksId must be a positive integer"),
                    totalWeight: z.number().positive("Total weight must be a positive number"),
                }),
            )
            .min(1, "At least one stock item is required"),
        shipmentDate: z
            .string()
            .datetime()
            .optional()
            .default(() => new Date().toISOString())
            .transform((val) => new Date(val)),
        status: z
            .enum([
                ShipmentStatus.Pending,
                ShipmentStatus.Approved,
                ShipmentStatus.Shipped,
                ShipmentStatus.Delivered,
                ShipmentStatus.Cancelled,
            ])
            .default(ShipmentStatus.Pending),
        consignee: z.string().min(1, "Consignee is required"),
        vessel: z.enum([Vessel.first, Vessel.second, Vessel.third, Vessel.fourth]),
        shipmark: z.string().min(1, "Shipmark is required"),
        packagingInstructions: z.enum([
            PackagingInstructions.oneJutetwoPolly,
            PackagingInstructions.oneJuteOnePolly,
        ]),
        additionalInstructions: z.string().optional(),
        userCognitoId: cognitoIdSchema,
    })
    .strict();

export const updateShipmentStatusSchema = z.object({
    status: z.enum(['Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled']),
});

export const createFavoritesShipmentSchema = z
    .object({
        items: z
            .array(
                z.object({
                    stocksId: z.number().int().positive("stocksId must be a positive integer"),
                    totalWeight: z.number().positive("Total weight must be a positive number"),
                }),
            )
            .min(1, "At least one stock item is required"),
        shipmentDate: z
            .string()
            .datetime()
            .optional()
            .default(() => new Date().toISOString())
            .transform((val) => new Date(val)),
        status: z
            .enum([
                ShipmentStatus.Pending,
                ShipmentStatus.Approved,
                ShipmentStatus.Shipped,
                ShipmentStatus.Delivered,
                ShipmentStatus.Cancelled,
            ])
            .default(ShipmentStatus.Pending),
        consignee: z.string().min(1, "Consignee is required"),
        vessel: z.enum([Vessel.first, Vessel.second, Vessel.third, Vessel.fourth]),
        shipmark: z.string().min(1, "Shipmark is required"),
        packagingInstructions: z.enum([
            PackagingInstructions.oneJutetwoPolly,
            PackagingInstructions.oneJuteOnePolly,
        ]),
        additionalInstructions: z.string().optional(),
        userCognitoId: cognitoIdSchema,
    })
    .strict();

export const getShipmentsQuerySchema = z
    .object({
        stocksId: z.coerce.number().int().positive().optional(),
        status: z
            .enum([
                ShipmentStatus.Pending,
                ShipmentStatus.Approved,
                ShipmentStatus.Shipped,
                ShipmentStatus.Delivered,
                ShipmentStatus.Cancelled,
            ])
            .optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().default(20),
        search: z.string().optional(),
    })
    .strict();

export const updateShipmentParamsSchema = z
    .object({
        id: z.coerce.number().int().positive("Invalid shipment ID"),
    })
    .strict();

export const updateShipmentBodySchema = z
    .object({
        status: z
            .enum([
                ShipmentStatus.Pending,
                ShipmentStatus.Approved,
                ShipmentStatus.Shipped,
                ShipmentStatus.Delivered,
                ShipmentStatus.Cancelled,
            ])
            .optional(),
        packagingInstructions: z
            .enum([PackagingInstructions.oneJutetwoPolly, PackagingInstructions.oneJuteOnePolly])
            .optional(),
        additionalInstructions: z.string().optional(),
        consignee: z.string().min(1, "Consignee is required").optional(),
        vessel: z.enum([Vessel.first, Vessel.second, Vessel.third, Vessel.fourth]).optional(),
        shipmark: z.string().min(1, "Shipmark is required").optional(),
        items: z
            .array(
                z.object({
                    stocksId: z.number().int().positive("stocksId must be a positive integer"),
                    totalWeight: z.number().positive("Total weight must be a positive number"),
                }),
            )
            .optional(),
    })
    .strict();

export const removeShipmentParamsSchema = z
    .object({
        id: z.coerce.number().int().positive("Invalid shipment ID"),
    })
    .strict();