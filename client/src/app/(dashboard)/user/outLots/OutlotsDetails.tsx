"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetOutlotByIdQuery, useExportOutLotsXlsxMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import Loading from "@/components/Loading";
import { OutLotsResponse } from "@/state";

interface OutLotsDetailsProps {
    params: { id: string };
}

const OutLotsDetails: React.FC<OutLotsDetailsProps> = ({ params }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const { data: outLot, isLoading: isOutLotLoading, error } = useGetOutlotByIdQuery(
        parseInt(params.id)
    );
    const [exportOutLots, { isLoading: isExporting }] = useExportOutLotsXlsxMutation();

    const handleDownload = async () => {
        try {
            if (!outLot) {
                toast.error(
                    t("catalog:errors.noOutLot", { defaultValue: "No outlot data available" })
                );
                return;
            }
            console.log("[OutLotsDetails] Exporting outlot with ID:", outLot.id);
            await exportOutLots({
                outLotIds: [outLot.id],
            }).unwrap();
            toast.success(
                t("catalog:success.xlsxDownloaded", { defaultValue: "XLSX downloaded successfully" })
            );
        } catch (err: any) {
            console.error("[OutLotsDetails] Export error:", err);
            toast.error(
                err?.data?.message ||
                t("catalog:errors.xlsxError", { defaultValue: "Failed to export XLSX" })
            );
        }
    };

    if (isAuthLoading || isOutLotLoading) return <Loading />;
    if (error || !outLot) {
        console.error("[OutLotsDetails] Error loading outlot, ID:", params.id, { error });
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading outlot" })}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster />
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                    {t("catalog:outLotDetails", { defaultValue: "Outlot Details" })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold">{t("catalog:lotNo", { defaultValue: "Lot Number" })}:</p>
                        <p>{outLot.lotNo ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:auction", { defaultValue: "Auction" })}:</p>
                        <p>{outLot.auction ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:broker", { defaultValue: "Broker" })}:</p>
                        <p>{formatBrokerName(outLot.broker) ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:</p>
                        <p>{outLot.sellingMark ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:grade", { defaultValue: "Grade" })}:</p>
                        <p>{outLot.grade ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:</p>
                        <p>{outLot.invoiceNo ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:bags", { defaultValue: "Bags" })}:</p>
                        <p>{outLot.bags ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:netWeight", { defaultValue: "Net Weight" })}:</p>
                        <p>{outLot.netWeight?.toFixed(2) ?? "N/A"} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:tareWeight", { defaultValue: "Tare Weight" })}:</p>
                        <p>
                            {outLot.totalWeight && outLot.netWeight
                                ? (outLot.totalWeight - outLot.netWeight).toFixed(2)
                                : "N/A"}{" "}
                            kg
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:totalWeight", { defaultValue: "Total Weight" })}:</p>
                        <p>{outLot.totalWeight?.toFixed(2) ?? "N/A"} kg</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:baselinePrice", { defaultValue: "Baseline Price" })}:</p>
                        <p>${outLot.baselinePrice?.toFixed(2) ?? "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:</p>
                        <p>
                            {outLot.manufactureDate
                                ? new Date(outLot.manufactureDate).toLocaleDateString("en-US", {
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
                        onClick={() => router.push("/user/outLots")}
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

export default OutLotsDetails;