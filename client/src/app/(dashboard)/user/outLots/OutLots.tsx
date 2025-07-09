"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetOutlotsQuery } from "@/state/api";
import { useAppSelector } from "@/state/redux";
import { Button } from "@/components/ui/button";
import OutlotsActions from "@/app/(dashboard)/user/outLots/OutlotsActions";
import OutlotsTable from "@/app/(dashboard)/user/outLots/OutlotsTable";
import OutlotsGrid from "@/app/(dashboard)/user/outLots/OutlotsGrid";

const OutLots: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters) || {};
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectAllAcrossPages, setSelectAllAcrossPages] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const limit = 100;

    console.log("[OutLots] Filters before query:", filters);

    const { data: outLotsDataResponse, isLoading, error } = useGetOutlotsQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    // Fetch all outlot IDs for bulk download when selectAllAcrossPages is true
    const { data: allOutLotsData, isLoading: isAllOutLotsLoading } = useGetOutlotsQuery(
        {
            ...filters,
            page: 1,
            limit: 10000,
        },
        { skip: !authUser?.cognitoInfo?.userId || !selectAllAcrossPages }
    );

    // Memoize outLotsData to ensure stable reference
    const outLotsData = useMemo(() => outLotsDataResponse?.data || [], [outLotsDataResponse]);

    const { totalPages = 1, total = 0 } = outLotsDataResponse?.meta || {};

    const handleSelectItem = useCallback((itemId: number) => {
        console.log("[OutLots] handleSelectItem called with itemId:", itemId);
        setSelectedItems((prev) => {
            const newSelected = prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId];
            console.log("[OutLots] New selected items:", newSelected);
            setSelectAllAcrossPages(false); // Reset select all across pages when individual items are toggled
            return newSelected;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        console.log("[OutLots] handleSelectAll called, current selectAllAcrossPages:", selectAllAcrossPages);
        if (selectAllAcrossPages || selectedItems.length === outLotsData.length) {
            setSelectedItems([]);
            setSelectAllAcrossPages(false);
        } else {
            const validIds = outLotsData
                .filter((item) => Number.isInteger(item.id) && item.id > 0)
                .map((item) => item.id);
            setSelectedItems(validIds);
            setSelectAllAcrossPages(true);
            console.log("[OutLots] Selected all items:", validIds);
        }
    }, [outLotsData, selectedItems.length, selectAllAcrossPages]);

    if (isAuthLoading || isLoading) return null; // Simplified loading state
    if (error) {
        console.error("[OutLots] Error loading outlots data", { error });
        return (
            <div className="text-red-500 p-4">
                {t("catalog:errors.error", { defaultValue: "Error loading outlots" })}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
            <Toaster richColors position="top-right" />
            <OutlotsActions
                outLotsData={outLotsData}
                selectedItems={selectedItems}
                selectAllAcrossPages={selectAllAcrossPages}
                handleSelectAll={handleSelectAll}
            />
            {viewMode === "list" ? (
                <OutlotsTable
                    outLotsData={outLotsData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                    selectAllAcrossPages={selectAllAcrossPages}
                    handleSelectAll={handleSelectAll}
                />
            ) : (
                <OutlotsGrid
                    outLotsData={outLotsData}
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

export default OutLots;