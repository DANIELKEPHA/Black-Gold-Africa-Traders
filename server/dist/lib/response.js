"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
exports.formatPaginatedResponse = formatPaginatedResponse;
const successResponse = (data, message) => ({
    status: "success",
    data,
    message,
});
exports.successResponse = successResponse;
const errorResponse = (message, details) => ({
    status: "error",
    message,
    details,
});
exports.errorResponse = errorResponse;
function formatPaginatedResponse(data, meta) {
    return { data, meta };
}
