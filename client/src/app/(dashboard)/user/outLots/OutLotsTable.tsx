"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { OutlotResponse } from "@/state";

interface OutlotsTableProps { outlotData: OutlotResponse[]; selectedItems: number[]; handleSelectItem: (id: number) => void; }

const OutlotsTable: React.FC<OutlotsTableProps> = ({
                                                     outlotData,
                                                     selectedItems,
                                                     handleSelectItem,
                                                 }) => {
    const { t } = useTranslation("catalog");

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <span className="sr-only">{t("outlot:headers.select")}</span>
                        </TableHead>
                        <TableHead className="text-sm">{t("headers.auction")}</TableHead>
                        <TableHead className="text-sm">{t("headers.broker")}</TableHead>
                        <TableHead className="text-sm">{t("headers.lotNo")}</TableHead>
                        <TableHead className="text-sm">{t("headers.sellingMark")}</TableHead>
                        <TableHead className="text-sm">{t("headers.grade")}</TableHead>
                        <TableHead className="text-sm">{t("headers.invoiceNo")}</TableHead>
                        <TableHead className="text-sm">{t("headers.bags")}</TableHead>
                        <TableHead className="text-sm">{t("headers.netWeight")}</TableHead>
                        <TableHead className="text-sm">{t("headers.totalWeight")}</TableHead>
                        <TableHead className="text-sm">{t("headers.baselinePrice")}</TableHead>
                        <TableHead className="text-sm">{t("headers.manufactureDate")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {outlotData.length > 0 ? (
                        outlotData.map((outlot) => (
                            <TableRow
                                key={outlot.id}
                                className={selectedItems.includes(outlot.id) ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-gray-800"}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedItems.includes(outlot.id)}
                                        onCheckedChange={() => handleSelectItem(outlot.id)}
                                        aria-label={t("actions.selectItem", { lotNo: outlot.lotNo })}
                                    />
                                </TableCell>
                                <TableCell className="text-sm">{outlot.auction}</TableCell>
                                <TableCell className="text-sm">{formatBrokerName(outlot.broker)}</TableCell>
                                <TableCell className="text-sm">{outlot.lotNo}</TableCell>
                                <TableCell className="text-sm">{outlot.sellingMark}</TableCell>
                                <TableCell className="text-sm">{outlot.grade}</TableCell>
                                <TableCell className="text-sm">{outlot.invoiceNo || "N/A"}</TableCell>
                                <TableCell className="text-sm">{outlot.bags}</TableCell>
                                <TableCell className="text-sm">{outlot.netWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">{outlot.totalWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">${outlot.baselinePrice.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">
                                    {outlot.manufactureDate ? new Date(outlot.manufactureDate).toLocaleDateString("en-US") : "N/A"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={12} className="text-center text-sm text-gray-600 dark:text-gray-300">
                                {t("noOutlots")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

};

export default OutlotsTable;