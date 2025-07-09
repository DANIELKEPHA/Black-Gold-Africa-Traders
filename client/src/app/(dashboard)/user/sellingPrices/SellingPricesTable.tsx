"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SellingPriceResponse } from "@/state";

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

    return (
        <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={sellingPricesData.length > 0 && selectedItems.length === sellingPricesData.length}
                            onCheckedChange={() => {
                                console.log("[SellingPricesTable] Select all checkbox toggled");
                                handleSelectAll();
                            }}
                            aria-label={t("catalog:actions.selectAll", { defaultValue: "Select all" })}
                            className="border-gray-300 dark:border-gray-600"
                        />
                    </TableHead>
                    <TableHead>{t("catalog:lotNo", { defaultValue: "Lot Number" })}</TableHead>
                    <TableHead>{t("catalog:category", { defaultValue: "Category" })}</TableHead>
                    <TableHead>{t("catalog:grade", { defaultValue: "Grade" })}</TableHead>
                    <TableHead>{t("catalog:broker", { defaultValue: "Broker" })}</TableHead>
                    <TableHead>{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}</TableHead>
                    <TableHead>{t("headers:saleCode", { defaultValue: "Sale Code" })}</TableHead>
                    <TableHead>{t("catalog:bags", { defaultValue: "Bags" })}</TableHead>
                    <TableHead>{t("catalog:tareWeight", { defaultValue: "Tare Weight" })}</TableHead>
                    <TableHead>{t("catalog:totalWeight", { defaultValue: "Total Weight" })}</TableHead>
                    <TableHead>{t("catalog:country", { defaultValue: "Country" })}</TableHead>
                    <TableHead className="text-blue-600">
                        {t("catalog:askingPrice", { defaultValue: "Asking Price" })}
                    </TableHead>
                    <TableHead className="text-green-600">
                        {t("catalog:purchasePrice", { defaultValue: "Purchase Price" })}
                    </TableHead>
                    <TableHead>{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}</TableHead>
                    <TableHead>{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}</TableHead>
                    <TableHead>{t("catalog:reprint.label", { defaultValue: "Reprint" })}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sellingPricesData.length > 0 ? (
                    sellingPricesData.map((sellingPrice) => (
                        <TableRow
                            key={sellingPrice.id}
                            className={`${
                                selectedItems.includes(sellingPrice.id)
                                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                                    : "bg-white dark:bg-gray-900"
                            } hover:bg-gray-100 dark:hover:bg-gray-800`}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(sellingPrice.id)}
                                    onCheckedChange={() => {
                                        console.log(
                                            "[SellingPricesTable] Checkbox toggled for sellingPrice id:",
                                            sellingPrice.id
                                        );
                                        handleSelectItem(sellingPrice.id);
                                    }}
                                    aria-label={t("catalog:actions.selectItem", {
                                        defaultValue: "Select item {{lotNo}}",
                                        lotNo: sellingPrice.lotNo ?? "N/A",
                                    })}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.lotNo ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.category ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.grade ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {formatBrokerName(sellingPrice.broker) ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.sellingMark ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.saleCode ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.bags ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.totalWeight && sellingPrice.netWeight
                                    ? (sellingPrice.totalWeight - sellingPrice.netWeight).toFixed(2)
                                    : "N/A"}{" "}
                                kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.totalWeight?.toFixed(2) ?? "N/A"} kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.producerCountry ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-blue-600 dark:text-blue-400">
                                ${sellingPrice.askingPrice?.toFixed(2) ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-green-600 dark:text-green-400">
                                ${sellingPrice.purchasePrice?.toFixed(2) ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.invoiceNo ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.manufactureDate
                                    ? new Date(sellingPrice.manufactureDate).toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    : "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {sellingPrice.reprint ?? "No"}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={16} className="text-center py-4 text-gray-500 dark:text-gray-400">
                            {t("catalog:noSellingPrices", { defaultValue: "No selling prices found" })}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default SellingPricesTable;