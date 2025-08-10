"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SellingPriceResponse } from "@/state";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import {useMediaQuery} from "@/app/(dashboard)/user/catalog/use-media-query";

export interface SellingPricesTableProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
    handleSelectAll: () => void;
}

const SellingPricesTable: React.FC<SellingPricesTableProps> = ({
                                                                   sellingPricesData,
                                                                   selectedItems,
                                                                   handleSelectItem,
                                                                   handleSelectAll,
                                                               }) => {
    const { t } = useTranslation(["catalog", "general", "sellingPrices"]);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const toggleRowExpand = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    // Mobile view render
    if (isMobile) {
        return (
            <div className="space-y-2">
                {sellingPricesData.length > 0 ? (
                    sellingPricesData.map((item) => (
                        <div
                            key={item.id}
                            className={`border rounded-lg p-3 ${
                                selectedItems.includes(item.id)
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700"
                                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={() => handleSelectItem(item.id)}
                                        className="border-gray-300 dark:border-gray-600 mt-1"
                                    />
                                    <div>
                                        <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                            {item.lotNo ?? "N/A"}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.category ?? "N/A"} • {item.grade ?? "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                                        ${item.askingPrice?.toFixed(2) ?? "N/A"}
                                    </div>
                                    <div className="text-sm text-green-600 dark:text-green-400">
                                        ${item.purchasePrice?.toFixed(2) ?? "N/A"}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <div className="text-gray-500 dark:text-gray-400">Bags</div>
                                    <div>{item.bags ?? "N/A"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 dark:text-gray-400">Weight</div>
                                    <div>{item.totalWeight?.toFixed(2) ?? "N/A"} kg</div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2 justify-between text-xs"
                                onClick={() => toggleRowExpand(item.id)}
                            >
                                <span>More details</span>
                                {expandedRows.includes(item.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>

                            {expandedRows.includes(item.id) && (
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Broker</div>
                                        <div>{formatBrokerName(item.broker) ?? "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Selling Mark</div>
                                        <div>{item.sellingMark ?? "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Sale Code</div>
                                        <div>{item.saleCode ?? "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Tare Weight</div>
                                        <div>
                                            {item.totalWeight && item.netWeight
                                                ? (item.totalWeight - item.netWeight).toFixed(2)
                                                : "N/A"} kg
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Country</div>
                                        <div>{item.producerCountry ?? "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Invoice No</div>
                                        <div>{item.invoiceNo ?? "N/A"}</div>
                                    </div>
                                    {item.manufactureDate && (
                                        <div className="col-span-2">
                                            <div className="text-gray-500 dark:text-gray-400">Manufacture Date</div>
                                            <div>
                                                {new Date(item.manufactureDate).toLocaleDateString("en-US", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-span-2">
                                        <div className="text-gray-500 dark:text-gray-400">Reprint</div>
                                        <div>{item.reprint ?? "No"}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {t("catalog:noSellingPrices", { defaultValue: "No selling prices found" })}
                    </div>
                )}
            </div>
        );
    }

    // Desktop view render
    return (
        <div className="overflow-x-auto">
            <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 min-w-full">
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={sellingPricesData.length > 0 && selectedItems.length === sellingPricesData.length}
                                onCheckedChange={handleSelectAll}
                                aria-label={t("catalog:actions.selectAll", { defaultValue: "Select all" })}
                                className="border-gray-300 dark:border-gray-600"
                            />
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:lotNo", { defaultValue: "Lot Number" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:category", { defaultValue: "Category" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:grade", { defaultValue: "Grade" })}</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">{t("catalog:broker", { defaultValue: "Broker" })}</TableHead>
                        <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}</TableHead>
                        <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t("headers:saleCode", { defaultValue: "Sale Code" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:bags", { defaultValue: "Bags" })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:tareWeight", { defaultValue: "Tare Weight" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:totalWeight", { defaultValue: "Total Weight" })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:country", { defaultValue: "Country" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                            {t("catalog:askingPrice", { defaultValue: "Asking Price" })}
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                            {t("catalog:purchasePrice", { defaultValue: "Purchase Price" })}
                        </TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:reprint.label", { defaultValue: "Reprint" })}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sellingPricesData.length > 0 ? (
                        sellingPricesData.map((item) => (
                            <TableRow
                                key={item.id}
                                className={`${
                                    selectedItems.includes(item.id)
                                        ? "bg-indigo-50 dark:bg-indigo-900/30"
                                        : "bg-white dark:bg-gray-900"
                                } hover:bg-gray-100 dark:hover:bg-gray-800`}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={() => handleSelectItem(item.id)}
                                        aria-label={t("catalog:actions.selectItem", {
                                            defaultValue: "Select item {{lotNo}}",
                                            lotNo: item.lotNo ?? "N/A",
                                        })}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.lotNo ?? "N/A"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.category ?? "N/A"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.grade ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {formatBrokerName(item.broker) ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.sellingMark ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.saleCode ?? "N/A"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.bags ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.totalWeight && item.netWeight
                                        ? (item.totalWeight - item.netWeight).toFixed(2)
                                        : "N/A"} kg
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.totalWeight?.toFixed(2) ?? "N/A"} kg
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.producerCountry ?? "N/A"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                                    ${item.askingPrice?.toFixed(2) ?? "N/A"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                                    ${item.purchasePrice?.toFixed(2) ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.invoiceNo ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.manufactureDate
                                        ? new Date(item.manufactureDate).toLocaleDateString("en-US", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                        : "N/A"}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {item.reprint ?? "No"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={16} className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                {t("catalog:noSellingPrices", { defaultValue: "No selling prices found" })}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default SellingPricesTable;