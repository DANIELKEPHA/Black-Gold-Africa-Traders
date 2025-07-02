"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetCatalogQuery, useDeleteCatalogsMutation } from "@/state/api";
import { useAppSelector } from "@/state/redux";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import CatalogActions from "@/app/(dashboard)/admin/catalog/CatalogActions";
import CatalogTable from "@/app/(dashboard)/admin/catalog/CatalogTable";
import CatalogGrid from "@/app/(dashboard)/admin/catalog/CatalogGrid";
import Loading from "@/components/Loading";

const Catalog: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters);
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [isSelectAll, setIsSelectAll] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
    const [isDeleteBulkOpen, setIsDeleteBulkOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
    const limit = 100;

    const { data: catalogDataResponse, isLoading, error } = useGetCatalogQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const [deleteCatalogs] = useDeleteCatalogsMutation();

    const catalogData = catalogDataResponse?.data || [];
    const { totalPages = 1, total = 0 } = catalogDataResponse?.meta || {};

    const handleSelectItem = useCallback((itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
        setIsSelectAll(false); // Reset select all when manually selecting/deselecting
    }, []);

    const handleSelectAll = useCallback(() => {
        if (isSelectAll || (catalogData.length > 0 && selectedItems.length === catalogData.length)) {
            setSelectedItems([]);
            setIsSelectAll(false);
        } else {
            const validIds = catalogData
                .filter((item) => Number.isInteger(item.id) && item.id > 0)
                .map((item) => item.id);
            setSelectedItems(validIds);
            setIsSelectAll(true);
        }
    }, [catalogData, isSelectAll, selectedItems.length]);

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0 && !isSelectAll) {
            console.log("[Catalog] Bulk delete attempted with no items selected");
            toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items selected" }));
            return;
        }
        if (!authUser?.cognitoInfo?.userId) {
            console.log("[Catalog] Bulk delete attempted without authenticated user");
            toast.error(t("catalog:errors.authError", { defaultValue: "Authentication error" }));
            return;
        }
        console.log("[Catalog] Opening bulk delete confirmation", { selectedItems, isSelectAll });
        setIsDeleteBulkOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!Number.isInteger(id) || id <= 0) {
            console.log("[Catalog] Invalid ID for single delete", { id });
            toast.error(t("catalog:errors.invalidId", { defaultValue: "Invalid catalog ID" }));
            return;
        }
        try {
            setIsDeleting((prev) => ({ ...prev, [id]: true }));
            console.log("[Catalog] Deleting single catalog", { id });
            await deleteCatalogs({ ids: [id] }).unwrap();
            setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
            toast.success(t("catalog:success.catalogDeleted", { defaultValue: "SellingPrice deleted" }));
        } catch (error: any) {
            console.error("[Catalog] Single delete failed", { id, error: error?.data || error });
            toast.error(
                error?.data?.message ||
                t("catalog:errors.deleteFailed", { defaultValue: "Deletion failed" })
            );
        } finally {
            setIsDeleting((prev) => ({ ...prev, [id]: false }));
        }
    };

    const confirmBulkDelete = async () => {
        if (selectedItems.length === 0 && !isSelectAll) {
            console.log("[Catalog] Bulk delete confirmed with no items selected");
            toast.error(t("catalog:errors.noItemsSelected", { defaultValue: "No items selected" }));
            setIsDeleteBulkOpen(false);
            return;
        }
        try {
            setIsBulkDeleting(true);
            console.log("[Catalog] Executing bulk delete", { ids: isSelectAll ? 'all' : selectedItems });
            await deleteCatalogs({
                ids: isSelectAll ? [] : selectedItems,
                ...filters
            }).unwrap();
            setSelectedItems([]);
            setIsSelectAll(false);
            toast.success(t("catalog:success.catalogsDeleted", { defaultValue: "Catalogs deleted" }));
        } catch (error: any) {
            console.error("[Catalog] Bulk delete failed", { ids: isSelectAll ? 'all' : selectedItems, error: error?.data || error });
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
        console.error("[Catalog] Error loading catalog data", { error });
        return <div className="text-red-500 p-4">{t("catalog:errors.error", { defaultValue: "Error" })}</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <Toaster richColors position="top-right" />
            <CatalogActions
                catalogData={catalogData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
                handleBulkDelete={handleBulkDelete}
                isSelectAll={isSelectAll}
            />
            {viewMode === "list" ? (
                <CatalogTable
                    catalogData={catalogData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                    isSelectAll={selectedItems.length === catalogData.length && catalogData.length > 0}
                />
            ) : (
                <CatalogGrid
                    catalogData={catalogData}
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
                            {t("catalog:confirm.bulkDelete", { defaultValue: "Delete Catalogs" })}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <p>
                            {t("catalog:confirm.bulkDelete", {
                                count: isSelectAll ? total : selectedItems.length,
                                defaultValue: `Delete ${isSelectAll ? total : selectedItems.length} catalog(s)?`,
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
                                t("catalog:actions.delete", { defaultValue: "Delete" })
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Catalog;