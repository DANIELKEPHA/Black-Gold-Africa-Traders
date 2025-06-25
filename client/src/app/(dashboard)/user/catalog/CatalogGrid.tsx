"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { CatalogResponse } from "@/state";
import { formatBrokerName } from "@/lib/utils";

interface CatalogGridProps {
    catalogData: CatalogResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const CatalogGrid: React.FC<CatalogGridProps> = ({
                                                     catalogData,
                                                     selectedItems,
                                                     handleSelectItem,
                                                 }) => {
    const { t } = useTranslation("catalog");

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogData.length > 0 ? (
                catalogData.map((catalog) => (
                    <Card
                        key={catalog.id}
                        className={selectedItems.includes(catalog.id) ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-gray-800"}
                    >
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">{catalog.lotNo}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="flex items-center mb-2">
                                <Checkbox
                                    checked={selectedItems.includes(catalog.id)}
                                    onCheckedChange={() => handleSelectItem(catalog.id)}
                                    aria-label={t("actions.selectItem", { lotNo: catalog.lotNo })}
                                />
                                <span className="ml-2">{t("actions.select")}</span>
                            </div>
                            <p><strong>{t("headers.broker")}:</strong> {formatBrokerName(catalog.broker)}</p>
                            <p><strong>{t("headers.saleCode")}:</strong> {catalog.saleCode}</p>
                            <p><strong>{t("headers.sellingMark")}:</strong> {catalog.sellingMark}</p>
                            <p><strong>{t("headers.grade")}:</strong> {catalog.grade}</p>
                            <p><strong>{t("headers.invoiceNo")}:</strong> {catalog.invoiceNo || "N/A"}</p>
                            <p><strong>{t("headers.category")}:</strong> {catalog.category}</p>
                            <p><strong>{t("headers.reprint")}:</strong> {catalog.reprint ?? 0}</p>
                            <p><strong>{t("headers.bags")}:</strong> {catalog.bags}</p>
                            <p><strong>{t("headers.netWeight")}:</strong> {catalog.netWeight.toFixed(2)}</p>
                            <p><strong>{t("headers.totalWeight")}:</strong> {catalog.totalWeight.toFixed(2)}</p>
                            <p><strong>{t("headers.askingPrice")}:</strong> ${catalog.askingPrice.toFixed(2)}</p>
                            <p><strong>{t("headers.producerCountry")}:</strong> {catalog.producerCountry || "N/A"}</p>
                            <p><strong>{t("headers.manufactureDate")}:</strong> {catalog.manufactureDate ? new Date(catalog.manufactureDate).toLocaleDateString("en-US") : "N/A"}</p>
                            <p><strong>{t("headers.admin")}:</strong> {catalog.admin?.name || "N/A"}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center py-4 text-sm text-gray-600 dark:text-gray-300">
                    {t("noCatalogs")}
                </div>
            )}
        </div>
    );
};

export default CatalogGrid;