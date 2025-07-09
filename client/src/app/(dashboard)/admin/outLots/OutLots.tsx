"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
    useGetAuthUserQuery,
    useGetOutlotsQuery,
    useDeleteOutlotsMutation,
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
import Loading from "@/components/Loading";
import OutlotsActions from "@/app/(dashboard)/admin/outLots/OutlotsActions";
import OutlotsTable from "@/app/(dashboard)/admin/outLots/OutlotsTable";
import OutlotsGrid from "@/app/(dashboard)/admin/outLots/OutlotsGrid";

const OutLots: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters) || {};
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectAllAcrossPages, setSelectAllAcrossPages] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
    const [isDeleteBulkOpen, setIsDeleteBulkOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
    const limit = 100;

    // console.log("[OutLots] Filters before query:", filters);

    const { data: outLotsDataResponse, isLoading, error } = useGetOutlotsQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    // Fetch all outlot IDs for bulk delete when selectAllAcrossPages is true
    const { data: allOutLotsData, isLoading: isAllOutLotsLoading } = useGetOutlotsQuery(
        {
            ...filters,
            page: 1,
            limit: 10000,
        },
        { skip: !authUser?.cognitoInfo?.userId || !selectAllAcrossPages }
    );

    const [deleteOutLots] = useDeleteOutlotsMutation();

    // Memoize outLotsData to ensure stable reference
    const outLotsData = useMemo(() => outLotsDataResponse?.data || [], [outLotsDataResponse]);

    const { totalPages = 1, total = 0 } = outLotsDataResponse?.meta || {};

    const handleSelectItem = useCallback((itemId: number) => {
        // console.log("[OutLots] handleSelectItem called with itemId:", itemId);
        setSelectedItems((prev) => {
            const newSelected = prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId];
            // console.log("[OutLots] New selected items:", newSelected);
            setSelectAllAcrossPages(false); // Reset select all across pages when individual items are toggled
            return newSelected;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        // console.log("[OutLots] handleSelectAll called, current selectAllAcrossPages:", selectAllAcrossPages);
        if (selectAllAcrossPages || selectedItems.length === outLotsData.length) {
            setSelectedItems([]);
            setSelectAllAcrossPages(false);
        } else {
            const validIds = outLotsData
                .filter((item) => Number.isInteger(item.id) && item.id > 0)
                .map((item) => item.id);
            setSelectedItems(validIds);
            setSelectAllAcrossPages(true);
            // console.log("[OutLots] Selected all items:", validIds);
        }
    }, [outLotsData, selectedItems.length, selectAllAcrossPages]);

    const handleDelete = useCallback(
        async (id: number) => {
            if (!authUser?.cognitoInfo?.userId) {
                // console.log("[OutLots] Delete attempted without authenticated user");
                toast.error(t("catalog:errors.authError", { defaultValue: "Authentication error" }));
                return;
            }
            // console.log("[OutLots] Deleting outlot with ID:", id);
            setIsDeleting((prev) => ({ ...prev, [id]: true }));
            try {
                await deleteOutLots({ ids: [id] }).unwrap();
                setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
                toast.success(t("catalog:success.outLotDeleted", { defaultValue: "Outlot deleted" }));
            } catch (error: any) {
                console.error("[OutLots] Delete failed for ID:", id, { error });
                toast.error(
                    error?.data?.message ||
                    t("catalog:errors.deleteFailed", { defaultValue: "Failed to delete outlot" })
                );
            } finally {
                setIsDeleting((prev) => ({ ...prev, [id]: false }));
            }
        },
        [authUser, deleteOutLots, t]
    );

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0 && !selectAllAcrossPages) {
            // console.log("[OutLots] Bulk delete attempted with no items selected");
            toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items selected" }));
            return;
        }
        if (!authUser?.cognitoInfo?.userId) {
            // console.log("[OutLots] Bulk delete attempted without authenticated user");
            toast.error(t("catalog:errors.authError", { defaultValue: "Authentication error" }));
            return;
        }
        // console.log("[OutLots] Opening bulk delete confirmation", { selectedItems, selectAllAcrossPages });
        setIsDeleteBulkOpen(true);
    };

    const confirmBulkDelete = async () => {
        try {
            setIsBulkDeleting(true);
            // Use all outlot IDs if selectAllAcrossPages is true, otherwise use selectedItems
            const idsToDelete = selectAllAcrossPages
                ? (allOutLotsData?.data || []).map((item) => item.id)
                : selectedItems;

            if (idsToDelete.length === 0) {
                // console.log("[OutLots] No items available to delete");
                toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items available to delete" }));
                return;
            }

            // console.log("[OutLots] Deleting outlots with IDs:", idsToDelete);
            await deleteOutLots({ ids: idsToDelete }).unwrap();
            setSelectedItems([]);
            setSelectAllAcrossPages(false);
            toast.success(t("catalog:success.outLotsDeleted", { defaultValue: "Outlots deleted" }));
        } catch (error: any) {
            console.error("[OutLots] Bulk delete failed", { error: error?.data || error });
            toast.error(
                error?.data?.message ||
                t("catalog:errors.bulkDeleteFailed", { defaultValue: "Bulk deletion failed" })
            );
        } finally {
            setIsBulkDeleting(false);
            setIsDeleteBulkOpen(false);
        }
    };

    if (isAuthLoading || isLoading) return <Loading />;
    if (error) {
        console.error("[OutLots] Error loading outlots data", { error });
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading outlots" })}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
            <Toaster richColors position="top-right" />
            <OutlotsActions
                outLotsData={outLotsData}
                selectedItems={selectedItems}
                selectAllAcrossPages={selectAllAcrossPages}
                handleSelectAll={handleSelectAll}
                handleBulkDelete={handleBulkDelete}
            />
            {viewMode === "list" ? (
                <OutlotsTable
                    outLotsData={outLotsData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                    selectAllAcrossPages={selectAllAcrossPages}
                    handleSelectAll={handleSelectAll}
                />
            ) : (
                <OutlotsGrid
                    outLotsData={outLotsData}
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
                            {t("catalog:confirm.bulkDeleteOutLots", { defaultValue: "Delete Outlots" })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <p>
                            {t("catalog:confirm.bulkDeleteOutLotsCount", {
                                defaultValue: "You are about to delete {{count}} outlot(s)",
                                count: selectAllAcrossPages ? total : selectedItems.length,
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
                            disabled={isBulkDeleting || isAllOutLotsLoading}
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