
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetSellingPricesQuery, useExportSellingPricesXlsxMutation } from "@/state/api";
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
    const filters = useAppSelector((state) => state.global.filters) || {};
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const limit = 100;

    console.log("[SellingPrices] Filters before query:", filters);

    const { data: sellingPricesDataResponse, isLoading, error } = useGetSellingPricesQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const [exportSellingPricesXlsx] = useExportSellingPricesXlsxMutation();

    const sellingPricesData = sellingPricesDataResponse?.data || [];
    const { totalPages = 1, total = 0 } = sellingPricesDataResponse?.meta || {};

    // Debug log for query data changes
    useEffect(() => {
        console.log(
            `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Selling prices data updated:`,
            {
                dataLength: sellingPricesData.length,
                total,
                page,
                totalPages,
                selectedItems,
            }
        );
    }, [sellingPricesData, total, page, totalPages, selectedItems]);

    const handleSelectItem = useCallback((itemId: number) => {
        console.log("[SellingPrices] handleSelectItem called with itemId:", itemId);
        setSelectedItems((prev) => {
            const newSelected = prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId];
            console.log("[SellingPrices] New selected items:", newSelected);
            return newSelected;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        console.log("[SellingPrices] handleSelectAll called");
        if (!sellingPricesData || sellingPricesData.length === 0) {
            setSelectedItems([]);
            console.log("[SellingPrices] No data to select");
            return;
        }
        if (selectedItems.length === sellingPricesData.length) {
            setSelectedItems([]);
            console.log("[SellingPrices] Deselected all items");
        } else {
            const validIds = sellingPricesData
                .filter((item) => Number.isInteger(item.id) && item.id > 0)
                .map((item) => item.id);
            setSelectedItems(validIds);
            console.log("[SellingPrices] Selected all items:", validIds);
        }
    }, [sellingPricesData, selectedItems.length]);

    const handleDownload = async () => {
        try {
            const ids = selectedItems.length > 0
                ? selectedItems
                : sellingPricesData.map(item => item.id);

            if (sellingPricesData.length === 0) {
                console.log("[SellingPrices] No selling prices available to export");
                toast.error(t("catalog:errors.noItems", { defaultValue: "No selling prices available to export" }));
                return;
            }

            console.log(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Exporting selling prices with IDs:`,
                ids
            );
            await exportSellingPricesXlsx({
                sellingPriceIds: ids,
            }).unwrap();
            toast.success(t("catalog:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" }));
        } catch (err: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Export error:`,
                err
            );
            toast.error(
                err?.data?.message || t("catalog:errors.xlsxError", { defaultValue: "Failed to export XLSX" })
            );
        }
    };

    if (isAuthLoading || isLoading) return <Loading />;
    if (error) {
        console.error(
            `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error loading selling prices:`,
            error
        );
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading selling prices" })}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
            <Toaster richColors position="top-right" />
            <SellingPricesActions
                sellingPricesData={sellingPricesData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
                handleDownload={handleDownload}
            />
            {viewMode === "list" ? (
                <SellingPricesTable
                    key={sellingPricesData.length}
                    sellingPricesData={sellingPricesData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                    handleSelectAll={handleSelectAll}
                />
            ) : (
                <SellingPricesGrid
                    key={sellingPricesData.length}
                    sellingPricesData={sellingPricesData}
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