"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAuthUserQuery } from "@/state/api";
import { OutLotsResponse } from "@/state";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import {useMediaQuery} from "@/app/(dashboard)/user/catalog/use-media-query";

export interface OutLotsTableProps {
    outLotsData: OutLotsResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
    selectAllAcrossPages: boolean;
    handleSelectAll: () => void;
}

const OutLotsTable: React.FC<OutLotsTableProps> = ({
                                                       outLotsData,
                                                       selectedItems,
                                                       handleSelectItem,
                                                       selectAllAcrossPages,
                                                       handleSelectAll,
                                                   }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
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
                {outLotsData.length > 0 ? (
                    outLotsData.map((outLot) => (
                        <div
                            key={outLot.id}
                            className={`border rounded-lg p-3 ${
                                selectedItems.includes(outLot.id)
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700"
                                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedItems.includes(outLot.id)}
                                        onCheckedChange={() => handleSelectItem(outLot.id)}
                                        className="border-gray-300 dark:border-gray-600 mt-1"
                                    />
                                    <div>
                                        <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                            {outLot.lotNo}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {outLot.auction ?? "N/A"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-medium text-sm text-blue-600 dark:text-blue-400">
                                        ${outLot.baselinePrice.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {outLot.totalWeight.toFixed(2)} kg
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2 justify-between text-xs"
                                onClick={() => toggleRowExpand(outLot.id)}
                            >
                                <span>More details</span>
                                {expandedRows.includes(outLot.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>

                            {expandedRows.includes(outLot.id) && (
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Broker</div>
                                        <div>{formatBrokerName(outLot.broker) ?? "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Grade</div>
                                        <div>{outLot.grade ?? "N/A"}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Bags</div>
                                        <div>{outLot.bags}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 dark:text-gray-400">Tare Weight</div>
                                        <div>{(outLot.totalWeight - outLot.netWeight).toFixed(2)} kg</div>
                                    </div>
                                    {outLot.sellingMark && (
                                        <div className="col-span-2">
                                            <div className="text-gray-500 dark:text-gray-400">Selling Mark</div>
                                            <div>{outLot.sellingMark}</div>
                                        </div>
                                    )}
                                    {outLot.invoiceNo && (
                                        <div className="col-span-2">
                                            <div className="text-gray-500 dark:text-gray-400">Invoice No</div>
                                            <div>{outLot.invoiceNo}</div>
                                        </div>
                                    )}
                                    {outLot.manufactureDate && (
                                        <div className="col-span-2">
                                            <div className="text-gray-500 dark:text-gray-400">Manufacture Date</div>
                                            <div>
                                                {new Date(outLot.manufactureDate).toLocaleDateString("en-US", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        {t("catalog:noOutLots", { defaultValue: "No outlots found" })}
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
                                checked={selectAllAcrossPages || (outLotsData.length > 0 && selectedItems.length === outLotsData.length)}
                                onCheckedChange={handleSelectAll}
                                aria-label={t("catalog:actions.selectAll", { defaultValue: "Select all" })}
                                className="border-gray-300 dark:border-gray-600"
                            />
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:lotNo", { defaultValue: "Lot Number" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:auction", { defaultValue: "Auction" })}</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">{t("catalog:broker", { defaultValue: "Broker" })}</TableHead>
                        <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:grade", { defaultValue: "Grade" })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:bags", { defaultValue: "Bags" })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:tareWeight", { defaultValue: "Tare Weight" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t("catalog:totalWeight", { defaultValue: "Total Weight" })}</TableHead>
                        <TableHead className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                            {t("catalog:baselinePrice", { defaultValue: "Baseline Price" })}
                        </TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {outLotsData.length > 0 ? (
                        outLotsData.map((outLot) => (
                            <TableRow
                                key={outLot.id}
                                className={`${
                                    selectedItems.includes(outLot.id)
                                        ? "bg-indigo-50 dark:bg-indigo-900/30"
                                        : "bg-white dark:bg-gray-900"
                                } hover:bg-gray-100 dark:hover:bg-gray-800`}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedItems.includes(outLot.id)}
                                        onCheckedChange={() => handleSelectItem(outLot.id)}
                                        aria-label={t("catalog:actions.selectItem", {
                                            defaultValue: "Select item {{lotNo}}",
                                            lotNo: outLot.lotNo,
                                        })}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{outLot.lotNo}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{outLot.auction ?? "N/A"}</TableCell>
                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {formatBrokerName(outLot.broker) ?? "N/A"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">{outLot.sellingMark ?? "N/A"}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{outLot.grade ?? "N/A"}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">{outLot.invoiceNo ?? "N/A"}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{outLot.bags}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {(outLot.totalWeight - outLot.netWeight).toFixed(2)} kg
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {outLot.totalWeight.toFixed(2)} kg
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                                    ${outLot.baselinePrice.toFixed(2)}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    {outLot.manufactureDate
                                        ? new Date(outLot.manufactureDate).toLocaleDateString("en-US", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                        : "N/A"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={12} className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                {t("catalog:noOutLots", { defaultValue: "No outlots found" })}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default OutLotsTable;