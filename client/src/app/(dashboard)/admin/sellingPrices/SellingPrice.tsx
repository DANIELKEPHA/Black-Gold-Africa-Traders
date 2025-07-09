"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
    useGetAuthUserQuery,
    useGetSellingPricesQuery,
    useDeleteSellingPricesMutation,
    useDeleteAllSellingPricesMutation,
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

const SellingPrices: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters) || {};
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isSelectAllPages, setIsSelectAllPages] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
    const [isDeleteBulkOpen, setIsDeleteBulkOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
    const limit = 100;

    console.log("[SellingPrices] Filters before query:", filters);

    const {
        data: sellingPricesDataResponse,
        isLoading,
        error,
        refetch,
    } = useGetSellingPricesQuery(
        { ...filters, page, limit },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const [deleteSellingPrices] = useDeleteSellingPricesMutation();
    const [deleteAllSellingPrices] = useDeleteAllSellingPricesMutation();

    const sellingPricesData = sellingPricesDataResponse?.data || [];
    const { totalPages = 1, total = 0 } = sellingPricesDataResponse?.meta || {};

    // Reset state on component unmount
    useEffect(() => {
        return () => {
            setIsDeleting({});
            setSelectedItems([]);
            setIsSelectAllPages(false);
        };
    }, []);

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
                isSelectAllPages,
            }
        );
    }, [sellingPricesData, total, page, totalPages, selectedItems, isSelectAllPages]);

    const handleSelectItem = useCallback((itemId: number) => {
        console.log("[SellingPrices] handleSelectItem called with itemId:", itemId);
        setSelectedItems((prev) => {
            const newSelected = prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId];
            console.log("[SellingPrices] New selected items:", newSelected);
            setIsSelectAllPages(false); // Reset select all pages when selecting individual items
            return newSelected;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        console.log(
            "[SellingPrices] handleSelectAll called, current isSelectAllPages:",
            isSelectAllPages
        );
        if (!sellingPricesData || sellingPricesData.length === 0) {
            setSelectedItems([]);
            setIsSelectAllPages(false);
            console.log("[SellingPrices] No data to select");
            return;
        }
        if (isSelectAllPages || selectedItems.length === sellingPricesData.length) {
            setSelectedItems([]);
            setIsSelectAllPages(false);
            console.log("[SellingPrices] Deselected all items");
        } else {
            const validIds = sellingPricesData
                .filter((item) => Number.isInteger(item.id) && item.id > 0)
                .map((item) => item.id);
            setSelectedItems(validIds);
            setIsSelectAllPages(true);
            console.log("[SellingPrices] Selected all items:", validIds);
        }
    }, [sellingPricesData, selectedItems.length, isSelectAllPages]);

    const handleBulkDelete = () => {
        if (!authUser?.cognitoInfo?.userId) {
            toast.error(t("catalog:errors.authError", { defaultValue: "User authentication data is incomplete" }));
            return;
        }
        if (selectedItems.length === 0 && !isSelectAllPages) {
            toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items selected or no data available" }));
            return;
        }
        setIsDeleteBulkOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!authUser?.cognitoInfo?.userId) {
            toast.error(t("catalog:errors.authError", { defaultValue: "User authentication data is incomplete" }));
            return;
        }
        try {
            setIsDeleting((prev) => ({ ...prev, [id]: true }));
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 10000);
            await deleteSellingPrices({ ids: [id], signal: controller.signal }).unwrap();
            setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
            setIsSelectAllPages(false);
            await refetch();
            if (sellingPricesData.length === 1 && page > 1) {
                setPage((prev) => prev - 1);
            }
            toast.success(t("catalog:success.sellingPriceDeleted", { defaultValue: "Selling price deleted" }));
        } catch (error: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Delete error for ID ${id}:`,
                error
            );
            const errorMessage = error?.data?.message || t("catalog:errors.deleteFailed", { defaultValue: "Deletion failed" });
            if (error.name === "AbortError") {
                toast.error(t("catalog:errors.timeout", { defaultValue: "Deletion request timed out" }));
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsDeleting((prev) => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }
    };

    const confirmBulkDelete = async () => {
        if (!authUser?.cognitoInfo?.userId) {
            toast.error(t("catalog:errors.authError", { defaultValue: "User authentication data is incomplete" }));
            setIsDeleteBulkOpen(false);
            return;
        }
        if (selectedItems.length === 0 && !isSelectAllPages) {
            toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items selected" }));
            setIsDeleteBulkOpen(false);
            return;
        }
        try {
            setIsBulkDeleting(true);
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 10000);
            if (isSelectAllPages) {
                console.log(
                    `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Sending deleteAllSellingPrices request`
                );
                const { deletedCount } = await deleteAllSellingPrices({ confirm: true, signal: controller.signal }).unwrap();
                if (deletedCount === 0) {
                    toast.warning(t("catalog:warnings.noItemsDeleted", { defaultValue: "No selling prices were deleted" }));
                } else {
                    toast.success(
                        t("catalog:success.allSellingPricesDeleted", { defaultValue: `All ${deletedCount} selling prices deleted` })
                    );
                }
            } else {
                console.log(
                    `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Sending deleteSellingPrices with IDs:`,
                    selectedItems
                );
                const { deletedCount } = await deleteSellingPrices({ ids: selectedItems, signal: controller.signal }).unwrap();
                if (deletedCount === 0) {
                    toast.warning(t("catalog:warnings.noItemsDeleted", { defaultValue: "No selling prices were deleted" }));
                } else {
                    toast.success(
                        t("catalog:success.sellingPricesDeleted", { defaultValue: `${deletedCount} selling price(s) deleted` })
                    );
                }
            }
            setSelectedItems([]);
            setIsSelectAllPages(false);
            await refetch();
            if (sellingPricesData.length === selectedItems.length && page > 1) {
                setPage((prev) => prev - 1);
            } else if (sellingPricesData.length === 0 && page > 1) {
                setPage(1);
            }
        } catch (error: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Bulk delete error:`,
                error
            );
            const errorMessage = error?.data?.message || t("catalog:errors.bulkDeleteFailed", { defaultValue: "Bulk deletion failed" });
            if (error.name === "AbortError") {
                toast.error(t("catalog:errors.timeout", { defaultValue: "Bulk deletion request timed out" }));
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsBulkDeleting(false);
            setIsDeleteBulkOpen(false);
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

    const deleteMessage = isSelectAllPages
        ? t("catalog:confirm.bulkDeleteAllSellingPrices", {
              defaultValue: `You are about to delete ALL ${total} selling prices across all pages. This action cannot be undone.`,
          })
        : t("catalog:confirm.bulkDeleteSellingPricesStatic", {
              defaultValue: `You are about to delete ${selectedItems.length} selling price(s).`,
          });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
            <Toaster richColors position="top-right" />
            <SellingPricesActions
                sellingPricesData={sellingPricesData}
                selectedItems={selectedItems}
                isSelectAllPages={isSelectAllPages}
                handleSelectAll={handleSelectAll}
                handleBulkDelete={handleBulkDelete}
            />
            {viewMode === "list" ? (
                <SellingPricesTable
                    key={sellingPricesData.length}
                    sellingPricesData={sellingPricesData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                    isSelectAllPages={isSelectAllPages}
                    handleSelectAll={handleSelectAll}
                />
            ) : (
                <SellingPricesGrid
                    key={sellingPricesData.length}
                    sellingPricesData={sellingPricesData}
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
                        <p>{deleteMessage}</p>
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

export default SellingPrices;