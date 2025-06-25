import catalog from "./en/catalog.json";
import stocks from "./en/stock.json";
import shipment from "./en/shipment.json";
import shipments from "./en/shipments.json";
import upload from "./en/upload.json";
import general from "./en/general.json";
import sellingPrices from "./en/sellingPrices.json";


export const resources = {
    en: {
        catalog,
        stocks,
        shipment,
        shipments,
        upload,
        general,
        sellingPrices
    }
} as const;