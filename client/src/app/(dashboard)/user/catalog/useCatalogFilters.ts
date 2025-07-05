import { useState, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
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
}

export const useCatalogFilters = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const [localFilters, setLocalFilters] = useState<FiltersState>({
        sortBy: "lotNo",
        sortOrder: "asc",
    }); // Initialize with default sort values to satisfy FiltersState
    const [errors, setErrors] = useState<Partial<Record<keyof FiltersState, string>>>({});

    const filterOptions: FilterOptions = {
        grades: ["PD", "PD2", "DUST", "DUST1", "DUST2", "PF", "PF1", "BP", "BP1", "FNGS1", "BOP", "BOPF", "FNGS", "FNGS2", "BMF", "BMFD", "PF2", "BMF1"],
        categories: ["M1", "M2", "M3", "S1"],
        brokers: ["AMBR", "ANJL", "ATBL", "ATLS", "BICL", "BTBL", "CENT", "COMK", "CTBL", "PRME", "PTBL", "TBEA", "UNTB", "VENS", "TTBL"],
    };
    const isFilterOptionsLoading = false;

    const debouncedUpdateURL = useMemo(
        () =>
            debounce((newFilters: FiltersState, currentPathname: string, router: ReturnType<typeof useRouter>) => {
                const cleanFilters = cleanParams({
                    ...newFilters,
                    saleCode: newFilters.saleCode === "any" ? undefined : newFilters.saleCode,
                    category: newFilters.category === "any" ? undefined : newFilters.category,
                    grade: newFilters.grade === "any" ? undefined : newFilters.grade,
                    broker: newFilters.broker === "any" ? undefined : newFilters.broker,
                    producerCountry: newFilters.producerCountry === "any" ? undefined : newFilters.producerCountry,
                });
                const updatedSearchParams = new URLSearchParams();
                Object.entries(cleanFilters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        updatedSearchParams.set(key, value.toString());
                    }
                });
                router.push(`${currentPathname}?${updatedSearchParams.toString()}`);
            }, 300),
        []
    );

    const updateURL = useCallback(
        (newFilters: FiltersState) => {
            debouncedUpdateURL(newFilters, pathname, router);
        },
        [debouncedUpdateURL, pathname, router]
    );

    const handleFilterChange = (key: keyof FiltersState, value: string) => {
        let newValue: FiltersState[typeof key];
        if (value === "" || value === "any") {
            newValue = ["saleCode", "category", "grade", "broker", "producerCountry"].includes(key) ? "any" : undefined;
        } else {
            newValue = value;
        }
        setLocalFilters((prev) => ({ ...prev, [key]: newValue } as FiltersState));
        dispatch(setFilters({ ...localFilters, [key]: newValue } as FiltersState));
        updateURL({ ...localFilters, [key]: newValue } as FiltersState);
    };

    const handleSubmit = () => {
        dispatch(setFilters(localFilters));
        updateURL(localFilters);
        toast.success(t("catalog:filterApplied", { defaultValue: "Filters applied successfully" }));
    };

    const handleReset = () => {
        setLocalFilters({ sortBy: "lotNo", sortOrder: "asc" } as FiltersState); // Reset to default FiltersState
        dispatch(setFilters({ sortBy: "lotNo", sortOrder: "asc" } as FiltersState));
        updateURL({ sortBy: "lotNo", sortOrder: "asc" } as FiltersState);
        setErrors({});
        toast.info(t("catalog:filtersReset", { defaultValue: "Filters reset" }));
    };

    return {
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