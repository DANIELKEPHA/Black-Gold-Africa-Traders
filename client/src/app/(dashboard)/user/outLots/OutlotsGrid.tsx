"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { OutLotsResponse } from "@/state";

export interface OutLotsGridProps {
    OutLotsData: OutLotsResponse[];
    selectedItems: number[];
    handleSelectItem: (itemId: number) => void;
}

const OutLotsGrid: React.FC<OutLotsGridProps> = ({
                                                     OutLotsData,
                                                     selectedItems,
                                                     handleSelectItem,
                                                 }) => {
    const { t } = useTranslation(["catalog", "general"]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OutLotsData.length > 0 ? (
                OutLotsData.map((outLot) => (
                    <Card
                        key={outLot.id}
                        className={`rounded-sm border-gray-200 dark:border-gray-700 ${
                            selectedItems.includes(outLot.id)
                                ? "bg-indigo-50 dark:bg-indigo-900/30"
                                : "bg-white dark:bg-gray-900"
                        }`}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {outLot.lotNo}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(outLot.id)}
                                    onChange={() => handleSelectItem(outLot.id)}
                                    aria-label={t("catalog:actions.selectItem", {
                                        defaultValue: "Select item {{lotNo}}",
                                        lotNo: outLot.lotNo,
                                    })}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {t("catalog:actions.selectItem", { defaultValue: "Select item" })}
                                </span>
                            </div>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:auction", { defaultValue: "Auction" })}:
                                </span>{" "}
                                {outLot.auction}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:broker", { defaultValue: "Broker" })}:
                                </span>{" "}
                                {formatBrokerName(outLot.broker)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:
                                </span>{" "}
                                {outLot.sellingMark}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:grade", { defaultValue: "Grade" })}:
                                </span>{" "}
                                {outLot.grade}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:
                                </span>{" "}
                                {outLot.invoiceNo}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:bags", { defaultValue: "Bags" })}:
                                </span>{" "}
                                {outLot.bags}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:tareWeight", { defaultValue: "Tare Weight" })}:
                                </span>{" "}
                                {(outLot.totalWeight - outLot.netWeight).toFixed(2)} kg
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:totalWeight", { defaultValue: "Total Weight" })}:
                                </span>{" "}
                                {outLot.totalWeight.toFixed(2)} kg
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:baselinePrice", { defaultValue: "Baseline Price" })}:
                                </span>{" "}
                                ${outLot.baselinePrice.toFixed(2)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:
                                </span>{" "}
                                {new Date(outLot.manufactureDate).toISOString().slice(0, 10)}
                            </p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                    {t("catalog:noOutLots", { defaultValue: "No outLots found" })}
                </div>
            )}
        </div>
    );
};

export default OutLotsGrid;