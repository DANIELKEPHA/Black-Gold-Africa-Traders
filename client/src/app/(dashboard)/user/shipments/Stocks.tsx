"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import debounce from "lodash.debounce";
import { Stock } from "@/state/stock";
import { cn } from "@/lib/utils";

interface StocksProps {
    stocks: Array<Stock & { selected: boolean; quantity: number }>;
    setStocks: React.Dispatch<
        React.SetStateAction<Array<Stock & { selected: boolean; quantity: number }>>
    >;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    stocksLoading: boolean;
}

const Stocks: React.FC<StocksProps> = ({
                                           stocks,
                                           setStocks,
                                           search,
                                           setSearch,
                                           stocksLoading,
                                       }) => {
    const { t } = useTranslation(["stocks", "general"]);
    const debouncedSetSearch = useMemo(
        () => debounce((value: string) => setSearch(value), 300),
        [setSearch]
    );

    const handleSelectStock = (id: number) => {
        setStocks((prev) =>
            prev.map((stock) => ({
                ...stock,
                selected: stock.id === id ? !stock.selected : stock.selected,
                quantity: stock.id === id && !stock.selected ? stock.weight : stock.quantity,
            }))
        );
    };

    const handleSelectAll = () => {
        if (stocks.length > 0 && stocks.every((stock) => stock.selected)) {
            setStocks((prev) =>
                prev.map((stock) => ({
                    ...stock,
                    selected: false,
                    quantity: 0,
                }))
            );
        } else {
            setStocks((prev) =>
                prev.map((stock) => ({
                    ...stock,
                    selected: true,
                    quantity: stock.weight,
                }))
            );
        }
    };

    const handleQuantityChange = (id: number, value: string) => {
        const numValue = parseFloat(value);
        setStocks((prev) =>
            prev.map((stock) => ({
                ...stock,
                quantity: stock.id === id && !isNaN(numValue) ? numValue : stock.quantity,
            }))
        );
    };

    return (
        <div className="space-y-4">
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder={t("stocks:searchPlaceholder", {
                        defaultValue: "Search stocks by lotNo or grade",
                    })}
                    value={search}
                    onChange={(e) => debouncedSetSearch(e.target.value)}
                    className="pl-10 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    aria-label={t("stocks:searchAriaLabel", {
                        defaultValue: "Search stocks by lotNo or grade",
                    })}
                />
            </div>

            <div className="overflow-x-auto">
                <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 min-w-full">
                    <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                            <TableHead className="w-[40px] p-1 text-xs">
                                <Checkbox
                                    checked={stocks.length > 0 && stocks.every((stock) => stock.selected)}
                                    onCheckedChange={handleSelectAll}
                                    aria-label={t("stocks:selectAll", { defaultValue: "Select all stocks" })}
                                    className="border-gray-300 dark:border-gray-600"
                                    disabled={stocksLoading || stocks.length === 0}
                                />
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:lotNo", { defaultValue: "Lot Nbr" })}
                            </TableHead>
                            <TableHead className="hidden sm:table-cell p-1 text-xs">
                                {t("stocks:mark", { defaultValue: "Mark" })}
                            </TableHead>
                            <TableHead className="hidden md:table-cell p-1 text-xs">
                                {t("stocks:saleCode", { defaultValue: "S. Code" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:grade", { defaultValue: "Grade" })}
                            </TableHead>
                            <TableHead className="hidden sm:table-cell p-1 text-xs">
                                {t("stocks:broker", { defaultValue: "Broker" })}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell p-1 text-xs">
                                {t("stocks:invoiceNo", { defaultValue: "Inv Nbr" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:bags", { defaultValue: "Bags" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:weight", { defaultValue: "Wght" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:purchaseValue", { defaultValue: "P. Value" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:totalPurchaseValue", { defaultValue: "T. P. Value" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs text-red-600 dark:text-red-800">
                                {t("stocks:agingDays", { defaultValue: "Aging Days" })}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell p-1 text-xs">
                                {t("stocks:penalty", { defaultValue: "Pen" })}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell p-1 text-xs">
                                {t("stocks:bgtCommission", { defaultValue: "BGT Comm" })}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell p-1 text-xs">
                                {t("stocks:maerskFee", { defaultValue: "Maersk Fee" })}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell p-1 text-xs">
                                {t("stocks:commission", { defaultValue: "Comm" })}
                            </TableHead>
                            <TableHead className="hidden lg:table-cell p-1 text-xs">
                                {t("stocks:netPrice", { defaultValue: "Net P." })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:total", { defaultValue: "Ttl" })}
                            </TableHead>
                            <TableHead className="p-1 text-xs">
                                {t("stocks:assignedQuantity", { defaultValue: "Qty (kg)" })}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stocksLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 19 }).map((_, j) => (
                                        <TableCell key={j} className="p-1">
                                            <Skeleton className="h-4 w-full rounded" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : stocks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={19} className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs">
                                    <AlertDescription>
                                        {t("stocks:noStocksFound", { defaultValue: "No stocks found." })}
                                    </AlertDescription>
                                </TableCell>
                            </TableRow>
                        ) : (
                            stocks.map((stock) => (
                                <TableRow
                                    key={stock.id}
                                    className={cn(
                                        stock.selected ? "bg-indigo-50 dark:bg-indigo-900/30" : "",
                                        "hover:bg-gray-100 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <TableCell className="p-1" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={stock.selected}
                                            onCheckedChange={() => handleSelectStock(stock.id)}
                                            aria-label={t("stocks:selectStockAriaLabel", {
                                                defaultValue: `Select stock ${stock.lotNo}`,
                                            })}
                                            className="border-gray-300 dark:border-gray-600"
                                        />
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      {stock.lotNo}
                    </span>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.mark ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.saleCode ?? "-"}
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.grade ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.broker ? stock.broker.replace(/_/g, " ") : "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.invoiceNo ?? "-"}
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.bags}
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                                        {stock.weight.toFixed(2)} kg
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.purchaseValue.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.totalPurchaseValue.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-red-600 dark:text-red-800">
                                        {stock.agingDays ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.penalty?.toFixed(2) ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.bgtCommission?.toFixed(2) ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.maerskFee?.toFixed(2) ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.commission?.toFixed(2) ?? "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.netPrice?.toFixed(2) ?? "-"}
                                    </TableCell>
                                    <TableCell className="p-1 text-xs text-gray-800 dark:text-gray-200">
                                        ${stock.total?.toFixed(2) ?? "-"}
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <Input
                                            type="number"
                                            value={stock.selected ? stock.quantity : 0}
                                            onChange={(e) => handleQuantityChange(stock.id, e.target.value)}
                                            disabled={!stock.selected}
                                            className="w-20 h-7 text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                            aria-label={t("stocks:assignQuantityAriaLabel", {
                                                defaultValue: `Assign quantity for ${stock.lotNo}`,
                                            })}
                                            min="0"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default Stocks;