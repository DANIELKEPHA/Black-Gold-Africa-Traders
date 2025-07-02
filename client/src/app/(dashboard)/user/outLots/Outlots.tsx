"use client";

import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetOutlotsQuery } from "@/state/api";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { OutlotResponse } from "@/state";
import { useAppSelector } from "@/state/redux";
import OutlotsActions from "@/app/(dashboard)/user/outLots/OutlotsActions";
import OutlotsGrid from "@/app/(dashboard)/user/outLots/OutlotsGrid";
import OutlotsTable from "@/app/(dashboard)/user/outLots/OutLotsTable";

interface OutlotsProps { selectedItems: number[]; setSelectedItems: Dispatch<SetStateAction<number[]>>; }

interface ApiError { data?: { message?: string }; status?: number; }

const Outlots: React.FC<OutlotsProps> = ({ selectedItems, setSelectedItems }) => {
    const { t } = useTranslation("catalog");
    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const filters = useAppSelector((state) => state.global.filters);
    const [page, setPage] = useState(1);
    const [outlotData, setOutlotData] = useState<OutlotResponse[]>([]);
    const limit = 100;

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Filters in Outlots:`, filters);

    const {
        data: outlotDataResponse,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetOutlotsQuery(
        {
            ...filters,
            page,
            limit,
            userCognitoId: authUser?.cognitoInfo?.userId,
        },
        { skip: !authUser?.cognitoInfo?.userId, refetchOnMountOrArgChange: true }
    );

    useEffect(() => {
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Query params:`, {
            ...filters,
            page,
            limit,
            userCognitoId: authUser?.cognitoInfo?.userId,
        });
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Outlots API response:`, outlotDataResponse);
        if (outlotDataResponse?.data) {
            const mappedData: OutlotResponse[] = outlotDataResponse.data.map((item) => ({
                id: item.id,
                auction: item.auction || "",
                lotNo: item.lotNo || "",
                broker: item.broker || "",
                sellingMark: item.sellingMark || "",
                grade: item.grade || "",
                invoiceNo: item.invoiceNo || "",
                bags: item.bags || 0,
                netWeight: item.netWeight || 0,
                totalWeight: item.totalWeight || 0,
                baselinePrice: item.baselinePrice || 0,
                manufactureDate: item.manufactureDate || "",
                adminCognitoId: item.adminCognitoId || "",
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
                admin: item.admin || { id: 0, adminCognitoId: "", name: null, email: null, phoneNumber: null },
            }));
            setOutlotData(mappedData);
        }
    }, [outlotDataResponse, authUser, filters, page]);

    const { totalPages = 1 } = outlotDataResponse?.meta || {};

    const handleSelectItem = (itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (!outlotData || outlotData.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === outlotData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(outlotData.map((item) => item.id));
        }
    };

    if (authLoading || isLoading || isFetching) {
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Loading state:`, { authLoading, isLoading, isFetching });
        return <Loading />;
    }

    if (error || authError) {
        const errorMessage =
            (error as ApiError)?.data?.message ||
            (authError as ApiError)?.data?.message ||
            t("errors.unauthorized");
        console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Error:`, errorMessage);
        toast.error(t("errors.error"), {
            description: errorMessage,
        });
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <Toaster richColors position="top-right" />
            <OutlotsActions
                outlotData={outlotData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
            />
            {viewMode === "list" ? (
                <OutlotsTable
                    outlotData={outlotData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            ) : (
                <OutlotsGrid
                    outlotData={outlotData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            )}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    <Button
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="rounded-sm bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.previous", { defaultValue: "Previous" })}
                    </Button>
                    <span className="text-gray-700 dark:text-gray-200">
            {t("general:pagination.page", { page, totalPages })}
          </span>
                    <Button
                        disabled={page === totalPages || isLoading}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="rounded-sm bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.next", { defaultValue: "Next" })}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Outlots;



