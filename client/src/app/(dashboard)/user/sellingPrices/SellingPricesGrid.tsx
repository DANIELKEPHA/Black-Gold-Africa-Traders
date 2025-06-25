"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { SellingPriceResponse } from "@/state";
import { formatBrokerName } from "@/lib/utils";

interface SellingPricesGridProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const SellingPricesGrid: React.FC<SellingPricesGridProps> = ({
                                                                 sellingPricesData,
                                                                 selectedItems,
                                                                 handleSelectItem,
                                                             }) => {
    const { t } = useTranslation("sellingPrices");

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellingPricesData.length > 0 ? (
                sellingPricesData.map((price) => (
                    <Card
                        key={price.id}
                        className={`${
                            selectedItems.includes(price.id) ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-gray-800"
                        } border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-800 dark:text-gray-100">{price.lotNo}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex items-center">
                                <Checkbox
                                    checked={selectedItems.includes(price.id)}
                                    onCheckedChange={() => handleSelectItem(price.id)}
                                    aria-label={t("actions.selectItem", { lotNo: price.lotNo })}
                                />
                                <span className="ml-2 text-gray-600 dark:text-gray-300">{t("actions.select")}</span>
                            </div>
                            <p><strong>{t("headers.broker")}:</strong> {formatBrokerName(price.broker)}</p>
                            <p><strong>{t("headers.saleCode")}:</strong> {price.saleCode}</p>
                            <p><strong>{t("headers.sellingMark")}:</strong> {price.sellingMark}</p>
                            <p><strong>{t("headers.grade")}:</strong> {price.grade}</p>
                            <p><strong>{t("headers.invoiceNo")}:</strong> {price.invoiceNo}</p>
                            <p><strong>{t("headers.category")}:</strong> {price.category}</p>
                            <p><strong>{t("headers.reprint")}:</strong> {price.reprint}</p>
                            <p><strong>{t("headers.bags")}:</strong> {price.bags}</p>
                            <p><strong>{t("headers.netWeight")}:</strong> {price.netWeight.toFixed(2)}</p>
                            <p><strong>{t("headers.totalWeight")}:</strong> {price.totalWeight.toFixed(2)}</p>
                            <p><strong>{t("headers.askingPrice")}:</strong> <span className="text-green-600 dark:text-green-400">${price.askingPrice.toFixed(2)}</span></p>
                            <p><strong>{t("headers.purchasePrice")}:</strong> <span className="text-blue-600 dark:text-blue-400">${price.purchasePrice.toFixed(2)}</span></p>
                            <p><strong>{t("headers.producerCountry")}:</strong> {price.producerCountry || "N/A"}</p>
                            <p><strong>{t("headers.manufactureDate")}:</strong> {price.manufactureDate ? new Date(price.manufactureDate).toLocaleDateString("en-US") : "N/A"}</p>
                            <p><strong>{t("headers.admin")}:</strong> {price.admin?.name || "N/A"}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center py-6 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {t("noSellingPrices")}
                </div>
            )}
        </div>
    );
};

export default SellingPricesGrid;