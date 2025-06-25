"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
    useGetAuthUserQuery,
    useGetSellingPricesQuery,
    useDeleteSellingPricesMutation,
} from "@/state/api";
import { useAppSelector } from "@/state/redux";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import SellingPricesActions from "@/app/(dashboard)/admin/sellingPrices/SellingPricesActions";
import SellingPricesTable from "@/app/(dashboard)/admin/sellingPrices/SellingPricesTable";
import SellingPricesGrid from "@/app/(dashboard)/admin/sellingPrices/SellingPricesGrid";
import Loading from "@/components/Loading";

const OutLots: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
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

    const { data: sellingPricesDataResponse, isLoading, error } = useGetSellingPricesQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const [deleteSellingPrices] = useDeleteSellingPricesMutation();

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

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items selected" }));
            return;
        }
        if (!authUser?.cognitoInfo?.userId) {
            toast.error(t("catalog:errors.authError", { defaultValue: "Authentication error" }));
            return;
        }
        setIsDeleteBulkOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            setIsDeleting((prev) => ({ ...prev, [id]: true }));
            await deleteSellingPrices({ ids: [id] }).unwrap();
            setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
            toast.success(t("catalog:success.sellingPriceDeleted", { defaultValue: "Selling price deleted" }));
        } catch (error: any) {
            toast.error(t("catalog:errors.deleteFailed", { defaultValue: "Deletion failed" }));
        } finally {
            setIsDeleting((prev) => ({ ...prev, [id]: false }));
        }
    };

    const confirmBulkDelete = async () => {
        try {
            setIsBulkDeleting(true);
            await deleteSellingPrices({ ids: selectedItems }).unwrap();
            setSelectedItems([]);
            toast.success(t("catalog:success.sellingPricesDeleted", { defaultValue: "Selling prices deleted" }));
        } catch (error: any) {
            toast.error(t("catalog:errors.bulkDeleteFailed", { defaultValue: "Bulk deletion failed" }));
        } finally {
            setIsBulkDeleting(false);
            setIsDeleteBulkOpen(false);
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
                handleBulkDelete={handleBulkDelete}
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
                    handleDelete={handleDelete}
                    isDeleting={isDeleting}
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
            <Dialog open={isDeleteBulkOpen} onOpenChange={() => setIsDeleteBulkOpen(false)}>
                <DialogContent className="bg-white dark:bg-gray-800 rounded-sm shadow-2xl max-w-lg mx-auto p-0">
                    <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 p-4">
                        <DialogTitle className="text-2xl font-bold text-white">
                            {t("catalog:confirm.bulkDeleteSellingPrices", { defaultValue: "Delete Selling Prices" })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <p>
                            {t("catalog:confirm.bulkDeleteSellingPricesCount", {
                                defaultValue: "You are about to delete {{count}} selling prices",
                                count: selectedItems.length,
                            })}
                        </p>
                        <p className="mt-2 font-semibold">
                            {t("catalog:confirm.proceed", { defaultValue: "Are you sure you want to proceed?" })}
                        </p>
                    </div>
                    <DialogFooter className="p-6 bg-white dark:bg-gray-800 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteBulkOpen(false)}
                            className="rounded-sm px-6 border-blue-400 text-blue-700 hover:bg-blue-100"
                        >
                            {t("general:actions.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button
                            onClick={confirmBulkDelete}
                            disabled={isBulkDeleting}
                            className="rounded-sm px-6 bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isBulkDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                t("catalog:actions.delete", { defaultValue: "Delete" })
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OutLots;