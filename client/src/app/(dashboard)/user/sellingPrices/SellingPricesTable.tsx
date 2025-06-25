"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { SellingPriceResponse } from "@/state";

interface SellingPricesTableProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const SellingPricesTable: React.FC<SellingPricesTableProps> = ({
                                                                   sellingPricesData,
                                                                   selectedItems,
                                                                   handleSelectItem,
                                                               }) => {
    const { t } = useTranslation("sellingPrices");

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="w-12">
                            <span className="sr-only">{t("headers.select")}</span>
                        </TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.broker")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.saleCode")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.lotNo")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.sellingMark")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.grade")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.invoiceNo")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.category")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.reprint")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.bags")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.netWeight")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.totalWeight")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.askingPrice")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.purchasePrice")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.producerCountry")}</TableHead>
                        <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("headers.manufactureDate")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sellingPricesData.length > 0 ? (
                        sellingPricesData.map((price) => (
                            <TableRow
                                key={price.id}
                                className={selectedItems.includes(price.id) ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-gray-800"}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedItems.includes(price.id)}
                                        onCheckedChange={() => handleSelectItem(price.id)}
                                        aria-label={t("actions.selectItem", { lotNo: price.lotNo })}
                                    />
                                </TableCell>
                                <TableCell className="text-sm">{formatBrokerName(price.broker)}</TableCell>
                                <TableCell className="text-sm">{price.saleCode}</TableCell>
                                <TableCell className="text-sm">{price.lotNo}</TableCell>
                                <TableCell className="text-sm">{price.sellingMark}</TableCell>
                                <TableCell className="text-sm">{price.grade}</TableCell>
                                <TableCell className="text-sm">{price.invoiceNo}</TableCell>
                                <TableCell className="text-sm">{price.category}</TableCell>
                                <TableCell className="text-sm">{price.reprint}</TableCell>
                                <TableCell className="text-sm">{price.bags}</TableCell>
                                <TableCell className="text-sm">{price.netWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">{price.totalWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-sm font-medium text-green-600 dark:text-green-400">${price.askingPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-sm font-medium text-blue-600 dark:text-blue-400">${price.purchasePrice.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">{price.producerCountry || "N/A"}</TableCell>
                                <TableCell className="text-sm">
                                    {price.manufactureDate ? new Date(price.manufactureDate).toLocaleDateString("en-US") : "N/A"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={16} className="text-center text-sm text-gray-600 dark:text-gray-300">
                                {t("noSellingPrices")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default SellingPricesTable;