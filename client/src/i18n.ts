// src/i18n.ts
"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";

interface Resources {
    catalog: typeof import("./locales/en/catalog.json");
    stock: typeof import("./locales/en/stock.json");
    shipment: typeof import("./locales/en/shipment.json");
    shipments: typeof import("./locales/en/shipments.json");
    upload: typeof import("./locales/en/upload.json");
    general: typeof import("./locales/en/general.json");
    sellingPrices: typeof import("./locales/en/sellingPrices.json");
}

declare module "react-i18next" {
    interface CustomTypeOptions {
        defaultNS: "catalog";
        resources: Resources;
        returnNull: false;
    }
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en",
        fallbackLng: "en",
        ns: ["catalog", "stock", "shipment", "shipments", "upload", "general", "sellingPrices"],
        defaultNS: "catalog",
        interpolation: { escapeValue: false },
        debug: process.env.NODE_ENV === "development",
        returnObjects: false,
        missingKeyHandler: (lngs, ns, key) => {
            console.warn(`Missing translation for key: ${key} in namespace: ${ns}`);
            return key;
        },
    });

export default i18n;