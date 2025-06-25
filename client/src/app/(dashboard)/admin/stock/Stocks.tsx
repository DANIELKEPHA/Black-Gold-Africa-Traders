"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetStocksQuery, useDeleteStocksMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import Loading from "@/components/Loading";
import { useAppSelector } from "@/state/redux";
import StocksActions from "@/app/(dashboard)/admin/stock/StocksActions";
import StockTable from "@/app/(dashboard)/admin/stock/StockTable";
import StockGrid from "@/app/(dashboard)/admin/stock/StockGrid";

const Stocks: React.FC = () => {
    const { t } = useTranslation(["stocks", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters);
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
    const [isDeleteBulkOpen, setIsDeleteBulkOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
    const limit = 20;

    const { data: stocksDataResponse, isLoading, error } = useGetStocksQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId },
    );

    const [deleteStocks] = useDeleteStocksMutation();

    const stocksData = stocksDataResponse?.data || [];
    const { totalPages = 1 } = stocksDataResponse?.meta || {};

    const handleSelectItem = useCallback(
        (itemId: number) => {
            setSelectedItems((prev) =>
                prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
            );
        },
        [],
    );

    const handleSelectAll = useCallback(() => {
        if (!stocksData || stocksData.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === stocksData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(stocksData.map((item) => item.id));
        }
    }, [stocksData, selectedItems.length]);

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            toast.error(t("stocks:errors.noItemsSelected", { defaultValue: "No items selected" }));
            return;
        }
        if (!authUser?.cognitoInfo?.userId) {
            toast.error(t("stocks:errors.authError", { defaultValue: "Authentication error" }));
            return;
        }
        setIsDeleteBulkOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            setIsDeleting((prev) => ({ ...prev, [id]: true }));
            await deleteStocks({ ids: [id] }).unwrap();
            setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
            toast.success(t("stocks:success.stockDeleted", { defaultValue: "Stock deleted" }));
        } catch (error: any) {
            toast.error(t("stocks:errors.deleteFailed", { defaultValue: "Deletion failed" }));
        } finally {
            setIsDeleting((prev) => ({ ...prev, [id]: false }));
        }
    };

    const confirmBulkDelete = async () => {
        try {
            setIsBulkDeleting(true);
            await deleteStocks({ ids: selectedItems }).unwrap();
            setSelectedItems([]);
            toast.success(t("stocks:success.stocksDeleted", { defaultValue: "Stocks deleted" }));
        } catch (error: any) {
            toast.error(t("stocks:errors.bulkDeleteFailed", { defaultValue: "Bulk deletion failed" }));
        } finally {
            setIsBulkDeleting(false);
            setIsDeleteBulkOpen(false);
        }
    };

    if (isAuthLoading || isLoading) return <Loading />;
    if (error)
        return <div className="text-red-500 p-4">{t("stocks:errors.error", { defaultValue: "Error" })}</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-0">
            <Toaster richColors position="top-right" />
            <StocksActions
                stocksData={stocksData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
                handleBulkDelete={handleBulkDelete}
            />

            {viewMode === "list" ? (
                <StockTable
                    stocksData={stocksData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            ) : (
                <StockGrid
                    stocksData={stocksData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                    handleDelete={handleDelete}
                    isDeleting={isDeleting}
                />
            )}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    <Button
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.previous", { defaultValue: "Previous" })}
                    </Button>
                    <span className="text-gray-700 dark:text-gray-200">
                        {t("general:pagination.page", { page, totalPages })}
                    </span>
                    <Button
                        disabled={page === totalPages || isLoading}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.next", { defaultValue: "Next" })}
                    </Button>
                </div>
            )}
            <Dialog open={isDeleteBulkOpen} onOpenChange={() => setIsDeleteBulkOpen(false)}>
                <DialogContent className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg mx-auto p-0">
                    <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 p-4">
                        <DialogTitle className="text-2xl font-bold text-white">
                            {t("stocks:confirm.bulkDelete", { defaultValue: "Delete Stocks" })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <p>{t("stocks:confirm.bulkDelete", { count: selectedItems.length })}</p>
                        <p className="mt-2 font-semibold">
                            {t("stocks:confirm.proceed", { defaultValue: "Are you sure you want to proceed?" })}
                        </p>
                    </div>
                    <DialogFooter className="p-6 bg-white dark:bg-gray-800 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteBulkOpen(false)}
                            className="rounded-lg px-6 border-blue-400 text-blue-700 hover:bg-blue-100"
                        >
                            {t("general:actions.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button
                            onClick={confirmBulkDelete}
                            disabled={isBulkDeleting}
                            className="rounded-lg px-6 bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isBulkDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                t("stocks:actions.delete", { defaultValue: "Delete" })
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Stocks;