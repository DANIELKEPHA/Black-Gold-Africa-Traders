import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import catalogRoutes from "./routes/catalogRoutes";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import outLotsRoutes from "./routes/outLotsRoutes";
import sellingPriceRouter from "./routes/sellingPriceRouter";
import teaStocksRoutes from "./routes/teaStocksRoutes";
import shipmentRoutes from "./routes/shipmentRoutes";
import reportRoutes from "./routes/reportRoutes";

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

// Rate limiter for presigned URL endpoints
const presignedUrlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests for presigned URLs, please try again later.',
});

/* ROUTES */
app.get("/", (req, res) => {
    res.send("This is home route");
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Mount routes
console.log("Mounting routes...");
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/contact-forms", userRoutes);
app.use("/catalogs", catalogRoutes);
app.use("/outLots", outLotsRoutes);
app.use("/sellingPrices", sellingPriceRouter);
app.use("/stocks", teaStocksRoutes);
app.use("/shipments", shipmentRoutes);
app.use("/reports", presignedUrlLimiter, reportRoutes);

/* SERVER */
const port = Number(process.env.PORT) || 3002;

// Add error handling for server startup
try {
    app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on port ${port}`);
    });
} catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
}