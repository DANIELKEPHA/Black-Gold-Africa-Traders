"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetSellingPriceByIdQuery, useExportSellingPricesXlsxMutation } from "@/state/api"; // Updated imports
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import Loading from "@/components/Loading";
import { SellingPriceResponse } from "@/state";

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
    const [exportSellingPricesXlsx, { isLoading: isExporting }] = useExportSellingPricesXlsxMutation(); // Only export mutation

    const handleDownload = async () => {
        try {
            await exportSellingPricesXlsx({ sellingPriceIds: [parseInt(params.id)] }).unwrap();
            toast.success(t("catalog:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" }));
        } catch (err: any) {
            toast.error(t("catalog:errors.xlsxError", { defaultValue: "Failed to export XLSX" }));
        }
    };

    if (isAuthLoading || isSellingPriceLoading) return <Loading />;
    if (error || !sellingPrice)
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading selling price" })}
            </div>
        );

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
                        <p>{sellingPrice.lotNo}</p>
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
                        <p>{sellingPrice.invoiceNo}</p>
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
                        <p>{sellingPrice.broker ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:reprint", { defaultValue: "Reprint" })}:</p>
                        <p>{sellingPrice.reprint ?? "No"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:bags", { defaultValue: "Bags" })}:</p>
                        <p>{sellingPrice.bags}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:netWeight", { defaultValue: "Net Weight" })}:</p>
                        <p>{sellingPrice.netWeight?.toFixed(2)} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:totalWeight", { defaultValue: "Total Weight" })}:</p>
                        <p>{sellingPrice.totalWeight?.toFixed(2)} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:askingPrice", { defaultValue: "Asking Price" })}:</p>
                        <p>${sellingPrice.askingPrice?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:purchasePrice", { defaultValue: "Purchase Price" })}:</p>
                        <p>${sellingPrice.purchasePrice?.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:producerCountry", { defaultValue: "Producer Country" })}:</p>
                        <p>{sellingPrice.producerCountry ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:</p>
                        <p>{sellingPrice.manufactureDate ? new Date(sellingPrice.manufactureDate).toISOString().slice(0, 10) : "N/A"}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/user/sellingPrices")} // Updated to user path
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellingPricesDetails;