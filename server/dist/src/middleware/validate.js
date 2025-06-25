"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });
    if (!result.success) {
        res.status(400).json({
            status: "fail",
            message: result.error.errors.map((e) => e.message).join(", "),
        });
        return; // ✅ Early return, but still returns void
    }
    next();
};
exports.validate = validate;
