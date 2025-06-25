import { toast } from "sonner";
import { useUploadStocksCsvMutation, useGetAuthUserQuery } from "@/state/api";
import { StocksResponse } from "@/state";
import { StockFormData } from "@/lib/schemas";

export const useStockActions = () => {
    const [createStocksFromCsv] = useUploadStocksCsvMutation();
    const { data: authUser } = useGetAuthUserQuery();

    const role = authUser?.userInfo?.data?.data?.role;
    const isAdmin = authUser?.userRole === "admin" || role === "admin";

    const handleCreateStocks = async (data: StockFormData) => {
        toast.error("Feature disabled", {
            description: "Stock creation functionality is currently disabled.",
        });
        return null;
    };

    const handleCreateStocksFromCsv = async (file: File) => {
        try {
            console.log("Uploading CSV file:", file.name);
            const response = await createStocksFromCsv({
                file,
                duplicateAction: "replace", // or "skip" based on your needs
            }).unwrap();
            console.log("CSV upload successful:", response);
            toast.success(`Successfully uploaded ${response.count} stock(s)`);
            return response;
        } catch (error: any) {
            console.error("Failed to upload CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to upload CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    const handleUpdateStocks = async (id: number, data: StockFormData) => {
        toast.error("Feature disabled", {
            description: "Stock update functionality is currently disabled.",
        });
        return false;
    };

    const handleDeleteStocks = async (id: number) => {
        toast.error("Feature disabled", {
            description: "Stock deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleBulkDelete = async (ids: number[]) => {
        toast.error("Feature disabled", {
            description: "Bulk deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleExportCsv = async (stocks?: StocksResponse[]) => {
        try {
            if (!stocks || stocks.length === 0) {
                throw new Error("No stock data to export");
            }
            console.log("Exporting stocks:", stocks.length);
            const csvData = [
                [
                    "id",
                    "saleCode",
                    "broker",
                    "lotNo",
                    "mark",
                    "grade",
                    "invoiceNo",
                    "bags",
                    "weight",
                    "purchaseValue",
                    "totalPurchaseValue",
                    "agingDays",
                    "penalty",
                    "bgtCommission",
                    "maerskFee",
                    "commission",
                    "netPrice",
                    "total",
                    "batchNumber",
                    "lowStockThreshold",
                    "adminCognitoId",
                ],
                ...stocks.map((stock) => [
                    stock.id,
                    stock.saleCode,
                    stock.broker,
                    stock.lotNo,
                    stock.mark || "",
                    stock.grade,
                    stock.invoiceNo || "",
                    stock.bags,
                    stock.weight,
                    stock.purchaseValue,
                    stock.totalPurchaseValue,
                    stock.agingDays,
                    stock.penalty,
                    stock.bgtCommission,
                    stock.maerskFee,
                    stock.commission,
                    stock.netPrice,
                    stock.total,
                    stock.batchNumber || "",
                    stock.lowStockThreshold != null ? stock.lowStockThreshold : "",
                    stock.adminCognitoId,
                ]),
            ];
            const csvContent = csvData.map((row) => row.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "stocks_export.csv";
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Stocks exported successfully");
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
        handleCreateStocks,
        handleCreateStocksFromCsv,
        handleUpdateStocks,
        handleDeleteStocks,
        handleBulkDelete,
        handleExportCsv,
        isAdmin,
    };
};