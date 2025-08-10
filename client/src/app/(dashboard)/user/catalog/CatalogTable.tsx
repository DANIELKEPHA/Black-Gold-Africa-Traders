"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { CatalogResponse } from "@/state";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAuthUserQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";

export interface CatalogTableProps {
    catalogData: CatalogResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
    isSelectAll: boolean;
}

const CatalogTable: React.FC<CatalogTableProps> = ({
                                                       catalogData,
                                                       selectedItems,
                                                       handleSelectItem,
                                                       isSelectAll,
                                                   }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        lotNo: true,
        category: true,
        grade: true,
        broker: true,
        sellingMark: false,
        saleCode: false,
        bags: true,
        tareWeight: false,
        totalWeight: true,
        country: false,
        askingPrice: true,
        invoiceNo: false,
        manufactureDate: false,
        reprint: false,
    });

    const toggleRowExpand = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleColumnVisibility = (column: string) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const columns = [
        { id: "lotNo", label: t("catalog:lotNo", { defaultValue: "Lot Number" }) },
        { id: "category", label: t("catalog:category", { defaultValue: "Category" }) },
        { id: "grade", label: t("catalog:grade", { defaultValue: "Grade" }) },
        { id: "broker", label: t("catalog:broker", { defaultValue: "Broker" }) },
        { id: "sellingMark", label: t("catalog:sellingMark", { defaultValue: "Selling Mark" }) },
        { id: "saleCode", label: t("headers:saleCode", { defaultValue: "Sale Code" }) },
        { id: "bags", label: t("catalog:bags", { defaultValue: "Bags" }) },
        { id: "tareWeight", label: t("catalog:tareWeight", { defaultValue: "Tare Weight" }) },
        { id: "totalWeight", label: t("catalog:totalWeight", { defaultValue: "Total Weight" }) },
        { id: "country", label: t("catalog:country", { defaultValue: "Country" }) },
        { id: "askingPrice", label: t("catalog:askingPrice", { defaultValue: "Asking Price" }) },
        { id: "invoiceNo", label: t("catalog:invoiceNo", { defaultValue: "Invoice Number" }) },
        { id: "manufactureDate", label: t("catalog:manufactureDate", { defaultValue: "Manufacture Date" }) },
        { id: "reprint", label: t("catalog:reprint.label", { defaultValue: "Reprint" }) },
    ];

    return (
        <div className="space-y-4">
            {/* Column Chooser */}
            <div className="flex justify-end">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <GripVertical className="h-4 w-4" />
                            {t("general:columns", { defaultValue: "Columns" })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="end">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                                {t("general:visibleColumns", { defaultValue: "Visible Columns" })}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {columns.map(column => (
                                    <div key={column.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`column-${column.id}`}
                                            checked={visibleColumns[column.id]}
                                            onCheckedChange={() => toggleColumnVisibility(column.id)}
                                        />
                                        <label
                                            htmlFor={`column-${column.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {column.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Table with horizontal scrolling cues */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xs px-2 bg-white/80 dark:bg-gray-900/80 rounded-r">
                        ← Scroll →
                    </span>
                </div>
                <div className="overflow-x-auto pb-2">
                    <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 min-w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-50 dark:bg-gray-800">
                                <TableHead className="w-[50px] sticky left-0 z-10 bg-gray-50 dark:bg-gray-800">
                                    <Checkbox
                                        checked={isSelectAll}
                                        onCheckedChange={() => handleSelectItem(0)}
                                        aria-label={t("catalog:actions.selectAll", { defaultValue: "Select all" })}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                </TableHead>
                                {visibleColumns.lotNo && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm sticky left-[50px] z-10 bg-gray-50 dark:bg-gray-800">
                                        {t("catalog:lotNo", { defaultValue: "Lot Number" })}
                                    </TableHead>
                                )}
                                {visibleColumns.category && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                        {t("catalog:category", { defaultValue: "Category" })}
                                    </TableHead>
                                )}
                                {visibleColumns.grade && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                        {t("catalog:grade", { defaultValue: "Grade" })}
                                    </TableHead>
                                )}
                                {visibleColumns.broker && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden sm:table-cell">
                                        {t("catalog:broker", { defaultValue: "Broker" })}
                                    </TableHead>
                                )}
                                {visibleColumns.sellingMark && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden md:table-cell">
                                        {t("catalog:sellingMark", { defaultValue: "Selling Mark" })}
                                    </TableHead>
                                )}
                                {visibleColumns.saleCode && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden md:table-cell">
                                        {t("headers:saleCode", { defaultValue: "Sale Code" })}
                                    </TableHead>
                                )}
                                {visibleColumns.bags && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                        {t("catalog:bags", { defaultValue: "Bags" })}
                                    </TableHead>
                                )}
                                {visibleColumns.tareWeight && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden lg:table-cell">
                                        {t("catalog:tareWeight", { defaultValue: "Tare Weight" })}
                                    </TableHead>
                                )}
                                {visibleColumns.totalWeight && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                        {t("catalog:totalWeight", { defaultValue: "Total Weight" })}
                                    </TableHead>
                                )}
                                {visibleColumns.country && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden lg:table-cell">
                                        {t("catalog:country", { defaultValue: "Country" })}
                                    </TableHead>
                                )}
                                {visibleColumns.askingPrice && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                        {t("catalog:askingPrice", { defaultValue: "Asking Price" })}
                                    </TableHead>
                                )}
                                {visibleColumns.invoiceNo && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden lg:table-cell">
                                        {t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}
                                    </TableHead>
                                )}
                                {visibleColumns.manufactureDate && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden lg:table-cell">
                                        {t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}
                                    </TableHead>
                                )}
                                {visibleColumns.reprint && (
                                    <TableHead className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm hidden lg:table-cell">
                                        {t("catalog:reprint.label", { defaultValue: "Reprint" })}
                                    </TableHead>
                                )}
                                <TableHead className="w-[40px] px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                    {/* Expand/collapse column */}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {catalogData?.length > 0 ? (
                                catalogData.map((item) => (
                                    <>
                                        <TableRow
                                            key={item.id}
                                            className={`${
                                                selectedItems.includes(item.id) || isSelectAll
                                                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                                                    : "bg-white dark:bg-gray-900"
                                            } hover:bg-gray-100 dark:hover:bg-gray-700`}
                                        >
                                            <TableCell
                                                className="sticky left-0 z-10 px-2 py-1 sm:px-4 sm:py-2 bg-white dark:bg-gray-900"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={() => handleSelectItem(item.id)}
                                                    aria-label={t("catalog:actions.selectItem", {
                                                        defaultValue: "Select item {{lotNo}}",
                                                        lotNo: item.lotNo,
                                                    })}
                                                    className="border-gray-300 dark:border-gray-600"
                                                />
                                            </TableCell>
                                            {visibleColumns.lotNo && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 sticky left-[50px] z-10 bg-white dark:bg-gray-900">
                                                    {item.lotNo}
                                                </TableCell>
                                            )}
                                            {visibleColumns.category && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                                    {item.category ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.grade && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                                    {item.grade ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.broker && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden sm:table-cell">
                                                    {formatBrokerName(item.broker) ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.sellingMark && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden md:table-cell">
                                                    {item.sellingMark ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.saleCode && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden md:table-cell">
                                                    {item.saleCode ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.bags && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                                    {item.bags}
                                                </TableCell>
                                            )}
                                            {visibleColumns.tareWeight && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                                                    {(item.totalWeight - item.netWeight).toFixed(2)} kg
                                                </TableCell>
                                            )}
                                            {visibleColumns.totalWeight && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                                    {item.totalWeight.toFixed(2)} kg
                                                </TableCell>
                                            )}
                                            {visibleColumns.country && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                                                    {item.producerCountry ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.askingPrice && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                                    ${item.askingPrice.toFixed(2)}
                                                </TableCell>
                                            )}
                                            {visibleColumns.invoiceNo && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                                                    {item.invoiceNo ?? "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.manufactureDate && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                                                    {item.manufactureDate
                                                        ? new Date(item.manufactureDate).toLocaleDateString("en-US", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                        })
                                                        : "N/A"}
                                                </TableCell>
                                            )}
                                            {visibleColumns.reprint && (
                                                <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 hidden lg:table-cell">
                                                    {item.reprint}
                                                </TableCell>
                                            )}
                                            <TableCell className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => toggleRowExpand(item.id)}
                                                >
                                                    {expandedRows.includes(item.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows.includes(item.id) && (
                                            <TableRow>
                                                <TableCell colSpan={columns.filter(c => visibleColumns[c.id]).length + 2} className="px-2 py-1 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-800">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs sm:text-sm">
                                                        {!visibleColumns.broker && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:broker")}: </span>
                                                                {formatBrokerName(item.broker) ?? "N/A"}
                                                            </div>
                                                        )}
                                                        {!visibleColumns.sellingMark && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:sellingMark")}: </span>
                                                                {item.sellingMark ?? "N/A"}
                                                            </div>
                                                        )}
                                                        {!visibleColumns.saleCode && (
                                                            <div>
                                                                <span className="font-medium">{t("headers:saleCode")}: </span>
                                                                {item.saleCode ?? "N/A"}
                                                            </div>
                                                        )}
                                                        {!visibleColumns.tareWeight && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:tareWeight")}: </span>
                                                                {(item.totalWeight - item.netWeight).toFixed(2)} kg
                                                            </div>
                                                        )}
                                                        {!visibleColumns.country && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:country")}: </span>
                                                                {item.producerCountry ?? "N/A"}
                                                            </div>
                                                        )}
                                                        {!visibleColumns.invoiceNo && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:invoiceNo")}: </span>
                                                                {item.invoiceNo ?? "N/A"}
                                                            </div>
                                                        )}
                                                        {!visibleColumns.manufactureDate && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:manufactureDate")}: </span>
                                                                {item.manufactureDate
                                                                    ? new Date(item.manufactureDate).toLocaleDateString("en-US", {
                                                                        day: "2-digit",
                                                                        month: "2-digit",
                                                                        year: "numeric",
                                                                    })
                                                                    : "N/A"}
                                                            </div>
                                                        )}
                                                        {!visibleColumns.reprint && (
                                                            <div>
                                                                <span className="font-medium">{t("catalog:reprint.label")}: </span>
                                                                {item.reprint}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.filter(c => visibleColumns[c.id]).length + 2} className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                        {t("catalog:noCatalogs", { defaultValue: "No catalogs found" })}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default CatalogTable;