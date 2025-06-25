import { toast } from "sonner";
import { useGetAuthUserQuery, useUploadSellingPricesCsvMutation } from "@/state/api";
import { CatalogFormData } from "@/lib/schemas";
import { SellingPriceResponse } from "@/state";

export const useSellingPriceActions = () => {
    const [uploadSellingPricesCsv] = useUploadSellingPricesCsvMutation();
    const { data: authUser } = useGetAuthUserQuery();

    const role = authUser?.userInfo?.data?.data?.role;
    const isAdmin = authUser?.userRole === "admin" || role === "admin";

    const handleCreateSellingPrice = async (data: CatalogFormData) => {
        toast.error("Feature disabled", {
            description: "Selling price creation functionality is currently disabled.",
        });
        return null;
    };

    const handleUploadSellingPriceFromCsv = async (file: File) => {
        try {
            console.log("Uploading CSV file:", file.name);
            const response = await uploadSellingPricesCsv({
                file,
                duplicateAction: "replace", // or "skip" based on needs
            }).unwrap();
            console.log("CSV upload successful:", response);
            toast.success(`Successfully uploaded ${response.count} selling price(s)`);
            return response;
        } catch (error: any) {
            console.error("Failed to upload CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to upload CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    const handleUpdateSellingPrice = async (id: number, data: CatalogFormData) => {
        toast.error("Feature disabled", {
            description: "Selling price update functionality is currently disabled.",
        });
        return false;
    };

    const handleDeleteSellingPrice = async (id: number) => {
        toast.error("Feature disabled", {
            description: "Selling price deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleBulkDelete = async (ids: number[]) => {
        toast.error("Feature disabled", {
            description: "Bulk deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleExportCsv = async (sellingPrices?: SellingPriceResponse[]) => {
        try {
            if (!sellingPrices || sellingPrices.length === 0) {
                throw new Error("No selling price data to export");
            }
            console.log("Exporting selling prices:", sellingPrices.length);
            const csvData = [
                [
                    "id",
                    "lotNo",
                    "sellingMark",
                    "grade",
                    "invoiceNo",
                    "saleCode",
                    "category",
                    "broker",
                    "reprint",
                    "bags",
                    "netWeight",
                    "totalWeight",
                    "askingPrice",
                    "purchasePrice",
                    "producerCountry",
                    "manufactureDate",
                    "adminCognitoId",
                ],
                ...sellingPrices.map((price) => [
                    price.id,
                    price.lotNo,
                    price.sellingMark ?? "",
                    price.grade,
                    price.invoiceNo,
                    price.saleCode ?? "",
                    price.category,
                    price.broker,
                    price.reprint,
                    price.bags,
                    price.netWeight,
                    price.totalWeight,
                    price.askingPrice,
                    price.purchasePrice,
                    price.producerCountry ?? "",
                    price.manufactureDate ?? "",
                    price.adminCognitoId ?? "",
                ]),
            ];
            const csvContent = csvData.map((row) => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "selling_prices_export.csv";
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Selling prices exported successfully");
            console.log("CSV exported successfully");
            return true;
        } catch (error: any) {
            console.error("Failed to export CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            toast.error("Failed to export CSV: " + (error.message || "Unknown error"));
            return error;
        }
    };

    return {
        handleCreateSellingPrice,
        handleUploadSellingPriceFromCsv,
        handleUpdateSellingPrice,
        handleDeleteSellingPrice,
        handleBulkDelete,
        handleExportCsv,
        isAdmin,
    };
};