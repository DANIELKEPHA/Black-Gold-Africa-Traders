"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import { Download, Upload, Loader2, UserPlus } from "lucide-react";
import { useExportStocksCsvMutation, useGetAuthUserQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import { StocksResponse } from "@/state";
import AssignStockModal, { mapStocksResponseToStock } from "./AssignStockModal";

interface StocksActionsProps {
    stocksData: StocksResponse[];
    selectedItems: number[];
    handleSelectAll: () => void;
    handleBulkDelete: () => void;
}

const StocksActions: React.FC<StocksActionsProps> = ({
                                                         stocksData,
                                                         selectedItems,
                                                         handleSelectAll,
                                                         handleBulkDelete,
                                                     }) => {
    const { t } = useTranslation(["stocks", "general"]);
    const router = useRouter();
    const { data: authUser } = useGetAuthUserQuery();
    const isAdmin = authUser?.userRole === "admin";
    const [exportStocksCsv, { isLoading: isExporting }] = useExportStocksCsvMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!isAdmin) return null;

    const handleDownload = async () => {
        try {
            const ids = selectedItems.length > 0 ? selectedItems : stocksData.map((item) => item.id);
            if (ids.length === 0) {
                toast.error(t("stocks:errors.noItems", { defaultValue: "No stocks available to export" }));
                return;
            }
            console.log(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })})] Exporting stocks with IDs, ID:`,
                ids,
            );
            await exportStocksCsv({
                stockIds: ids.join(","),
            }).unwrap();
            toast.success(t("stocksActions:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }));
            toast.success("CSV file downloaded successfully");
        } catch (err: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })})] Export error, error:`,
                err,
            );
            toast.error(t("stocks:errors.csvError", { defaultValue: "Failed to export CSV" }));
        }
    };

    const handleUpload = () => {
        router.push("/admin/stock/upload");
    };

    const handleAssign = () => {
        if (selectedItems.length === 0) {
            toast.error(t("stocks:errors.noItemsSelected", { defaultValue: "No stocks selected to assign" }));
            return;
        }
        setIsModalOpen(true);
    };

    const handleViewHistory = () => {
        router.push("/admin/stock/history");
    };

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="select-all"
                            checked={stocksData?.length > 0 && selectedItems.length === stocksData.length}
                            onCheckedChange={handleSelectAll}
                            aria-label={t("stocks:actions.selectAll", { defaultValue: "Select All" })}
                            className="border-gray-300 dark:border-gray-600"
                        />
                        <label
                            htmlFor="select-all"
                            className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                        >
                            {t("stocks:actions.selectAll", { defaultValue: "Select All" })}
                        </label>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="destructive"
                        onClick={handleBulkDelete}
                        disabled={selectedItems.length === 0}
                        className="rounded-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                        {t("stocks:actions.deleteSelected", { defaultValue: "Delete Selected" })}
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={isExporting}
                        className="rounded-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {t("stocks:actions.download", { defaultValue: "Download" })}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        className="rounded-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {t("stocks:actions.upload", { defaultValue: "Upload" })}
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={selectedItems.length === 0}
                        className="rounded-sm bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t("stocks:actions.assign", { defaultValue: "Assign" })}
                    </Button>
                    <Button
                        onClick={handleViewHistory}
                        className="rounded-sm bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        {t("stocks:actions.viewHistory", { defaultValue: "View Stock History" })}
                    </Button>
                </div>
            </div>
            <AssignStockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                stockIds={selectedItems}
                stocksData={stocksData
                    .filter((stock) => selectedItems.includes(stock.id))
                    .map(mapStocksResponseToStock)} // Transform to Stock[]
            />
            <Toaster />
        </>
    );
};

export default StocksActions;