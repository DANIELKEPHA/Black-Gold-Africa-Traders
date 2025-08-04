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
exports.exportReportsXlsx = exports.deleteReports = exports.getReportById = exports.createReport = exports.getReportFilterOptions = exports.getReports = exports.generateDownloadPresignedUrl = exports.generatePresignedUrl = void 0;
const client_1 = require("@prisma/client");
const exceljs_1 = __importDefault(require("exceljs"));
const controllerUtils_1 = require("../utils/controllerUtils");
const s3_1 = __importDefault(require("../services/s3"));
const prisma = new client_1.PrismaClient();
// Serialize report data for response
const serializeReport = (report) => ({
    id: report.id,
    title: report.title,
    description: report.description,
    fileUrl: report.fileUrl,
    fileType: report.fileType,
    uploadedAt: report.uploadedAt.toISOString(),
    adminCognitoId: report.adminCognitoId,
    userCognitoId: report.userCognitoId,
    admin: report.admin ? {
        adminCognitoId: report.admin.adminCognitoId,
        name: report.admin.name,
        email: report.admin.email,
    } : null,
    user: report.user ? {
        userCognitoId: report.user.userCognitoId,
        name: report.user.name,
        email: report.user.email,
    } : null,
});
// Valid MIME types for consistency
const validMimeTypes = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};
const generatePresignedUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting generatePresignedUrl with body:`, req.body);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        console.log("Authenticated user:", { userId: authenticatedUser.userId, role: authenticatedUser.role });
        const { fileName, fileType } = req.body;
        if (!fileName || typeof fileName !== 'string') {
            console.error("Validation failed: fileName is required and must be a string");
            res.status(400).json({ message: "fileName is required and must be a string" });
            return;
        }
        if (!fileType || typeof fileType !== 'string') {
            console.error("Validation failed: fileType is required and must be a string");
            res.status(400).json({ message: "fileType is required and must be a string" });
            return;
        }
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        if (!bucket) {
            console.error("Configuration error: AWS_S3_BUCKET_NAME is not defined");
            res.status(500).json({ message: "Server configuration error: S3 bucket name is missing" });
            return;
        }
        const key = `reports/${authenticatedUser.userId}/${Date.now()}-${fileName}`;
        const params = {
            Bucket: bucket,
            Key: key,
            Expires: 60 * 5,
            ContentType: fileType, // Include ContentType
        };
        const url = yield s3_1.default.getSignedUrlPromise('putObject', params);
        console.log("Generated presigned URL:", { url, key, fileType });
        res.status(200).json({ url, key });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in generatePresignedUrl:`, {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error generating presigned URL",
            error: error.message,
        });
    }
});
exports.generatePresignedUrl = generatePresignedUrl;
const generateDownloadPresignedUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting generateDownloadPresignedUrl with body:`, req.body);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        console.log("Authenticated user:", { userId: authenticatedUser.userId, role: authenticatedUser.role });
        const { key } = req.body;
        if (!key || typeof key !== 'string') {
            console.error("Validation failed: key is required and must be a string");
            res.status(400).json({ message: "key is required and must be a string" });
            return;
        }
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        if (!bucket) {
            console.error("Configuration error: AWS_S3_BUCKET_NAME is not defined");
            res.status(500).json({ message: "Server configuration error: S3 bucket name is missing" });
            return;
        }
        // Verify the user has access to the report
        const report = yield prisma.report.findFirst({
            where: {
                fileUrl: { contains: key },
                OR: [
                    { adminCognitoId: authenticatedUser.userId },
                    { userCognitoId: authenticatedUser.userId },
                ],
            },
        });
        if (!report) {
            console.error("Report not found or unauthorized");
            res.status(404).json({ message: "Report not found or unauthorized" });
            return;
        }
        const params = {
            Bucket: bucket,
            Key: key,
            Expires: 60 * 5, // URL expires in 5 minutes
        };
        const url = yield s3_1.default.getSignedUrlPromise('getObject', params);
        console.log("Generated download presigned URL:", { url, key });
        res.status(200).json({ url });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in generateDownloadPresignedUrl:`, {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error generating download presigned URL",
            error: error.message,
        });
    }
});
exports.generateDownloadPresignedUrl = generateDownloadPresignedUrl;
const getReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting getReports with query:`, req.query);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        const { page = 1, limit = 100, title, fileType, adminCognitoId, userCognitoId, search } = req.query;
        const pageNum = parseInt(String(page), 10);
        const limitNum = parseInt(String(limit), 10);
        if (isNaN(pageNum) || pageNum < 1) {
            res.status(400).json({ message: "Invalid page number" });
            return;
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            res.status(400).json({ message: "Limit must be between 1 and 1000" });
            return;
        }
        const where = {};
        if (authenticatedUser.role.toLowerCase() === "admin") {
            where.adminCognitoId = { equals: authenticatedUser.userId };
        }
        else {
            where.OR = [
                { userCognitoId: { equals: authenticatedUser.userId } },
                { adminCognitoId: { not: null } }, // Allow users to see admin reports
            ];
        }
        if (title) {
            where.title = { contains: String(title), mode: "insensitive" };
        }
        if (fileType && fileType !== "any") {
            if (!Object.values(validMimeTypes).includes(String(fileType))) {
                res.status(400).json({ message: `Invalid file type, must be one of: ${Object.values(validMimeTypes).join(", ")}` });
                return;
            }
            where.fileType = { equals: String(fileType) };
        }
        if (adminCognitoId) {
            where.adminCognitoId = { equals: String(adminCognitoId) };
        }
        if (userCognitoId) {
            where.userCognitoId = { equals: String(userCognitoId) };
        }
        if (search) {
            const orConditions = [
                { title: { contains: String(search), mode: "insensitive" } },
                { description: { contains: String(search), mode: "insensitive" } },
            ];
            if (Object.values(validMimeTypes).includes(String(search))) {
                orConditions.push({ fileType: { equals: String(search) } });
            }
            where.OR = orConditions;
        }
        const skip = (pageNum - 1) * limitNum;
        const take = limitNum;
        const [reports, total] = yield Promise.all([
            prisma.report.findMany({
                where,
                skip,
                take,
                include: {
                    admin: { select: { adminCognitoId: true, name: true, email: true } },
                    user: { select: { userCognitoId: true, name: true, email: true } },
                },
            }),
            prisma.report.count({ where }),
        ]);
        res.status(200).json({
            data: reports.map(serializeReport),
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            total,
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in getReports:`, {
            message: error.message,
            stack: error.stack,
            query: req.query,
        });
        res.status(500).json({
            message: "Error fetching reports",
            error: error.message,
        });
    }
});
exports.getReports = getReports;
const getReportFilterOptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting getReportFilterOptions`);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        const where = {};
        if (authenticatedUser.role.toLowerCase() === "admin") {
            where.OR = [
                { adminCognitoId: { equals: authenticatedUser.userId } },
                { adminCognitoId: { equals: null } },
            ];
        }
        else {
            where.userCognitoId = authenticatedUser.userId;
        }
        const [distinctValues, aggregates] = yield Promise.all([
            prisma.report.findMany({
                where,
                select: {
                    fileType: true,
                    adminCognitoId: true,
                    userCognitoId: true,
                    uploadedAt: true,
                },
                distinct: ["fileType", "adminCognitoId", "userCognitoId"],
            }),
            prisma.report.aggregate({
                where,
                _min: { uploadedAt: true },
                _max: { uploadedAt: true },
            }),
        ]);
        const fileTypes = [...new Set(distinctValues.map(r => r.fileType))];
        const adminCognitoIds = [...new Set(distinctValues.map(r => r.adminCognitoId).filter(Boolean))];
        const userCognitoIds = [...new Set(distinctValues.map(r => r.userCognitoId).filter(Boolean))];
        res.status(200).json({
            fileTypes,
            adminCognitoIds,
            userCognitoIds,
            uploadedAt: {
                min: (_b = (_a = aggregates._min.uploadedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) !== null && _b !== void 0 ? _b : "2020-01-01T00:00:00Z",
                max: (_d = (_c = aggregates._max.uploadedAt) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : new Date().toISOString(),
            },
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in getReportFilterOptions:`, {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            message: "Error fetching report filter options",
            error: error.message,
        });
    }
});
exports.getReportFilterOptions = getReportFilterOptions;
const createReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting createReport with body:`, req.body);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        console.log("Authenticated user:", { userId: authenticatedUser.userId, role: authenticatedUser.role });
        const { title, description, fileUrl, fileType } = req.body;
        if (!title || !fileUrl || !fileType) {
            console.error("Validation failed: title, fileUrl, and fileType are required");
            res.status(400).json({ message: "title, fileUrl, and fileType are required" });
            return;
        }
        const report = yield prisma.report.create({
            data: {
                title,
                description,
                fileUrl,
                fileType,
                [authenticatedUser.role === 'admin' ? 'adminCognitoId' : 'userCognitoId']: authenticatedUser.userId,
            },
        });
        console.log("Created report:", { id: report.id, title, fileUrl, fileType });
        res.status(201).json(report);
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in createReport:`, {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error creating report",
            error: error.message,
        });
    }
});
exports.createReport = createReport;
const getReportById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting getReportById with params:`, req.params);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        const { id } = req.params;
        const reportId = parseInt(id, 10);
        if (isNaN(reportId)) {
            console.error("Validation failed: Invalid report ID");
            res.status(400).json({ message: "Invalid report ID" });
            return;
        }
        const where = {
            id: reportId,
            OR: [
                { adminCognitoId: authenticatedUser.userId },
                { userCognitoId: authenticatedUser.userId },
            ],
        };
        const report = yield prisma.report.findFirst({
            where,
            include: {
                admin: { select: { adminCognitoId: true, name: true, email: true } },
                user: { select: { userCognitoId: true, name: true, email: true } },
            },
        });
        if (!report) {
            console.error("Report not found or unauthorized");
            res.status(404).json({ message: "Report not found or unauthorized" });
            return;
        }
        res.status(200).json(serializeReport(report));
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in getReportById:`, {
            message: error.message,
            stack: error.stack,
            params: req.params,
        });
        res.status(500).json({
            message: "Error fetching report",
            error: error.message,
        });
    }
});
exports.getReportById = getReportById;
const deleteReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting deleteReports with body:`, req.body);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser || authenticatedUser.role.toLowerCase() !== "admin") {
            console.error("Authentication failed: No admin or invalid role");
            res.status(401).json({ message: "Unauthorized: Only admins can delete reports" });
            return;
        }
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            console.error("Validation failed: No report IDs provided");
            res.status(400).json({ message: "No report IDs provided" });
            return;
        }
        const reportIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
        if (reportIds.length === 0) {
            console.error("Validation failed: Invalid report IDs");
            res.status(400).json({ message: "Invalid report IDs", details: { providedIds: ids } });
            return;
        }
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        if (!bucket) {
            console.error("Configuration error: AWS_S3_BUCKET_NAME is not defined");
            res.status(500).json({ message: "Server configuration error: S3 bucket name is missing" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const reports = yield tx.report.findMany({
                where: {
                    id: { in: reportIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
                select: { id: true, title: true, fileUrl: true },
            });
            if (reports.length === 0) {
                console.error("No reports found or unauthorized");
                throw new Error("No reports found or unauthorized");
            }
            // Delete S3 objects
            for (const report of reports) {
                const key = report.fileUrl.split('/').slice(3).join('/');
                if (key) {
                    try {
                        yield s3_1.default.deleteObject({ Bucket: bucket, Key: key }).promise();
                        console.log(`Deleted S3 object: ${key}`);
                    }
                    catch (error) {
                        console.error(`Failed to delete S3 object ${key}:`, error.message);
                    }
                }
            }
            const associations = reports.map((report) => ({
                id: report.id,
                title: report.title,
            }));
            const { count } = yield tx.report.deleteMany({
                where: {
                    id: { in: reportIds },
                    OR: [
                        { adminCognitoId: authenticatedUser.userId },
                        { adminCognitoId: null },
                    ],
                },
            });
            return { deletedCount: count, associations };
        }));
        console.log(`Deleted ${result.deletedCount} reports`);
        res.status(200).json({
            message: `Successfully deleted ${result.deletedCount} report(s)`,
            associations: result.associations,
        });
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in deleteReports:`, {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error deleting reports",
            error: error.message,
        });
    }
});
exports.deleteReports = deleteReports;
const exportReportsXlsx = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Starting exportReportsXlsx with body:`, req.body);
        const authenticatedUser = (0, controllerUtils_1.authenticateUser)(req, res);
        if (!authenticatedUser) {
            console.error("Authentication failed: No user found");
            res.status(401).json({ message: "Unauthorized: User not authenticated" });
            return;
        }
        const { page = 1, limit = 100, reportIds, title, fileType, adminCognitoId, userCognitoId, search } = req.body;
        const pageNum = parseInt(String(page), 10);
        const limitNum = parseInt(String(limit), 10);
        if (isNaN(pageNum) || pageNum < 1) {
            console.error("Validation failed: Invalid page number");
            res.status(400).json({ message: "Invalid page number" });
            return;
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            console.error("Validation failed: Invalid limit");
            res.status(400).json({ message: "Limit must be between 1 and 1000" });
            return;
        }
        let where = {};
        if (reportIds) {
            const ids = [...new Set(String(reportIds).split(",").map(id => parseInt(id.trim())))].filter(id => !isNaN(id));
            if (ids.length === 0) {
                console.error("Validation failed: Invalid reportIds");
                res.status(400).json({ message: "Invalid reportIds provided" });
                return;
            }
            where = { id: { in: ids } };
        }
        else {
            if (authenticatedUser.role.toLowerCase() === "admin") {
                where.OR = [
                    { adminCognitoId: authenticatedUser.userId },
                    { adminCognitoId: null },
                ];
            }
            else {
                where.userCognitoId = { equals: authenticatedUser.userId };
            }
            if (title)
                where.title = { contains: String(title), mode: "insensitive" };
            if (fileType && fileType !== "any") {
                if (!Object.values(validMimeTypes).includes(String(fileType))) {
                    console.error("Validation failed: Invalid file type");
                    res.status(400).json({ message: `Invalid file type, must be one of: ${Object.values(validMimeTypes).join(", ")}` });
                    return;
                }
                where.fileType = { equals: String(fileType) };
            }
            if (adminCognitoId)
                where.adminCognitoId = { equals: String(adminCognitoId) };
            if (userCognitoId)
                where.userCognitoId = { equals: String(userCognitoId) };
            if (search) {
                where.OR = [
                    ...(where.OR || []),
                    { title: { contains: String(search), mode: "insensitive" } },
                    { description: { contains: String(search), mode: "insensitive" } },
                    ...(Object.values(validMimeTypes).includes(String(search)) ? [{ fileType: { equals: String(search) } }] : []),
                ];
            }
        }
        const reports = yield prisma.report.findMany(Object.assign({ where, select: {
                id: true,
                title: true,
                description: true,
                fileUrl: true,
                fileType: true,
                uploadedAt: true,
                adminCognitoId: true,
                userCognitoId: true,
            } }, (reportIds ? {} : { skip: (pageNum - 1) * limitNum, take: limitNum })));
        if (!reports.length) {
            console.error("No reports found for export");
            res.status(404).json({ message: "No reports found" });
            return;
        }
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet("Reports");
        worksheet.addRow(["Official Black Gold Africa Traders Ltd Reports"]);
        worksheet.mergeCells("A1:G1");
        worksheet.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFF" } };
        worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
        worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;
        worksheet.addRow([]);
        const headers = ["ID", "Title", "Description", "File URL", "File Type", "Uploaded At", "Admin Cognito ID"];
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D3D3D3" } };
            cell.font = { name: "Calibri", size: 11, bold: true };
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
            cell.alignment = { horizontal: "center" };
        });
        reports.forEach((report) => {
            worksheet.addRow([
                report.id,
                report.title,
                report.description || "",
                report.fileUrl,
                report.fileType,
                report.uploadedAt.toLocaleString("en-GB", { timeZone: "Africa/Nairobi" }),
                report.adminCognitoId,
            ]);
        });
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" },
                    };
                    cell.alignment = { horizontal: "left" };
                });
            }
        });
        const widths = [10, 30, 40, 50, 15, 20, 40];
        widths.forEach((width, i) => {
            worksheet.getColumn(i + 1).width = width;
        });
        const lastRow = worksheet.addRow([]);
        lastRow.getCell(1).value = `Generated from bgatltd.com on ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`;
        lastRow.getCell(1).font = { name: "Calibri", size: 8, italic: true };
        lastRow.getCell(1).alignment = { horizontal: "center" };
        worksheet.mergeCells(`A${lastRow.number}:G${lastRow.number}`);
        worksheet.views = [{ state: "frozen", ySplit: 3 }];
        worksheet.protect("bgatltd2025", {
            selectLockedCells: false,
            selectUnlockedCells: false,
        });
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="reports_${new Date().toISOString().split("T")[0]}.xlsx`);
        yield workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error in exportReportsXlsx:`, {
            message: error.message,
            stack: error.stack,
            requestBody: req.body,
        });
        res.status(500).json({
            message: "Error exporting reports",
            error: error.message,
        });
    }
});
exports.exportReportsXlsx = exportReportsXlsx;
