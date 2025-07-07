"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
    useGetAuthUserQuery,
    useGetStockByLotNoQuery,
    useDeleteStocksMutation,
    useExportStocksXlsxMutation,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import Loading from "@/components/Loading";
import { StocksResponse } from "@/state";

interface StockDetailsProps {
    params: { id: string };
}

const StockDetails: React.FC<StockDetailsProps> = ({ params }) => {
    const { t } = useTranslation(["stocks", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const { data: stock, isLoading: isStockLoading, error } = useGetStockByLotNoQuery(params.id);
    const [deleteStocks, { isLoading: isDeleting }] = useDeleteStocksMutation();
    const [exportStocksXlsx, { isLoading: isExporting }] = useExportStocksXlsxMutation();
    const isAdmin = authUser?.userRole === "admin";

    const handleDelete = async () => {
        if (!isAdmin) {
            toast.error(t("stocks:errors.unauthorized", { defaultValue: "Unauthorized" }));
            return;
        }
        try {
            await deleteStocks({ ids: [parseInt(params.id)] }).unwrap();
            toast.success(t("stocks:success.stockDeleted", { defaultValue: "Stock deleted" }));
            router.push("/admin/stock");
        } catch (err: any) {
            toast.error(t("stocks:errors.deleteFailed", { defaultValue: "Failed to delete stock" }));
        }
    };

    const handleDownload = async () => {
        try {
            const stockIds = params.id && !isNaN(Number(params.id)) ? [Number(params.id)] : undefined;
            await exportStocksXlsx({ stockIds }).unwrap();
            toast.success(t("stocks:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" }));
        } catch (err: any) {
            console.error("Export error:", err);
            toast.error(t("stocks:errors.xlsxError", { defaultValue: "Failed to export XLSX" }));
        }
    };

    if (isAuthLoading || isStockLoading) return <Loading />;
    if (error || !stock)
        return <div className="text-red-500 p-4">{t("stocks:errors.error", { defaultValue: "Error" })}</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-2">
            <Toaster />
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                    {t("stocks:stockDetails", { defaultValue: "Stock Details" })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold">{t("stocks:lotNo", { defaultValue: "Lot Number" })}:</p>
                        <p>{stock.lotNo}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:mark", { defaultValue: "Mark" })}:</p>
                        <p>{stock.mark || "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:grade", { defaultValue: "Grade" })}:</p>
                        <p>{stock.grade}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:invoiceNo", { defaultValue: "Invoice Number" })}:</p>
                        <p>{stock.invoiceNo || "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:saleCode", { defaultValue: "Sale Code" })}:</p>
                        <p>{stock.saleCode}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:bags", { defaultValue: "Bags" })}:</p>
                        <p>{stock.bags}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:weight", { defaultValue: "Weight" })}:</p>
                        <p>{stock.weight.toFixed(2)} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:purchaseValue", { defaultValue: "Purchase Value" })}:</p>
                        <p>${stock.purchaseValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:totalPurchaseValue", { defaultValue: "Total Purchase Value" })}:</p>
                        <p>${stock.totalPurchaseValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:agingDays", { defaultValue: "Aging Days" })}:</p>
                        <p>{stock.agingDays}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:penalty", { defaultValue: "Penalty" })}:</p>
                        <p>${stock.penalty.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:bgtCommission", { defaultValue: "BGT Commission" })}:</p>
                        <p>${stock.bgtCommission.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:maerskFee", { defaultValue: "Maersk Fee" })}:</p>
                        <p>${stock.maerskFee.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:commission", { defaultValue: "Commission" })}:</p>
                        <p>${stock.commission.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:netPrice", { defaultValue: "Net Price" })}:</p>
                        <p>${stock.netPrice.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:total", { defaultValue: "Total" })}:</p>
                        <p>${stock.total.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:batchNumber", { defaultValue: "Batch Number" })}:</p>
                        <p>{stock.batchNumber || "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("stocks:lowStockThreshold", { defaultValue: "Low Stock Threshold" })}:</p>
                        <p>{stock.lowStockThreshold != null ? stock.lowStockThreshold.toFixed(2) : "N/A"} kg</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin/stock")}
                        className="rounded-sm px-6 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        {t("general:actions.back", { defaultValue: "Back" })}
                    </Button>
                    <div className="space-x-2">
                        <Button
                            onClick={handleDownload}
                            disabled={isExporting}
                            className="rounded-sm px-6 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isExporting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            {t("stocks:actions.download", { defaultValue: "Download" })}
                        </Button>
                        {isAdmin && (
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="rounded-sm px-6 bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    t("stocks:actions.delete", { defaultValue: "Delete" })
                                )}
                            </Button>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDetails;