"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExportOutLotsXlsxMutation, useGetAuthUserQuery, useGetOutlotsQuery } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { OutLotsResponse } from "@/state";

interface OutLotsActionsProps {
    outLotsData: OutLotsResponse[];
    selectedItems: number[];
    selectAllAcrossPages: boolean;
    handleSelectAll: () => void;
}

const OutLotsActions: React.FC<OutLotsActionsProps> = ({
                                                           outLotsData,
                                                           selectedItems,
                                                           selectAllAcrossPages,
                                                           handleSelectAll,
                                                       }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser } = useGetAuthUserQuery();
    const [exportOutLots, { isLoading: isExporting }] = useExportOutLotsXlsxMutation();
    const { data: allOutLotsData, isLoading: isAllOutLotsLoading, error: allOutLotsError } = useGetOutlotsQuery(
        { page: 1, limit: 10000 },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const handleDownload = async () => {
        try {
            if (allOutLotsError) {
                const errorMessage =
                    (allOutLotsError as any)?.data?.message ||
                    t("catalog:errors.fetchAllFailed", { defaultValue: "Failed to fetch all outLots" });
                console.error(
                    `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] handleDownload: allOutLotsError:`,
                    allOutLotsError
                );
                toast.error(errorMessage);
                return;
            }

            const ids =
                selectedItems.length > 0
                    ? selectedItems
                    : (allOutLotsData?.data || []).map((item) => item.id);

            if (ids.length === 0) {
                toast.error(
                    t("catalog:errors.noItems", { defaultValue: "No outLots available to export" })
                );
                return;
            }

            console.log(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] handleDownload: Exporting outlots with IDs:`,
                ids
            );

            await exportOutLots({ outLotIds: ids }).unwrap();

            toast.success(
                t("catalog:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" })
            );
        } catch (err: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] handleDownload: Export error:`,
                err
            );
            const errorMessage =
                err?.data?.message ||
                t("catalog:errors.xlsxError", { defaultValue: "Failed to export XLSX" });
            toast.error(errorMessage);
        }
    };

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Checkbox
                            id="select-all"
                            checked={outLotsData.length > 0 && (selectedItems.length === outLotsData.length || selectAllAcrossPages)}
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
                        onClick={handleDownload}
                        disabled={isExporting || isAllOutLotsLoading}
                        className="rounded-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isExporting || isAllOutLotsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {t("catalog:actions.download", { defaultValue: "Download" })}
                    </Button>
                </div>
            </div>
            <Toaster />
        </>
    );
};

export default OutLotsActions;