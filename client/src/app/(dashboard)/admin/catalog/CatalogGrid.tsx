"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import { CatalogResponse } from "@/state";

export interface CatalogGridProps {
    catalogData: CatalogResponse[];
    selectedItems: number[];
    handleSelectItem: (itemId: number) => void;
    handleDelete: (id: number) => Promise<void>;
    isDeleting: Record<number, boolean>;
}

const CatalogGrid: React.FC<CatalogGridProps> = ({
                                                     catalogData,
                                                     selectedItems,
                                                     handleSelectItem,
                                                     handleDelete,
                                                     isDeleting,
                                                 }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser } = useGetAuthUserQuery();
    const isAdmin = authUser?.userRole === "admin";

    const handleCardClick = (catalogId: number) => {
        router.push(`/admin/catalog/${catalogId}`);
    };

    // Helper to safely render potentially null or complex fields
    const renderField = (value: any): string => {
        if (value == null) return "N/A";
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }
        return "N/A"; // Fallback for unexpected types
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogData.length > 0 ? (
                catalogData.map((catalog) => (
                    <Card
                        key={catalog.id}
                        className={`cursor-pointer rounded-sm border-gray-200 dark:border-gray-700 ${
                            selectedItems.includes(catalog.id) ? "bg-blue-50 dark:bg-blue-800" : "bg-white dark:bg-gray-900"
                        }`}
                        onClick={() => handleCardClick(catalog.id)}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">{catalog.lotNo}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(catalog.id)}
                                    onChange={() => handleSelectItem(catalog.id)}
                                    aria-label={t("catalog:actions.selectItem", { defaultValue: "Select item {{lotNo}}", lotNo: catalog.lotNo })}
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
                                {renderField(catalog.category)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:grade", { defaultValue: "Grade" })}:
                                </span>{" "}
                                {renderField(catalog.grade)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:broker", { defaultValue: "Broker" })}:
                                </span>{" "}
                                {renderField(formatBrokerName(catalog.broker))}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:
                                </span>{" "}
                                {renderField(catalog.sellingMark)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:sale", { defaultValue: "Sale" })}:
                                </span>{" "}
                                {renderField(catalog.saleCode)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:bags", { defaultValue: "Bags" })}:
                                </span>{" "}
                                {catalog.bags}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:tareWeight", { defaultValue: "Tare Weight" })}:
                                </span>{" "}
                                {(catalog.totalWeight - catalog.netWeight).toFixed(2)} kg
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:totalWeight", { defaultValue: "Total Weight" })}:
                                </span>{" "}
                                {catalog.totalWeight.toFixed(2)} kg
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:country", { defaultValue: "Country" })}:
                                </span>{" "}
                                {renderField(catalog.producerCountry)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:askingPrice", { defaultValue: "Asking Price" })}:
                                </span>{" "}
                                ${catalog.askingPrice.toFixed(2)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:
                                </span>{" "}
                                {renderField(catalog.invoiceNo)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:
                                </span>{" "}
                                {catalog.manufactureDate
                                    ? new Date(catalog.manufactureDate).toLocaleDateString("en-US", {
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
                                {catalog.reprint}
                            </p>
                            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                {isAdmin && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(catalog.id)}
                                        disabled={isDeleting[catalog.id] ?? false}
                                        className="rounded-sm bg-red-600 hover:bg-red-700 text-white"
                                        aria-label={t("catalog:actions.delete", { defaultValue: "Delete item {{lotNo}}", lotNo: catalog.lotNo })}
                                    >
                                        {isDeleting[catalog.id]
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
                    {t("catalog:noCatalogs", { defaultValue: "No catalogs found" })}
                </div>
            )}
        </div>
    );
};

export default CatalogGrid;