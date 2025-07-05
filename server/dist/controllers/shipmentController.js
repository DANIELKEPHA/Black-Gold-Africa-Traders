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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShipmentStatus = exports.removeShipment = exports.updateShipment = exports.getShipmentHistory = exports.createShipment = exports.getShipments = void 0;
const client_1 = require("@prisma/client");
const shipmentSchemas_1 = require("../schemas/shipmentSchemas");
const database_1 = require("../utils/database");
const controllerUtils_1 = require("../utils/controllerUtils");
const teaStocksController_1 = require("./teaStocksController");
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
const getShipments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            return;
        }
        const userCognitoId = req.params.userCognitoId;
        const isAdminRoute = req.path.includes('/admin/shipments');
        const parsed = shipmentSchemas_1.getShipmentsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ message: 'Invalid query parameters', errors: parsed.error.flatten() });
            return;
        }
        const { stocksId, status, page, limit, search } = parsed.data;
        if (!isAdminRoute && userCognitoId) {
            if (authenticatedUser.role.toLowerCase() === 'user' && userCognitoId !== authenticatedUser.userId) {
                res.status(403).json({ message: "Forbidden: Cannot access other users' shipments" });
                return;
            }
        }
        const where = (0, controllerUtils_1.buildShipmentWhereClause)({ stocksId, status, userCognitoId, search });
        const [shipments, total] = yield Promise.all([
            prisma.shipment.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { shipmentDate: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            userCognitoId: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    lotNo: true,
                                    mark: true,
                                    bags: true,
                                    weight: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.shipment.count({ where }),
        ]);
        res.status(200).json((0, controllerUtils_1.formatPaginatedResponse)(shipments, page, limit, total));
    }
    catch (error) {
        (0, controllerUtils_1.logError)('Error in getShipments', error);
        (0, controllerUtils_1.sendErrorResponse)(res, error);
    }
});
exports.getShipments = getShipments;
const createShipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        console.log(`[${time}] createShipment Request:`, {
            url: req.originalUrl,
            method: req.method,
            headers: JSON.stringify(req.headers, null, 2),
            body: JSON.stringify(req.body, null, 2),
            params: req.params,
        });
        const parsed = shipmentSchemas_1.createShipmentSchema.safeParse(req.body);
        if (!parsed.success) {
            const validationErrors = parsed.error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
                code: err.code,
            }));
            console.log(`[${time}] Validation errors:`, JSON.stringify(validationErrors, null, 2));
            res.status(400).json({ message: 'Invalid shipment data', details: validationErrors });
            return;
        }
        const { userCognitoId } = req.params;
        const { items, shipmentDate, status, consignee, vessel, shipmark, packagingInstructions, additionalInstructions, } = parsed.data;
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.log(`[${time}] Authentication failed: No authenticated user`);
            return;
        }
        if (authenticatedUser.role.toLowerCase() !== 'user') {
            console.log(`[${time}] Forbidden: Role=${authenticatedUser.role}, expected 'user'`);
            res.status(403).json({ message: 'Forbidden: Only users can create shipments' });
            return;
        }
        if (userCognitoId !== authenticatedUser.userId) {
            console.log(`[${time}] Forbidden: userCognitoId=${userCognitoId}, authenticatedUserId=${authenticatedUser.userId}`);
            res.status(403).json({ message: 'Forbidden: You can only create shipments for yourself' });
            return;
        }
        const user = yield prisma.user.findUnique({ where: { userCognitoId } });
        if (!user) {
            console.log(`[${time}] User not found: userCognitoId=${userCognitoId}`);
            res.status(404).json({ message: `User with userCognitoId ${userCognitoId} not found` });
            return;
        }
        const shipment = yield (0, database_1.retryTransaction)((tx) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`[${time}] Starting transaction for shipment creation`);
            const newShipment = yield tx.shipment.create({
                data: {
                    shipmentDate: shipmentDate ? new Date(shipmentDate) : new Date(),
                    status: status || client_1.ShipmentStatus.Pending,
                    userCognitoId,
                    consignee,
                    vessel,
                    shipmark,
                    packagingInstructions,
                    additionalInstructions: additionalInstructions || null,
                    stocks: {
                        create: items.map((item) => ({
                            stocksId: item.stocksId,
                            assignedWeight: item.totalWeight,
                        })),
                    },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userCognitoId: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    lotNo: true,
                                    mark: true,
                                    bags: true,
                                    weight: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            });
            yield tx.shipmentHistory.create({
                data: {
                    shipmentId: newShipment.id,
                    userCognitoId: authenticatedUser.userId,
                    action: 'CREATED',
                    details: {
                        consignee: newShipment.consignee,
                        vessel: newShipment.vessel,
                        shipmark: newShipment.shipmark,
                        packagingInstructions: newShipment.packagingInstructions,
                        additionalInstructions: newShipment.additionalInstructions,
                        status: newShipment.status,
                        items: items.map(item => ({
                            stocksId: item.stocksId,
                            totalWeight: item.totalWeight,
                        })),
                    },
                },
            });
            console.log(`[${time}] Created shipment history for shipment ID: ${newShipment.id}`);
            for (const item of items) {
                console.log(`[${time}] Processing item: stocksId=${item.stocksId}, totalWeight=${item.totalWeight}`);
                const stock = yield tx.stocks.findFirst({
                    where: { id: item.stocksId },
                    select: {
                        id: true,
                        weight: true,
                        bags: true,
                        lotNo: true,
                        mark: true,
                        purchaseValue: true,
                        grade: true,
                        broker: true,
                        saleCode: true,
                    },
                });
                if (!stock) {
                    console.log(`[${time}] Error: Stock ${item.stocksId} not found`);
                    throw new Error(`Stock ${item.stocksId} not found`);
                }
                if (item.totalWeight > stock.weight) {
                    console.log(`[${time}] Error: Insufficient stock for stock ${item.stocksId}: requested ${item.totalWeight}, available ${stock.weight}`);
                    throw new Error(`Insufficient stock for stock ${item.stocksId}: requested ${item.totalWeight}, available ${stock.weight}`);
                }
                const weightPerBag = stock.bags > 0 ? Number((stock.weight / stock.bags).toFixed(2)) : 0;
                const bagsToDeduct = weightPerBag > 0 ? Math.ceil(item.totalWeight / weightPerBag) : 0;
                console.log(`[${time}] Deducting bags:`, { bagsToDeduct, weightPerBag, totalWeight: item.totalWeight });
                yield tx.stocks.update({
                    where: { id: item.stocksId },
                    data: { bags: stock.bags - bagsToDeduct, weight: stock.weight - item.totalWeight },
                });
                yield tx.stockHistory.create({
                    data: {
                        stocksId: stock.id,
                        action: 'SHIPPED',
                        userCognitoId: authenticatedUser.userId,
                        shipmentId: newShipment.id,
                        details: {
                            totalWeight: item.totalWeight,
                            reason: `Stock reduced for shipment ${newShipment.id}`,
                            lotNo: stock.lotNo,
                            mark: stock.mark,
                            grade: stock.grade,
                            broker: stock.broker,
                            saleCode: stock.saleCode,
                        },
                        timestamp: new Date(),
                    },
                });
            }
            return newShipment;
        }), 3, prisma);
        console.log(`[${time}] Shipment created successfully:`, {
            id: shipment.id,
            shipmark,
            userCognitoId,
            itemsCount: items.length,
        });
        res.status(201).json({ data: (0, controllerUtils_1.formatSingleShipmentResponse)(shipment) });
    }
    catch (error) {
        console.error(`[${time}] Error creating shipment:`, {
            message: error.message,
            stack: error.stack,
            requestBody: JSON.stringify(req.body, null, 2),
            userCognitoId: req.params.userCognitoId,
        });
        (0, controllerUtils_1.logError)('Error creating shipment', error);
        (0, controllerUtils_1.sendErrorResponse)(res, error);
    }
    finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        yield prisma.$disconnect();
    }
});
exports.createShipment = createShipment;
const getShipmentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.log(`[${time}] Authentication failed: No authenticated user`);
            return;
        }
        const userCognitoId = req.params.userCognitoId;
        const { shipmentId, page = '1', limit = '10' } = req.query;
        if (authenticatedUser.role.toLowerCase() === 'user' && userCognitoId !== authenticatedUser.userId) {
            console.log(`[${time}] Forbidden: userCognitoId=${userCognitoId}, authenticatedUserId=${authenticatedUser.userId}`);
            res.status(403).json({ message: "Forbidden: Cannot access other users' shipment history" });
            return;
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
            console.log(`[${time}] Invalid pagination parameters: page=${page}, limit=${limit}`);
            res.status(400).json({ message: 'Invalid pagination parameters' });
            return;
        }
        const where = { userCognitoId };
        if (shipmentId) {
            const shipmentIdNum = parseInt(shipmentId, 10);
            if (isNaN(shipmentIdNum)) {
                console.log(`[${time}] Invalid shipmentId: ${shipmentId}`);
                res.status(400).json({ message: 'Invalid shipmentId' });
                return;
            }
            where.shipmentId = shipmentIdNum;
        }
        const [history, total] = yield Promise.all([
            prisma.shipmentHistory.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { timestamp: 'desc' },
                include: {
                    shipment: {
                        select: {
                            id: true,
                            shipmark: true,
                            status: true,
                        },
                    },
                },
            }),
            prisma.shipmentHistory.count({ where }),
        ]);
        console.log(`[${time}] Fetched shipment history:`, {
            userCognitoId,
            shipmentId: shipmentId || 'all',
            page: pageNum,
            limit: limitNum,
            totalRecords: total,
        });
        res.status(200).json({
            data: history.map(record => (Object.assign(Object.assign({}, record), { items: record.details && typeof record.details === 'object' && 'items' in record.details
                    ? record.details.items
                    : [], createdAt: record.timestamp.toISOString() }))),
            meta: {
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                total,
            },
        });
    }
    catch (error) {
        console.error(`[${time}] Error fetching shipment history:`, {
            message: error.message,
            stack: error.stack,
            userCognitoId: req.params.userCognitoId,
            query: JSON.stringify(req.query, null, 2),
        });
        (0, controllerUtils_1.logError)('Error fetching shipment history', error);
        (0, controllerUtils_1.sendErrorResponse)(res, error);
    }
    finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        yield prisma.$disconnect();
    }
});
exports.getShipmentHistory = getShipmentHistory;
const updateShipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        const params = shipmentSchemas_1.updateShipmentParamsSchema.parse(req.params);
        const body = shipmentSchemas_1.updateShipmentBodySchema.parse(req.body);
        const { id: shipmentId } = params;
        const { status, packagingInstructions, additionalInstructions, consignee, vessel, shipmark, items } = body;
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            return;
        }
        if (authenticatedUser.role.toLowerCase() !== 'user') {
            console.log(`[${time}] Forbidden: Only users can update shipments`);
            res.status(403).json({ message: 'Forbidden: Only users can update shipments' });
            return;
        }
        const updatedShipment = yield (0, database_1.retryTransaction)((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const shipment = yield tx.shipment.findUnique({
                where: { id: shipmentId },
                include: {
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    weight: true,
                                    bags: true,
                                    lotNo: true,
                                    mark: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!shipment) {
                console.log(`[${time}] Shipment not found: ${shipmentId}`);
                throw new Error(`Shipment with ID ${shipmentId} not found`);
            }
            if (shipment.userCognitoId !== authenticatedUser.userId) {
                console.log(`[${time}] Forbidden: Can only update own shipments`);
                throw new Error('Forbidden: You can only update your own shipments');
            }
            if (shipment.status === 'Cancelled') {
                console.log(`[${time}] Cannot update cancelled shipment: ${shipmentId}`);
                throw new Error('Cannot update a cancelled shipment');
            }
            const allowedUserStatuses = ['Pending', 'Cancelled'];
            if (status && !allowedUserStatuses.includes(status)) {
                console.log(`[${time}] Forbidden: Invalid status ${status}`);
                throw new Error('Forbidden: Users can only set status to Pending or Cancelled');
            }
            if (items) {
                for (const oldItem of shipment.stocks) {
                    yield (0, teaStocksController_1.adjustStock)(oldItem.stocksId, oldItem.assignedWeight, `Stock restored for shipment ${shipmentId} update`, authenticatedUser.userId, shipmentId, tx);
                }
                yield tx.shipmentItem.deleteMany({ where: { shipmentId } });
                for (const newItem of items) {
                    const stock = yield tx.stocks.findFirst({
                        where: { id: newItem.stocksId },
                        select: {
                            id: true,
                            weight: true,
                            bags: true,
                            lotNo: true,
                            mark: true,
                            purchaseValue: true,
                            grade: true,
                            broker: true,
                            saleCode: true,
                        },
                    });
                    if (!stock) {
                        console.log(`[${time}] Stock not found: ${newItem.stocksId}`);
                        throw new Error(`Stock ${newItem.stocksId} not found`);
                    }
                    if (newItem.totalWeight > stock.weight) {
                        console.log(`[${time}] Insufficient stock for stock ${newItem.stocksId}`);
                        throw new Error(`Insufficient stock for stock ${newItem.stocksId}: requested ${newItem.totalWeight}, available ${stock.weight}`);
                    }
                    yield (0, teaStocksController_1.adjustStock)(newItem.stocksId, -newItem.totalWeight, `Stock reduced for shipment ${shipmentId} update`, authenticatedUser.userId, shipmentId, tx);
                    yield tx.shipmentItem.create({
                        data: {
                            shipmentId,
                            stocksId: newItem.stocksId,
                            assignedWeight: newItem.totalWeight,
                        },
                    });
                }
            }
            const updated = yield tx.shipment.update({
                where: { id: shipmentId },
                data: {
                    status,
                    packagingInstructions,
                    additionalInstructions,
                    consignee,
                    vessel,
                    shipmark,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userCognitoId: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    lotNo: true,
                                    mark: true,
                                    bags: true,
                                    weight: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            });
            yield tx.shipmentHistory.create({
                data: {
                    shipmentId,
                    userCognitoId: authenticatedUser.userId,
                    action: 'UPDATED',
                    details: {
                        consignee: updated.consignee,
                        vessel: updated.vessel,
                        shipmark: updated.shipmark,
                        packagingInstructions: updated.packagingInstructions,
                        additionalInstructions: updated.additionalInstructions,
                        status: updated.status,
                        items: (items !== null && items !== void 0 ? items : shipment.stocks).map(item => ({
                            stocksId: item.stocksId,
                            totalWeight: 'assignedWeight' in item ? item.assignedWeight : item.totalWeight,
                        })),
                    },
                },
            });
            return updated;
        }), 3, prisma);
        for (const item of updatedShipment.stocks) {
            const stock = yield prisma.stocks.findUnique({
                where: { id: item.stocksId },
                select: { weight: true },
            });
            if (stock && stock.weight < 100) {
                console.warn(`[${time}] Low stock for stock ${item.stocksId}: ${stock.weight} kg`);
            }
        }
        console.log(`[${time}] Shipment updated: ${shipmentId}`);
        res.status(200).json({ data: (0, controllerUtils_1.formatSingleShipmentResponse)(updatedShipment) });
    }
    catch (error) {
        (0, controllerUtils_1.logError)(`Error updating shipment with ID ${req.params.id}`, error);
        (0, controllerUtils_1.sendErrorResponse)(res, error);
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateShipment = updateShipment;
const removeShipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    try {
        const params = shipmentSchemas_1.removeShipmentParamsSchema.parse(req.params);
        const { id } = params;
        const userCognitoId = req.params.userCognitoId;
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            return;
        }
        const isAdmin = authenticatedUser.role.toLowerCase() === 'enforce';
        if (!isAdmin && userCognitoId !== authenticatedUser.userId) {
            console.log(`[${time}] Forbidden: User ${authenticatedUser.userId} attempted to delete shipment for userCognitoId ${userCognitoId}`);
            res.status(403).json({ message: 'Forbidden: You can only delete your own shipments' });
            return;
        }
        const deleted = yield (0, database_1.retryTransaction)((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const shipment = yield tx.shipment.findUnique({
                where: { id, userCognitoId },
                include: {
                    user: {
                        select: {
                            id: true,
                            userCognitoId: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                        },
                    },
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    lotNo: true,
                                    mark: true,
                                    bags: true,
                                    weight: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!shipment) {
                console.log(`[${time}] Shipment not found: ID=${id}, userCognitoId=${userCognitoId}`);
                throw new Error(`Shipment with ID ${id} not found`);
            }
            for (const item of shipment.stocks) {
                yield (0, teaStocksController_1.adjustStock)(item.stocksId, item.assignedWeight, `Stock restored for deleted shipment ${id}`, authenticatedUser.userId, id, tx);
            }
            yield tx.shipment.delete({ where: { id } });
            yield tx.shipmentHistory.create({
                data: {
                    shipmentId: id,
                    userCognitoId: authenticatedUser.userId,
                    action: 'DELETED',
                    details: {
                        consignee: shipment.consignee,
                        vessel: shipment.vessel,
                        shipmark: shipment.shipmark,
                        status: shipment.status,
                        items: shipment.stocks.map(item => ({
                            stocksId: item.stocksId,
                            assignedWeight: item.assignedWeight,
                        })),
                    },
                },
            });
            return shipment;
        }), 3, prisma);
        res.status(200).json({ message: `Shipment ${id} successfully deleted`, data: (0, controllerUtils_1.formatSingleShipmentResponse)(deleted) });
    }
    catch (error) {
        (0, controllerUtils_1.logError)('Error deleting shipment', error);
        (0, controllerUtils_1.sendErrorResponse)(res, error);
    }
    finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        yield prisma.$disconnect();
    }
});
exports.removeShipment = removeShipment;
const updateShipmentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    console.log(`[${time}] Starting updateShipmentStatus for ID ${req.params.id}, body:`, req.body);
    try {
        console.log(`[${time}] Parsing params:`, req.params);
        const params = shipmentSchemas_1.updateShipmentParamsSchema.parse(req.params);
        console.log(`[${time}] Parsing body:`, req.body);
        const body = shipmentSchemas_1.updateShipmentStatusSchema.parse(req.body);
        const { id: shipmentId } = params;
        const { status } = body;
        console.log(`[${time}] Validated: shipmentId=${shipmentId}, status=${status}`);
        console.log(`[${time}] Authenticating user`);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.log(`[${time}] Authentication failed`);
            return;
        }
        const allowedRoles = ['enforce', 'admin'];
        if (!allowedRoles.includes(authenticatedUser.role.toLowerCase())) {
            console.log(`[${time}] Forbidden: User role=${authenticatedUser.role}`);
            res.status(403).json({ message: `Forbidden: Only users with roles ${allowedRoles.join(' or ')} can update shipment status` });
            return;
        }
        console.log(`[${time}] User authenticated:`, { userId: authenticatedUser.userId, role: authenticatedUser.role });
        console.log(`[${time}] Checking admin existence: ${authenticatedUser.userId}`);
        let admin = yield prisma.admin.findUnique({ where: { adminCognitoId: authenticatedUser.userId } });
        if (!admin) {
            console.log(`[${time}] Creating admin record for ${authenticatedUser.userId}`);
            admin = yield prisma.admin.create({
                data: {
                    adminCognitoId: authenticatedUser.userId,
                    name: authenticatedUser.email || 'Admin',
                    email: authenticatedUser.email || `admin-${authenticatedUser.userId}@example.com`,
                    phoneNumber: '',
                },
            });
        }
        console.log(`[${time}] Admin verified:`, { id: admin.id, adminCognitoId: admin.adminCognitoId });
        const updatedShipment = yield (0, database_1.retryTransaction)((tx) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`[${time}] Finding shipment: ${shipmentId}`);
            const shipment = yield tx.shipment.findUnique({
                where: { id: shipmentId },
                include: {
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    lotNo: true,
                                    mark: true,
                                    bags: true,
                                    weight: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!shipment) {
                console.log(`[${time}] Shipment not found: ${shipmentId}`);
                throw new Error(`Shipment with ID ${shipmentId} not found`);
            }
            console.log(`[${time}] Shipment found:`, { id: shipment.id, consignee: shipment.consignee });
            console.log(`[${time}] Updating shipment status to: ${status}`);
            const updated = yield tx.shipment.update({
                where: { id: shipmentId },
                data: { status },
                include: {
                    user: { select: { id: true, userCognitoId: true, name: true, email: true, phoneNumber: true } },
                    stocks: {
                        include: {
                            stocks: {
                                select: {
                                    id: true,
                                    lotNo: true,
                                    mark: true,
                                    bags: true,
                                    weight: true,
                                    purchaseValue: true,
                                    grade: true,
                                    broker: true,
                                    saleCode: true,
                                },
                            },
                        },
                    },
                },
            });
            console.log(`[${time}] Creating shipment history`);
            yield tx.shipmentHistory.create({
                data: {
                    shipmentId,
                    adminCognitoId: admin.adminCognitoId,
                    action: 'STATUS_UPDATED',
                    details: {
                        consignee: shipment.consignee,
                        vessel: shipment.vessel,
                        shipmark: shipment.shipmark,
                        packagingInstructions: shipment.packagingInstructions,
                        additionalInstructions: shipment.additionalInstructions,
                        status,
                        items: shipment.stocks.map((item) => ({
                            stocksId: item.stocksId,
                            assignedWeight: item.assignedWeight,
                        })),
                    },
                },
            });
            return updated;
        }), 3, prisma);
        console.log(`[${time}] Shipment status updated: ${shipmentId}, new status: ${status}`);
        res.status(200).json({ data: (0, controllerUtils_1.formatSingleShipmentResponse)(updatedShipment) });
    }
    catch (error) {
        console.error(`[${time}] Error updating shipment status for ID ${req.params.id}:`, {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body,
            zodErrors: error.errors || null,
        });
        (0, controllerUtils_1.logError)('Error updating shipment status', error);
        (0, controllerUtils_1.sendErrorResponse)(res, error);
    }
    finally {
        console.log(`[${time}] Disconnecting Prisma client`);
        yield prisma.$disconnect();
    }
});
exports.updateShipmentStatus = updateShipmentStatus;
