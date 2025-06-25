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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const client = (0, jwks_rsa_1.default)({
    jwksUri: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8sc2M4oo4/.well-known/jwks.json",
});
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, undefined);
            return;
        }
        const signingKey = key === null || key === void 0 ? void 0 : key.getPublicKey();
        callback(null, signingKey);
    });
}
const authMiddleware = (allowedRoles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const authHeader = req.header("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const token = authHeader.split(" ")[1];
        try {
            jsonwebtoken_1.default.verify(token, getKey, {
                issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8sc2M4oo4",
                audience: "l8jun63kuu65vfssqhsj88tgq",
                clockTolerance: 86400, // 24 hours to handle future iat
            }, (err, decoded) => {
                if (err) {
                    console.error("Token verification error:", err);
                    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
                    return;
                }
                const payload = decoded;
                console.log("Decoded token payload:", {
                    sub: payload.sub,
                    customRole: payload["custom:role"],
                    tokenUse: payload.token_use,
                });
                if (payload.token_use !== "id") {
                    res.status(401).json({ message: "Unauthorized: ID token required" });
                    return;
                }
                const rawRole = payload["custom:role"] || "user";
                if (typeof rawRole !== "string") {
                    res.status(403).json({ message: "Forbidden: Invalid role" });
                    return;
                }
                const role = rawRole.toLowerCase();
                const hasAccess = allowedRoles.length === 0 || allowedRoles.map(r => r.toLowerCase()).includes(role);
                if (!hasAccess) {
                    res.status(403).json({ message: "Forbidden: Insufficient permissions" });
                    return;
                }
                req.user = {
                    id: payload.sub,
                    userId: payload.sub,
                    role,
                    email: payload.email || "",
                    username: payload["cognito:username"],
                    phoneNumber: payload.phone_number,
                    tokenUse: payload.token_use,
                };
                next();
            });
        }
        catch (err) {
            console.error("Middleware error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    });
};
exports.authMiddleware = authMiddleware;
