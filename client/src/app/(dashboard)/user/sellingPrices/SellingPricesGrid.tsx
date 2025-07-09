"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { useGetAuthUserQuery } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import { SellingPriceResponse } from "@/state";

export interface SellingPricesGridProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectItem: (itemId: number) => void;
}

const SellingPricesGrid: React.FC<SellingPricesGridProps> = ({
                                                                 sellingPricesData,
                                                                 selectedItems,
                                                                 handleSelectItem,
                                                             }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellingPricesData.length > 0 ? (
                sellingPricesData.map((sellingPrice) => (
                    <Card
                        key={sellingPrice.id}
                        className={`rounded-sm border-gray-200 dark:border-gray-700 ${
                            selectedItems.includes(sellingPrice.id)
                                ? "bg-indigo-50 dark:bg-indigo-900/30"
                                : "bg-white dark:bg-gray-900"
                        }`}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                {sellingPrice.lotNo ?? "N/A"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(sellingPrice.id)}
                                    onCheckedChange={() => {
                                        console.log(
                                            "[SellingPricesGrid] Checkbox toggled for sellingPrice id:",
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
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    {t("catalog:actions.selectItem", { defaultValue: "Select item" })}
                                </span>
                            </div>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:category", { defaultValue: "Category" })}:
                                </span>{" "}
                                {sellingPrice.category ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:grade", { defaultValue: "Grade" })}:
                                </span>{" "}
                                {sellingPrice.grade ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:broker", { defaultValue: "Broker" })}:
                                </span>{" "}
                                {formatBrokerName(sellingPrice.broker) ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:
                                </span>{" "}
                                {sellingPrice.sellingMark ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:saleCode", { defaultValue: "Sale Code" })}:
                                </span>{" "}
                                {sellingPrice.saleCode ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:bags", { defaultValue: "Bags" })}:
                                </span>{" "}
                                {sellingPrice.bags ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:tareWeight", { defaultValue: "Tare Weight" })}:
                                </span>{" "}
                                {sellingPrice.totalWeight && sellingPrice.netWeight
                                    ? (sellingPrice.totalWeight - sellingPrice.netWeight).toFixed(2)
                                    : "N/A"}{" "}
                                kg
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:totalWeight", { defaultValue: "Total Weight" })}:
                                </span>{" "}
                                {sellingPrice.totalWeight?.toFixed(2) ?? "N/A"} kg
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:producerCountry", { defaultValue: "Producer Country" })}:
                                </span>{" "}
                                {sellingPrice.producerCountry ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:askingPrice", { defaultValue: "Asking Price" })}:
                                </span>{" "}
                                ${sellingPrice.askingPrice?.toFixed(2) ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:purchasePrice", { defaultValue: "Purchase Price" })}:
                                </span>{" "}
                                ${sellingPrice.purchasePrice?.toFixed(2) ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:
                                </span>{" "}
                                {sellingPrice.invoiceNo ?? "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:
                                </span>{" "}
                                {sellingPrice.manufactureDate
                                    ? new Date(sellingPrice.manufactureDate).toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    })
                                    : "N/A"}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:reprint", { defaultValue: "Reprint" })}:
                                </span>{" "}
                                {sellingPrice.reprint ?? "No"}
                            </p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                    {t("catalog:noSellingPrices", { defaultValue: "No selling prices found" })}
                </div>
            )}
        </div>
    );
};

export default SellingPricesGrid;