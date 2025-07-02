"use client";

import { toast } from "sonner";
import { useGetAuthUserQuery, useUploadOutlotsCsvMutation, useExportOutLotsCsvMutation } from "@/state/api";
import { OutLotsResponse } from "@/state";
import { OutlotFormData } from "@/lib/schemas";

export const useOutLotsActions = () => {
    const [uploadOutlotsCsv] = useUploadOutlotsCsvMutation();
    const [exportOutLotsCsv] = useExportOutLotsCsvMutation();
    const { data: authUser } = useGetAuthUserQuery();

    const role = authUser?.userInfo?.data?.data?.role;
    const isAdmin = authUser?.userRole === "admin" || role === "admin";

    // Disabled: SellingPrice creation is not implemented in this hook
    const handleCreateOutLot = async (data: OutlotFormData) => {
        toast.error("Feature disabled", {
            description: "OutLot creation functionality is currently disabled.",
        });
        return null;
    };

    const handleUploadOutlotsCsv = async (file: File) => {
        try {
            console.log("Uploading CSV file:", file.name);
            const response = await uploadOutlotsCsv({
                file,
                duplicateAction: "replace", // or "skip" based on needs
            }).unwrap();
            console.log("CSV upload successful:", response);
            toast.success(`Successfully uploaded ${response.count} outlot(s)`);
            return response;
        } catch (error: any) {
            console.error("Failed to upload CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.data?.message || "Failed to upload CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    // Disabled: SellingPrice update is not implemented in this hook
    const handleUpdateOutLot = async (id: number, data: OutlotFormData) => {
        toast.error("Feature disabled", {
            description: "OutLot update functionality is currently disabled.",
        });
        return false;
    };

    // Disabled: SellingPrice deletion is not implemented in this hook
    const handleDeleteOutLot = async (id: number) => {
        toast.error("Feature disabled", {
            description: "OutLot deletion functionality is currently disabled.",
        });
        return null;
    };

    // Disabled: SellingPrice bulk deletion is not implemented in this hook
    const handleBulkDelete = async (ids: number[]) => {
        toast.error("Feature disabled", {
            description: "Bulk deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleExportCsv = async (outLots?: OutLotsResponse[]) => {
        try {
            if (!outLots || outLots.length === 0) {
                throw new Error("No outlot data to export");
            }
            console.log("Exporting outLots:", outLots.length);
            const response = await exportOutLotsCsv({
                outLotIds: outLots.map((outLot) => outLot.id).join(","),
            }).unwrap();
            console.log("CSV export successful:", response);
            toast.success("SellingPrice exported successfully");
            return true;
        } catch (error: any) {
            console.error("Failed to export CSV:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            const errorMessage = error?.message || "Failed to export CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    return {
        handleCreateOutLot,
        handleUploadOutlotsCsv,
        handleUpdateOutLot,
        handleDeleteOutLot,
        handleBulkDelete,
        handleExportCsv,
        isAdmin,
    };
};