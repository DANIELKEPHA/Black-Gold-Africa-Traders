"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { useGetAuthUserQuery } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import { OutLotsResponse } from "@/state";

export interface OutLotsGridProps {
    outLotsData: OutLotsResponse[];
    selectedItems: number[];
    handleSelectItem: (itemId: number) => void;
    handleDelete: (id: number) => Promise<void>;
    isDeleting: Record<number, boolean>;
}

const OutLotsGrid: React.FC<OutLotsGridProps> = ({
                                                     outLotsData,
                                                     selectedItems,
                                                     handleSelectItem,
                                                     handleDelete,
                                                     isDeleting,
                                                 }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
    const isAdmin = authUser?.userRole === "admin";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outLotsData.length > 0 ? (
                outLotsData.map((outLot) => (
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
                                    onCheckedChange={() => {
                                        // console.log("[OutLotsGrid] Checkbox toggled for outlot id:", outLot.id);
                                        handleSelectItem(outLot.id);
                                    }}
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
                                {outLot.auction ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:broker", { defaultValue: "Broker" })}:
                                </span>{" "}
                                {formatBrokerName(outLot.broker) ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:
                                </span>{" "}
                                {outLot.sellingMark ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:grade", { defaultValue: "Grade" })}:
                                </span>{" "}
                                {outLot.grade ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:
                                </span>{" "}
                                {outLot.invoiceNo ?? "N/A"}
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
                                {outLot.manufactureDate
                                    ? new Date(outLot.manufactureDate).toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    : "N/A"}
                            </p>
                            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                {isAdmin && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            // console.log("[OutLotsGrid] Delete button clicked for outlot id:", outLot.id);
                                            handleDelete(outLot.id);
                                        }}
                                        disabled={isDeleting[outLot.id] ?? false}
                                        className="rounded-sm bg-red-600 hover:bg-red-700 text-white"
                                        aria-label={t("catalog:actions.delete", {
                                            defaultValue: "Delete item {{lotNo}}",
                                            lotNo: outLot.lotNo,
                                        })}
                                    >
                                        {isDeleting[outLot.id]
                                            ? t("catalog:deleting", { defaultValue: "Deleting..." })
                                            : t("catalog:actions.delete", { defaultValue: "Delete" })}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                    {t("catalog:noOutLots", { defaultValue: "No outlots found" })}
                </div>
            )}
        </div>
    );
};

export default OutLotsGrid;