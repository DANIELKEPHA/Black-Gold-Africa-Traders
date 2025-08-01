"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
    useGetAuthUserQuery,
    useGetSellingPriceByIdQuery,
    useDeleteSellingPricesMutation,
    useExportSellingPricesXlsxMutation,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import Loading from "@/components/Loading";
import { SellingPriceResponse } from "@/state";
import {formatBrokerName} from "@/lib/utils";

interface SellingPricesDetailsProps {
    params: { id: string };
}

const SellingPricesDetails: React.FC<SellingPricesDetailsProps> = ({ params }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const { data: sellingPrice, isLoading: isSellingPriceLoading, error } = useGetSellingPriceByIdQuery(
        parseInt(params.id)
    );
    const [deleteSellingPrices, { isLoading: isDeleting }] = useDeleteSellingPricesMutation();
    const [exportSellingPricesXlsx, { isLoading: isExporting }] = useExportSellingPricesXlsxMutation();

    const isAdmin = authUser?.userRole === "admin";

    const handleDelete = async () => {
        if (!isAdmin) {
            toast.error(t("catalog:errors.unauthorized", { defaultValue: "Unauthorized" }));
            return;
        }
        try {
            console.log("[SellingPricesDetails] Deleting selling price with ID:", params.id);
            await deleteSellingPrices({ ids: [parseInt(params.id)] }).unwrap();
            toast.success(t("catalog:success.sellingPriceDeleted", { defaultValue: "Selling price deleted" }));
            router.push("/admin/sellingPrices");
        } catch (err: any) {
            console.error("[SellingPricesDetails] Delete error:", err);
            toast.error(
                err?.data?.message || t("catalog:errors.deleteFailed", { defaultValue: "Failed to delete selling price" })
            );
        }
    };

    const handleDownload = async () => {
        try {
            if (!sellingPrice) {
                toast.error(t("catalog:errors.noSellingPrice", { defaultValue: "No selling price data available" }));
                return;
            }
            console.log("[SellingPricesDetails] Exporting selling price with ID:", params.id);
            await exportSellingPricesXlsx({ sellingPriceIds: [parseInt(params.id)] }).unwrap();
            toast.success(t("catalog:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" }));
        } catch (err: any) {
            console.error("[SellingPricesDetails] Export error:", err);
            toast.error(
                err?.data?.message || t("catalog:errors.xlsxError", { defaultValue: "Failed to export XLSX" })
            );
        }
    };

    if (isAuthLoading || isSellingPriceLoading) return <Loading />;
    if (error || !sellingPrice) {
        console.error("[SellingPricesDetails] Error loading selling price, ID:", params.id, { error });
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading selling price" })}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster />
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                    {t("catalog:sellingPriceDetails", { defaultValue: "Selling Price Details" })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold">{t("catalog:lotNo", { defaultValue: "Lot Number" })}:</p>
                        <p>{sellingPrice.lotNo ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:</p>
                        <p>{sellingPrice.sellingMark ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:grade", { defaultValue: "Grade" })}:</p>
                        <p>{sellingPrice.grade ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:</p>
                        <p>{sellingPrice.invoiceNo ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:saleCode", { defaultValue: "Sale Code" })}:</p>
                        <p>{sellingPrice.saleCode ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:category", { defaultValue: "Category" })}:</p>
                        <p>{sellingPrice.category ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:broker", { defaultValue: "Broker" })}:</p>
                        <p>{formatBrokerName(sellingPrice.broker) ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:reprint", { defaultValue: "Reprint" })}:</p>
                        <p>{sellingPrice.reprint ?? "No"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:bags", { defaultValue: "Bags" })}:</p>
                        <p>{sellingPrice.bags ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:netWeight", { defaultValue: "Net Weight" })}:</p>
                        <p>{sellingPrice.netWeight?.toFixed(2) ?? "N/A"} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:totalWeight", { defaultValue: "Total Weight" })}:</p>
                        <p>{sellingPrice.totalWeight?.toFixed(2) ?? "N/A"} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:askingPrice", { defaultValue: "Asking Price" })}:</p>
                        <p>${sellingPrice.askingPrice?.toFixed(2) ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:purchasePrice", { defaultValue: "Purchase Price" })}:</p>
                        <p>${sellingPrice.purchasePrice?.toFixed(2) ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:producerCountry", { defaultValue: "Producer Country" })}:</p>
                        <p>{sellingPrice.producerCountry ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:</p>
                        <p>
                            {sellingPrice.manufactureDate
                                ? new Date(sellingPrice.manufactureDate).toLocaleDateString("en-US", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                  })
                                : "N/A"}
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin/sellingPrices")}
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
                            {t("catalog:actions.download", { defaultValue: "Download" })}
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
                                    t("catalog:actions.delete", { defaultValue: "Delete" })
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellingPricesDetails;