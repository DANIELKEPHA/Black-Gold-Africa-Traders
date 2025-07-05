"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OutLotsResponse } from "@/state";

export interface OutLotsTableProps {
    OutLotsData: OutLotsResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const OutLotsTable: React.FC<OutLotsTableProps> = ({
                                                       OutLotsData,
                                                       selectedItems,
                                                       handleSelectItem,
                                                   }) => {
    const { t } = useTranslation(["catalog", "general"]);

    const handleSelectAll = () => {
        if (selectedItems.length === OutLotsData.length && OutLotsData.length > 0) {
            handleSelectItem(0); // Deselect all
        } else {
            OutLotsData.forEach((outLot) => {
                if (!selectedItems.includes(outLot.id)) {
                    handleSelectItem(outLot.id);
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
                            checked={selectedItems.length === OutLotsData.length && OutLotsData.length > 0}
                            onChange={handleSelectAll}
                            aria-label={t("catalog:actions.selectAll", { defaultValue: "Select all" })}
                            className="border-gray-300 dark:border-gray-600"
                        />
                    </TableHead>
                    <TableHead>{t("catalog:lotNo", { defaultValue: "Lot Number" })}</TableHead>
                    <TableHead>{t("catalog:auction", { defaultValue: "Auction" })}</TableHead>
                    <TableHead>{t("catalog:broker", { defaultValue: "Broker" })}</TableHead>
                    <TableHead>{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}</TableHead>
                    <TableHead>{t("catalog:grade", { defaultValue: "Grade" })}</TableHead>
                    <TableHead>{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}</TableHead>
                    <TableHead>{t("catalog:bags", { defaultValue: "Bags" })}</TableHead>
                    <TableHead>{t("catalog:tareWeight", { defaultValue: "Tare Weight" })}</TableHead>
                    <TableHead>{t("catalog:totalWeight", { defaultValue: "Total Weight" })}</TableHead>
                    <TableHead className="text-blue-600">
                        {t("catalog:baselinePrice", { defaultValue: "Baseline Price" })}
                    </TableHead>
                    <TableHead>{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {OutLotsData.length > 0 ? (
                    OutLotsData.map((outLot) => (
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
                                    onChange={() => handleSelectItem(outLot.id)}
                                    aria-label={t("catalog:actions.selectItem", {
                                        defaultValue: "Select item {{lotNo}}",
                                        lotNo: outLot.lotNo,
                                    })}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.lotNo}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.auction}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {formatBrokerName(outLot.broker)}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.sellingMark}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.grade}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.invoiceNo}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.bags}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {(outLot.totalWeight - outLot.netWeight).toFixed(2)} kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {outLot.totalWeight.toFixed(2)} kg
                            </TableCell>
                            <TableCell className="text-blue-600 dark:text-blue-400">
                                ${outLot.baselinePrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {new Date(outLot.manufactureDate).toISOString().slice(0, 10)}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={12} className="text-center py-4 text-gray-500 dark:text-gray-400">
                            {t("catalog:noOutLots", { defaultValue: "No outLots found" })}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default OutLotsTable;