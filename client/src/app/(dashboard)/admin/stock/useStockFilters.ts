import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { debounce } from "lodash";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters } from "@/state";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface FilterOptions {
    grades?: string[];
    brokers?: string[];
    saleCodes?: string[];
    bags?: { min: number; max: number };
    weight?: { min: number; max: number };
    purchaseValue?: { min: number; max: number };
    totalPurchaseValue?: { min: number; max: number };
    agingDays?: { min: number; max: number };
    penalty?: { min: number; max: number };
    bgtCommission?: { min: number; max: number };
    maerskFee?: { min: number; max: number };
    commission?: { min: number; max: number };
    netPrice?: { min: number; max: number };
    total?: { min: number; max: number };
    lowStockThreshold?: { min: number; max: number };
    manufactureDate?: { min: string; max: string };
    auction?: string[];
    status?: string[];
}

export const useStockFilters = () => {
    const { t } = useTranslation(["stocks", "general"]);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const filters = useSelector((state: any) => state.global.filters) as FiltersState;
    const [localFilters, setLocalFilters] = useState<FiltersState>({ ...filters });
    const [errors, setErrors] = useState<Partial<Record<keyof FiltersState, string>>>({});

    // Mock filter options (replace with API call if needed)
    const filterOptions: FilterOptions = {
        grades: [
            "PD",
            "PD2",
            "DUST",
            "DUST1",
            "DUST2",
            "PF",
            "PF1",
            "BP",
            "BP1",
            "FNGS1",
            "BOP",
            "BOPF",
            "FNGS",
            "FNGS2",
            "BMF",
            "BMFD",
            "PF2",
            "BMF1",
        ],
        brokers: [
            "AMBR",
            "ANJL",
            "ATBL",
            "ATLS",
            "BICL",
            "BTBL",
            "CENT",
            "COMK",
            "CTBL",
            "PRME",
            "PTBL",
            "TBEA",
            "UNTB",
            "VENS",
            "TTBL",
        ],
        saleCodes: ["SALE1", "SALE2", "SALE3"], // Example values, replace with actual data
        bags: { min: 1, max: 1000 },
        weight: { min: 0, max: 100000 },
        purchaseValue: { min: 0, max: 10000 },
        totalPurchaseValue: { min: 0, max: 1000000 },
        agingDays: { min: 0, max: 365 },
        penalty: { min: 0, max: 1000 },
        bgtCommission: { min: 0, max: 1000 },
        maerskFee: { min: 0, max: 1000 },
        commission: { min: 0, max: 1000 },
        netPrice: { min: 0, max: 10000 },
        total: { min: 0, max: 1000000 },
        lowStockThreshold: { min: 0, max: 10000 },
        status: ["PENDING", "SHIPPED", "DELIVERED"], // Example shipment statuses
    };
    const isFilterOptionsLoading = false;

    const updateURL = useCallback(
        debounce((newFilters: FiltersState) => {
            const cleanFilters = cleanParams({
                ...newFilters,
                saleCode: newFilters.saleCode === "any" ? undefined : newFilters.saleCode,
                grade: newFilters.grade === "any" ? undefined : newFilters.grade,
                broker: newFilters.broker === "any" ? undefined : newFilters.broker,
                manufactureDate: newFilters.manufactureDate === "" ? undefined : newFilters.manufactureDate,
                favoriteIds: newFilters.favoriteIds?.length ? newFilters.favoriteIds.join(",") : undefined,
                ids: newFilters.ids?.length ? newFilters.ids.join(",") : undefined,
                showFavorites: newFilters.showFavorites ? "true" : undefined,
            });
            const updatedSearchParams = new URLSearchParams();
            Object.entries(cleanFilters).forEach(([key, value]) => {
                if (value !== undefined) {
                    updatedSearchParams.set(key, value.toString());
                }
            });
            router.push(`${pathname}?${updatedSearchParams.toString()}`);
        }, 300),
        [pathname, router],
    );

    const validateFilter = (key: keyof FiltersState, value: any): string | undefined => {
        if (
            [
                "bags",
                "weight",
                "purchaseValue",
                "totalPurchaseValue",
                "agingDays",
                "penalty",
                "bgtCommission",
                "maerskFee",
                "commission",
                "netPrice",
                "total",
                "lowStockThreshold",
                "baselinePrice",
            ].includes(key)
        ) {
            const num = parseFloat(value);
            if (value && isNaN(num)) return t("stocks:errors.invalidNumber", { defaultValue: "Invalid number" });
            if (key === "bags" && num < 1) return t("stocks:errors.bagsTooLow", { defaultValue: "Bags must be at least 1" });
            if (["weight", "lowStockThreshold"].includes(key) && num < 0)
                return t("stocks:errors.negativeValue", { defaultValue: "Value cannot be negative" });
        } else if (key === "favoriteIds" || key === "ids") {
            const ids = value.split(",").map(Number);
            if (ids.some(isNaN)) return t("stocks:errors.invalidIds", { defaultValue: "Invalid IDs" });
        } else if (key === "manufactureDate" && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) return t("stocks:errors.invalidDate", { defaultValue: "Invalid date" });
        }
        return undefined;
    };

    const handleFilterChange = (key: keyof FiltersState, value: string) => {
        let newValue: FiltersState[typeof key];
        if (value === "" || value === "any") {
            newValue = ["saleCode", "grade", "broker"].includes(key) ? "any" : undefined;
        } else if (
            [
                "bags",
                "weight",
                "purchaseValue",
                "totalPurchaseValue",
                "agingDays",
                "penalty",
                "bgtCommission",
                "maerskFee",
                "commission",
                "netPrice",
                "total",
                "lowStockThreshold",
                "baselinePrice",
            ].includes(key)
        ) {
            const num = parseFloat(value);
            newValue = isNaN(num) ? undefined : num;
        } else if (key === "favoriteIds" || key === "ids") {
            const ids = value.split(",").map(Number).filter((id) => !isNaN(id));
            newValue = ids.length > 0 ? ids : undefined;
        } else if (key === "showFavorites") {
            newValue = value === "true";
        } else {
            newValue = value;
        }
        setLocalFilters((prev) => ({ ...prev, [key]: newValue }));
        setErrors((prev) => ({ ...prev, [key]: validateFilter(key, value) }));
        dispatch(setFilters({ ...filters, [key]: newValue }));
        updateURL({ ...filters, [key]: newValue });
    };

    const handleSubmit = () => {
        if (Object.values(errors).some((error) => error)) {
            toast.error(t("stocks:errors.invalidFilters", { defaultValue: "Invalid filter values" }));
            return;
        }
        dispatch(setFilters(localFilters));
        updateURL(localFilters);
        toast.success(t("stocks:filterApplied", { defaultValue: "Filters applied successfully" }));
    };

    const handleReset = () => {
        setLocalFilters({} as FiltersState);
        dispatch(setFilters({} as FiltersState));
        updateURL({} as FiltersState);
        setErrors({});
        toast.info(t("stocks:filtersReset", { defaultValue: "Filters reset" }));
    };

    return {
        filters,
        localFilters,
        errors,
        filterOptions,
        isFilterOptionsLoading,
        handleFilterChange,
        handleSubmit,
        handleReset,
        formatDate: (date?: string) => (date ? new Date(date).toISOString().slice(0, 10) : ""),
    };
};