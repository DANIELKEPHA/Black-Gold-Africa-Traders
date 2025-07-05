"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { Download, Loader2 } from "lucide-react"; // Removed Upload and UploadIcon
import { useExportSellingPricesXlsxMutation, useGetAuthUserQuery } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SellingPriceResponse } from "@/state";
import {Loader} from "@aws-amplify/ui-react";

interface SellingPricesActionsProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectAll: () => void;
    handleDownload: () => void; // Updated prop
}

const SellingPricesActions: React.FC<SellingPricesActionsProps> = ({
                                                                       sellingPricesData,
                                                                       selectedItems,
                                                                       handleSelectAll,
                                                                       handleDownload,
                                                                   }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
    const [exportSellingPricesXlsx, { isLoading: isExporting }] = useExportSellingPricesXlsxMutation();

    const handleDownloadLocal = handleDownload; // No admin check needed

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
                        onClick={handleDownloadLocal}
                        disabled={isExporting}
                        className="rounded-sm bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isExporting ? (
                            <Loader className="w-4 h-4 animate-spin mr-2" />
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

export default SellingPricesActions;