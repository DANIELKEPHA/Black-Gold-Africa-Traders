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
import { CatalogResponse } from "@/state";

interface CatalogTableProps {
    catalogData: CatalogResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const CatalogTable: React.FC<CatalogTableProps> = ({
                                                       catalogData,
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
                            <span className="sr-only">{t("headers.select")}</span>
                        </TableHead>
                        <TableHead className="text-sm">{t("headers.broker")}</TableHead>
                        <TableHead className="text-sm">{t("headers.saleCode")}</TableHead>
                        <TableHead className="text-sm">{t("headers.lotNo")}</TableHead>
                        <TableHead className="text-sm">{t("headers.sellingMark")}</TableHead>
                        <TableHead className="text-sm">{t("headers.grade")}</TableHead>
                        <TableHead className="text-sm">{t("headers.invoiceNo")}</TableHead>
                        <TableHead className="text-sm">{t("headers.category")}</TableHead>
                        <TableHead className="text-sm">{t("headers.reprint")}</TableHead>
                        <TableHead className="text-sm">{t("headers.bags")}</TableHead>
                        <TableHead className="text-sm">{t("headers.netWeight")}</TableHead>
                        <TableHead className="text-sm">{t("headers.totalWeight")}</TableHead>
                        <TableHead className="text-sm">{t("headers.askingPrice")}</TableHead>
                        <TableHead className="text-sm">{t("headers.country")}</TableHead>
                        <TableHead className="text-sm">{t("headers.manufactureDate")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {catalogData.length > 0 ? (
                        catalogData.map((catalog) => (
                            <TableRow
                                key={catalog.id}
                                className={selectedItems.includes(catalog.id) ? "bg-indigo-50 dark:bg-indigo-900" : "bg-white dark:bg-gray-800"}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedItems.includes(catalog.id)}
                                        onCheckedChange={() => handleSelectItem(catalog.id)}
                                        aria-label={t("actions.selectItem", { lotNo: catalog.lotNo })}
                                    />
                                </TableCell>
                                <TableCell className="text-sm">{formatBrokerName(catalog.broker)}</TableCell>
                                <TableCell className="text-sm">{catalog.saleCode}</TableCell>
                                <TableCell className="text-sm">{catalog.lotNo}</TableCell>
                                <TableCell className="text-sm">{catalog.sellingMark}</TableCell>
                                <TableCell className="text-sm">{catalog.grade}</TableCell>
                                <TableCell className="text-sm">{catalog.invoiceNo || "N/A"}</TableCell>
                                <TableCell className="text-sm">{catalog.category}</TableCell>
                                <TableCell className="text-sm">{catalog.reprint ?? 0}</TableCell>
                                <TableCell className="text-sm">{catalog.bags}</TableCell>
                                <TableCell className="text-sm">{catalog.netWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">{catalog.totalWeight.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">${catalog.askingPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-sm">{catalog.producerCountry || "N/A"}</TableCell>
                                <TableCell className="text-sm">
                                    {catalog.manufactureDate ? new Date(catalog.manufactureDate).toLocaleDateString("en-US") : "N/A"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={16} className="text-center text-sm text-gray-600 dark:text-gray-300">
                                {t("noCatalogs")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default CatalogTable;