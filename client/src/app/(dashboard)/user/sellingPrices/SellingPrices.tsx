"use client";

import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetSellingPricesQuery } from "@/state/api";
import React, {Dispatch, SetStateAction, useMemo, useState} from "react"; // Replace useEffect with useMemo
import { toast, Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/state/redux";
import SellingPricesActions from "@/app/(dashboard)/user/sellingPrices/SellingPricesActions";
import SellingPricesTable from "@/app/(dashboard)/user/sellingPrices/SellingPricesTable";
import SellingPricesGrid from "@/app/(dashboard)/user/sellingPrices/SellingPricesGrid";

interface SellingPricesProps {
    selectedItems: number[];
    setSelectedItems: Dispatch<SetStateAction<number[]>>;
}

interface ApiError {
    data?: { message?: string };
    status?: number;
}

const SellingPrices: React.FC<SellingPricesProps> = ({ selectedItems, setSelectedItems }) => {
    const { t } = useTranslation("sellingPrices");
    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const filters = useAppSelector((state) => state.global.filters);
    const [page, setPage] = useState(1);
    const limit = 20;

    console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Filters in SellingPrices:`, filters);

    const {
        data: sellingPricesDataResponse,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetSellingPricesQuery(
        {
            ...filters,
            page,
            limit,
            userCognitoId: authUser?.cognitoInfo?.userId,
        },
        { skip: !authUser?.cognitoInfo?.userId, refetchOnMountOrArgChange: true }
    );

    // Memoize sellingPricesData to avoid useEffect
    const sellingPricesData = useMemo(
        () =>
            sellingPricesDataResponse?.data.map((item) => ({
                ...item,
                saleCode: item.saleCode || "",
                netWeight: item.netWeight || 0,
                totalWeight: item.totalWeight || 0,
                askingPrice: item.askingPrice || 0,
                purchasePrice: item.purchasePrice || 0,
                admin: item.admin || { id: 0, adminCognitoId: "", name: null, email: null, phoneNumber: null },
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
                invoiceNo: item.invoiceNo || "",
                reprint: item.reprint || 0,
                producerCountry: item.producerCountry || null,
                category: item.category || "",
                grade: item.grade || "",
                broker: item.broker || "",
                lotNo: item.lotNo || "",
                sellingMark: item.sellingMark || "",
                adminCognitoId: item.adminCognitoId || "",
                manufactureDate: item.manufactureDate || "",
            })) || [],
        [sellingPricesDataResponse]
    );

    const { totalPages = 1 } = sellingPricesDataResponse?.meta || {};

    const handleSelectItem = (itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (!sellingPricesData || sellingPricesData.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === sellingPricesData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(sellingPricesData.map((item) => item.id));
        }
    };

    if (authLoading || isLoading || isFetching) {
        console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Loading state:`, { authLoading, isLoading, isFetching });
        return <Loading />;
    }

    if (error || authError) {
        const errorMessage =
            (error as ApiError)?.data?.message ||
            (authError as ApiError)?.data?.message ||
            t("errors.unauthorized");
        console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Error:`, errorMessage);
        toast.error(t("errors.error"), {
            description: errorMessage,
        });
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <Toaster richColors position="top-right" />
            <SellingPricesActions
                sellingPricesData={sellingPricesData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
            />
            {viewMode === "list" ? (
                <SellingPricesTable
                    sellingPricesData={sellingPricesData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            ) : (
                <SellingPricesGrid
                    sellingPricesData={sellingPricesData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            )}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center gap-4">
                    <Button
                        disabled={page === 1}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="text-sm bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border border-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600"
                        aria-label={t("pagination.previous")}
                    >
                        {t("pagination.previous")}
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                        {t("pagination.page", { page, totalPages })}
                    </span>
                    <Button
                        disabled={page === totalPages}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="text-sm bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border border-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:border-indigo-600"
                        aria-label={t("pagination.next")}
                    >
                        {t("pagination.next")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SellingPrices;