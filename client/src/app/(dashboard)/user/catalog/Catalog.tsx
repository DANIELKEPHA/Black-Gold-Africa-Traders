import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useGetCatalogQuery } from "@/state/api";
import { useAppSelector } from "@/state/redux";
import { Button } from "@/components/ui/button";
import CatalogActions from "@/app/(dashboard)/user/catalog/CatalogActions";
import CatalogTable from "@/app/(dashboard)/user/catalog/CatalogTable";
import CatalogGrid from "@/app/(dashboard)/user/catalog/CatalogGrid";
import Loading from "@/components/Loading";

const Catalog: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const filters = useAppSelector((state) => state.global.filters) || {};
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const limit = 100;

    const { data: catalogDataResponse, isLoading, error } = useGetCatalogQuery(
        {
            ...filters,
            page,
            limit,
        },
        { skip: !authUser?.cognitoInfo?.userId }
    );

    const catalogData = useMemo(() => catalogDataResponse?.data || [], [catalogDataResponse]);
    const { totalPages = 1, total = 0 } = catalogDataResponse?.meta || {};

    const handleSelectItem = useCallback((itemId: number) => {
        setSelectedItems((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    }, []);

    if (isAuthLoading || isLoading) return <Loading />;
    if (error) {
        console.error("[Catalog] Error loading catalog data", { error });
        return <div className="text-red-500 p-4">{t("catalog:errors.error", { defaultValue: "Error" })}</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <Toaster richColors position="top-right" />
            <CatalogActions selectedItems={selectedItems} catalogData={catalogData} />
            {viewMode === "list" ? (
                <CatalogTable catalogData={catalogData} selectedItems={selectedItems} handleSelectItem={handleSelectItem} />
            ) : (
                <CatalogGrid catalogData={catalogData} selectedItems={selectedItems} handleSelectItem={handleSelectItem} />
            )}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    <Button
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage((prev) => prev - 1)}
                        className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.previous", { defaultValue: "Previous" })}
                    </Button>
                    <span className="text-gray-700 dark:text-gray-200">
                        {t("general:pagination.page", { page, totalPages })}
                    </span>
                    <Button
                        disabled={page === totalPages || isLoading}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        {t("general:pagination.next", { defaultValue: "Next" })}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Catalog;