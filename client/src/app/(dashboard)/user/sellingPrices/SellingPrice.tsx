"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetSellingPricesQuery, useExportSellingPricesXlsxMutation } from "@/state/api"; // Updated imports
import { useAppSelector } from "@/state/redux";
import { Button } from "@/components/ui/button";
import SellingPricesActions from "@/app/(dashboard)/user/sellingPrices/SellingPricesActions";
import SellingPricesTable from "@/app/(dashboard)/user/sellingPrices/SellingPricesTable";
import SellingPricesGrid from "@/app/(dashboard)/user/sellingPrices/SellingPricesGrid";
import Loading from "@/components/Loading";

const SellingPrices: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters);
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const limit = 100;

    const { data: sellingPricesDataResponse, isLoading, error } = useGetSellingPricesQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const [exportSellingPricesXlsx] = useExportSellingPricesXlsxMutation(); // Only export mutation remains

    const sellingPricesData = sellingPricesDataResponse?.data || [];
    const { totalPages = 1 } = sellingPricesDataResponse?.meta || {};

    const handleSelectItem = useCallback((itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        if (!sellingPricesData || sellingPricesData.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === sellingPricesData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(sellingPricesData.map((item) => item.id));
        }
    }, [sellingPricesData, selectedItems.length]);

    const handleDownload = async () => {
        try {
            const ids = selectedItems.length > 0
                ? selectedItems
                : sellingPricesData.map(item => item.id);

            if (sellingPricesData.length === 0) {
                toast.error(t("catalog:errors.noItems", { defaultValue: "No selling prices available to export" }));
                return;
            }

            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting selling prices with IDs:`, ids);
            await exportSellingPricesXlsx({
                sellingPriceIds: ids,
            }).unwrap();
            toast.success(t("catalog:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" }));
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            toast.error(t("catalog:errors.xlsxError", { defaultValue: "Failed to export XLSX" }));
        }
    };

    if (isAuthLoading || isLoading) return <Loading />;
    if (error)
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading selling prices" })}
            </div>
        );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
            <Toaster richColors position="top-right" />
            <SellingPricesActions
                sellingPricesData={sellingPricesData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
                handleDownload={handleDownload} // Updated prop
            />
            {viewMode === "list" ? (
                <SellingPricesTable
                    SellingPriceData={sellingPricesData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            ) : (
                <SellingPricesGrid
                    SellingPriceData={sellingPricesData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            )}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    <Button
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="rounded-sm bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.previous", { defaultValue: "Previous" })}
                    </Button>
                    <span className="text-gray-700 dark:text-gray-200">
                        {t("general:pagination.page", { page, totalPages })}
                    </span>
                    <Button
                        disabled={page === totalPages || isLoading}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="rounded-sm bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.next", { defaultValue: "Next" })}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SellingPrices;