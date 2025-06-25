import { toast } from "sonner";
import {
    useCreateCatalogFromCsvMutation,
    useGetAuthUserQuery,
} from "@/state/api";
import { CatalogFormData } from "@/lib/schemas";
import { Catalog } from "@/state/catalog";

export const useCatalogActions = () => {
    const [createCatalogFromCsv] = useCreateCatalogFromCsvMutation();
    const { data: authUser } = useGetAuthUserQuery();

    const role = authUser?.userInfo?.data?.data?.role;
    const isAdmin = authUser?.userRole === "admin" || role === "admin";

    const handleCreateCatalog = async (data: CatalogFormData) => {
        toast.error("Feature disabled", {
            description: "OutLots creation functionality is currently disabled.",
        });
        return null;
    };

    const handleCreateCatalogFromCsv = async (file: File) => {
        try {
            console.log("Uploading CSV file:", file.name);
            // Wrap the file in the expected object structure
            const response = await createCatalogFromCsv({
                file,
                duplicateAction: "replace" // or "skip" based on your needs
            }).unwrap();
            console.log("CSV upload successful:", response);
            toast.success(`Successfully uploaded ${response.count} catalog(s)`);
            return response;
        } catch (error: any) {
            console.error("Failed to upload CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to upload CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    const handleUpdateCatalog = async (id: number, data: CatalogFormData) => {
        toast.error("Feature disabled", {
            description: "OutLots update functionality is currently disabled.",
        });
        return false;
    };

    const handleDeleteCatalog = async (id: number) => {
        toast.error("Feature disabled", {
            description: "OutLots deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleBulkDelete = async (ids: number[]) => {
        toast.error("Feature disabled", {
            description: "Bulk deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleExportCsv = async (catalogs?: Catalog[]) => {
        try {
            if (!catalogs || catalogs.length === 0) {
                throw new Error("No catalog data to export");
            }
            console.log("Exporting catalogs:", catalogs.length);
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
                    "producerCountry",
                    "manufactureDate",
                    "adminCognitoId",
                ],
                ...catalogs.map((catalog) => [
                    catalog.id,
                    catalog.lotNo,
                    catalog.sellingMark,
                    catalog.grade,
                    catalog.invoiceNo || "",
                    catalog.saleCode,
                    catalog.category,
                    catalog.broker,
                    catalog.reprint,
                    catalog.bags,
                    catalog.netWeight,
                    catalog.totalWeight,
                    catalog.askingPrice,
                    catalog.producerCountry || "",
                    catalog.manufactureDate || "",
                    catalog.adminCognitoId,
                ]),
            ];
            const csvContent = csvData.map((row) => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "catalogs_export.csv";
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Catalogs exported successfully");
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
        handleCreateCatalog,
        handleCreateCatalogFromCsv,
        handleUpdateCatalog,
        handleDeleteCatalog,
        handleBulkDelete,
        handleExportCsv,
        isAdmin,
    };
};