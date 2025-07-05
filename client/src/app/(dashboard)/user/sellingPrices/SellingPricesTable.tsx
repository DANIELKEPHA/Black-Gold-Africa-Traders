"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SellingPriceResponse } from "@/state";

export interface SellingPricesTableProps {
    SellingPriceData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const SellingPricesTable: React.FC<SellingPricesTableProps> = ({
                                                                   SellingPriceData,
                                                                   selectedItems,
                                                                   handleSelectItem,
                                                               }) => {
    const { t } = useTranslation(["catalog", "general", "sellingPrices"]);

    const handleSelectAll = () => {
        if (selectedItems.length === SellingPriceData.length && SellingPriceData.length > 0) {
            handleSelectItem(0); // Deselect all
        } else {
            SellingPriceData.forEach((SellingPrice) => {
                if (!selectedItems.includes(SellingPrice.id)) {
                    handleSelectItem(SellingPrice.id);
                }
            });
        }
    };

    return (
        <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={selectedItems.length === SellingPriceData.length && SellingPriceData.length > 0}
                            onChange={handleSelectAll}
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
                {SellingPriceData.length > 0 ? (
                    SellingPriceData.map((SellingPrice) => (
                        <TableRow
                            key={SellingPrice.id}
                            className={`${
                                selectedItems.includes(SellingPrice.id)
                                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                                    : "bg-white dark:bg-gray-900"
                            } hover:bg-gray-100 dark:hover:bg-gray-800`}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(SellingPrice.id)}
                                    onChange={() => handleSelectItem(SellingPrice.id)}
                                    aria-label={t("catalog:actions.selectItem", {
                                        defaultValue: "Select item {{lotNo}}",
                                        lotNo: SellingPrice.lotNo,
                                    })}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.lotNo}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.category ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.grade ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {formatBrokerName(SellingPrice.broker) ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.sellingMark ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.saleCode ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.bags}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {(SellingPrice.totalWeight - SellingPrice.netWeight).toFixed(2)} kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {SellingPrice.totalWeight.toFixed(2)} kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.producerCountry ?? "N/A"}</TableCell>
                            <TableCell className="text-blue-600 dark:text-blue-400">
                                ${SellingPrice.askingPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-green-600 dark:text-green-400">
                                ${SellingPrice.purchasePrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.invoiceNo}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {SellingPrice.manufactureDate
                                    ? new Date(SellingPrice.manufactureDate).toISOString().slice(0, 10)
                                    : "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{SellingPrice.reprint}</TableCell>
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