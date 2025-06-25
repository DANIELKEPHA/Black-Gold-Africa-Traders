"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = authenticateUser;
exports.buildShipmentWhereClause = buildShipmentWhereClause;
exports.formatPaginatedResponse = formatPaginatedResponse;
exports.formatSingleShipmentResponse = formatSingleShipmentResponse;
exports.logError = logError;
exports.sendErrorResponse = sendErrorResponse;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
function authenticateUser(req, res) {
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    console.log(`[${time}] AuthenticateUser - Authorization Header:`, req.headers.authorization);
    console.log(`[${time}] AuthenticateUser - req.user:`, req.user);
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
        console.log(`[${time}] No authenticated user found`);
        res.status(401).json({ message: 'Unauthorized: No valid token provided' });
        return undefined;
    }
    console.log(`[${time}] Authenticated user:`, authenticatedUser);
    return authenticatedUser;
}
function buildShipmentWhereClause({ stocksId, status, userCognitoId, search, }) {
    const where = {};
    if (userCognitoId) {
        where.userCognitoId = userCognitoId;
    }
    if (status) {
        where.status = status;
    }
    if (stocksId) {
        where.stocks = { some: { stocksId } };
    }
    if (search) {
        where.OR = [
            { shipmark: { contains: search, mode: 'insensitive' } },
            { consignee: { contains: search, mode: 'insensitive' } },
            {
                user: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                },
            },
            {
                stocks: {
                    some: {
                        stocks: {
                            OR: [
                                { lotNo: { contains: search, mode: 'insensitive' } },
                                { mark: { contains: search, mode: 'insensitive' } },
                                {
                                    grade: {
                                        equals: search,
                                    }
                                },
                                {
                                    broker: {
                                        equals: search,
                                    }
                                },
                                { saleCode: { contains: search, mode: 'insensitive' } },
                            ],
                        },
                    },
                },
            },
        ];
    }
    return where;
}
function formatPaginatedResponse(shipments, page, limit, total) {
    return {
        data: shipments.map((shipment) => (Object.assign(Object.assign({}, shipment), { shipmentDate: shipment.shipmentDate.toISOString(), user: Object.assign(Object.assign({}, shipment.user), { name: shipment.user.name, email: shipment.user.email, phoneNumber: shipment.user.phoneNumber }), stocks: shipment.stocks.map((item) => ({
                stocks: Object.assign(Object.assign({}, item.stocks), { mark: item.stocks.mark, purchaseValue: item.stocks.purchaseValue, grade: item.stocks.grade, broker: item.stocks.broker, saleCode: item.stocks.saleCode }),
                assignedWeight: item.assignedWeight,
            })) }))),
        meta: Object.assign({ page,
            limit }, (total !== undefined && {
            total,
            totalPages: Math.ceil(total / limit),
        })),
    };
}
function formatSingleShipmentResponse(shipment) {
    return Object.assign(Object.assign({}, shipment), { shipmentDate: shipment.shipmentDate.toISOString(), user: Object.assign(Object.assign({}, shipment.user), { name: shipment.user.name, email: shipment.user.email, phoneNumber: shipment.user.phoneNumber }), stocks: shipment.stocks.map((item) => ({
            stocks: Object.assign(Object.assign({}, item.stocks), { mark: item.stocks.mark, purchaseValue: item.stocks.purchaseValue, grade: item.stocks.grade, broker: item.stocks.broker, saleCode: item.stocks.saleCode }),
            assignedWeight: item.assignedWeight,
        })) });
}
function logError(message, error) {
    const logTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    console.error(`[${logTime}] ${message}:`, error);
}
function sendErrorResponse(res, error) {
    if (error instanceof zod_1.z.ZodError) {
        res.status(400).json({ message: 'Invalid query parameters', details: error.errors });
        return;
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Shipment with shipmark already exists' });
            return;
        }
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Shipment not found' });
            return;
        }
    }
    res.status(500).json({
        message: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
    });
}
