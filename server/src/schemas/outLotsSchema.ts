import { z } from "zod";
import { Broker, TeaGrade } from "@prisma/client";

const teaGradeValues = Object.values(TeaGrade) as [string, ...string[]];
const brokerValues = Object.values(Broker) as [string, ...string[]];

// Custom validator for YYYY/MM/DD format (accepts single-digit month/day)
const dateFormat = z
    .string()
    .regex(
        /^\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])$/,
        "Invalid date format (YYYY/MM/DD)"
    )
    .transform((val) => {
        // Split the date and ensure leading zeros for month and day
        const [year, month, day] = val.split("/").map(Number);
        const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        console.log(`[Schema] Transforming date: ${val} to ${formattedDate}`);

        // Validate the date is valid
        const date = new Date(formattedDate);
        if (isNaN(date.getTime())) {
            console.error(`[Schema] Invalid date: ${formattedDate}`);
            throw new Error("Invalid date");
        }

        // Return in YYYY/MM/DD format for consistency
        return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
    });

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
    manufactureDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
        message: "Invalid manufacture date",
    }),
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
    manufactureDate: dateFormat,
    grade: z.enum(teaGradeValues, { message: "Invalid tea grade" }),
}).strict();

export const querySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(0).max(1000).optional().default(100),
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
    manufactureDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
        message: "Invalid manufacture date",
    }).optional(),
    search: z.string().optional(),
    ids: z.array(z.number().int()).optional(),
});