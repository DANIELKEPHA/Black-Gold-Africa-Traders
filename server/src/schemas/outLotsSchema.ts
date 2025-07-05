import { z } from "zod";
import { Broker, TeaGrade } from "@prisma/client";
import {dateFormat} from "./catalogSchemas";

const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];
const brokerValues = Object.values(Broker) as [string, ...string[]];

export const createOutLotSchema = z.object({
    auction: z.string().min(1, "Auction is required"),
    lotNo: z.string().min(1, "Lot number is required"),
    grade: z.enum([...teaGradeValues, "any"] as const).optional(),
    broker: z.enum([...brokerValues, "any"] as const).optional(),
    sellingMark: z.string().min(1, "Selling mark is required"),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    bags: z.number().int().min(0, "Bags must be a non-negative integer"),
    netWeight: z.number().min(0, "Net weight must be non-negative"),
    totalWeight: z.number().min(0, "Total weight must be non-negative"),
    baselinePrice: z.number().min(0, "Baseline price must be non-negative"),
    manufactureDate: dateFormat.optional(),
    adminCognitoId: z.string().min(1, "Admin Cognito ID is required"),
});

export const csvRecordSchema = z.object({
    auction: z.string().min(1, "Auction is required"),
    broker: z.enum(brokerValues, { message: "Invalid broker value" }),
    sellingMark: z.string().min(1, "Selling mark is required"),
    lotNo: z.string().min(1, "Lot number is required"),
    bags: z.number().int().positive("Bags must be a positive integer"),
    netWeight: z.number().positive("Net weight must be positive"),
    totalWeight: z.number().positive("Total weight must be positive"),
    invoiceNo: z.string().min(1, "Invoice number is required"),
    adminCognitoId: z.string().uuid("Admin Cognito ID must be a valid UUID"),
    baselinePrice: z.coerce.number().min(0).optional(),
    manufactureDate: dateFormat.optional(),
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade" }),
}).strict();

export const querySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(0).max(10000).optional().default(100), // Changed max from 1000 to 10000
    auction: z.string().optional(),
    lotNo: z.string().optional(),
    sellingMark: z.string().optional(),
    grade: z.enum([...teaGradeValues, "any"] as const).optional(),
    broker: z.enum([...brokerValues, "any"] as const).optional(),
    invoiceNo: z.string().optional(),
    bags: z.coerce.number().int().min(0).optional(),
    netWeight: z.coerce.number().min(0).optional(),
    totalWeight: z.coerce.number().min(0).optional(),
    baselinePrice: z.coerce.number().min(0).optional(),
    manufactureDate: dateFormat.optional(),
    search: z.string().optional(),
    ids: z.array(z.number().int()).optional(),
});