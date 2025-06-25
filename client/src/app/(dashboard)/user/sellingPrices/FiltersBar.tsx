"use client"

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
    useExportSellingPricesCsvMutation,
    useGetAuthUserQuery,
    useGetSellingPricesFilterOptionsQuery,
    useGetSellingPricesQuery,
} from "@/state/api";
import { Broker, TeaCategory, TeaGrade } from "@/state/enums";

interface LocalSellingPricesFilterOptions {
    countries?: string[];
    grades?: string[];
    categories?: string[];
    brokers?: string[];
    saleCodes?: string[];
    sellingMarks?: string[];
    invoiceNos?: string[];
    bags?: { min: number; max: number };
    totalWeight?: { min: number; max: number };
    netWeight?: { min: number; max: number };
    askingPrice?: { min: number; max: number };
    purchasePrice?: { min: number; max: number };
    manufactureDate?: { min: string; max: string };
}

interface SellingPrice {
    id: number;
    lotNo: string;
    sellingMark: string;
    bags: number;
    totalWeight: number;
    netWeight: number;
    invoiceNo: string | null;
    saleCode: string;
    askingPrice: number;
    purchasePrice: number | null;
    producerCountry: string | null;
    manufactureDate: string;
    category: TeaCategory;
    grade: TeaGrade;
    broker: Broker;
    reprint: number;
}

interface FiltersBarProps {
    selectedItems?: number[];
}

const FiltersBar: React.FC<FiltersBarProps> = ({ selectedItems = [] }) => {
    const { t } = useTranslation(["sellingPrices", "general"]);
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
        useGetSellingPricesFilterOptionsQuery() as {
            data: LocalSellingPricesFilterOptions | undefined;
            isLoading: boolean;
            isError: boolean;
        };
    const { data: { data: sellingPricesData = [] } = {}, isLoading: isSellingPricesLoading } = useGetSellingPricesQuery({
        ...cleanParams({
            saleCode: filters.saleCode === "any" ? undefined : filters.saleCode,
            category: filters.category === "any" ? undefined : filters.category,
            grade: filters.grade === "any" ? undefined : filters.grade,
            broker: filters.broker === "any" ? undefined : filters.broker,
            producerCountry: filters.producerCountry === "any" ? undefined : filters.producerCountry,
            lotNo: filters.lotNo === "any" ? undefined : filters.lotNo,
            sellingMark: filters.sellingMark === "any" ? undefined : filters.sellingMark,
            invoiceNo: filters.invoiceNo === "any" ? undefined : filters.invoiceNo,
            bags: filters.bags,
            totalWeight: filters.totalWeight,
            netWeight: filters.netWeight,
            askingPrice: filters.askingPrice,
            purchasePrice: filters.purchasePrice,
            manufactureDate: filters.manufactureDate,
            reprint: filters.reprint,
            search: filters.search,
        }),
    });
    const [triggerExport, { isLoading: isExportLoading }] = useExportSellingPricesCsvMutation();

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
            producerCountry: newFilters.producerCountry === "any" ? undefined : newFilters.producerCountry,
            lotNo: newFilters.lotNo === "any" ? undefined : newFilters.lotNo,
            sellingMark: newFilters.sellingMark === "any" ? undefined : newFilters.sellingMark,
            invoiceNo: newFilters.invoiceNo === "any" ? undefined : newFilters.invoiceNo,
            bags: newFilters.bags,
            totalWeight: newFilters.totalWeight,
            netWeight: newFilters.netWeight,
            askingPrice: newFilters.askingPrice,
            purchasePrice: newFilters.purchasePrice,
            manufactureDate: newFilters.manufactureDate === "" ? undefined : newFilters.manufactureDate,
            reprint: newFilters.reprint,
        });
        const updatedSearchParams = new URLSearchParams();
        Object.entries(cleanFilters).forEach(([key, value]) => {
            if (value !== undefined) {
                updatedSearchParams.set(key, value.toString());
            }
        });
        router.push(`${pathname}?${updatedSearchParams.toString()}`);
    }, 300);

    const handleFilterChange = (key: keyof FiltersState, value: string | number) => {
        let newValue: FiltersState[typeof key];
        if (key === "grade") {
            newValue = value === "" || value === "any" ? "any" : (value as TeaGrade);
        } else if (key === "category") {
            newValue = value === "" || value === "any" ? "any" : (value as TeaCategory);
        } else if (key === "broker") {
            newValue = value === "" || value === "any" ? "any" : (value as Broker);
        } else if (key === "producerCountry" || key === "saleCode" || key === "lotNo" || key === "sellingMark" || key === "invoiceNo") {
            newValue = value === "" || value === "any" ? "any" : value.toString();
        } else if (key === "bags" || key === "totalWeight" || key === "netWeight" || key === "askingPrice" || key === "purchasePrice" || key === "reprint") {
            const num = parseFloat(value.toString());
            newValue = isNaN(num) ? undefined : num;
        } else if (key === "manufactureDate") {
            newValue = value === "" ? undefined : value.toString();
        } else if (["page", "limit"].includes(key as string)) {
            const num = parseInt(value.toString(), 10);
            newValue = isNaN(num) ? undefined : num;
        } else {
            newValue = value === "" ? undefined : value.toString();
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
        toast.success(t("sellingPrices:filterApplied", { defaultValue: "Filters applied successfully" }));
    };

    const handleReset = () => {
        dispatch(setFilters(initialState.filters));
        setSearchInput("");
        updateURL(initialState.filters);
        toast.info(t("sellingPrices:filtersReset", { defaultValue: "Filters reset" }));
    };

    const handleDownloadCSV = async () => {
        try {
            const ids = selectedItems.length > 0 ? selectedItems : Array.isArray(sellingPricesData) ? sellingPricesData.map((item) => item.id) : [];
            if (ids.length === 0) {
                toast.error(t("sellingPrices:errors.noItems", { defaultValue: "No selling prices available to export" }));
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting selling prices with IDs:`, ids);

            await triggerExport({ sellingPriceIds: ids }).unwrap();

            toast.success(
                t("sellingPrices:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }),
                {
                    description: t("sellingPrices:success.csvDownloadedDesc", {
                        defaultValue: "Selling prices data exported to CSV",
                    }),
                }
            );
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            const errorMessage = t("sellingPrices:errors.csvError", { defaultValue: "CSV Export Failed" });
            let errorDescription = t("sellingPrices:errors.csvFailed", { defaultValue: "Failed to export selling prices to CSV" });

            if (err.status === 400) {
                errorDescription = t("sellingPrices:errors.invalidParams", { defaultValue: "Invalid selling price IDs provided" });
            } else if (err.status === 403) {
                errorDescription = t("sellingPrices:errors.forbidden", { defaultValue: "You are not authorized to export selling prices" });
            } else if (err.status === 404) {
                errorDescription = t("sellingPrices:errors.noSellingPrices", { defaultValue: "No selling prices found for the provided IDs" });
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
                        aria-label={t("sellingPrices:actions.allFilters", { defaultValue: "All Filters" })}
                        disabled={isFilterOptionsLoading}
                    >
                        <Filter className="w-4 h-4" />
                        <span>{t("sellingPrices:actions.allFilters", { defaultValue: "All Filters" })}</span>
                    </Button>
                    <div className="flex items-center">
                        <Input
                            placeholder={t("sellingPrices:searchPlaceholder", { defaultValue: "Search by Lot No, Selling Mark, Invoice No..." })}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => !isFiltersFullOpen && e.key === "Enter" && handleSearch()}
                            className="w-36 sm:w-48 rounded-l-sm rounded-r-none border-indigo-400 dark:border-indigo-600 border-r-0"
                            aria-label={t("sellingPrices:searchPlaceholder", { defaultValue: "Search by Lot No, Selling Mark, Invoice No..." })}
                            disabled={isFilterOptionsLoading}
                        />
                        <Button
                            onClick={handleSearch}
                            className="rounded-r-sm rounded-l-none border-l-none border-indigo-400 dark:border-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700"
                            aria-label={t("sellingPrices:searchPlaceholder", { defaultValue: "Search by Lot No, Selling Mark, Invoice No..." })}
                            disabled={isFilterOptionsLoading}
                        >
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>
                    {!isFiltersFullOpen && (
                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.saleCode ?? "any"}
                                onValueChange={(value) => handleFilterChange("saleCode", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-24 sm:w-28 rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:saleCodePlaceholder", { defaultValue: "Sale Code" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anySaleCode", { defaultValue: "Any Sale Code" })}</SelectItem>
                                    {filterOptions?.saleCodes?.map((saleCode) => (
                                        <SelectItem key={saleCode} value={saleCode}>
                                            {saleCode}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.category ?? "any"}
                                onValueChange={(value) => handleFilterChange("category", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-24 sm:w-28 rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:categoryPlaceholder", { defaultValue: "Category" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anyCategory", { defaultValue: "Any Category" })}</SelectItem>
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
                                    <SelectValue placeholder={t("sellingPrices:gradePlaceholder", { defaultValue: "Grade" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anyGrade", { defaultValue: "Any Grade" })}</SelectItem>
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
                        disabled={isExportLoading || isAuthLoading || isSellingPricesLoading}
                        aria-label={t("sellingPrices:actions.download", { defaultValue: "Download" })}
                    >
                        <Download className="w-4 h-4" />
                        <span>
                            {isExportLoading
                                ? t("sellingPrices:downloading", { defaultValue: "Downloading..." })
                                : t("sellingPrices:actions.download", { defaultValue: "Download" })}
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
                            aria-label={t("sellingPrices:listView", { defaultValue: "List View" })}
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
                            aria-label={t("sellingPrices:gridView", { defaultValue: "Grid View" })}
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
                            <Label className="font-medium mb-1">{t("sellingPrices:saleCodePlaceholder", { defaultValue: "Sale Code" })}</Label>
                            <Select
                                value={filters.saleCode ?? "any"}
                                onValueChange={(value) => handleFilterChange("saleCode", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:saleCodePlaceholder", { defaultValue: "Sale Code" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anySaleCode", { defaultValue: "Any Sale Code" })}</SelectItem>
                                    {(filterOptions?.saleCodes || []).map((saleCode) => (
                                        <SelectItem key={saleCode} value={saleCode}>
                                            {saleCode}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:lotNoPlaceholder", { defaultValue: "Lot Number" })}</Label>
                            <Input
                                placeholder={t("sellingPrices:lotNoPlaceholder", { defaultValue: "Lot Number" })}
                                value={filters.lotNo ?? ""}
                                onChange={(e) => handleFilterChange("lotNo", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("sellingPrices:lotNoPlaceholder", { defaultValue: "Lot Number" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}</Label>
                            <Input
                                placeholder={t("sellingPrices:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}
                                value={filters.sellingMark ?? ""}
                                onChange={(e) => handleFilterChange("sellingMark", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("sellingPrices:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:invoiceNoPlaceholder", { defaultValue: "Invoice Number" })}</Label>
                            <Input
                                placeholder={t("sellingPrices:invoiceNoPlaceholder", { defaultValue: "Invoice Number" })}
                                value={filters.invoiceNo ?? ""}
                                onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("sellingPrices:invoiceNoPlaceholder", { defaultValue: "Invoice Number" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:categoryPlaceholder", { defaultValue: "Category" })}</Label>
                            <Select
                                value={filters.category ?? "any"}
                                onValueChange={(value) => handleFilterChange("category", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:categoryPlaceholder", { defaultValue: "Category" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anyCategory", { defaultValue: "Any Category" })}</SelectItem>
                                    {(filterOptions?.categories || []).map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:gradePlaceholder", { defaultValue: "Grade" })}</Label>
                            <Select
                                value={filters.grade ?? "any"}
                                onValueChange={(value) => handleFilterChange("grade", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:gradePlaceholder", { defaultValue: "Grade" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anyGrade", { defaultValue: "Any Grade" })}</SelectItem>
                                    {(filterOptions?.grades || []).map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                            {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:brokerPlaceholder", { defaultValue: "Broker" })}</Label>
                            <Select
                                value={filters.broker ?? "any"}
                                onValueChange={(value) => handleFilterChange("broker", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:brokerPlaceholder", { defaultValue: "Broker" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anyBroker", { defaultValue: "Any Broker" })}</SelectItem>
                                    {(filterOptions?.brokers || []).map((broker) => (
                                        <SelectItem key={broker} value={broker}>
                                            {broker}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:producerCountryPlaceholder", { defaultValue: "Producer Country" })}</Label>
                            <Select
                                value={filters.producerCountry ?? "any"}
                                onValueChange={(value) => handleFilterChange("producerCountry", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("sellingPrices:producerCountryPlaceholder", { defaultValue: "Producer Country" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("sellingPrices:anyCountry", { defaultValue: "Any Country" })}</SelectItem>
                                    {(filterOptions?.countries || []).map((country) => (
                                        <SelectItem key={country} value={country}>
                                            {country}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:bagsPlaceholder", { defaultValue: "Bags" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("sellingPrices:bagsPlaceholder", { defaultValue: "Bags" })}
                                value={filters.bags ?? ""}
                                onChange={(e) => handleFilterChange("bags", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.bags?.min ?? 0}
                                max={filterOptions?.bags?.max ?? 1000}
                                aria-label={t("sellingPrices:bagsPlaceholder", { defaultValue: "Bags" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:totalWeightPlaceholder", { defaultValue: "Total Weight" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("sellingPrices:totalWeightPlaceholder", { defaultValue: "Total Weight" })}
                                value={filters.totalWeight ?? ""}
                                onChange={(e) => handleFilterChange("totalWeight", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.totalWeight?.min ?? 0}
                                max={filterOptions?.totalWeight?.max ?? 100000}
                                aria-label={t("sellingPrices:totalWeightPlaceholder", { defaultValue: "Total Weight" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:netWeightPlaceholder", { defaultValue: "Net Weight" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("sellingPrices:netWeightPlaceholder", { defaultValue: "Net Weight" })}
                                value={filters.netWeight ?? ""}
                                onChange={(e) => handleFilterChange("netWeight", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.netWeight?.min ?? 0}
                                max={filterOptions?.netWeight?.max ?? 1000}
                                aria-label={t("sellingPrices:netWeightPlaceholder", { defaultValue: "Net Weight" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:askingPricePlaceholder", { defaultValue: "Asking Price" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("sellingPrices:askingPricePlaceholder", { defaultValue: "Asking Price" })}
                                value={filters.askingPrice ?? ""}
                                onChange={(e) => handleFilterChange("askingPrice", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.askingPrice?.min ?? 0}
                                max={filterOptions?.askingPrice?.max ?? 1000}
                                aria-label={t("sellingPrices:askingPricePlaceholder", { defaultValue: "Asking Price" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:purchasePricePlaceholder", { defaultValue: "Purchase Price" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("sellingPrices:purchasePricePlaceholder", { defaultValue: "Purchase Price" })}
                                value={filters.purchasePrice ?? ""}
                                onChange={(e) => handleFilterChange("purchasePrice", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.purchasePrice?.min ?? 0}
                                max={filterOptions?.purchasePrice?.max ?? 1000}
                                aria-label={t("sellingPrices:purchasePricePlaceholder", { defaultValue: "Purchase Price" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:reprintPlaceholder", { defaultValue: "Reprint" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("sellingPrices:reprintPlaceholder", { defaultValue: "Reprint" })}
                                value={filters.reprint ?? ""}
                                onChange={(e) => handleFilterChange("reprint", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={0}
                                aria-label={t("sellingPrices:reprintPlaceholder", { defaultValue: "Reprint" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("sellingPrices:manufactureDatePlaceholder", { defaultValue: "Manufacture Date" })}</Label>
                            <Input
                                type="date"
                                placeholder={t("sellingPrices:manufactureDatePlaceholder", { defaultValue: "Manufacture Date" })}
                                value={filters.manufactureDate ?? ""}
                                onChange={(e) => handleFilterChange("manufactureDate", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.manufactureDate?.min?.split("T")[0] ?? "2020-01-01"}
                                max={filterOptions?.manufactureDate?.max?.split("T")[0] ?? new Date().toISOString().split("T")[0]}
                                aria-label={t("sellingPrices:manufactureDatePlaceholder", { defaultValue: "Manufacture Date" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-indigo-600 text-white dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 rounded-sm"
                            aria-label={t("sellingPrices:apply", { defaultValue: "Apply" })}
                            disabled={isFilterOptionsLoading}
                        >
                            {t("sellingPrices:apply", { defaultValue: "Apply" })}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="flex-1 rounded-sm border-indigo-400 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-200 dark:hover:bg-indigo-700"
                            aria-label={t("sellingPrices:resetFilters", { defaultValue: "Reset Filters" })}
                            disabled={isFilterOptionsLoading}
                        >
                            {t("sellingPrices:resetFilters", { defaultValue: "Reset Filters" })}
                        </Button>
                    </div>
                </div>
            )}
            <Toaster position="top-right" richColors />
        </div>
    );
};

export default FiltersBar;