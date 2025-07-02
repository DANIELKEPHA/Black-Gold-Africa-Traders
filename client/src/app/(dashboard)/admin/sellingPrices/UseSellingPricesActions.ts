import { toast } from "sonner";
import {
    useGetAuthUserQuery,
    useUploadSellingPricesCsvMutation,
    useCreateSellingPriceMutation,
    useDeleteSellingPricesMutation,
    useUpdateSellingPriceMutation, // Assuming this mutation exists or needs to be added
} from "@/state/api";
import { SellingPriceFormData} from "@/lib/schemas";
import { SellingPriceResponse } from "@/state";

export const useSellingPriceActions = () => {
    const [uploadSellingPricesCsv] = useUploadSellingPricesCsvMutation();
    const [createSellingPrice] = useCreateSellingPriceMutation();
    const [updateSellingPrice] = useUpdateSellingPriceMutation(); // Add this mutation
    const [deleteSellingPrices] = useDeleteSellingPricesMutation();
    const { data: authUser } = useGetAuthUserQuery();

    const role = authUser?.userInfo?.data?.data?.role;
    const isAdmin = authUser?.userRole === "admin" || role === "admin";

    const handleCreateSellingPrice = async (data: SellingPriceFormData) => {
        if (!isAdmin) {
            toast.error("Unauthorized", {
                description: "Only admins can create selling prices.",
            });
            return null;
        }

        try {
            console.log("Creating selling price:", data);
            const response = await createSellingPrice({
                ...data,
                adminCognitoId: authUser?.cognitoInfo?.userId || "",
            }).unwrap();
            console.log("Selling price created:", response);
            toast.success("Selling price created successfully");
            return response;
        } catch (error: any) {
            console.error("Failed to create selling price:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to create selling price";
            toast.error(errorMessage);
            return null;
        }
    };

    const handleUploadSellingPriceFromCsv = async (file: File) => {
        if (!isAdmin) {
            toast.error("Unauthorized", {
                description: "Only admins can upload selling prices.",
            });
            return null;
        }

        try {
            console.log("Uploading CSV file:", file.name);
            const response = await uploadSellingPricesCsv({
                file,
                duplicateAction: "replace",
            }).unwrap();
            console.log("CSV upload successful:", response);
            toast.success(
                `Successfully uploaded ${response.success.created} selling price(s), skipped ${response.success.skipped}, replaced ${response.success.replaced}`
            );
            return response;
        } catch (error: any) {
            console.error("Failed to upload CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to upload CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    const handleUpdateSellingPrice = async (id: number, data: Partial<SellingPriceFormData>) => {
        if (!isAdmin) {
            toast.error("Unauthorized", {
                description: "Only admins can update selling prices.",
            });
            return false;
        }

        try {
            console.log(`Updating selling price ID ${id}:`, data);
            const response = await updateSellingPrice({ id, ...data }).unwrap();
            console.log("Selling price updated:", response);
            toast.success("Selling price updated successfully");
            return true;
        } catch (error: any) {
            console.error("Failed to update selling price:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to update selling price";
            toast.error(errorMessage);
            return false;
        }
    };

    const handleDeleteSellingPrice = async (id: number) => {
        if (!isAdmin) {
            toast.error("Unauthorized", {
                description: "Only admins can delete selling prices.",
            });
            return null;
        }

        try {
            console.log(`Deleting selling price ID ${id}`);
            const response = await deleteSellingPrices({ ids: [id] }).unwrap();
            console.log("Selling price deleted:", response);
            toast.success("Selling price deleted successfully");
            return response;
        } catch (error: any) {
            console.error("Failed to delete selling price:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to delete selling price";
            toast.error(errorMessage);
            return null;
        }
    };

    const handleBulkDelete = async (ids: number[]) => {
        if (!isAdmin) {
            toast.error("Unauthorized", {
                description: "Only admins can delete selling prices.",
            });
            return null;
        }

        if (ids.length === 0) {
            toast.error("No items selected", {
                description: "Please select at least one selling price to delete.",
            });
            return null;
        }

        try {
            console.log("Bulk deleting selling prices:", ids);
            const response = await deleteSellingPrices({ ids }).unwrap();
            console.log("Bulk delete successful:", response);
            toast.success(`Successfully deleted ${response.associations.length} selling price(s)`);
            return response;
        } catch (error: any) {
            console.error("Failed to bulk delete selling prices:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to delete selling prices";
            toast.error(errorMessage);
            return null;
        }
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