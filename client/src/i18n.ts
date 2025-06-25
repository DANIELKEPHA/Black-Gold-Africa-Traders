"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";

i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    ns: ["catalog", "stock", "shipment", "shipments", "upload", "general", "sellingPrices"],
    defaultNS: "catalog",
    interpolation: {
        escapeValue: false,
    },
    debug: false, // Disabled debug mode for production
    returnObjects: true,
    missingKeyHandler: (lngs, ns, key) => key, // Return key silently if missing
});

export default i18n;