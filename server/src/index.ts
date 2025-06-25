// src/index.ts
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import catalogRoutes from "./routes/catalogRoutes";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import outLotsRoutes from "./routes/outLotsRoutes";
import sellingPriceRouter from "./routes/sellingPriceRouter";
import teaStocksRoutes from "./routes/teaStocksRoutes";
import shipmentRoutes from "./routes/shipmentRoutes";

/* CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

/* ROUTES */
app.get("/", (req, res) => {
    res.send("This is home route");
});

// Mount routes
console.log("Mounting routes...");
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/catalogs", catalogRoutes);
app.use("/outLots", outLotsRoutes);
app.use("/sellingPrices", sellingPriceRouter);
app.use("/stocks", teaStocksRoutes);
app.use("/shipments", shipmentRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
});
