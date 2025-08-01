import { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { debounce } from "lodash";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters } from "@/state";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {Broker, TeaCategory, TeaGrade, TeaProducerCountry} from "@/state/enums";

interface FilterOptions {
    producerCountries?: TeaProducerCountry[];
    grades?: TeaGrade[];
    categories?: TeaCategory[];
    brokers?: Broker[];
    saleCodes?: string[];
    bags?: { min: number; max: number };
    netWeight?: { min: number; max: number };
    totalWeight?: { min: number; max: number };
    askingPrice?: { min: number; max: number };
    manufactureDate?: { min: string; max: string };
}

export const useSellingPricesFilters = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const filters = useSelector((state: any) => state.global.filters) as FiltersState;
    const [localFilters, setLocalFilters] = useState<FiltersState>({ ...filters });
    const [errors, setErrors] = useState<Partial<Record<keyof FiltersState, string>>>({});

    // Mock filter options using enums
    const filterOptions: FilterOptions = {
        producerCountries: Object.values(TeaProducerCountry),
        grades: Object.values(TeaGrade),
        categories: Object.values(TeaCategory),
        brokers: Object.values(Broker),
    };
    const isFilterOptionsLoading = false;

    // Memoize the debounced function to ensure it's created only once
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
                    manufactureDate: newFilters.manufactureDate === "" ? undefined : newFilters.manufactureDate,
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