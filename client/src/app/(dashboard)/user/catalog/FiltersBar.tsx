"use client";

import {
    FiltersState,
    initialState,
    setFilters,
    setViewMode,
    toggleFiltersFullOpen,
} from "@/state";
import { useAppSelector } from "@/state/redux";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";
import { cn, cleanParams } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import {
    useExportCatalogsCsvMutation,
    useGetAuthUserQuery,
    useGetCatalogFilterOptionsQuery,
    useGetCatalogQuery,
} from "@/state/api";
import { Broker, TeaCategory, TeaGrade } from "@/state/enums";

interface LocalCatalogFilterOptions {
    producerCountries?: string[];
    grades?: string[];
    categories?: string[];
    brokers?: string[];
    saleCode?: { min: number; max: number };
    manufactureDate?: { min: string; max: string };
}

interface Catalog {
    id: number;
    // Other catalog fields as needed
}

interface FiltersBarProps {
    selectedItems?: number[];
}

const FiltersBar: React.FC<FiltersBarProps> = ({ selectedItems = [] }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const filters = useAppSelector((state) => state.global.filters);
    const isFiltersFullOpen = useAppSelector((state) => state.global.isFiltersFullOpen);
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const { data: authData, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const isAdmin = authData?.userRole?.toLowerCase() === "admin" || false;
    const [searchInput, setSearchInput] = useState(filters.search ?? "");
    const { data: filterOptions, isLoading: isFilterOptionsLoading, isError } =
        useGetCatalogFilterOptionsQuery() as {
            data: LocalCatalogFilterOptions | undefined;
            isLoading: boolean;
            isError: boolean;
        };
    const { data: { data: catalogData = [] } = {}, isLoading: isCatalogsLoading } = useGetCatalogQuery({
        ...cleanParams({
            saleCode: filters.saleCode === "any" ? undefined : filters.saleCode,
            category: filters.category === "any" ? undefined : filters.category,
            grade: filters.grade === "any" ? undefined : filters.grade,
            broker: filters.broker === "any" ? undefined : filters.broker,
            producerCountry: filters. producerCountry === "any" ? undefined : filters. producerCountry,
            search: filters.search,
            sellingMark: filters.sellingMark,
            invoiceNo: filters.invoiceNo,
            reprint: filters.reprint,
        }),
    });
    const [triggerExport, { isLoading: isExportLoading }] = useExportCatalogsCsvMutation();

    // Handle filter options loading error
    React.useEffect(() => {
        if (isError) {
            toast.error(t("general:errors.filterOptionsFailed", { defaultValue: "Failed to load filter options" }));
        }
    }, [isError, t]);

    const updateURL = debounce((newFilters: FiltersState) => {
        const cleanFilters = cleanParams({
            ...newFilters,
            saleCode: newFilters.saleCode === "any" ? undefined : newFilters.saleCode,
            category: newFilters.category === "any" ? undefined : newFilters.category,
            grade: newFilters.grade === "any" ? undefined : newFilters.grade,
            broker: newFilters.broker === "any" ? undefined : newFilters.broker,
            producerCountry: newFilters. producerCountry === "any" ? undefined : newFilters. producerCountry,
            manufactureDate: newFilters.manufactureDate === "" ? undefined : newFilters.manufactureDate,
        });
        const updatedSearchParams = new URLSearchParams();
        Object.entries(cleanFilters).forEach(([key, value]) => {
            if (value !== undefined) {
                updatedSearchParams.set(key, value.toString());
            }
        });
        router.push(`${pathname}?${updatedSearchParams.toString()}`);
    }, 300);

    const handleFilterChange = (key: keyof FiltersState, value: string) => {
        let newValue: FiltersState[typeof key];
        if (key === "grade") {
            newValue = value === "" || value === "any" ? "any" : (value as TeaGrade);
        } else if (key === "category") {
            newValue = value === "" || value === "any" ? "any" : (value as TeaCategory);
        } else if (key === "broker") {
            newValue = value === "" || value === "any" ? "any" : (value as Broker);
        } else if (key === "producerCountry") {
            newValue = value === "" || value === "any" ? "any" : value;
        } else if (key === "saleCode") {
            const num = parseFloat(value);
            newValue = value === "" || value === "any" ? "any" : isNaN(num) ? undefined : num;
        } else if (key === "reprint") {
            const num = parseFloat(value);
            newValue = isNaN(num) ? undefined : num;
        } else if (["page", "limit"].includes(key as string)) {
            const num = parseInt(value, 10);
            newValue = isNaN(num) ? undefined : num;
        } else {
            newValue = value === "" || value === "any" ? undefined : value;
        }
        const newFilters = { ...filters, [key]: newValue };
        dispatch(setFilters(newFilters));
        if (!isFiltersFullOpen) {
            updateURL(newFilters);
        }
    };

    const handleSearch = () => {
        handleFilterChange("search", searchInput);
    };

    const handleSubmit = () => {
        dispatch(setFilters(filters));
        updateURL(filters);
        toast.success(t("catalog:filterApplied", { defaultValue: "Filters applied successfully" }));
    };

    const handleReset = () => {
        dispatch(setFilters(initialState.filters));
        setSearchInput("");
        updateURL(initialState.filters);
        toast.info(t("catalog:filtersReset", { defaultValue: "Filters reset" }));
    };

    const handleDownloadCSV = async () => {
        try {
            const ids = selectedItems.length > 0 ? selectedItems : Array.isArray(catalogData) ? catalogData.map((item) => item.id) : [];
            if (ids.length === 0) {
                toast.error(t("catalog:errors.noItems", { defaultValue: "No catalogs available to export" }));
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting catalogs with IDs:`, ids);
            await triggerExport({ catalogIds: ids }).unwrap();
            toast.success(
                t("catalog:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }),
                {
                    description: t("catalog:success.csvDownloadedDesc", {
                        defaultValue: "Stocks data exported to CSV",
                    }),
                }
            );
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            const errorMessage = t("catalog:errors.csvError", { defaultValue: "CSV Export Failed" });
            let errorDescription = t("catalog:errors.csvFailed", { defaultValue: "Failed to export catalog to CSV" });

            if (err.status === 400) {
                errorDescription = t("catalog:errors.invalidParams", { defaultValue: "Invalid catalog IDs provided" });
            } else if (err.status === 403) {
                errorDescription = t("catalog:errors.forbidden", { defaultValue: "You are not authorized to export catalogs" });
            } else if (err.status === 404) {
                errorDescription = t("catalog:errors.noCatalogs", { defaultValue: "No catalogs found for the provided IDs" });
            } else if (err.message) {
                errorDescription = err.message;
            }

            toast.error(errorMessage, { description: errorDescription });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-sm">
            <div className="flex justify-between items-center w-full py-3 px-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        className={cn(
                            "gap-2 rounded-sm border-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700",
                            isFiltersFullOpen && "bg-indigo-600 text-white"
                        )}
                        onClick={() => dispatch(toggleFiltersFullOpen())}
                        aria-label={t("catalog:actions.allFilters", { defaultValue: "All Filters" })}
                        disabled={isFilterOptionsLoading}
                    >
                        <Filter className="w-4 h-4" />
                        <span>{t("catalog:actions.allFilters", { defaultValue: "All Filters" })}</span>
                    </Button>
                    <div className="flex items-center">
                        <Input
                            placeholder={t("catalog:searchPlaceholder", { defaultValue: "Search by Lot No or Selling Mark..." })}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => !isFiltersFullOpen && e.key === "Enter" && handleSearch()}
                            className="w-36 sm:w-48 rounded-l-sm rounded-r-none border-indigo-400 dark:border-indigo-600 border-r-0"
                            aria-label={t("catalog:searchPlaceholder", { defaultValue: "Search by Lot No or Selling Mark..." })}
                            disabled={isFilterOptionsLoading}
                        />
                        <Button
                            onClick={handleSearch}
                            className="rounded-r-sm rounded-l-none border-l-none border-indigo-400 dark:border-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700"
                            aria-label={t("catalog:searchPlaceholder", { defaultValue: "Search by Lot No or Selling Mark..." })}
                            disabled={isFilterOptionsLoading}
                        >
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>
                    {!isFiltersFullOpen && (
                        <div className="flex flex-wrap gap-2">
                            <Input
                                type="number"
                                placeholder={t("catalog:salePlaceholder", { defaultValue: "Sale" })}
                                value={filters.saleCode === "any" ? "" : filters.saleCode ?? ""}
                                onChange={(e) => handleFilterChange("saleCode", e.target.value)}
                                className="w-20 sm:w-24 rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.saleCode?.min ?? 1}
                                max={filterOptions?.saleCode?.max ?? 12}
                                aria-label={t("catalog:salePlaceholder", { defaultValue: "Sale" })}
                                disabled={isFilterOptionsLoading}
                            />
                            <Select
                                value={filters.category ?? "any"}
                                onValueChange={(value) => handleFilterChange("category", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-24 sm:w-28 rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("catalog:categoryPlaceholder", { defaultValue: "Category" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("catalog:anyCategory", { defaultValue: "Any Category" })}</SelectItem>
                                    {filterOptions?.categories?.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.grade ?? "any"}
                                onValueChange={(value) => handleFilterChange("grade", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-24 sm:w-28 rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("catalog:gradePlaceholder", { defaultValue: "Grade" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("catalog:anyGrade", { defaultValue: "Any Grade" })}</SelectItem>
                                    {filterOptions?.grades?.map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                            {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 rounded-sm border-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700"
                        onClick={handleDownloadCSV}
                        disabled={isExportLoading || isAuthLoading || isCatalogsLoading}
                        aria-label={t("catalog:actions.download", { defaultValue: "Download" })}
                    >
                        <Download className="w-4 h-4" />
                        <span>
              {isExportLoading
                  ? t("catalog:downloading", { defaultValue: "Downloading..." })
                  : t("catalog:actions.download", { defaultValue: "Download" })}
            </span>
                    </Button>
                    <div className="flex border rounded-sm border-indigo-400">
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-2 py-1 rounded-l-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                                viewMode === "list" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-600 dark:text-white"
                            )}
                            onClick={() => dispatch(setViewMode("list"))}
                            aria-label={t("catalog:listView", { defaultValue: "List View" })}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-2 py-4 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700",
                                viewMode === "grid" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-600 dark:text-white"
                            )}
                            onClick={() => dispatch(setViewMode("grid"))}
                            aria-label={t("catalog:gridView", { defaultValue: "Grid View" })}
                        >
                            <Grid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
            {isFiltersFullOpen && (
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}</Label>
                            <Input
                                placeholder={t("catalog:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}
                                value={filters.sellingMark ?? ""}
                                onChange={(e) => handleFilterChange("sellingMark", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("catalog:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:invoiceNoPlaceholder", { defaultValue: "Invoice No" })}</Label>
                            <Input
                                placeholder={t("catalog:invoiceNoPlaceholder", { defaultValue: "Invoice No" })}
                                value={filters.invoiceNo ?? ""}
                                onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("catalog:invoiceNoPlaceholder", { defaultValue: "Invoice No" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:brokerPlaceholder", { defaultValue: "Broker" })}</Label>
                            <Select
                                value={filters.broker ?? "any"}
                                onValueChange={(value) => handleFilterChange("broker", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("catalog:brokerPlaceholder", { defaultValue: "Broker" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("catalog:anyBroker", { defaultValue: "Any Broker" })}</SelectItem>
                                    {(filterOptions?.brokers || []).map((broker) => (
                                        <SelectItem key={broker} value={broker}>
                                            {broker}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:gradePlaceholder", { defaultValue: "Grade" })}</Label>
                            <Select
                                value={filters.grade ?? "any"}
                                onValueChange={(value) => handleFilterChange("grade", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("catalog:gradePlaceholder", { defaultValue: "Grade" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("catalog:anyGrade", { defaultValue: "Any Grade" })}</SelectItem>
                                    {(filterOptions?.grades || []).map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                            {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:categoryPlaceholder", { defaultValue: "Category" })}</Label>
                            <Select
                                value={filters.category ?? "any"}
                                onValueChange={(value) => handleFilterChange("category", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("catalog:categoryPlaceholder", { defaultValue: "Category" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("catalog:anyCategory", { defaultValue: "Any Category" })}</SelectItem>
                                    {(filterOptions?.categories || []).map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:saleCodePlaceholder", { defaultValue: "Sale Code" })}</Label>
                            <Input
                                placeholder={t("catalog:saleCodePlaceholder", { defaultValue: "Sale Code" })}
                                value={filters.saleCode ?? ""}
                                onChange={(e) => handleFilterChange("saleCode", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("catalog:saleCodePlaceholder", { defaultValue: "Sale Code" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:countryPlaceholder", { defaultValue: " producerCountry" })}</Label>
                            <Select
                                value={filters. producerCountry ?? "any"}
                                onValueChange={(value) => handleFilterChange("producerCountry", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("catalog:countryPlaceholder", { defaultValue: "producerCountry" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("catalog:anyCountry", { defaultValue: "Any Country" })}</SelectItem>
                                    {(filterOptions?.producerCountries || []).map((producerCountry) => (
                                        <SelectItem key={producerCountry} value={producerCountry}>
                                            {producerCountry}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("catalog:reprintPlaceholder", { defaultValue: "Reprint" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("catalog:reprintPlaceholder", { defaultValue: "Reprint" })}
                                value={filters.reprint ?? ""}
                                onChange={(e) => handleFilterChange("reprint", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={0}
                                aria-label={t("catalog:reprintPlaceholder", { defaultValue: "Reprint" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-indigo-600 text-white dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 rounded-sm"
                            aria-label={t("catalog:apply", { defaultValue: "Apply" })}
                            disabled={isFilterOptionsLoading}
                        >
                            {t("catalog:apply", { defaultValue: "Apply" })}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="flex-1 rounded-sm border-indigo-400 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-200 dark:hover:bg-indigo-700"
                            aria-label={t("catalog:resetFilters", { defaultValue: "Reset Filters" })}
                            disabled={isFilterOptionsLoading}
                        >
                            {t("catalog:resetFilters", { defaultValue: "Reset Filters" })}
                        </Button>
                    </div>
                </div>
            )}
            <Toaster position="top-right" richColors />
        </div>
    );
};

export default FiltersBar;