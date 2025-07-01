"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Catalog } from "@/state/catalog";
import { Toaster, toast } from "sonner";
import { Download, Upload, Loader2 } from "lucide-react";
import { useExportCatalogsCsvMutation } from "@/state/api";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";

interface CatalogActionsProps {
    catalogData: Catalog[];
    selectedItems: number[];
    handleSelectAll: () => void;
    handleBulkDelete: () => void;
}

const CatalogActions: React.FC<CatalogActionsProps> = ({
                                                           catalogData,
                                                           selectedItems,
                                                           handleSelectAll,
                                                           handleBulkDelete,
                                                       }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser } = useGetAuthUserQuery();
    const isAdmin = authUser?.userRole === "admin";
    const [exportCatalogsCsv, { isLoading: isExporting }] = useExportCatalogsCsvMutation();

    if (!isAdmin) return null;

    const handleDownload = async () => {
        try {
            const ids = selectedItems.length > 0 ? selectedItems : catalogData.map(item => item.id);
            if (ids.length === 0) {
                toast.error(t("catalog:errors.noItems", { defaultValue: "No catalogs available to export" }));
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting catalogs with IDs:`, ids);
            await exportCatalogsCsv({
                catalogIds: ids,
            }).unwrap();
            toast.success(t("catalog:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }));
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            toast.error(t("catalog:errors.csvError", { defaultValue: "Failed to export CSV" }));
        }
    };

    const handleUpload = () => {
        router.push("/admin/catalog/upload");
    };

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="select-all"
                            checked={catalogData?.length > 0 && selectedItems.length === catalogData.length}
                            onCheckedChange={handleSelectAll}
                            aria-label={t("catalog:actions.selectAll", { defaultValue: "Select All" })}
                            className="border-gray-300 dark:border-gray-600"
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            {t("catalog:actions.selectAll")}
                        </label>
                    </div>
                    {/*<span className="text-sm text-gray-500 dark:text-gray-400">*/}
                    {/*    {t("catalog:labels.select")}*/}
                    {/*</span>*/}
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
                        <Upload className="w-4 h-4 mr-2" />
                        {t("catalog:actions.upload", { defaultValue: "Upload" })}
                    </Button>
                </div>
            </div>
            <Toaster />
        </>
    );
};

export default CatalogActions;