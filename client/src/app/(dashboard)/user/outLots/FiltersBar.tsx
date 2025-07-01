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
    useExportOutLotsCsvMutation,
    useGetAuthUserQuery,
    useGetOutlotsFilterOptionsQuery,
    useGetOutlotsQuery,
} from "@/state/api";
import { Broker, TeaGrade } from "@/state/enums";

interface LocalOutLotsFilterOptions {
    auctions?: string[];
    grades?: string[];
    brokers?: string[];
    sellingMarks?: string[];
    invoiceNos?: string[];
    bags?: { min: number; max: number };
    netWeight?: { min: number; max: number };
    totalWeight?: { min: number; max: number };
    baselinePrice?: { min: number; max: number };
    manufactureDate?: { min: string; max: string };
}

interface OutLot {
    id: number;
    auction: string;
    lotNo: string;
    broker: Broker;
    sellingMark: string;
    grade: TeaGrade;
    invoiceNo: string | null;
    bags: number;
    netWeight: number;
    totalWeight: number;
    baselinePrice: number;
    manufactureDate: string;
}

interface FiltersBarProps {
    selectedItems?: number[];
}

const FiltersBar: React.FC<FiltersBarProps> = ({ selectedItems = [] }) => {
    const { t } = useTranslation(["outlots", "general"]);
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
        useGetOutlotsFilterOptionsQuery() as {
            data: LocalOutLotsFilterOptions | undefined;
            isLoading: boolean;
            isError: boolean;
        };
    const { data: { data: outLotsData = [] } = {}, isLoading: isOutLotsLoading } = useGetOutlotsQuery({
        ...cleanParams({
            auction: filters.auction === "any" ? undefined : filters.auction,
            lotNo: filters.lotNo === "any" ? undefined : filters.lotNo,
            broker: filters.broker === "any" ? undefined : filters.broker,
            sellingMark: filters.sellingMark === "any" ? undefined : filters.sellingMark,
            grade: filters.grade === "any" ? undefined : filters.grade,
            invoiceNo: filters.invoiceNo === "any" ? undefined : filters.invoiceNo,
            bags: filters.bags,
            netWeight: filters.netWeight,
            totalWeight: filters.totalWeight,
            baselinePrice: filters.baselinePrice,
            manufactureDate: filters.manufactureDate,
            search: filters.search,
        }),
    });
    const [triggerExport, { isLoading: isExportLoading }] = useExportOutLotsCsvMutation();

    // Handle filter options loading error
    React.useEffect(() => {
        if (isError) {
            toast.error(t("general:errors.filterOptionsFailed", { defaultValue: "Failed to load filter options" }));
        }
    }, [isError, t]);

    const updateURL = debounce((newFilters: FiltersState) => {
        const cleanFilters = cleanParams({
            ...newFilters,
            auction: newFilters.auction === "any" ? undefined : newFilters.auction,
            lotNo: newFilters.lotNo === "any" ? undefined : newFilters.lotNo,
            broker: newFilters.broker === "any" ? undefined : newFilters.broker,
            sellingMark: newFilters.sellingMark === "any" ? undefined : newFilters.sellingMark,
            grade: newFilters.grade === "any" ? undefined : newFilters.grade,
            invoiceNo: newFilters.invoiceNo === "any" ? undefined : newFilters.invoiceNo,
            bags: newFilters.bags,
            netWeight: newFilters.netWeight,
            totalWeight: newFilters.totalWeight,
            baselinePrice: newFilters.baselinePrice,
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

    const handleFilterChange = (key: keyof FiltersState, value: string | number) => {
        let newValue: FiltersState[typeof key];
        if (key === "grade") {
            newValue = value === "" || value === "any" ? "any" : (value as TeaGrade);
        } else if (key === "broker") {
            newValue = value === "" || value === "any" ? "any" : (value as Broker);
        } else if (key === "auction" || key === "lotNo" || key === "sellingMark" || key === "invoiceNo") {
            newValue = value === "" || value === "any" ? "any" : value.toString();
        } else if (key === "bags" || key === "netWeight" || key === "totalWeight" || key === "baselinePrice") {
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
        toast.success(t("outlots:filterApplied", { defaultValue: "Filters applied successfully" }));
    };

    const handleReset = () => {
        dispatch(setFilters(initialState.filters));
        setSearchInput("");
        updateURL(initialState.filters);
        toast.info(t("outlots:filtersReset", { defaultValue: "Filters reset" }));
    };

    const handleDownloadCSV = async () => {
        try {
            // Use selectedItems if any are selected, otherwise use all outlot IDs
            const ids = selectedItems.length > 0 ? selectedItems : Array.isArray(outLotsData) ? outLotsData.map((item) => item.id) : [];
            if (ids.length === 0) {
                toast.error(t("outlots:errors.noItems", { defaultValue: "No outlots available to export" }));
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting outlots with IDs:`, ids);
            await triggerExport({ outLotIds: ids.join(",") }).unwrap();
            toast.success(
                t("outlots:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }),
                {
                    description: t("outlots:success.csvDownloadedDesc", {
                        defaultValue: "Outlots data exported to CSV",
                    }),
                }
            );
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            const errorMessage = t("outlots:errors.csvError", { defaultValue: "CSV Export Failed" });
            let errorDescription = t("outlots:errors.csvFailed", { defaultValue: "Failed to export outlots to CSV" });

            if (err.status === 400) {
                errorDescription = t("outlots:errors.invalidParams", { defaultValue: "Invalid outlot IDs provided" });
            } else if (err.status === 403) {
                errorDescription = t("outlots:errors.forbidden", { defaultValue: "You are not authorized to export outlots" });
            } else if (err.status === 404) {
                errorDescription = t("outlots:errors.noOutlots", { defaultValue: "No outlots found for the provided IDs" });
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
                        aria-label={t("outlots:actions.allFilters", { defaultValue: "All Filters" })}
                        disabled={isFilterOptionsLoading}
                    >
                        <Filter className="w-4 h-4" />
                        <span>{t("outlots:actions.allFilters", { defaultValue: "All Filters" })}</span>
                    </Button>
                    <div className="flex items-center">
                        <Input
                            placeholder={t("outlots:searchPlaceholder", { defaultValue: "Search by Lot No, Selling Mark, Invoice No..." })}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => !isFiltersFullOpen && e.key === "Enter" && handleSearch()}
                            className="w-36 sm:w-48 rounded-l-sm rounded-r-none border-indigo-400 dark:border-indigo-600 border-r-0"
                            aria-label={t("outlots:searchPlaceholder", { defaultValue: "Search by Lot No, Selling Mark, Invoice No..." })}
                            disabled={isFilterOptionsLoading}
                        />
                        <Button
                            onClick={handleSearch}
                            className="rounded-r-sm rounded-l-none border-l-none border-indigo-400 dark:border-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700"
                            aria-label={t("outlots:searchPlaceholder", { defaultValue: "Search by Lot No, Selling Mark, Invoice No..." })}
                            disabled={isFilterOptionsLoading}
                        >
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>
                    {!isFiltersFullOpen && (
                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.auction ?? "any"}
                                onValueChange={(value) => handleFilterChange("auction", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-24 sm:w-28 rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("outlots:auctionPlaceholder", { defaultValue: "Auction" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("outlots:anyAuction", { defaultValue: "Any Auction" })}</SelectItem>
                                    {filterOptions?.auctions?.map((auction) => (
                                        <SelectItem key={auction} value={auction}>
                                            {auction}
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
                                    <SelectValue placeholder={t("outlots:gradePlaceholder", { defaultValue: "Grade" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("outlots:anyGrade", { defaultValue: "Any Grade" })}</SelectItem>
                                    {filterOptions?.grades?.map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                            {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.broker ?? "any"}
                                onValueChange={(value) => handleFilterChange("broker", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-24 sm:w-28 rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("outlots:brokerPlaceholder", { defaultValue: "Broker" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("outlots:anyBroker", { defaultValue: "Any Broker" })}</SelectItem>
                                    {filterOptions?.brokers?.map((broker) => (
                                        <SelectItem key={broker} value={broker}>
                                            {broker}
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
                        disabled={isExportLoading || isAuthLoading || isOutLotsLoading}
                        aria-label={t("outlots:actions.download", { defaultValue: "Download" })}
                    >
                        <Download className="w-4 h-4" />
                        <span>
                            {isExportLoading
                                ? t("outlots:downloading", { defaultValue: "Downloading..." })
                                : t("outlots:actions.download", { defaultValue: "Download" })}
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
                            aria-label={t("outlots:listView", { defaultValue: "List View" })}
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
                            aria-label={t("outlots:gridView", { defaultValue: "Grid View" })}
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
                            <Label className="font-medium mb-1">{t("outlots:auctionPlaceholder", { defaultValue: "Auction" })}</Label>
                            <Select
                                value={filters.auction ?? "any"}
                                onValueChange={(value) => handleFilterChange("auction", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("outlots:auctionPlaceholder", { defaultValue: "Auction" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("outlots:anyAuction", { defaultValue: "Any Auction" })}</SelectItem>
                                    {(filterOptions?.auctions || []).map((auction) => (
                                        <SelectItem key={auction} value={auction}>
                                            {auction}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:lotNoPlaceholder", { defaultValue: "Lot Number" })}</Label>
                            <Input
                                placeholder={t("outlots:lotNoPlaceholder", { defaultValue: "Lot Number" })}
                                value={filters.lotNo ?? ""}
                                onChange={(e) => handleFilterChange("lotNo", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("outlots:lotNoPlaceholder", { defaultValue: "Lot Number" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}</Label>
                            <Input
                                placeholder={t("outlots:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}
                                value={filters.sellingMark ?? ""}
                                onChange={(e) => handleFilterChange("sellingMark", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("outlots:sellingMarkPlaceholder", { defaultValue: "Selling Mark" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:invoiceNoPlaceholder", { defaultValue: "Invoice Number" })}</Label>
                            <Input
                                placeholder={t("outlots:invoiceNoPlaceholder", { defaultValue: "Invoice Number" })}
                                value={filters.invoiceNo ?? ""}
                                onChange={(e) => handleFilterChange("invoiceNo", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                aria-label={t("outlots:invoiceNoPlaceholder", { defaultValue: "Invoice Number" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:brokerPlaceholder", { defaultValue: "Broker" })}</Label>
                            <Select
                                value={filters.broker ?? "any"}
                                onValueChange={(value) => handleFilterChange("broker", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("outlots:brokerPlaceholder", { defaultValue: "Broker" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("outlots:anyBroker", { defaultValue: "Any Broker" })}</SelectItem>
                                    {(filterOptions?.brokers || []).map((broker) => (
                                        <SelectItem key={broker} value={broker}>
                                            {broker}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:gradePlaceholder", { defaultValue: "Grade" })}</Label>
                            <Select
                                value={filters.grade ?? "any"}
                                onValueChange={(value) => handleFilterChange("grade", value)}
                                disabled={isFilterOptionsLoading}
                            >
                                <SelectTrigger className="w-full rounded-sm border-indigo-400 dark:border-indigo-600">
                                    <SelectValue placeholder={t("outlots:gradePlaceholder", { defaultValue: "Grade" })} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800">
                                    <SelectItem value="any">{t("outlots:anyGrade", { defaultValue: "Any Grade" })}</SelectItem>
                                    {(filterOptions?.grades || []).map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                            {grade}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:bagsPlaceholder", { defaultValue: "Bags" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("outlots:bagsPlaceholder", { defaultValue: "Bags" })}
                                value={filters.bags ?? ""}
                                onChange={(e) => handleFilterChange("bags", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.bags?.min ?? 0}
                                max={filterOptions?.bags?.max ?? 1000}
                                aria-label={t("outlots:bagsPlaceholder", { defaultValue: "Bags" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:netWeightPlaceholder", { defaultValue: "Net Weight" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("outlots:netWeightPlaceholder", { defaultValue: "Net Weight" })}
                                value={filters.netWeight ?? ""}
                                onChange={(e) => handleFilterChange("netWeight", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.netWeight?.min ?? 0}
                                max={filterOptions?.netWeight?.max ?? 1000}
                                aria-label={t("outlots:netWeightPlaceholder", { defaultValue: "Net Weight" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:totalWeightPlaceholder", { defaultValue: "Total Weight" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("outlots:totalWeightPlaceholder", { defaultValue: "Total Weight" })}
                                value={filters.totalWeight ?? ""}
                                onChange={(e) => handleFilterChange("totalWeight", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.totalWeight?.min ?? 0}
                                max={filterOptions?.totalWeight?.max ?? 100000}
                                aria-label={t("outlots:totalWeightPlaceholder", { defaultValue: "Total Weight" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:baselinePricePlaceholder", { defaultValue: "Baseline Price" })}</Label>
                            <Input
                                type="number"
                                placeholder={t("outlots:baselinePricePlaceholder", { defaultValue: "Baseline Price" })}
                                value={filters.baselinePrice ?? ""}
                                onChange={(e) => handleFilterChange("baselinePrice", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.baselinePrice?.min ?? 0}
                                max={filterOptions?.baselinePrice?.max ?? 1000}
                                aria-label={t("outlots:baselinePricePlaceholder", { defaultValue: "Baseline Price" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                        <div>
                            <Label className="font-medium mb-1">{t("outlots:manufactureDatePlaceholder", { defaultValue: "Manufacture Date" })}</Label>
                            <Input
                                type="date"
                                placeholder={t("outlots:manufactureDatePlaceholder", { defaultValue: "Manufacture Date" })}
                                value={filters.manufactureDate ?? ""}
                                onChange={(e) => handleFilterChange("manufactureDate", e.target.value)}
                                className="rounded-sm border-indigo-400 dark:border-indigo-600"
                                min={filterOptions?.manufactureDate?.min?.split("T")[0] ?? "2020-01-01"}
                                max={filterOptions?.manufactureDate?.max?.split("T")[0] ?? new Date().toISOString().split("T")[0]}
                                aria-label={t("outlots:manufactureDatePlaceholder", { defaultValue: "Manufacture Date" })}
                                disabled={isFilterOptionsLoading}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-indigo-600 text-white dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 rounded-sm"
                            aria-label={t("outlots:apply", { defaultValue: "Apply" })}
                            disabled={isFilterOptionsLoading}
                        >
                            {t("outlots:apply", { defaultValue: "Apply" })}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            className="flex-1 rounded-sm border-indigo-400 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-200 dark:hover:bg-indigo-700"
                            aria-label={t("outlots:resetFilters", { defaultValue: "Reset Filters" })}
                            disabled={isFilterOptionsLoading}
                        >
                            {t("outlots:resetFilters", { defaultValue: "Reset Filters" })}
                        </Button>
                    </div>
                </div>
            )}
            <Toaster position="top-right" richColors />
        </div>
    );
};

export default FiltersBar;