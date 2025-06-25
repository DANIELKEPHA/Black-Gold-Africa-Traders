"use client";

import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, Search, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import { FiltersState, toggleFiltersFullOpen, setViewMode } from "@/state";
import { useStockFilters } from "@/app/(dashboard)/admin/stock/useStockFilters";

interface FilterField {
    key: keyof FiltersState;
    placeholder: string;
    options?: string[];
    type?: "text" | "number";
}

const FiltersBar: React.FC = () => {
    const { t } = useTranslation(["stock", "general"]);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const isFiltersFullOpen = useSelector((state: any) => state.global.isFiltersFullOpen);
    const viewMode = useSelector((state: any) => state.global.viewMode);
    const {
        localFilters,
        errors,
        filterOptions,
        isFilterOptionsLoading,
        handleFilterChange,
        handleSubmit,
        handleReset,
    } = useStockFilters();

    const compactFilterFields: FilterField[] = [
        { key: "grade", placeholder: "gradePlaceholder", options: filterOptions?.grades },
        { key: "broker", placeholder: "brokerPlaceholder", options: filterOptions?.brokers },
        { key: "lotNo", placeholder: "stocks:lotNoPlaceholder", type: "text" },
        { key: "saleCode", placeholder: "stocks:saleCodePlaceholder", type: "text" },
    ];

    const fullFilterFields: FilterField[] = [
        { key: "grade", placeholder: "stock:gradePlaceholder", options: filterOptions?.grades },
        { key: "broker", placeholder: "stock:brokerPlaceholder", options: filterOptions?.brokers },
        { key: "mark", placeholder: "stock:markPlaceholder", type: "text" },
        { key: "saleCode", placeholder: "stock:saleCodePlaceholder", type: "text" },
        { key: "invoiceNo", placeholder: "stock:invoiceNoPlaceholder", type: "text" },
        { key: "lotNo", placeholder: "stock:lotNoPlaceholder", type: "text" },
        { key: "bags", placeholder: "stock:bagsPlaceholder", type: "number" },
        { key: "weight", placeholder: "stock:weightPlaceholder", type: "number" },
        { key: "purchaseValue", placeholder: "stock:purchaseValuePlaceholder", type: "number" },
        { key: "agingDays", placeholder: "stock:agingDaysPlaceholder", type: "number" },
    ];

    const getInputValue = (key: keyof FiltersState): string | number => {
        const value = localFilters[key];
        if (value === "any") return "";
        return (value ?? "") as string | number;
    };

    return (
        <div className="w-full p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
            <Toaster position="top-right" richColors />
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        className={cn(
                            "flex items-center gap-2 rounded-md border-indigo-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-colors",
                            isFiltersFullOpen && "bg-indigo-600 text-white",
                        )}
                        onClick={() => dispatch(toggleFiltersFullOpen())}
                        aria-label={t("stocks:actions.allFilters", { defaultValue: "All Filters" })}
                        disabled={isFilterOptionsLoading}
                    >
                        <Filter className="w-4 h-4" />
                        <span>{t("stocks:actions.allFilters", { defaultValue: "All Filters" })}</span>
                    </Button>
                    <div className="flex items-center">
                        <Input
                            placeholder={t("stocks:searchPlaceholder", { defaultValue: "Search stocks..." })}
                            value={localFilters.search ?? ""}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-full max-w-[200px] sm:max-w-[280px] rounded-l-md border-indigo-500 dark:border-indigo-600 border-r-0 focus:ring-indigo-500"
                            aria-label={t("stocks:searchPlaceholder", { defaultValue: "Search stocks..." })}
                            disabled={isFilterOptionsLoading}
                        />
                        <Button
                            onClick={handleSubmit}
                            className="rounded-l-none rounded-r-md border-indigo-500 dark:border-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-colors"
                            aria-label={t("stocks:searchPlaceholder", { defaultValue: "Search stocks..." })}
                            disabled={isFilterOptionsLoading}
                        >
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex border rounded-md border-indigo-500">
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-3 py-1 rounded-l-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                viewMode === "list" &&
                                "bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white",
                            )}
                            onClick={() => dispatch(setViewMode("list"))}
                            aria-label={t("stocks:listView", { defaultValue: "List View" })}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-3 py-1 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                viewMode === "grid" &&
                                "bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white",
                            )}
                            onClick={() => dispatch(setViewMode("grid"))}
                            aria-label={t("stocks:gridView", { defaultValue: "Grid View" })}
                        >
                            <Grid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                {isFiltersFullOpen ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            {fullFilterFields.map(({ key, placeholder, options, type }) => (
                                <div key={key} className="flex flex-col">
                                    <Label className="font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {t(`stocks:${placeholder}`, { defaultValue: placeholder })}
                                    </Label>
                                    {options ? (
                                        <Select
                                            value={(localFilters[key] ?? "any") as string}
                                            onValueChange={(value) => handleFilterChange(key, value)}
                                            disabled={isFilterOptionsLoading}
                                        >
                                            <SelectTrigger className="w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500">
                                                <SelectValue
                                                    placeholder={t(`stocks:${placeholder}`, {
                                                        defaultValue: placeholder,
                                                    })}
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500 max-h-60 overflow-y-auto">
                                                <SelectItem value="any">
                                                    {t(`stocks:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
                                                        defaultValue: `Any ${key}`,
                                                    })}
                                                </SelectItem>
                                                {options.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        {key === "broker" ? option.replace(/_/g, " ") : option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type={type}
                                            placeholder={t(`stocks:${placeholder}`, { defaultValue: placeholder })}
                                            value={getInputValue(key)}
                                            onChange={(e) => handleFilterChange(key, e.target.value)}
                                            className={cn(
                                                "w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500",
                                                errors[key] && "border-red-500 focus:ring-red-500",
                                            )}
                                            disabled={isFilterOptionsLoading}
                                        />
                                    )}
                                    {errors[key] && <p className="text-red-500 text-xs mt-1.5">{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-gray-50 dark:bg-gray-800 py-4 -mx-4 px-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
                                disabled={isFilterOptionsLoading || Object.values(errors).some((e) => e)}
                            >
                                {t("stocks:apply", { defaultValue: "Apply" })}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="flex-1 rounded-md border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
                                disabled={isFilterOptionsLoading}
                            >
                                {t("stocks:resetFilters", { defaultValue: "Reset Filters" })}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {compactFilterFields.map(({ key, placeholder, options, type }) =>
                            options ? (
                                <Select
                                    key={key}
                                    value={(localFilters[key] ?? "any") as string}
                                    onValueChange={(value) => handleFilterChange(key, value)}
                                    disabled={isFilterOptionsLoading}
                                >
                                    <SelectTrigger className="w-full max-w-[160px] sm:max-w-[180px] rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500">
                                        <SelectValue
                                            placeholder={t(`stocks:${placeholder}`, { defaultValue: placeholder })}
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500 max-h-60 overflow-y-auto">
                                        <SelectItem value="any">
                                            {t(`stocks:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
                                                defaultValue: `Any ${key}`,
                                            })}
                                        </SelectItem>
                                        {options.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {key === "broker" ? option.replace(/_/g, " ") : option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    key={key}
                                    type={type}
                                    placeholder={t(`stocks:${placeholder}`, { defaultValue: placeholder })}
                                    value={getInputValue(key)}
                                    onChange={(e) => handleFilterChange(key, e.target.value)}
                                    className={cn(
                                        "w-full max-w-[160px] sm:max-w-[180px] rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500",
                                        errors[key] && "border-red-500 focus:ring-red-500",
                                    )}
                                    disabled={isFilterOptionsLoading}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FiltersBar;