"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {Download, Upload, Loader2, UploadIcon} from "lucide-react";
import { useRouter } from "next/navigation";
import { useExportSellingPricesCsvMutation, useGetAuthUserQuery } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {SellingPriceResponse} from "@/state";

interface SellingPricesActionsProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectAll: () => void;
    handleBulkDelete: () => void;
}

const SellingPricesActions: React.FC<SellingPricesActionsProps> = ({
                                                                       sellingPricesData,
                                                                       selectedItems,
                                                                       handleSelectAll,
                                                                       handleBulkDelete,
                                                                   }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser } = useGetAuthUserQuery();
    const isAdmin = authUser?.userRole === "admin";
    const [exportSellingPricesCsv, { isLoading: isExporting }] = useExportSellingPricesCsvMutation();

    if (!isAdmin) return null;

    const handleDownload = async () => {
        try {
            const ids = selectedItems.length > 0 ? selectedItems : sellingPricesData.map(item => item.id);
            if (ids.length === 0) {
                toast.error(t("catalog:errors.noItems", { defaultValue: "No selling prices available to export" }));
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting selling prices with IDs:`, ids);
            await exportSellingPricesCsv({
                sellingPriceIds: ids,
            }).unwrap();
            toast.success(t("catalog:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }));
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            toast.error(t("catalog:errors.csvError", { defaultValue: "Failed to export CSV" }));
        }
    };

    const handleUpload = () => {
        router.push("/admin/sellingPrices/upload");
    };

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="select-all"
                            checked={
                                sellingPricesData.length > 0 &&
                                selectedItems.length === sellingPricesData.length
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label={t("catalog:actions.selectAll", { defaultValue: "Select All" })}
                            className="border-gray-300 dark:border-gray-600"
                        />
                        <label
                            htmlFor="select-all"
                            className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                        >
                            {t("catalog:actions.selectAll", { defaultValue: "Select All" })}
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
                        {t("catalog:actions.deleteSelected", { defaultValue: "Delete Selected" })}
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
                        {t("catalog:actions.download", { defaultValue: "Download" })}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        className="rounded-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                        <UploadIcon className="uppercase w-4 h-4 mr-2" />
                        {t("catalog:actions.upload", { defaultValue: "Upload" })}
                    </Button>

                </div>
            </div>
            <Toaster />
        </>
    );
};

export default SellingPricesActions;