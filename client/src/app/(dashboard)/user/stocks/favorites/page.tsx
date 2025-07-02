'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'sonner';
import { useGetAuthUserQuery, useGetStocksQuery, useToggleFavoriteMutation } from '@/state/api';
import { Button } from '@/components/ui/button';
import Loading from '@/components/Loading';
import { useAppSelector } from '@/state/redux';
import { Stock, StockData } from '@/state/stock';
import StocksActions from '@/app/(dashboard)/user/stocks/StocksActions';
import StockTable from '@/app/(dashboard)/user/stocks/StockTable';
import StockGrid from '@/app/(dashboard)/user/stocks/StockGrid';
import { useStockActions } from '@/app/(dashboard)/user/stocks/useStockActions';
import { NAVBAR_HEIGHT } from '@/lib/constants';
import FiltersBar from "@/app/(dashboard)/user/stocks/FiltersBar";
import {Broker} from "@/state/enums";

const FavoritePage: React.FC = () => {
    const { t } = useTranslation(['stocks', 'general']);
    const filters = useAppSelector((state) => state.global.filters);
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const { data: authData, isError: authError, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const userCognitoId: string | undefined = authData?.cognitoInfo?.userId;
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const limit = 100;
    const { handleExportCsv } = useStockActions();
    const [toggleFavorite, { isLoading: isTogglingFavorite }] = useToggleFavoriteMutation();

    const { data: stockResponse, isLoading, error } = useGetStocksQuery(
        {
            page,
            limit,
            search: filters.search,
            lotNo: filters.lotNo,
            grade: filters.grade === 'any' ? undefined : filters.grade,
            broker: filters.broker === 'any' ? undefined : filters.broker,
            batchNumber: filters.batchNumber,
            onlyFavorites: true, // Filter for favorited stocks
        },
        { skip: !userCognitoId },
    );

    // Map stocks to StockData format for compatibility with Stocks components
    const favoriteStocks: StockData[] = React.useMemo(
        () =>
            stockResponse?.data.map((stock: Stock) => ({
                id: stock.id,
                saleCode: stock.saleCode,
                broker: stock.broker as Broker,
                lotNo: stock.lotNo,
                mark: stock.mark,
                grade: stock.grade,
                invoiceNo: stock.invoiceNo,
                bags: stock.bags,
                weight: stock.assignedWeight ?? stock.weight,
                purchaseValue: stock.purchaseValue,
                totalPurchaseValue: stock.totalPurchaseValue,
                agingDays: stock.agingDays,
                penalty: stock.penalty,
                bgtCommission: stock.bgtCommission,
                maerskFee: stock.maerskFee,
                commission: stock.commission,
                netPrice: stock.netPrice,
                total: stock.total,
                batchNumber: stock.batchNumber || null,
                lowStockThreshold: stock.lowStockThreshold,
                isLowStock: stock.lowStockThreshold != null && (stock.assignedWeight ?? stock.weight) < stock.lowStockThreshold,
                adminCognitoId: stock.adminCognitoId || '',
                createdAt: stock.createdAt,
                updatedAt: stock.updatedAt,
                isFavorited: true, // All stocks here are favorited due to onlyFavorites: true
            })) || [],
        [stockResponse?.data]
    );

    const totalPages = stockResponse?.meta.totalPages || 1;

    const handleSelectItem = useCallback(
        (itemId: number) => {
            setSelectedItems((prev) =>
                prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
            );
        },
        [],
    );

    const handleSelectAll = useCallback(() => {
        if (favoriteStocks.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === favoriteStocks.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(favoriteStocks.map((item) => item.id));
        }
    }, [favoriteStocks, selectedItems.length]);

    const handleFavoriteToggle = async (stockId: number, isFavorited: boolean) => {
        if (!userCognitoId) {
            toast.error(t('stocks:errors.authRequired', { defaultValue: 'Authentication required' }));
            return;
        }
        try {
            await toggleFavorite({ userCognitoId, stocksId: stockId }).unwrap();
            toast.success(
                isFavorited
                    ? t('stocks:favoriteRemoved', { defaultValue: 'Stock removed from favorites' })
                    : t('stocks:favoriteAdded', { defaultValue: 'Stock added to favorites' }),
            );
        } catch (error) {
            toast.error(t('stocks:errors.favoriteError', { defaultValue: 'Error toggling favorite' }));
        }
    };

    if (isAuthLoading || isLoading) return <Loading />;
    if (authError || error)
        return (
            <div className="text-red-500 p-4">
                {t('stocks:errors.error', { defaultValue: 'Error' })}
            </div>
        );

    return (
        <div
            className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col bg-gray-50 dark:bg-gray-900"
            style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
        >
            <Toaster richColors position="top-right" />
            <div className="sticky top-0 z-10">
                <FiltersBar />
            </div>
            <div className="flex flex-1 gap-4 mt-4">
                <div className="flex-1 overflow-x-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                            {t('stocks:favoriteStocks', { defaultValue: 'Favorite Stocks' })}
                        </h2>
                        <StocksActions
                            stocks={favoriteStocks}
                            authUser={authData ?? null}
                            selectedItems={selectedItems}
                            handleSelectItem={handleSelectItem}
                            handleSelectAll={handleSelectAll}
                            viewMode={viewMode}
                            loading={isLoading}
                            handleExportCsv={() => handleExportCsv(favoriteStocks)}
                            isCreatingFavorite={isTogglingFavorite}
                            isDeletingFavorite={isTogglingFavorite}
                            handleFavoriteToggle={handleFavoriteToggle}
                        />
                        {favoriteStocks.length === 0 ? (
                            <div className="text-gray-500 dark:text-gray-400 p-4">
                                {t('stocks:noFavoriteStocks', { defaultValue: 'No favorite stocks found.' })}
                            </div>
                        ) : viewMode === 'list' ? (
                            <StockTable
                                stocks={favoriteStocks}
                                authUser={authData ?? null}
                                selectedItems={selectedItems}
                                handleSelectItem={handleSelectItem}
                                handleSelectAll={handleSelectAll}
                                viewMode={viewMode}
                                loading={isLoading}
                                handleExportCsv={() => handleExportCsv(favoriteStocks)}
                                isCreatingFavorite={isTogglingFavorite}
                                isDeletingFavorite={isTogglingFavorite}
                                handleFavoriteToggle={handleFavoriteToggle}
                            />
                        ) : (
                            <StockGrid
                                stocks={favoriteStocks}
                                authUser={authData ?? null}
                                selectedItems={selectedItems}
                                handleSelectItem={handleSelectItem}
                                handleSelectAll={handleSelectAll}
                                viewMode={viewMode}
                                loading={isLoading}
                                handleExportCsv={() => handleExportCsv(favoriteStocks)}
                                isCreatingFavorite={isTogglingFavorite}
                                isDeletingFavorite={isTogglingFavorite}
                                handleFavoriteToggle={handleFavoriteToggle}
                            />
                        )}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-between items-center">
                                <Button
                                    disabled={page === 1 || isLoading}
                                    onClick={() => setPage((prev) => prev - 1)}
                                    className="rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {t('general:pagination:previous', { defaultValue: 'Previous' })}
                                </Button>
                                <span className="text-gray-700 dark:text-gray-200">
                  {t('general:pagination:page', { defaultValue: 'Page {page} of {totalPages}', page, totalPages })}
                </span>
                                <Button
                                    disabled={page >= totalPages || isLoading}
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {t('general:pagination:next', { defaultValue: 'Next' })}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FavoritePage;