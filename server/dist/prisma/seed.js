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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
let seededTables = [];
const tableNameMap = {
    StockHistory: 'stock_history',
    ShipmentHistory: 'shipment_history',
    SellingPrice: 'selling_price',
    OutLots: 'out_lots',
    Report: 'report',
};
function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.$queryRaw `SELECT 1`;
            console.log('Database connection successful');
        }
        catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    });
}
function deleteAllData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tables = yield prisma.$queryRaw `
            SELECT tablename FROM pg_tables WHERE schemaname = 'public';
        `;
            const tableNames = tables.map((row) => row.tablename);
            const modelOrder = [
                'adminNotification',
                'shipmentHistory',
                'stockHistory',
                'shipmentItem',
                'stockAssignment',
                'favorite',
                'contact',
                'report',
                'shipment',
                'sellingPrice',
                'outLots',
                'stocks',
                'catalog',
                'user',
                'admin',
            ];
            const modelToTable = modelOrder.reduce((acc, model) => {
                const tableName = tableNameMap[model] || toCamelCase(model);
                if (tableNames.includes(tableName)) {
                    acc[model] = tableName;
                }
                return acc;
            }, {});
            const deletionOrder = [
                ...Object.values(modelToTable),
                ...tableNames.filter((table) => !Object.values(modelToTable).includes(table)),
            ];
            yield prisma.$executeRaw `SET CONSTRAINTS ALL DEFERRED;`;
            for (const tableName of deletionOrder) {
                try {
                    yield prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
                    console.log(`Cleared table ${tableName}`);
                }
                catch (error) {
                    if (error instanceof Error) {
                        console.warn(`Error clearing table ${tableName}: ${error.message}`);
                    }
                    else {
                        console.warn(`Error clearing table ${tableName}: ${String(error)}`);
                    }
                }
            }
            yield prisma.$executeRaw `SET CONSTRAINTS ALL IMMEDIATE;`;
        }
        catch (error) {
            console.error('Error during data deletion:', error);
            throw error;
        }
    });
}
function adjustStock(lotNo, weightChange, reason, adminCognitoId, shipmentId, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Adjusting stock for lotNo ${lotNo}: weightChange=${weightChange}, reason=${reason}, adminCognitoId=${adminCognitoId}`);
        try {
            const stock = yield tx.stocks.findUnique({
                where: { lotNo },
                select: { id: true, weight: true },
            });
            if (!stock) {
                throw new Error(`Stocks with lotNo ${lotNo} not found`);
            }
            const newWeight = stock.weight + weightChange;
            if (newWeight < 0) {
                console.warn(`Skipping stock adjustment for lotNo ${lotNo}: would result in negative weight`);
                return;
            }
            yield tx.stocks.update({
                where: { id: stock.id },
                data: { weight: newWeight, updatedAt: new Date() },
            });
            const existingHistory = yield tx.stockHistory.findFirst({
                where: { stocksId: stock.id, action: reason, timestamp: { gte: new Date(Date.now() - 1000) } },
            });
            if (!existingHistory) {
                yield tx.stockHistory.create({
                    data: {
                        stocksId: stock.id,
                        action: reason,
                        timestamp: new Date(),
                        adminCognitoId,
                        shipmentId,
                    },
                });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to adjust stock for lotNo ${lotNo}: ${message}`);
        }
    });
}
const seedStats = {};
function seedTable(model, modelName, jsonData, fileName, tx) {
    return __awaiter(this, void 0, void 0, function* () {
        seedStats[modelName] = { success: 0, skipped: 0, errors: [] };
        const validTeaCategories = ['M1', 'M2', 'M3', 'S1'];
        const validTeaGrades = [
            'PD', 'PD2', 'DUST', 'DUST1', 'DUST2', 'PF', 'PF1', 'BP', 'BP1', 'FNGS1',
            'BOP', 'BOPF', 'FNGS', 'FNGS2', 'BMF', 'BMFD', 'PF2', 'BMF1',
        ];
        const validBrokers = [
            'AMBR', 'ANJL', 'ATBL', 'ATLS', 'BICL', 'BTBL', 'CENT', 'COMK', 'CTBL',
            'PRME', 'PTBL', 'TBEA', 'UNTB', 'VENS', 'TTBL', 'ABBL',
        ];
        const validStatuses = ['Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled'];
        const validVessels = ['first', 'second', 'third', 'fourth'];
        const validPackaging = ['oneJutetwoPolly', 'oneJuteOnePolly'];
        const validReprints = ['1', '2', '3', '4', '5', '6', '7', 'No', null];
        const validFileTypes = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'];
        try {
            if (modelName === 'Admin') {
                const emails = jsonData.map(item => item.email).filter(email => email);
                const uniqueEmails = new Set(emails);
                if (emails.length !== uniqueEmails.size) {
                    throw new Error('Duplicate emails found in admin.json');
                }
            }
            for (const item of jsonData) {
                try {
                    if (modelName === 'Admin') {
                        yield tx.admin.upsert({
                            where: { adminCognitoId: item.adminCognitoId },
                            update: { name: item.name, email: item.email, phoneNumber: item.phoneNumber || null },
                            create: {
                                adminCognitoId: item.adminCognitoId,
                                name: item.name,
                                email: item.email,
                                phoneNumber: item.phoneNumber || null,
                            },
                        });
                    }
                    else if (modelName === 'User') {
                        const { id } = item, userData = __rest(item, ["id"]);
                        yield model.create({
                            data: Object.assign(Object.assign({}, userData), { createdAt: new Date(item.createdAt || Date.now()), updatedAt: new Date(item.updatedAt || Date.now()) }),
                        });
                    }
                    else if (modelName === 'Catalog') {
                        if (!item.lotNo)
                            throw new Error('Missing lotNo');
                        if (!validTeaCategories.includes(item.category))
                            throw new Error(`Invalid category '${item.category}'`);
                        if (!validTeaGrades.includes(item.grade))
                            throw new Error(`Invalid grade '${item.grade}'`);
                        if (!validBrokers.includes(item.broker))
                            throw new Error(`Invalid broker '${item.broker}'`);
                        if (item.bags <= 0 || item.netWeight <= 0)
                            throw new Error('Zero or negative bags/netWeight');
                        if (item.reprint !== null && !validReprints.includes(item.reprint)) {
                            throw new Error(`Invalid reprint value '${item.reprint}'. Must be '1', '2', 'No', or null`);
                        }
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const existingCatalog = yield tx.catalog.findUnique({ where: { lotNo: item.lotNo } });
                        if (existingCatalog)
                            throw new Error(`Duplicate lotNo ${item.lotNo}`);
                        const { adminCognitoId, userCognitoId } = item, catalogData = __rest(item, ["adminCognitoId", "userCognitoId"]);
                        yield model.create({
                            data: Object.assign(Object.assign({}, catalogData), { reprint: item.reprint, manufactureDate: new Date(item.manufactureDate), createdAt: new Date(item.createdAt || Date.now()), updatedAt: new Date(item.updatedAt || Date.now()), admin: { connect: { adminCognitoId: item.adminCognitoId } } }),
                        });
                    }
                    else if (modelName === 'SellingPrice') {
                        if (!item.lotNo)
                            throw new Error('Missing lotNo');
                        if (!validTeaCategories.includes(item.category))
                            throw new Error(`Invalid category '${item.category}'`);
                        if (!validTeaGrades.includes(item.grade))
                            throw new Error(`Invalid grade '${item.grade}'`);
                        if (!validBrokers.includes(item.broker))
                            throw new Error(`Invalid broker '${item.broker}'`);
                        if (item.reprint !== null && !validReprints.includes(item.reprint)) {
                            throw new Error(`Invalid reprint value '${item.reprint}'. Must be '1', '2', 'No', or null`);
                        }
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const existingPrice = yield tx.sellingPrice.findUnique({ where: { lotNo: item.lotNo } });
                        if (existingPrice)
                            throw new Error(`Duplicate lotNo ${item.lotNo}`);
                        const { adminCognitoId, userCognitoId } = item, sellingPriceData = __rest(item, ["adminCognitoId", "userCognitoId"]);
                        yield model.create({
                            data: Object.assign(Object.assign({}, sellingPriceData), { reprint: item.reprint, manufactureDate: new Date(item.manufactureDate), createdAt: new Date(item.createdAt || Date.now()), updatedAt: new Date(item.updatedAt || Date.now()), admin: { connect: { adminCognitoId: item.adminCognitoId } } }),
                        });
                    }
                    else if (modelName === 'OutLots') {
                        if (!item.lotNo)
                            throw new Error('Missing lotNo');
                        if (!validTeaGrades.includes(item.grade))
                            throw new Error(`Invalid grade '${item.grade}'`);
                        if (!validBrokers.includes(item.broker))
                            throw new Error(`Invalid broker '${item.broker}'`);
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const existingOutLot = yield tx.outLots.findUnique({ where: { lotNo: item.lotNo } });
                        if (existingOutLot)
                            throw new Error(`Duplicate lotNo ${item.lotNo}`);
                        const { adminCognitoId, userCognitoId } = item, outLotsData = __rest(item, ["adminCognitoId", "userCognitoId"]);
                        yield model.create({
                            data: Object.assign(Object.assign({}, outLotsData), { manufactureDate: new Date(item.manufactureDate), createdAt: new Date(item.createdAt || Date.now()), updatedAt: new Date(item.updatedAt || Date.now()), admin: { connect: { adminCognitoId: item.adminCognitoId } } }),
                        });
                    }
                    else if (modelName === 'Stocks') {
                        if (!item.lotNo)
                            throw new Error('Missing lotNo');
                        if (!validTeaGrades.includes(item.grade))
                            throw new Error(`Invalid grade '${item.grade}'`);
                        if (!validBrokers.includes(item.broker))
                            throw new Error(`Invalid broker '${item.broker}'`);
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const existingStock = yield tx.stocks.findUnique({ where: { lotNo: item.lotNo } });
                        if (existingStock)
                            throw new Error(`Duplicate lotNo ${item.lotNo}`);
                        const { adminCognitoId } = item, stocksData = __rest(item, ["adminCognitoId"]);
                        yield model.create({
                            data: Object.assign(Object.assign({}, stocksData), { createdAt: new Date(item.createdAt || Date.now()), updatedAt: new Date(item.updatedAt || Date.now()), admin: { connect: { adminCognitoId: item.adminCognitoId } } }),
                        });
                    }
                    else if (modelName === 'StockAssignment') {
                        const stockRecord = yield tx.stocks.findUnique({
                            where: { lotNo: item.lotNo },
                            select: { id: true, weight: true },
                        });
                        if (!stockRecord) {
                            console.warn(`Skipping StockAssignment with invalid lotNo ${item.lotNo}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        const userRecord = yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } });
                        if (!userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        if (item.assignedWeight <= 0)
                            throw new Error('Zero or negative assignedWeight');
                        if (item.assignedWeight > stockRecord.weight)
                            throw new Error(`Assigned weight ${item.assignedWeight} exceeds stock weight ${stockRecord.weight}`);
                        const existingAssignment = yield tx.stockAssignment.findFirst({
                            where: { stocksId: stockRecord.id, userCognitoId: item.userCognitoId },
                        });
                        if (existingAssignment) {
                            console.warn(`Skipping duplicate StockAssignment for lotNo ${item.lotNo}, user ${item.userCognitoId}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        yield model.create({
                            data: {
                                stocksId: stockRecord.id,
                                userCognitoId: item.userCognitoId,
                                assignedWeight: item.assignedWeight,
                                assignedAt: new Date(item.assignedAt || Date.now()),
                            },
                        });
                        yield adjustStock(item.lotNo, -item.assignedWeight, `Assigned ${item.assignedWeight} kg to user ${item.userCognitoId}`, item.adminCognitoId, null, tx);
                        yield tx.adminNotification.create({
                            data: {
                                adminCognitoId: item.adminCognitoId,
                                message: `Assigned ${item.assignedWeight} kg to user ${item.userCognitoId}`,
                                details: {
                                    lotNo: item.lotNo,
                                    assignedWeight: item.assignedWeight,
                                    userCognitoId: item.userCognitoId,
                                },
                                createdAt: new Date(item.createdAt || Date.now()),
                            },
                        });
                    }
                    else if (modelName === 'Shipment') {
                        if (!validStatuses.includes(item.status))
                            throw new Error(`Invalid status '${item.status}'`);
                        if (!validVessels.includes(item.vessel))
                            throw new Error(`Invalid vessel '${item.vessel}'`);
                        if (!validPackaging.includes(item.packagingInstructions))
                            throw new Error(`Invalid packagingInstructions '${item.packagingInstructions}'`);
                        const userRecord = yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } });
                        if (!userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        const adminRecord = item.adminCognitoId ? yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } }) : null;
                        if (item.adminCognitoId && !adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const existingShipment = yield tx.shipment.findUnique({ where: { shipmark: item.shipmark } });
                        if (existingShipment)
                            throw new Error(`Duplicate shipmark ${item.shipmark}`);
                        const { userCognitoId, adminCognitoId, stocks } = item, shipmentData = __rest(item, ["userCognitoId", "adminCognitoId", "stocks"]);
                        const shipmentRecord = yield model.create({
                            data: Object.assign(Object.assign({}, shipmentData), { shipmentDate: new Date(item.shipmentDate), createdAt: new Date(item.createdAt || Date.now()), user: { connect: { userCognitoId: item.userCognitoId } }, admin: item.adminCognitoId ? { connect: { adminCognitoId: item.adminCognitoId } } : undefined }),
                        });
                        for (const shipmentItem of stocks || []) {
                            if (!shipmentItem.lotNo) {
                                console.warn(`Skipping ShipmentItem with missing or undefined lotNo for shipmark ${item.shipmark}`);
                                seedStats[modelName].skipped++;
                                continue;
                            }
                            const stockRecord = yield tx.stocks.findUnique({
                                where: { lotNo: shipmentItem.lotNo },
                                select: { id: true, weight: true },
                            });
                            if (!stockRecord) {
                                console.warn(`Skipping ShipmentItem with invalid lotNo ${shipmentItem.lotNo}`);
                                seedStats[modelName].skipped++;
                                continue;
                            }
                            if (shipmentItem.assignedWeight <= 0) {
                                console.warn(`Skipping ShipmentItem with zero assignedWeight for lotNo ${shipmentItem.lotNo}`);
                                seedStats[modelName].skipped++;
                                continue;
                            }
                            if (shipmentItem.assignedWeight > stockRecord.weight) {
                                console.warn(`Skipping ShipmentItem with assignedWeight ${shipmentItem.assignedWeight} exceeding stock weight ${stockRecord.weight}`);
                                seedStats[modelName].skipped++;
                                continue;
                            }
                            const existingShipmentItem = yield tx.shipmentItem.findUnique({
                                where: { shipmentId_stocksId: { shipmentId: shipmentRecord.id, stocksId: stockRecord.id } },
                            });
                            if (existingShipmentItem) {
                                console.warn(`Skipping duplicate ShipmentItem for shipmark ${item.shipmark}, lotNo ${shipmentItem.lotNo}`);
                                seedStats[modelName].skipped++;
                                continue;
                            }
                            yield tx.shipmentItem.create({
                                data: {
                                    shipmentId: shipmentRecord.id,
                                    stocksId: stockRecord.id,
                                    assignedWeight: shipmentItem.assignedWeight,
                                },
                            });
                            yield adjustStock(shipmentItem.lotNo, -shipmentItem.assignedWeight, `Shipment ${item.shipmark}`, item.adminCognitoId || 'system', shipmentRecord.id, tx);
                        }
                    }
                    else if (modelName === 'ShipmentItem') {
                        const shipmentRecord = yield tx.shipment.findUnique({ where: { shipmark: item.shipmark } });
                        if (!shipmentRecord) {
                            console.warn(`Skipping ShipmentItem with invalid shipmark ${item.shipmark}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        const stockRecord = yield tx.stocks.findUnique({
                            where: { lotNo: item.lotNo },
                            select: { id: true, weight: true },
                        });
                        if (!stockRecord) {
                            console.warn(`Skipping ShipmentItem with invalid lotNo ${item.lotNo}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        if (item.assignedWeight <= 0) {
                            console.warn(`Skipping ShipmentItem with zero assignedWeight for lotNo ${item.lotNo}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        const existingShipmentItem = yield tx.shipmentItem.findUnique({
                            where: { shipmentId_stocksId: { shipmentId: shipmentRecord.id, stocksId: stockRecord.id } },
                        });
                        if (existingShipmentItem) {
                            console.warn(`Skipping duplicate ShipmentItem for shipmark ${item.shipmark}, lotNo ${item.lotNo}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        yield model.create({
                            data: {
                                shipmentId: shipmentRecord.id,
                                stocksId: stockRecord.id,
                                assignedWeight: item.assignedWeight,
                            },
                        });
                        yield adjustStock(item.lotNo, -item.assignedWeight, `ShipmentItem ${item.shipmark}`, item.adminCognitoId || 'system', shipmentRecord.id, tx);
                    }
                    else if (modelName === 'StockHistory') {
                        const stockRecord = yield tx.stocks.findUnique({
                            where: { lotNo: item.lotNo },
                            select: { id: true },
                        });
                        if (!stockRecord) {
                            console.warn(`Skipping StockHistory with invalid lotNo ${item.lotNo}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        const userRecord = item.userCognitoId ? yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } }) : null;
                        if (item.userCognitoId && !userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        const adminRecord = item.adminCognitoId ? yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } }) : null;
                        if (item.adminCognitoId && !adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const shipmentRecord = item.shipmentId ? yield tx.shipment.findUnique({ where: { id: item.shipmentId } }) : null;
                        if (item.shipmentId && !shipmentRecord)
                            throw new Error(`Invalid shipmentId ${item.shipmentId}`);
                        yield model.create({
                            data: {
                                stocksId: stockRecord.id,
                                action: item.action || 'Seeded',
                                timestamp: new Date(item.timestamp || Date.now()),
                                userCognitoId: item.userCognitoId,
                                adminCognitoId: item.adminCognitoId,
                                shipmentId: item.shipmentId,
                                details: item.details || {},
                            },
                        });
                    }
                    else if (modelName === 'ShipmentHistory') {
                        const shipmentRecord = yield tx.shipment.findUnique({ where: { shipmark: item.shipmark } });
                        if (!shipmentRecord) {
                            console.warn(`Skipping ShipmentHistory with invalid shipmark ${item.shipmark}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        const userRecord = item.userCognitoId ? yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } }) : null;
                        if (item.userCognitoId && !userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        const adminRecord = item.adminCognitoId ? yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } }) : null;
                        if (item.adminCognitoId && !adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        yield model.create({
                            data: {
                                shipmentId: shipmentRecord.id,
                                action: item.action,
                                timestamp: new Date(item.timestamp || Date.now()),
                                userCognitoId: item.userCognitoId,
                                adminCognitoId: item.adminCognitoId,
                                details: item.details || {},
                            },
                        });
                    }
                    else if (modelName === 'AdminNotification') {
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        if (!item.message)
                            throw new Error('Missing message');
                        if (!item.details || typeof item.details !== 'object')
                            throw new Error('Invalid or missing details');
                        yield model.create({
                            data: {
                                adminCognitoId: item.adminCognitoId,
                                message: item.message,
                                details: item.details,
                                createdAt: new Date(item.createdAt || Date.now()),
                            },
                        });
                    }
                    else if (modelName === 'Contact') {
                        const userRecord = item.userCognitoId ? yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } }) : null;
                        if (item.userCognitoId && !userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        if (!item.name)
                            throw new Error('Missing name');
                        if (!item.email)
                            throw new Error('Missing email');
                        if (!item.message)
                            throw new Error('Missing message');
                        if (typeof item.privacyConsent !== 'boolean')
                            throw new Error('Invalid or missing privacyConsent');
                        yield model.create({
                            data: {
                                name: item.name,
                                email: item.email,
                                subject: item.subject || null,
                                message: item.message,
                                privacyConsent: item.privacyConsent,
                                userCognitoId: item.userCognitoId,
                                createdAt: new Date(item.createdAt || Date.now()),
                            },
                        });
                    }
                    else if (modelName === 'Favorite') {
                        const userRecord = yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } });
                        if (!userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        const stockRecord = item.stocksId ? yield tx.stocks.findUnique({ where: { id: item.stocksId } }) : null;
                        if (item.stocksId && !stockRecord)
                            throw new Error(`Invalid stocksId ${item.stocksId}`);
                        const existingFavorite = yield tx.favorite.findUnique({
                            where: {
                                user_stocks_favorite: {
                                    userCognitoId: item.userCognitoId,
                                    stocksId: item.stocksId,
                                },
                            },
                        });
                        if (existingFavorite) {
                            console.warn(`Skipping duplicate Favorite for user ${item.userCognitoId}, stock ${item.stocksId}`);
                            seedStats[modelName].skipped++;
                            continue;
                        }
                        yield model.create({
                            data: {
                                userCognitoId: item.userCognitoId,
                                stocksId: item.stocksId,
                                createdAt: new Date(item.createdAt || Date.now()),
                            },
                        });
                    }
                    else if (modelName === 'Report') {
                        const adminRecord = yield tx.admin.findUnique({ where: { adminCognitoId: item.adminCognitoId } });
                        if (!adminRecord)
                            throw new Error(`Invalid adminCognitoId ${item.adminCognitoId}`);
                        const userRecord = item.userCognitoId ? yield tx.user.findUnique({ where: { userCognitoId: item.userCognitoId } }) : null;
                        if (item.userCognitoId && !userRecord)
                            throw new Error(`Invalid userCognitoId ${item.userCognitoId}`);
                        if (!item.title)
                            throw new Error('Missing title');
                        if (!item.fileUrl)
                            throw new Error('Missing fileUrl');
                        if (!validFileTypes.includes(item.fileType))
                            throw new Error(`Invalid fileType '${item.fileType}'`);
                        const { adminCognitoId, userCognitoId, updatedAt, deletedAt } = item, reportData = __rest(item, ["adminCognitoId", "userCognitoId", "updatedAt", "deletedAt"]);
                        yield model.create({
                            data: Object.assign(Object.assign({}, reportData), { uploadedAt: new Date(item.uploadedAt || Date.now()), admin: { connect: { adminCognitoId } }, user: userCognitoId ? { connect: { userCognitoId } } : undefined }),
                        });
                    }
                    else {
                        yield model.create({ data: item });
                    }
                    seedStats[modelName].success++;
                }
                catch (error) {
                    seedStats[modelName].skipped++;
                    const message = error instanceof Error ? error.message : String(error);
                    seedStats[modelName].errors.push(`${modelName} entry: ${message}`);
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            seedStats[modelName].errors.push(`Failed to seed ${modelName}: ${message}`);
        }
    });
}
function verifyData() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\nVerifying seeded data:');
        const models = [
            'admin', 'user', 'catalog', 'sellingPrice', 'outLots', 'stocks',
            'stockAssignment', 'shipment', 'shipmentItem', 'stockHistory',
            'shipmentHistory', 'adminNotification', 'contact', 'favorite', 'report',
        ];
        for (const modelName of models) {
            const modelNameCamel = toCamelCase(modelName);
            const model = prisma[modelNameCamel];
            try {
                const count = yield model.count();
                console.log(`${modelName}: ${count} records`);
            }
            catch (error) {
                console.error(`Error verifying ${modelName}:`, error);
            }
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const dataDirectory = path_1.default.join(process.cwd(), 'src', 'prisma', 'seedData');
        const orderedFileNames = [
            'admin.json',
            'user.json',
            'catalog.json',
            'sellingPrice.json',
            'outLots.json',
            'stocks.json',
            'stockAssignment.json',
            'shipment.json',
            'shipmentItem.json',
            'stockHistory.json',
            'shipmentHistory.json',
            'adminNotification.json',
            'contact.json',
            'favorite.json',
            'report.json',
        ];
        try {
            console.log('Starting seeding process...');
            yield testConnection();
            yield deleteAllData();
            for (const fileName of orderedFileNames) {
                const filePath = path_1.default.join(dataDirectory, fileName);
                if (!fs_1.default.existsSync(filePath)) {
                    console.warn(`Skipping missing seed file ${fileName}`);
                    continue;
                }
                const jsonData = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                console.log(`Seeding ${fileName} with ${jsonData.length} records`);
                const modelName = toPascalCase(path_1.default.basename(fileName, '.json'));
                const modelNameCamel = toCamelCase(modelName);
                const model = prisma[modelNameCamel];
                if (!model) {
                    console.error(`Model ${modelName} not found in Prisma schema`);
                    continue;
                }
                yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    yield seedTable(tx[modelNameCamel], modelName, jsonData, fileName, tx);
                    seededTables.push(modelName);
                }));
            }
            console.log('\nSeeding completed. Summary:');
            for (const [model, stats] of Object.entries(seedStats)) {
                console.log(`${model}: ${stats.success} seeded, ${stats.skipped} skipped`);
                if (stats.errors.length > 0) {
                    console.log(`  Errors (${stats.errors.length}):`);
                    stats.errors.forEach((error, i) => console.log(`    ${i + 1}. ${error}`));
                }
            }
            yield verifyData();
        }
        catch (error) {
            console.error(`Seeding failed after seeding: ${seededTables.join(', ')}`, error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main().catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
});
