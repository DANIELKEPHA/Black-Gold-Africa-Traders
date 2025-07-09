import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useExportCatalogsXlsxMutation } from "@/state/api";
import { useGetAuthUserQuery } from "@/state/api";
import { CatalogResponse } from "@/state";
import {Toaster} from "@/components/ui/sonner";
import {toast} from "sonner";

interface CatalogActionsProps {
    selectedItems: number[];
    catalogData: CatalogResponse[]; // Use the imported CatalogResponse type
}

const CatalogActions: React.FC<CatalogActionsProps> = ({ selectedItems, catalogData }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
    const [exportCatalogsXlsx, { isLoading: isExporting }] = useExportCatalogsXlsxMutation();

    const handleDownload = async () => {
        try {
            if (!authUser?.cognitoInfo?.userId) {
                toast.error(t("catalog:errors.authError", { defaultValue: "Authentication error" }));
                return;
            }
            const ids = selectedItems.length > 0 ? selectedItems : catalogData.map((item) => item.id);
            if (ids.length === 0) {
                toast.error(t("catalog:errors.noItems", { defaultValue: "No catalogs available to export" }));
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Exporting catalogs:`, ids);
            await exportCatalogsXlsx({ catalogIds: ids }).unwrap();
            toast.success(t("catalog:success.csvDownloaded", { defaultValue: "XLSX downloaded successfully" }));
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Export error:`, err);
            toast.error(t("catalog:errors.csvError", { defaultValue: "Failed to export XLSX" }));
        }
    };

    return (
        <div className="mb-4 flex items-center justify-end">
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
            <Toaster />
        </div>
    );
};

export default CatalogActions;