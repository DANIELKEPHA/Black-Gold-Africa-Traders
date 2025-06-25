"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { OutlotResponse } from "@/state";
import { formatBrokerName } from "@/lib/utils";

interface OutlotsGridProps {
    outlotData: OutlotResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const OutlotsGrid: React.FC<OutlotsGridProps> = ({
                                                     outlotData,
                                                     selectedItems,
                                                     handleSelectItem,
                                                 }) => {
    const { t } = useTranslation("catalog");

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlotData.length > 0 ? (
                outlotData.map((outlot) => (
                    <Card
                        key={outlot.id}
                        className={selectedItems.includes(outlot.id) ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-gray-800"}
                    >
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">{outlot.lotNo}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="flex items-center mb-2">
                                <Checkbox
                                    checked={selectedItems.includes(outlot.id)}
                                    onCheckedChange={() => handleSelectItem(outlot.id)}
                                    aria-label={t("actions.selectItem", { lotNo: outlot.lotNo })}
                                />
                                <span className="ml-2">{t("actions.select")}</span>
                            </div>
                            <p><strong>{t("outlot:headers.auction")}:</strong> {outlot.auction}</p>
                            <p><strong>{t("outlot:headers.broker")}:</strong> {formatBrokerName(outlot.broker)}</p>
                            <p><strong>{t("outlot:headers.sellingMark")}:</strong> {outlot.sellingMark}</p>
                            <p><strong>{t("outlot:headers.grade")}:</strong> {outlot.grade}</p>
                            <p><strong>{t("outlot:headers.invoiceNo")}:</strong> {outlot.invoiceNo || "N/A"}</p>
                            <p><strong>{t("outlot:headers.bags")}:</strong> {outlot.bags}</p>
                            <p><strong>{t("outlot:headers.netWeight")}:</strong> {outlot.netWeight.toFixed(2)}</p>
                            <p><strong>{t("outlot:headers.totalWeight")}:</strong> {outlot.totalWeight.toFixed(2)}</p>
                            <p><strong>{t("outlot:headers.baselinePrice")}:</strong> ${outlot.baselinePrice.toFixed(2)}</p>
                            <p><strong>{t("outlot:headers.manufactureDate")}:</strong> {outlot.manufactureDate ? new Date(outlot.manufactureDate).toLocaleDateString("en-US") : "N/A"}</p>
                            <p><strong>{t("outlot:headers.admin")}:</strong> {outlot.admin?.name || "N/A"}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="col-span-full text-center py-4 text-sm text-gray-600 dark:text-gray-300">
                    {t("noOutlots")}
                </div>
            )}
        </div>
    );
};

export default OutlotsGrid;