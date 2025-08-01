import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { debounce } from "lodash";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters } from "@/state";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface FilterOptions {
    producerCountries?: string[];
    grades?: string[];
    categories?: string[];
    brokers?: string[];
    saleCodes?: string[];
    bags?: { min: number; max: number };
    netWeight?: { min: number; max: number };
    totalWeight?: { min: number; max: number };
    askingPrice?: { min: number; max: number };
    manufactureDate?: { min: string; max: string };
}

export const useOutLotsFilters = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const filters = useSelector((state: any) => state.global.filters) as FiltersState;
    const [localFilters, setLocalFilters] = useState<FiltersState>({ ...filters });
    const [errors, setErrors] = useState<Partial<Record<keyof FiltersState, string>>>({});

    // Mock filter options for simplicity (replace with API call if needed)
    const filterOptions: FilterOptions = {
        grades: ["PD", "PD2", "DUST", "DUST1", "DUST2", "PF", "PF1", "BP", "BP1", "FNGS1", "BOP", "BOPF", "FNGS", "FNGS2", "BMF", "BMFD", "PF2", "BMF1"],
        categories: ["M1", "M2", "M3", "S1"],
        brokers: ["AMBR", "ANJL", "ATBL", "ATLS", "BICL", "BTBL", "CENT", "COMK", "CTBL", "PRME", "PTBL", "TBEA", "UNTB", "VENS", "TTBL"],
    };
    const isFilterOptionsLoading = false;

    const updateURL = useCallback(
        (newFilters: FiltersState) => {
            const debouncedUpdate = debounce((filters: FiltersState) => {
                const cleanFilters = cleanParams({
                    ...filters,
                    saleCode: filters.saleCode === "any" ? undefined : filters.saleCode,
                    category: filters.category === "any" ? undefined : filters.category,
                    grade: filters.grade === "any" ? undefined : filters.grade,
                    broker: filters.broker === "any" ? undefined : filters.broker,
                    producerCountry: filters.producerCountry === "any" ? undefined : filters.producerCountry,
                    manufactureDate: filters.manufactureDate === "" ? undefined : filters.manufactureDate,
                });
                const updatedSearchParams = new URLSearchParams();
                Object.entries(cleanFilters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        updatedSearchParams.set(key, value.toString());
                    }
                });
                router.push(`${pathname}?${updatedSearchParams.toString()}`);
            }, 300);
            debouncedUpdate(newFilters);
        },
        [pathname, router]
    );

    const validateFilter = (key: keyof FiltersState, value: any): string | undefined => {
        if (["bags", "netWeight", "totalWeight", "askingPrice", "reprint"].includes(key)) {
            const num = parseFloat(value);
            if (value && isNaN(num)) return t("catalog:errors.invalidNumber", { defaultValue: "Invalid number" });
            if (key === "bags" && num < 1) return t("catalog:errors.bagsTooLow", { defaultValue: "Bags must be at least 1" });
        }
        return undefined;
    };

    const handleFilterChange = (key: keyof FiltersState, value: string) => {
        let newValue: FiltersState[typeof key];
        if (value === "" || value === "any") {
            newValue = ["saleCode", "category", "grade", "broker", "producerCountry"].includes(key) ? "any" : undefined;
        } else if (["bags", "netWeight", "totalWeight", "askingPrice", "reprint"].includes(key)) {
            const num = parseFloat(value);
            newValue = isNaN(num) ? undefined : num;
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
            toast.error(t("catalog:errors.invalidFilters", { defaultValue: "Invalid filter values" }));
            return;
        }
        dispatch(setFilters(localFilters));
        updateURL(localFilters);
        toast.success(t("catalog:filterApplied", { defaultValue: "Filters applied successfully" }));
    };

    const handleReset = () => {
        setLocalFilters({} as FiltersState);
        dispatch(setFilters({} as FiltersState));
        updateURL({} as FiltersState);
        setErrors({});
        toast.info(t("catalog:filtersReset", { defaultValue: "Filters reset" }));
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
        formatDate: (date?: string) => date?.split("T")[0] || "",
    };
};