"use client";

import Loading from "@/components/Loading";
import { useGetAuthUserQuery, useGetCatalogQuery } from "@/state/api";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CatalogResponse } from "@/state";
import { useAppSelector } from "@/state/redux";
import CatalogActions from "@/app/(dashboard)/user/catalog/CatalogActions";
import CatalogTable from "@/app/(dashboard)/user/catalog/CatalogTable";
import CatalogGrid from "@/app/(dashboard)/user/catalog/CatalogGrid";

interface CatalogProps {
    selectedItems: number[];
    setSelectedItems: Dispatch<SetStateAction<number[]>>;
}

interface ApiError {
    data?: { message?: string };
    status?: number;
}

const Catalog: React.FC<CatalogProps> = ({ selectedItems, setSelectedItems }) => {
    const { t } = useTranslation("catalog");
    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const filters = useAppSelector((state) => state.global.filters);
    const [page, setPage] = useState(1);
    const [catalogData, setCatalogData] = useState<CatalogResponse[]>([]);
    const limit = 20;

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Filters in Catalog:`, filters);

    const {
        data: catalogDataResponse,
        isLoading,
        isFetching,
        error,
    } = useGetCatalogQuery(
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
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Catalog API response:`, catalogDataResponse);
        if (catalogDataResponse?.data) {
            const mappedData: CatalogResponse[] = catalogDataResponse.data.map((item) => ({
                ...item,
                saleCode: item.saleCode || "",
                netWeight: item.netWeight || 0,
                admin: item.admin || { id: 0, name: null, email: null },
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
                invoiceNo: item.invoiceNo ?? "",
            }));
            setCatalogData(mappedData);
        }
    }, [catalogDataResponse, authUser]);

    // Rest of the component remains unchanged...
    const { totalPages = 1 } = catalogDataResponse?.meta || {};

    const handleSelectItem = (itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId)
                ? prev.filter((id) => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = () => {
        if (!catalogData || catalogData.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === catalogData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(catalogData.map((item) => item.id));
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

            <CatalogActions
                catalogData={catalogData}
                selectedItems={selectedItems}
                handleSelectAll={handleSelectAll}
            />
            {viewMode === "list" ? (
                <CatalogTable
                    catalogData={catalogData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            ) : (
                <CatalogGrid
                    catalogData={catalogData}
                    selectedItems={selectedItems}
                    handleSelectItem={handleSelectItem}
                />
            )}
            {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                    <Button
                        disabled={page === 1}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="text-sm border-indigo-400 hover:bg-indigo-600 hover:text-white dark:border-indigo-600 dark:hover:bg-indigo-700"
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
                        className="text-sm border-indigo-400 hover:bg-indigo-600 hover:text-white dark:border-indigo-600 dark:hover:bg-indigo-700"
                        aria-label={t("pagination.next")}
                    >
                        {t("pagination.next")}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Catalog;