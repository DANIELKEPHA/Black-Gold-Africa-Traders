import { PrismaClient, TeaCategory, TeaGrade, Broker, SalePeriod, ShipmentStatus, Vessel, PackagingInstructions } from "@prisma/client";
import * as fs from "fs/promises";
import * as path from "path";

const prisma = new PrismaClient();

interface SeedFunction {
    (data?: any[]): Promise<void>;
}

const seedFiles: Record<string, SeedFunction> = {
    admin: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for Admin seeding");
            return;
        }
        await prisma.admin.createMany({
            data: data.map(item => ({
                adminCognitoId: item.adminCognitoId,
                name: item.name,
                email: item.email,
                phoneNumber: item.phoneNumber,
            })),
            skipDuplicates: true,
        });
        console.log("Seeded Admin");
    },
    user: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for User seeding");
            return;
        }
        for (const item of data) {
            const { id, favoritedCatalogs, ...record } = item;
            await prisma.user.create({
                data: {
                    ...record,
                    userCognitoId: record.userCognitoId, // Changed from cognitoId
                    role: record.role || "user",
                    favoritedCatalogs: favoritedCatalogs ? { connect: favoritedCatalogs.connect || [] } : { connect: [] },
                },
            });
            console.log(`Created User with userCognitoId: ${record.userCognitoId}`);
        }
        console.log("Seeded User");
    },
    gradeCategoryMapping: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for GradeCategoryMapping seeding");
            return;
        }
        await prisma.gradeCategoryMapping.createMany({
            data: data,
            skipDuplicates: true,
        });
        console.log("Seeded GradeCategoryMapping");
    },
    catalog: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for OutLots seeding");
            return;
        }
        const validCategories = Object.values(TeaCategory);
        const validGrades = Object.values(TeaGrade);
        const validBrokers = Object.values(Broker);
        const validSales = Object.values(SalePeriod);

        for (const item of data) {
            const { id, ...record } = item;

            if (
                !record.lotNo ||
                !record.adminCognitoId || // Changed from adminId
                !record.category ||
                !record.grade ||
                !record.broker ||
                !record.sale
            ) {
                console.warn(`Skipping Catalog with missing required fields:`, item);
                continue;
            }

            if (!validCategories.includes(record.category)) {
                console.warn(`Skipping Catalog with invalid category ${record.category}:`, item);
                continue;
            }

            if (!validGrades.includes(record.grade)) {
                console.warn(`Skipping Catalog with invalid grade ${record.grade}:`, item);
                continue;
            }
            const mapping = await prisma.gradeCategoryMapping.findUnique({
                where: { grade: record.grade },
            });
            if (!mapping || mapping.category !== record.category) {
                console.warn(
                    `Skipping Catalog with invalid grade-category pair (${record.grade}, ${record.category}):`,
                    item
                );
                continue;
            }

            if (!validBrokers.includes(record.broker)) {
                console.warn(`Skipping Catalog with invalid broker ${record.broker}:`, item);
                continue;
            }
            if (!validSales.includes(record.sale)) {
                console.warn(`Skipping Catalog with invalid sale ${record.sale}:`, item);
                continue;
            }
            if (record.manufactureDate) {
                record.manufactureDate = new Date(record.manufactureDate);
                if (isNaN(record.manufactureDate.getTime())) {
                    console.warn(`Skipping Catalog with invalid manufactureDate:`, item);
                    continue;
                }
            }
            if (typeof record.bags !== "number" || record.bags < 0) {
                console.warn(`Skipping Catalog with invalid bags:`, item);
                continue;
            }
            if (typeof record.totalWeight !== "number" || record.totalWeight < 0) {
                console.warn(`Skipping Catalog with invalid totalWeight:`, item);
                continue;
            }
            if (typeof record.askingPrice !== "number" || record.askingPrice < 0) {
                console.warn(`Skipping Catalog with invalid askingPrice:`, item);
                continue;
            }

            const admin = await prisma.admin.findUnique({
                where: { adminCognitoId: record.adminCognitoId },
            });
            if (!admin) {
                console.warn(`Skipping Catalog with adminCognitoId ${record.adminCognitoId}: Admin not found`);
                continue;
            }

            await prisma.catalog.create({
                data: {
                    ...record,
                    adminCognitoId: record.adminCognitoId,
                    category: record.category as TeaCategory,
                    grade: record.grade as TeaGrade,
                    broker: record.broker as Broker,
                    sale: record.sale as SalePeriod,
                    reprint: record.reprint ? Number(record.reprint) : 0,
                    isShared: !!record.isShared,
                    year: record.year ? Number(record.year) : new Date().getFullYear(),
                    tareWeight: record.tareWeight ? Number(record.tareWeight) : 0,
                    version: record.version ? Number(record.version) : 0,
                },
            });
            console.log(`Created Catalog with lotNo: ${record.lotNo}`);
        }
        console.log("Seeded OutLots");
    },
    stock: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for Stock seeding");
            return;
        }
        for (const item of data) {
            const { id, ...record } = item;

            if (!record.catalogId || !record.quantity || !record.batchNumber || !record.warehouse) {
                console.warn(`Skipping Stock with missing required fields:`, item);
                continue;
            }

            const catalog = await prisma.catalog.findUnique({
                where: { id: record.catalogId },
            });
            if (!catalog) {
                console.warn(`Skipping Stock with catalogId ${record.catalogId}: Catalog not found`);
                continue;
            }

            const existingStock = await prisma.stock.findFirst({
                where: { catalogId: record.catalogId },
            });
            if (existingStock) {
                console.warn(`Skipping Stock for catalogId ${record.catalogId}: Stock already exists`);
                continue;
            }

            if (!/^[A-Z0-9-]+$/.test(record.batchNumber)) {
                console.warn(`Skipping Stock with invalid batchNumber ${record.batchNumber}:`, item);
                continue;
            }

            if (typeof record.quantity !== "number" || record.quantity < 0) {
                console.warn(`Skipping Stock with invalid quantity:`, item);
                continue;
            }
            if (record.lowStockThreshold && (typeof record.lowStockThreshold !== "number" || record.lowStockThreshold < 0)) {
                console.warn(`Skipping Stock with invalid lowStockThreshold:`, item);
                continue;
            }

            await prisma.stock.create({
                data: {
                    catalogId: record.catalogId,
                    quantity: record.quantity,
                    batchNumber: record.batchNumber,
                    warehouse: record.warehouse,
                    lowStockThreshold: record.lowStockThreshold ?? 100.0,
                    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
                    lastUpdated: record.lastUpdated ? new Date(record.lastUpdated) : new Date(),
                    version: record.version ? Number(record.version) : 0,
                },
            });
            console.log(`Created Stock for catalogId: ${record.catalogId}, batchNumber: ${record.batchNumber}`);
        }
        console.log("Seeded Stock");
    },
    shipment: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for Shipment seeding");
            return;
        }
        for (const item of data) {
            const { id, client, catalog, ...record } = item;
            const userCognitoId = client?.connect?.userCognitoId; // Changed from cognitoId
            const catalogId = catalog?.connect?.id;

            if (!userCognitoId || !catalogId) {
                console.warn(`Skipping Shipment with missing userCognitoId or catalogId:`, item);
                continue;
            }
            if (record.shipmentDate) record.shipmentDate = new Date(record.shipmentDate);
            const user = await prisma.user.findUnique({
                where: { userCognitoId: userCognitoId },
            });
            if (!user) {
                console.warn(`Skipping Shipment with userCognitoId ${userCognitoId}: User not found`);
                continue;
            }
            const catalogRecord = await prisma.catalog.findUnique({
                where: { id: catalogId },
            });
            if (!catalogRecord) {
                console.warn(`Skipping Shipment with catalogId ${catalogId}: Catalog not found`);
                continue;
            }
            if (!Object.values(ShipmentStatus).includes(record.status)) {
                console.warn(`Skipping Shipment with invalid status ${record.status}`);
                continue;
            }
            if (!Object.values(Vessel).includes(record.vessel)) {
                console.warn(`Skipping Shipment with invalid vessel ${record.vessel}`);
                continue;
            }
            if (!Object.values(PackagingInstructions).includes(record.packagingInstructions)) {
                console.warn(`Skipping Shipment with invalid packagingInstructions ${record.packagingInstructions}`);
                continue;
            }
            const stock = await prisma.stock.findFirst({
                where: { catalogId },
            });
            if (!stock) {
                console.warn(`Skipping Shipment with catalogId ${catalogId}: Stock not found`);
                continue;
            }
            if (stock.quantity < record.quantity) {
                console.warn(`Skipping Shipment with catalogId ${catalogId}: Insufficient stock (${stock.quantity} < ${record.quantity})`);
                continue;
            }
            await prisma.shipment.create({
                data: {
                    ...record,
                    userCognitoId, // Changed from clientCognitoId
                    catalogId,
                },
            });
            console.log(`Created Shipment for userCognitoId: ${userCognitoId}`);
        }
        console.log("Seeded Shipment");
    },
    stockHistory: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for StockHistory seeding");
            return;
        }
        for (const item of data) {
            const { id, stock, admin, shipment, ...record } = item;
            const stockId = stock?.connect?.catalogId;
            const adminCognitoId = admin?.connect?.adminCognitoId; // Changed from cognitoId
            const shipmentId = shipment?.connect?.id;

            if (!stockId || !record.quantity || !record.reason || !adminCognitoId) {
                console.warn(`Skipping StockHistory with missing required fields:`, item);
                continue;
            }

            const stockRecord = await prisma.stock.findFirst({
                where: { catalogId: stockId },
            });
            if (!stockRecord) {
                console.warn(`Skipping StockHistory with catalogId ${stockId}: Stock not found`);
                continue;
            }

            const adminRecord = await prisma.admin.findUnique({
                where: { adminCognitoId: adminCognitoId },
            });
            if (!adminRecord) {
                console.warn(`Skipping StockHistory with adminCognitoId ${adminCognitoId}: Admin not found`);
                continue;
            }

            if (shipmentId) {
                const shipmentRecord = await prisma.shipment.findUnique({
                    where: { id: shipmentId },
                });
                if (!shipmentRecord) {
                    console.warn(`Skipping StockHistory with shipmentId ${shipmentId}: Shipment not found`);
                    continue;
                }
            }

            await prisma.stockHistory.create({
                data: {
                    stockId: stockRecord.id,
                    quantity: record.quantity,
                    reason: record.reason,
                    updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
                    adminCognitoId, // Changed from userId
                    shipmentId,
                },
            });
            console.log(`Created StockHistory for stockId: ${stockId}`);
        }
        console.log("Seeded StockHistory");
    },
    favorite: async (data?: any[]) => {
        if (!data) {
            console.warn("No data provided for Favorite seeding");
            return;
        }
        for (const item of data) {
            const { id, user, catalog, ...record } = item;
            const userCognitoId = user?.connect?.userCognitoId;
            const catalogId = catalog?.connect?.id;

            if (!userCognitoId || !catalogId) {
                console.warn(`Skipping Favorite with missing userCognitoId or catalogId:`, item);
                continue;
            }

            const userRecord = await prisma.user.findUnique({
                where: { userCognitoId: userCognitoId },
            });
            if (!userRecord) {
                console.warn(`Skipping Favorite with userCognitoId ${userCognitoId}: User not found`);
                continue;
            }

            const catalogRecord = await prisma.catalog.findUnique({
                where: { id: catalogId },
            });
            if (!catalogRecord) {
                console.warn(`Skipping Favorite with catalogId ${catalogId}: Catalog not found`);
                continue;
            }

            await prisma.favorite.create({
                data: {
                    userCognitoId,
                    catalogId,
                    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
                },
            });
            console.log(`Created Favorite for userCognitoId: ${userCognitoId}, catalogId: ${catalogId}`);
        }
        console.log("Seeded Favorite");
    },
};

async function main() {
    const seedDataDir = path.join(__dirname, "seedData");

    const seedOrder = [
        "admin",
        "user",
        "gradeCategoryMapping",
        "catalog",
        "stock",
        "shipment",
        "stockHistory",
        "favorite",
    ];

    for (const model of seedOrder) {
        console.log(`Seeding ${model}...`);
        try {
            const filePath = path.join(seedDataDir, `${model}.json`);
            const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
            const seedFn = seedFiles[model];
            await seedFn(data);
        } catch (error) {
            console.error(`Error seeding ${model}:`, error);
            throw error;
        }
    }
}

main()
    .catch((e) => {
        console.error("Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Disconnected from database");
    });