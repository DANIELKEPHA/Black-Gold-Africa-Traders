"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const catalogRoutes_1 = __importDefault(require("./routes/catalogRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const outLotsRoutes_1 = __importDefault(require("./routes/outLotsRoutes"));
const sellingPriceRouter_1 = __importDefault(require("./routes/sellingPriceRouter"));
const teaStocksRoutes_1 = __importDefault(require("./routes/teaStocksRoutes"));
const shipmentRoutes_1 = __importDefault(require("./routes/shipmentRoutes"));
/* CONFIGURATIONS */
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
/* ROUTES */
app.get("/", (req, res) => {
    res.send("This is home route");
});
// Mount routes
console.log("Mounting routes...");
app.use("/admin", adminRoutes_1.default);
app.use("/users", userRoutes_1.default);
app.use("/catalogs", catalogRoutes_1.default);
app.use("/outLots", outLotsRoutes_1.default);
app.use("/sellingPrices", sellingPriceRouter_1.default);
app.use("/stocks", teaStocksRoutes_1.default);
app.use("/shipments", shipmentRoutes_1.default);
/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});
