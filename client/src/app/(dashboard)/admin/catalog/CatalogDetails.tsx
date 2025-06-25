
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetCatalogByIdQuery, useDeleteCatalogsMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { useExportCatalogsCsvMutation } from "@/state/api";
import Loading from "@/components/Loading";

interface CatalogDetailsProps {
    params: { id: string };
}

const CatalogDetails: React.FC<CatalogDetailsProps> = ({ params }) => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const { data: catalog, isLoading: isCatalogLoading, error } = useGetCatalogByIdQuery(parseInt(params.id));
    const [deleteCatalogs, { isLoading: isDeleting }] = useDeleteCatalogsMutation();
    const [exportCatalogsCsv, { isLoading: isExporting }] = useExportCatalogsCsvMutation();
    const isAdmin = authUser?.userRole === "admin";

    const handleDelete = async () => {
        if (!isAdmin) {
            toast.error(t("catalog:errors.unauthorized", { defaultValue: "Unauthorized" }));
            return;
        }
        try {
            await deleteCatalogs({ ids: [parseInt(params.id)] }).unwrap();
            toast.success(t("catalog:success.catalogDeleted", { defaultValue: "OutLots deleted" }));
            router.push("/admin/catalog");
        } catch (err: any) {
            toast.error(t("catalog:errors.deleteFailed", { defaultValue: "Failed to delete catalog" }));
        }
    };

    const handleDownload = async () => {
        try {
            await exportCatalogsCsv({ catalogIds: [parseInt(params.id)] }).unwrap();
            toast.success(t("catalog:success.csvDownloaded", { defaultValue: "CSV downloaded successfully" }));
        } catch (err: any) {
            toast.error(t("catalog:errors.csvError", { defaultValue: "Failed to export CSV" }));
        }
    };

    if (isAuthLoading || isCatalogLoading) return <Loading />;
    if (error || !catalog)
        return <div className="text-red-500 p-4">{t("catalog:errors.error", { defaultValue: "Error" })}</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster />
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                    {t("catalog:catalogDetails", { defaultValue: "OutLots Details" })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="font-semibold">{t("catalog:lotNo", { defaultValue: "Lot Number" })}:</p>
                        <p>{catalog.lotNo}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:sellingMark", { defaultValue: "Selling Mark" })}:</p>
                        <p>{catalog.sellingMark}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:grade", { defaultValue: "Grade" })}:</p>
                        <p>{catalog.grade}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:invoiceNo", { defaultValue: "Invoice Number" })}:</p>
                        <p>{catalog.invoiceNo}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:saleCode", { defaultValue: "Sale Code" })}:</p>
                        <p>{catalog.saleCode}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:category", { defaultValue: "Category" })}:</p>
                        <p>{catalog.category}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:reprint", { defaultValue: "Reprint" })}:</p>
                        <p>{catalog.reprint}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:bags", { defaultValue: "Bags" })}:</p>
                        <p>{catalog.bags}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:netWeight", { defaultValue: "Net Weight" })}:</p>
                        <p>{catalog.netWeight}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:totalWeight", { defaultValue: "Total Weight" })}:</p>
                        <p>{catalog.totalWeight}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:askingPrice", { defaultValue: "Asking Price" })}:</p>
                        <p>{catalog.askingPrice}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:producerCountry", { defaultValue: "Producer Country" })}:</p>
                        <p>{catalog.producerCountry || "N/A"}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t("catalog:manufactureDate", { defaultValue: "Manufacture Date" })}:</p>
                        <p>{catalog.manufactureDate.split("T")[0]}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin/catalog")}
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

export default CatalogDetails;