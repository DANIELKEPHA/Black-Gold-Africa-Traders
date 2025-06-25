"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationIdMiddleware = void 0;
const uuid_1 = require("uuid");
const correlationIdMiddleware = (req, res, next) => {
    req.requestId = req.header("X-Request-ID") || (0, uuid_1.v4)();
    res.setHeader("X-Request-ID", req.requestId);
    next();
};
exports.correlationIdMiddleware = correlationIdMiddleware;
