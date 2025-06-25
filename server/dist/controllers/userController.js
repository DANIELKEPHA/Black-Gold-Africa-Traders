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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContact = exports.getUserStockHistory = exports.getLoggedInUsers = exports.updateUser = exports.createUser = exports.getUserById = void 0;
const client_1 = require("@prisma/client");
const userSchema_1 = require("../schemas/userSchema");
const response_1 = require("../lib/response");
const logger_1 = require("../lib/logger");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma = new client_1.PrismaClient({
    log: ["query", "info", "warn", "error"],
});
const checkAuth = (user, userCognitoId, allowSelf = false) => {
    if (!user) {
        return { message: "Unauthorized: No valid token provided" };
    }
    const isAdmin = user.role.toLowerCase() === "admin";
    const isSelf = allowSelf && user.userId === userCognitoId;
    if (!isAdmin && !isSelf) {
        return { message: "Forbidden: Admin role or self-access required" };
    }
    return null;
};
const serializeStocks = (stock) => ({
    id: stock.id,
    lotNo: stock.lotNo,
    mark: stock.mark || null,
    grade: stock.grade,
    invoiceNo: stock.invoiceNo || null,
    saleCode: stock.saleCode,
    broker: stock.broker,
    bags: stock.bags,
    weight: Number(stock.weight),
    purchaseValue: Number(stock.purchaseValue),
    totalPurchaseValue: Number(stock.totalPurchaseValue),
    agingDays: stock.agingDays,
    penalty: Number(stock.penalty),
    bgtCommission: Number(stock.bgtCommission),
    maerskFee: Number(stock.maerskFee),
    commission: Number(stock.commission),
    netPrice: Number(stock.netPrice),
    total: Number(stock.total),
    batchNumber: stock.batchNumber || null,
    lowStockThreshold: stock.lowStockThreshold ? Number(stock.lowStockThreshold) : null,
    adminCognitoId: stock.adminCognitoId,
    createdAt: stock.createdAt.toISOString(),
    updatedAt: stock.updatedAt.toISOString(),
});
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const params = userSchema_1.getUserParamsSchema.safeParse(req.params);
        const query = userSchema_1.getUserQuerySchema.safeParse(req.query);
        if (!params.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid parameters", params.error.errors));
            return;
        }
        if (!query.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid query parameters", query.error.errors));
            return;
        }
        const { userCognitoId } = params.data;
        const { includeShipments, includeAssignedStocks } = query.data;
        (0, logger_1.logInfo)("Fetching user", {
            userCognitoId,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        const authError = checkAuth(req.user, userCognitoId, true);
        if (authError) {
            res.status(401).json((0, response_1.errorResponse)(authError.message));
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { userCognitoId },
            include: {
                shipments: includeShipments
                    ? {
                        select: {
                            id: true,
                            shipmentDate: true,
                            status: true,
                            consignee: true,
                            vessel: true,
                            shipmark: true,
                            packagingInstructions: true,
                            additionalInstructions: true,
                        },
                    }
                    : false,
                assignments: includeAssignedStocks
                    ? {
                        select: {
                            id: true,
                            stocksId: true,
                            userCognitoId: true,
                            assignedWeight: true,
                            assignedAt: true,
                            stocks: true, // Simplified to reduce type complexity
                        },
                    }
                    : false,
                favorites: includeAssignedStocks
                    ? {
                        select: {
                            id: true,
                            userCognitoId: true,
                            stocksId: true,
                            createdAt: true,
                            stocks: true, // Simplified to reduce type complexity
                        },
                    }
                    : false,
            },
        });
        // Log raw assignments data for debugging
        if (includeAssignedStocks && user && user.assignments) {
            (0, logger_1.logInfo)("Raw assignments data", {
                userCognitoId,
                assignments: user.assignments.map((a) => ({
                    id: a.id,
                    stocksId: a.stocksId,
                    hasStocks: !!a.stocks,
                    stocksData: a.stocks ? { id: a.stocks.id, lotNo: a.stocks.lotNo } : null,
                })),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
        }
        if (!user) {
            (0, logger_1.logInfo)("User not found", {
                userCognitoId,
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
            res.status(404).json((0, response_1.errorResponse)("User not found"));
            return;
        }
        (0, logger_1.logInfo)("User retrieved", {
            userCognitoId,
            name: user.name,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(200).json((0, response_1.successResponse)({
            cognitoInfo: { userId: user.userCognitoId },
            userInfo: Object.assign(Object.assign({ id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, role: user.role, createdAt: user.createdAt.toISOString() }, (includeShipments && {
                shipments: (_b = (_a = user.shipments) === null || _a === void 0 ? void 0 : _a.map((s) => (Object.assign(Object.assign({}, s), { shipmentDate: s.shipmentDate.toISOString() })))) !== null && _b !== void 0 ? _b : [],
            })), (includeAssignedStocks && {
                assignedStocks: (_d = (_c = user.assignments) === null || _c === void 0 ? void 0 : _c.map((a) => ({
                    id: a.id,
                    stocksId: a.stocksId,
                    userCognitoId: a.userCognitoId,
                    assignedWeight: Number(a.assignedWeight),
                    assignedAt: a.assignedAt.toISOString(),
                    stocks: a.stocks ? serializeStocks(a.stocks) : null,
                })).filter((a) => a.stocks != null)) !== null && _d !== void 0 ? _d : [],
                favoritedStocks: (_f = (_e = user.favorites) === null || _e === void 0 ? void 0 : _e.map((f) => (f.stocks ? serializeStocks(f.stocks) : null)).filter((f) => f != null)) !== null && _f !== void 0 ? _f : [],
            })),
            userRole: user.role,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Error retrieving user", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json((0, response_1.errorResponse)("Internal server error"));
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getUserById = getUserById;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = userSchema_1.createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid user data", parsed.error.errors));
            return;
        }
        const { userCognitoId, name, email, phoneNumber, role } = parsed.data;
        (0, logger_1.logInfo)("Creating user", { userCognitoId, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        const user = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const existingUser = yield tx.user.findFirst({
                where: {
                    OR: [{ userCognitoId }, { email: email !== null && email !== void 0 ? email : undefined }],
                },
            });
            if (existingUser) {
                throw new Error("User with this userCognitoId or email already exists");
            }
            return tx.user.create({
                data: {
                    userCognitoId,
                    name,
                    email,
                    phoneNumber,
                    role: role || "user",
                    createdAt: new Date(),
                },
                select: {
                    id: true,
                    userCognitoId: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                },
            });
        }));
        (0, logger_1.logInfo)("User created", { userCognitoId, name, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        res.status(201).json((0, response_1.successResponse)(Object.assign(Object.assign({}, user), { createdAt: user.createdAt.toISOString() })));
    }
    catch (error) {
        (0, logger_1.logError)("Error creating user", { error, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        if (error instanceof Error && error.message.includes("already exists")) {
            res.status(409).json((0, response_1.errorResponse)(error.message));
            return;
        }
        res.status(500).json((0, response_1.errorResponse)("Internal server error"));
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = userSchema_1.updateUserParamsSchema.safeParse(req.params);
        const body = userSchema_1.updateUserBodySchema.safeParse(req.body);
        if (!params.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid parameters", params.error.errors));
            return;
        }
        if (!body.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid user data", body.error.errors));
            return;
        }
        const { userCognitoId } = params.data;
        const data = body.data;
        (0, logger_1.logInfo)("Updating user", { userCognitoId, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        const authError = checkAuth(req.user, userCognitoId, true);
        if (authError) {
            res.status(401).json((0, response_1.errorResponse)(authError.message));
            return;
        }
        if (data.email) {
            const existingUser = yield prisma.user.findFirst({
                where: { email: data.email, userCognitoId: { not: userCognitoId } },
            });
            if (existingUser) {
                res.status(409).json((0, response_1.errorResponse)("Email is already in use by another user"));
                return;
            }
        }
        const updatedUser = yield prisma.user.update({
            where: { userCognitoId },
            data,
            select: {
                id: true,
                userCognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
            },
        });
        (0, logger_1.logInfo)("User updated", { userCognitoId, name: updatedUser.name, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        res.status(200).json((0, response_1.successResponse)(Object.assign(Object.assign({}, updatedUser), { createdAt: updatedUser.createdAt.toISOString() })));
    }
    catch (error) {
        (0, logger_1.logError)("Error updating user", { error, timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }) });
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json((0, response_1.errorResponse)("User not found"));
                return;
            }
            if (error.code === "P2002") {
                res.status(409).json((0, response_1.errorResponse)("Email is already in use"));
                return;
            }
        }
        res.status(500).json((0, response_1.errorResponse)("Internal server error"));
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateUser = updateUser;
const getLoggedInUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = userSchema_1.getLoggedInUsersQuerySchema.safeParse(req.query);
        if (!query.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid query parameters", query.error.errors));
            return;
        }
        const { page, limit, search, includeShipments, includeFavoritedStocks, includeAssignedStocks } = query.data;
        (0, logger_1.logInfo)("Fetching logged-in users", {
            page,
            limit,
            search,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        const authError = checkAuth(req.user, undefined, false);
        if (authError) {
            res.status(401).json((0, response_1.errorResponse)(authError.message));
            return;
        }
        const where = Object.assign({ role: { not: "admin" } }, (search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }));
        const [users, total] = yield Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    shipments: includeShipments
                        ? {
                            select: {
                                id: true,
                                shipmentDate: true,
                                status: true,
                                consignee: true,
                                vessel: true,
                                shipmark: true,
                                packagingInstructions: true,
                                additionalInstructions: true,
                            },
                        }
                        : false,
                    favorites: includeFavoritedStocks
                        ? {
                            select: {
                                id: true,
                                userCognitoId: true,
                                stocksId: true,
                                createdAt: true,
                                stocks: true, // Simplified to reduce type complexity
                            },
                        }
                        : false,
                    assignments: includeAssignedStocks
                        ? {
                            select: {
                                id: true,
                                stocksId: true,
                                userCognitoId: true,
                                assignedWeight: true,
                                assignedAt: true,
                                stocks: true, // Simplified to reduce type complexity
                            },
                        }
                        : false,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);
        // Log raw assignments data for debugging
        if (includeAssignedStocks && users.length > 0) {
            (0, logger_1.logInfo)("Raw assignments data", {
                assignments: users.map((u) => {
                    var _a, _b;
                    return ({
                        userCognitoId: u.userCognitoId,
                        assignments: (_b = (_a = u.assignments) === null || _a === void 0 ? void 0 : _a.map((a) => ({
                            id: a.id,
                            stocksId: a.stocksId,
                            hasStocks: !!a.stocks, // Use type assertion for logging
                            stocksData: a.stocks ? { id: a.stocks.id, lotNo: a.stocks.lotNo } : null,
                        }))) !== null && _b !== void 0 ? _b : [],
                    });
                }),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
        }
        if (users.length === 0) {
            (0, logger_1.logInfo)("No users found", {
                page,
                limit,
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
            res.status(404).json((0, response_1.errorResponse)("No users found"));
            return;
        }
        (0, logger_1.logInfo)(`Retrieved ${users.length} users`, {
            page,
            limit,
            total,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(200).json((0, response_1.successResponse)({
            data: users.map((user) => {
                var _a, _b, _c, _d, _e, _f;
                return (Object.assign(Object.assign(Object.assign({ id: user.id, userCognitoId: user.userCognitoId, name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role, createdAt: user.createdAt.toISOString() }, (includeShipments && {
                    shipments: (_b = (_a = user.shipments) === null || _a === void 0 ? void 0 : _a.map((s) => (Object.assign(Object.assign({}, s), { shipmentDate: s.shipmentDate.toISOString() })))) !== null && _b !== void 0 ? _b : [],
                })), (includeFavoritedStocks && {
                    favoritedStocks: (_d = (_c = user.favorites) === null || _c === void 0 ? void 0 : _c.map((f) => (f.stocks ? serializeStocks(f.stocks) : null)).filter((f) => f != null)) !== null && _d !== void 0 ? _d : [],
                })), (includeAssignedStocks && {
                    assignedStocks: (_f = (_e = user.assignments) === null || _e === void 0 ? void 0 : _e.map((a) => ({
                        id: a.id,
                        stocksId: a.stocksId,
                        userCognitoId: a.userCognitoId,
                        assignedWeight: Number(a.assignedWeight),
                        assignedAt: a.assignedAt.toISOString(),
                        stocks: a.stocks ? serializeStocks(a.stocks) : null,
                    })).filter((a) => a.stocks != null)) !== null && _f !== void 0 ? _f : [],
                })));
            }),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Error retrieving logged-in users", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json((0, response_1.errorResponse)("Internal server error"));
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getLoggedInUsers = getLoggedInUsers;
const getUserStockHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const params = userSchema_1.getUserParamsSchema.safeParse(req.params);
        const query = userSchema_1.getUserStockHistoryQuerySchema.safeParse(req.query);
        if (!params.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid parameters", params.error.errors));
            return;
        }
        if (!query.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid query parameters", query.error.errors));
            return;
        }
        const { userCognitoId } = params.data;
        const { page, limit, search, sortBy, sortOrder } = query.data;
        (0, logger_1.logInfo)("Fetching user stock assignment history", {
            userCognitoId,
            page,
            limit,
            search,
            sortBy,
            sortOrder,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        const authError = checkAuth(req.user, undefined, false);
        if (authError) {
            res.status(401).json((0, response_1.errorResponse)(authError.message));
            return;
        }
        const where = Object.assign({ userCognitoId }, (search && {
            stocks: {
                OR: [
                    { lotNo: { contains: search, mode: "insensitive" } },
                    { invoiceNo: { contains: search, mode: "insensitive" } },
                    { saleCode: { contains: search, mode: "insensitive" } },
                ],
            },
        }));
        const [assignments, total] = yield Promise.all([
            prisma.stockAssignment.findMany({
                where,
                include: {
                    stocks: true,
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.stockAssignment.count({ where }),
        ]);
        // Log raw assignments data for debugging
        if (assignments.length > 0) {
            (0, logger_1.logInfo)("Raw stock assignment history", {
                userCognitoId,
                assignments: assignments.map((a) => ({
                    id: a.id,
                    stocksId: a.stocksId,
                    hasStocks: !!a.stocks,
                    stocksData: a.stocks ? { id: a.stocks.id, lotNo: a.stocks.lotNo } : null,
                })),
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
        }
        if (assignments.length === 0) {
            (0, logger_1.logInfo)("No stock assignments found", {
                userCognitoId,
                page,
                limit,
                timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
            });
            res.status(404).json((0, response_1.errorResponse)("No stock assignments found"));
            return;
        }
        (0, logger_1.logInfo)(`Retrieved ${assignments.length} stock assignments`, {
            userCognitoId,
            page,
            limit,
            total,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(200).json((0, response_1.successResponse)({
            data: assignments.map((a) => ({
                id: a.id,
                stocksId: a.stocksId,
                userCognitoId: a.userCognitoId,
                assignedWeight: Number(a.assignedWeight),
                assignedAt: a.assignedAt.toISOString(),
                stocks: a.stocks ? serializeStocks(a.stocks) : null,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Error retrieving user stock assignment history", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json((0, response_1.errorResponse)("Internal server error"));
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getUserStockHistory = getUserStockHistory;
// reCAPTCHA verification utility
// async function verifyRecaptcha(token: string): Promise<boolean> {
//     try {
//         const response = await axios.post(
//             `https://www.google.com/recaptcha/api/siteverify`,
//             null,
//             {
//                 params: {
//                     secret: process.env.RECAPTCHA_SECRET_KEY,
//                     response: token,
//                 },
//             }
//         );
//         return response.data.success && response.data.score >= 0.5;
//     } catch (error) {
//         logError("reCAPTCHA verification failed", {
//             error,
//             timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
//         });
//         return false;
//     }
// }
const createContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = userSchema_1.createContactSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json((0, response_1.errorResponse)("Invalid contact data", parsed.error.errors));
            return;
        }
        const { name, email, subject, message, privacyConsent, userCognitoId } = parsed.data;
        (0, logger_1.logInfo)("Processing contact form submission", {
            email,
            userCognitoId: userCognitoId || "anonymous",
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        // Verify reCAPTCHA
        // const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        // if (!isValidRecaptcha) {
        //     res.status(400).json(errorResponse("reCAPTCHA verification failed"));
        //     return;
        // }
        // Sanitize inputs
        const sanitizedData = {
            name: (0, sanitize_html_1.default)(name),
            email: (0, sanitize_html_1.default)(email),
            subject: subject ? (0, sanitize_html_1.default)(subject) : undefined,
            message: (0, sanitize_html_1.default)(message),
            privacyConsent,
            userCognitoId,
        };
        // Save to database
        const contact = yield prisma.contact.create({
            data: {
                name: sanitizedData.name,
                email: sanitizedData.email,
                subject: sanitizedData.subject,
                message: sanitizedData.message,
                privacyConsent: sanitizedData.privacyConsent,
                userCognitoId: sanitizedData.userCognitoId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                subject: true,
                message: true,
                privacyConsent: true,
                userCognitoId: true,
                createdAt: true,
            },
        });
        (0, logger_1.logInfo)("Contact submission created", {
            id: contact.id,
            email: contact.email,
            userCognitoId: contact.userCognitoId || "anonymous",
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        // Optional: Send email notification (e.g., using Nodemailer)
        /*
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: email,
          to: "admin@example.com",
          subject: subject || "New Contact Form Submission",
          text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}\nUserCognitoId: ${userCognitoId || "anonymous"}`,
        });
        */
        res.status(201).json((0, response_1.successResponse)({
            id: contact.id,
            name: contact.name,
            email: contact.email,
            subject: contact.subject,
            message: contact.message,
            privacyConsent: contact.privacyConsent,
            userCognitoId: contact.userCognitoId,
            createdAt: contact.createdAt.toISOString(),
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Error creating contact submission", {
            error,
            timestamp: new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }),
        });
        res.status(500).json((0, response_1.errorResponse)("Internal server error"));
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.createContact = createContact;
