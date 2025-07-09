"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAuthUserQuery } from "@/state/api";
import { OutLotsResponse } from "@/state";

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

    return (
        <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={selectAllAcrossPages || (outLotsData.length > 0 && selectedItems.length === outLotsData.length)}
                            onCheckedChange={() => {
                                console.log("[OutLotsTable] Select all checkbox toggled");
                                handleSelectAll();
                            }}
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
                                    onCheckedChange={() => {
                                        console.log("[OutLotsTable] Checkbox toggled for outlot id:", outLot.id);
                                        handleSelectItem(outLot.id);
                                    }}
                                    aria-label={t("catalog:actions.selectItem", {
                                        defaultValue: "Select item {{lotNo}}",
                                        lotNo: outLot.lotNo,
                                    })}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.lotNo}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.auction ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {formatBrokerName(outLot.broker) ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.sellingMark ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.grade ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{outLot.invoiceNo ?? "N/A"}</TableCell>
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
                        <TableCell colSpan={12} className="text-center py-4 text-gray-500 dark:text-gray-400">
                            {t("catalog:noOutLots", { defaultValue: "No outlots found" })}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default OutLotsTable;