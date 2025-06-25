import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Extend Express request to store user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                userCognitoId: string;
                role: string;
                email: string;
                username?: string;
                phoneNumber?: string;
                tokenUse?: "id" | "access";
            };
        }
    }
}

const client = jwksClient({
    jwksUri: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8sc2M4oo4/.well-known/jwks.json",
});

function getKey(header: any, callback: (err: Error | null, key: string | undefined) => void) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err, undefined);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export const authMiddleware = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.header("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }

        const token = authHeader.split(" ")[1];

        try {
            jwt.verify(token, getKey, {
                issuer: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8sc2M4oo4",
                audience: "l8jun63kuu65vfssqhsj88tgq",
                clockTolerance: 86400, // 24 hours to handle future iat
            }, (err, decoded) => {
                if (err) {
                    console.error("Token verification error:", err);
                    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
                    return;
                }

                const payload = decoded as jwt.JwtPayload;
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
                    id: payload.sub as string,
                    userId: payload.sub as string,
                    role,
                    email: payload.email || "",
                    username: payload["cognito:username"],
                    phoneNumber: payload.phone_number,
                    tokenUse: payload.token_use as "id" | "access",
                };

                next();
            });
        } catch (err) {
            console.error("Middleware error:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    };
};