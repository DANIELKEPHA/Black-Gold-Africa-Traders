"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { CatalogResponse } from "@/state";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetAuthUserQuery } from "@/state/api";

export interface CatalogTableProps {
    catalogData: CatalogResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const CatalogTable: React.FC<CatalogTableProps> = ({
                                                       catalogData,
                                                       selectedItems,
                                                       handleSelectItem,
                                                   }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();

    const handleSelectAll = () => {
        if (selectedItems.length === catalogData.length && catalogData.length > 0) {
            handleSelectItem(0); // Deselect all
        } else {
            catalogData.forEach((catalog) => {
                if (!selectedItems.includes(catalog.id)) {
                    handleSelectItem(catalog.id);
                }
            });
        }
    };

    return (
        <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={selectedItems.length === catalogData.length && catalogData.length > 0}
                            onChange={handleSelectAll}
                            aria-label={t("catalog:actions.selectAll", { defaultValue: "Select all" })}
                            className="border-gray-300 dark:border-gray-600"
                        />
                    </TableHead>
                    <TableHead>{t("catalog:lotNo", { defaultValue: "Lot Number" })}</TableHead>
                    <TableHead>{t("catalog:category", { defaultValue: "Category" })}</TableHead>
                    <TableHead>{t("catalog:grade", { defaultValue: "Grade" })}</TableHead>
                    <TableHead>{t("catalog:broker", { defaultValue: "Broker" })}</TableHead>
                    <TableHead>{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}</TableHead>
                    <TableHead>{t("headers:saleCode", { defaultValue: "Sale Code" })}</TableHead>
                    <TableHead>{t("catalog:bags", { defaultValue: "Bags" })}</TableHead>
                    <TableHead>{t("catalog:tareWeight", { defaultValue: "Tare Weight" })}</TableHead>
                    <TableHead>{t("catalog:totalWeight", { defaultValue: "Total Weight" })}</TableHead>
                    <TableHead>{t("catalog:country", { defaultValue: "Country" })}</TableHead>
                    <TableHead>{t("catalog:askingPrice", { defaultValue: "Asking Price" })}</TableHead>
                    <TableHead>{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}</TableHead>
                    <TableHead>{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}</TableHead>
                    <TableHead>{t("catalog:reprint.label", { defaultValue: "Reprint" })}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {catalogData.length > 0 ? (
                    catalogData.map((catalog) => (
                        <TableRow
                            key={catalog.id}
                            className={`${
                                selectedItems.includes(catalog.id)
                                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                                    : "bg-white dark:bg-gray-900"
                            } hover:bg-gray-100 dark:hover:bg-gray-800`}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={selectedItems.includes(catalog.id)}
                                    onChange={() => handleSelectItem(catalog.id)}
                                    aria-label={t("catalog:actions.selectItem", {
                                        defaultValue: "Select item {{lotNo}}",
                                        lotNo: catalog.lotNo,
                                    })}
                                    className="border-gray-300 dark:border-gray-600"
                                />
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.lotNo}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.category ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.grade ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {formatBrokerName(catalog.broker) ?? "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.sellingMark ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.saleCode ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.bags}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {(catalog.totalWeight - catalog.netWeight).toFixed(2)} kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {catalog.totalWeight.toFixed(2)} kg
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.producerCountry ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                ${catalog.askingPrice.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.invoiceNo ?? "N/A"}</TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">
                                {catalog.manufactureDate
                                    ? new Date(catalog.manufactureDate).toISOString().slice(0, 10)
                                    : "N/A"}
                            </TableCell>
                            <TableCell className="text-gray-800 dark:text-gray-200">{catalog.reprint}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={15} className="text-center py-4 text-gray-500 dark:text-gray-400">
                            {t("catalog:noCatalogs", { defaultValue: "No catalogs found" })}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default CatalogTable;