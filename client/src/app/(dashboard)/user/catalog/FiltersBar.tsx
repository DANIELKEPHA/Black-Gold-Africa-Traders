"use client";

import { useDispatch, useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, Search, Grid, List, X } from "lucide-react";
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
import { useCatalogFilters } from "@/app/(dashboard)/admin/catalog/useCatalogFilters";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/app/(dashboard)/user/catalog/use-media-query";

interface FilterField {
    key: keyof FiltersState;
    placeholder: string;
    options?: string[];
    type?: "text" | "date" | "number";
}

const FiltersBar: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const dispatch = useDispatch();
    const isMobile = useMediaQuery("(max-width: 640px)");
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
    } = useCatalogFilters();

    const compactFilterFields: FilterField[] = [
        { key: "category", placeholder: "categoryPlaceholder", options: filterOptions?.categories },
        { key: "broker", placeholder: "brokerPlaceholder", options: filterOptions?.brokers },
        {
            key: "producerCountry",
            placeholder: "catalog:producerCountryPlaceholder",
            options: filterOptions?.producerCountries,
        },
        { key: "lotNo", placeholder: "catalog:lotNoPlaceholder", type: "text" },
    ];

    const fullFilterFields: FilterField[] = [
        {
            key: "producerCountry",
            placeholder: "catalog:producerCountryPlaceholder",
            options: filterOptions?.producerCountries,
        },
        { key: "grade", placeholder: "catalog:gradePlaceholder", options: filterOptions?.grades },
        { key: "category", placeholder: "catalog:categoryPlaceholder", options: filterOptions?.categories },
        { key: "broker", placeholder: "catalog:brokerPlaceholder", options: filterOptions?.brokers },
        { key: "sellingMark", placeholder: "filters:sellingMarkPlaceholder", type: "text" },
        { key: "invoiceNo", placeholder: "filters:invoiceNoPlaceholder", type: "text" },
        { key: "lotNo", placeholder: "catalog:lotNoPlaceholder", type: "text" },
    ];

    // Updated getInputValue to handle boolean and number[] types
    const getInputValue = (value: any): string | number | undefined => {
        if (value === "any" || value == null) return "";
        if (typeof value === "boolean") return value.toString(); // Convert boolean to string
        if (Array.isArray(value)) return value.join(", "); // Convert array to comma-separated string
        return value as string | number;
    };

    const handleMobileSubmit = () => {
        handleSubmit();
        dispatch(toggleFiltersFullOpen());
    };

    if (isMobile) {
        return (
            <div className="w-full p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                <Toaster position="top-right" richColors />
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center flex-1">
                        <Input
                            placeholder={t("catalog:searchPlaceholder", { defaultValue: "Search catalogs..." })}
                            value={getInputValue(localFilters.search)} // Use getInputValue for consistency
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="flex-1 rounded-l-md rounded-r-none border-indigo-500 dark:border-indigo-600 border-r-0 focus:ring-indigo-500 text-sm h-10"
                            disabled={isFilterOptionsLoading}
                        />
                        <Button
                            onClick={handleSubmit}
                            className="rounded-r-md rounded-l-none border-l-0 border-indigo-500 dark:border-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-colors h-10"
                            disabled={isFilterOptionsLoading}
                        >
                            <Search className="w-5 h-5" />
                        </Button>
                    </div>
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button
                                variant="outline"
                                className="ml-2 gap-2 rounded-md border-indigo-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-colors h-10 px-3"
                                disabled={isFilterOptionsLoading}
                            >
                                <Filter className="w-5 h-5" />
                                <span className="sr-only">Filters</span>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="w-full max-h-[85vh] p-0">
                            <DrawerHeader className="text-left px-4 pt-4">
                                <DrawerTitle className="flex justify-between items-center text-lg">
                                    {t("catalog:actions.allFilters", { defaultValue: "Filters" })}
                                    <Button
                                        variant="ghost"
                                        onClick={() => dispatch(toggleFiltersFullOpen())}
                                        className="p-0 h-auto"
                                    >
                                        <X className="w-6 h-6" />
                                    </Button>
                                </DrawerTitle>
                            </DrawerHeader>
                            <div className="p-4 overflow-y-auto">
                                <div className="space-y-3">
                                    {fullFilterFields.map(({ key, placeholder, options, type }) => (
                                        <div key={key} className="flex flex-col">
                                            <Label className="font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-sm">
                                                {t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                            </Label>
                                            {options ? (
                                                <Select
                                                    value={(localFilters[key] ?? "any") as string}
                                                    onValueChange={(value) => handleFilterChange(key, value)}
                                                    disabled={isFilterOptionsLoading}
                                                >
                                                    <SelectTrigger className="w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500 h-10 text-sm">
                                                        <SelectValue
                                                            placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500 max-h-60">
                                                        <SelectItem value="any">
                                                            {t(`catalog:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
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
                                                    placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                                    value={getInputValue(localFilters[key])} // Use getInputValue
                                                    onChange={(e) => handleFilterChange(key, e.target.value)}
                                                    className={cn(
                                                        "w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500 h-10 text-sm",
                                                        errors[key] && "border-red-500 focus:ring-red-500"
                                                    )}
                                                    disabled={isFilterOptionsLoading}
                                                />
                                            )}
                                            {errors[key] && (
                                                <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <Button
                                        onClick={handleMobileSubmit}
                                        className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors h-10 text-sm"
                                        disabled={isFilterOptionsLoading || Object.values(errors).some((e) => e)}
                                    >
                                        {t("catalog:apply", { defaultValue: "Apply" })}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        className="flex-1 rounded-md border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors h-10 text-sm"
                                        disabled={isFilterOptionsLoading}
                                    >
                                        {t("catalog:resetFilters", { defaultValue: "Reset" })}
                                    </Button>
                                </div>
                            </div>
                        </DrawerContent>
                    </Drawer>
                    <div className="flex border rounded-md border-indigo-500 ml-2">
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-3 py-1 rounded-l-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                viewMode === "list" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white"
                            )}
                            onClick={() => dispatch(setViewMode("list"))}
                        >
                            <List className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-3 py-1 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                viewMode === "grid" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white"
                            )}
                            onClick={() => dispatch(setViewMode("grid"))}
                        >
                            <Grid className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                    <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
                        {compactFilterFields.map(({ key, placeholder, options, type }) =>
                            options ? (
                                <div key={key} className="flex-shrink-0 w-32 snap-center">
                                    <Select
                                        value={(localFilters[key] ?? "any") as string}
                                        onValueChange={(value) => handleFilterChange(key, value)}
                                        disabled={isFilterOptionsLoading}
                                    >
                                        <SelectTrigger className="w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500 h-10 text-sm">
                                            <SelectValue
                                                placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                            />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500 max-h-60">
                                            <SelectItem value="any">
                                                {t(`catalog:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
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
                                </div>
                            ) : (
                                <div key={key} className="flex-shrink-0 w-32 snap-center">
                                    <Input
                                        type={type}
                                        placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                        value={getInputValue(localFilters[key])} // Use getInputValue
                                        onChange={(e) => handleFilterChange(key, e.target.value)}
                                        className={cn(
                                            "w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500 h-10 text-sm",
                                            errors[key] && "border-red-500 focus:ring-red-500"
                                        )}
                                        disabled={isFilterOptionsLoading}
                                    />
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
            <Toaster position="top-right" richColors />
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="outline"
                        className={cn(
                            "gap-2 rounded-md border-indigo-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-colors",
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
                            placeholder={t("catalog:searchPlaceholder", { defaultValue: "Search catalogs..." })}
                            value={getInputValue(localFilters.search)} // Use getInputValue
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-40 sm:w-56 rounded-l-md rounded-r-none border-indigo-500 dark:border-indigo-600 border-r-0 focus:ring-indigo-500"
                            aria-label={t("catalog:searchPlaceholder", { defaultValue: "Search catalogs..." })}
                            disabled={isFilterOptionsLoading}
                        />
                        <Button
                            onClick={handleSubmit}
                            className="rounded-r-md rounded-l-none border-l-0 border-indigo-500 dark:border-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700 transition-colors"
                            aria-label={t("catalog:searchPlaceholder", { defaultValue: "Search catalogs..." })}
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
                                viewMode === "list" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white"
                            )}
                            onClick={() => dispatch(setViewMode("list"))}
                            aria-label={t("catalog:listView", { defaultValue: "List View" })}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "px-3 py-1 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                viewMode === "grid" && "bg-indigo-100 text-indigo-600 dark:bg-indigo-700 dark:text-white"
                            )}
                            onClick={() => dispatch(setViewMode("grid"))}
                            aria-label={t("catalog:gridView", { defaultValue: "Grid View" })}
                        >
                            <Grid className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                {isFiltersFullOpen ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            {fullFilterFields.map(({ key, placeholder, options, type }) => (
                                <div key={key} className="flex flex-col">
                                    <Label className="font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                    </Label>
                                    {options ? (
                                        <Select
                                            value={(localFilters[key] ?? "any") as string}
                                            onValueChange={(value) => handleFilterChange(key, value)}
                                            disabled={isFilterOptionsLoading}
                                        >
                                            <SelectTrigger className="w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500">
                                                <SelectValue
                                                    placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                                />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500">
                                                <SelectItem value="any">
                                                    {t(`catalog:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
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
                                            placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                            value={getInputValue(localFilters[key])} // Fixed: Use getInputValue with localFilters[key]
                                            onChange={(e) => handleFilterChange(key, e.target.value)}
                                            className={cn(
                                                "w-full rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500",
                                                errors[key] && "border-red-500 focus:ring-red-500"
                                            )}
                                            disabled={isFilterOptionsLoading}
                                        />
                                    )}
                                    {errors[key] && <p className="text-red-500 text-xs mt-1.5">{errors[key]}</p>}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 sticky bottom-0 bg-gray-50 dark:bg-gray-800 py-4 -mx-4 px-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors"
                                disabled={isFilterOptionsLoading || Object.values(errors).some((e) => e)}
                            >
                                {t("catalog:apply", { defaultValue: "Apply" })}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                className="flex-1 rounded-md border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors"
                                disabled={isFilterOptionsLoading}
                            >
                                {t("catalog:resetFilters", { defaultValue: "Reset Filters" })}
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
                                    <SelectTrigger className="w-32 sm:w-36 rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500">
                                        <SelectValue
                                            placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500">
                                        <SelectItem value="any">
                                            {t(`catalog:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
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
                                    placeholder={t(`catalog:${placeholder}`, { defaultValue: placeholder })}
                                    value={getInputValue(localFilters[key])} // Use getInputValue
                                    onChange={(e) => handleFilterChange(key, e.target.value)}
                                    className={cn(
                                        "w-32 sm:w-36 rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500",
                                        errors[key] && "border-red-500 focus:ring-red-500"
                                    )}
                                    disabled={isFilterOptionsLoading}
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FiltersBar;