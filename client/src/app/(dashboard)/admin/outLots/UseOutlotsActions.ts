"use client";

import { toast } from "sonner";
import {
    useGetAuthUserQuery,
    useUploadOutlotsCsvMutation,
    useExportOutLotsXlsxMutation,
} from "@/state/api";
import { OutLotsResponse } from "@/state";
import { OutlotFormData } from "@/lib/schemas";

export const useOutLotsActions = () => {
    const [uploadOutlotsCsv] = useUploadOutlotsCsvMutation();
    const [exportOutLotsXlsx] = useExportOutLotsXlsxMutation();
    const { data: authUser } = useGetAuthUserQuery();

    const role = authUser?.userInfo?.data?.data?.role;
    const isAdmin = authUser?.userRole === "admin" || role === "admin";

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
                duplicateAction: "replace",
            }).unwrap();
            console.log("CSV upload successful:", response);
            toast.success(`Successfully uploaded ${response.count} outlot(s)`);
            return response;
        } catch (error: any) {
            console.error("Failed to upload CSV:", error);
            const errorMessage = error?.data?.message || "Failed to upload CSV";
            toast.error(errorMessage);
            return error;
        }
    };

    const handleUpdateOutLot = async (id: number, data: OutlotFormData) => {
        toast.error("Feature disabled", {
            description: "OutLot update functionality is currently disabled.",
        });
        return false;
    };

    const handleDeleteOutLot = async (id: number) => {
        toast.error("Feature disabled", {
            description: "OutLot deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleBulkDelete = async (ids: number[]) => {
        toast.error("Feature disabled", {
            description: "Bulk deletion functionality is currently disabled.",
        });
        return null;
    };

    const handleExportXlsx = async (outLots?: OutLotsResponse[]) => {
        try {
            if (!outLots || outLots.length === 0) {
                throw new Error("No outlot data to export");
            }

            console.log("Exporting outLots:", outLots.length);

            const response = await exportOutLotsXlsx({
                outLotIds: outLots.map((outLot) => outLot.id),
            }).unwrap();

            console.log("XLSX export successful:", response);
            toast.success("OutLots exported successfully");
            return true;
        } catch (error: any) {
            console.error("Failed to export XLSX:", error);
            const errorMessage = error?.message || "Failed to export XLSX";
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
        handleExportXlsx,
        isAdmin,
    };
};
