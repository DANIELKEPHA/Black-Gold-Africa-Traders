'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast, Toaster } from 'sonner';
import { useGetAuthUserQuery, useGetStocksQuery, useExportStocksXlsxMutation, useToggleFavoriteMutation } from '@/state/api';
import { Button } from '@/components/ui/button';
import Loading from '@/components/Loading';
import { useAppSelector } from '@/state/redux';
import { Stock, StockData } from '@/state/stock';
import StocksActions from '@/app/(dashboard)/user/stocks/StocksActions';
import StockTable from '@/app/(dashboard)/user/stocks/StockTable';
import StockGrid from '@/app/(dashboard)/user/stocks/StockGrid';
import FiltersBar from '@/app/(dashboard)/user/stocks/FiltersBar';
import { NAVBAR_HEIGHT } from '@/lib/constants';

const FavoritesPage: React.FC = () => {
    const { t } = useTranslation(['stocks', 'general']);
    const filters = useAppSelector((state) => state.global.filters);
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const { data: authData, isError: authError, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const userCognitoId: string | undefined = authData?.cognitoInfo?.userId;
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const [isCreatingFavorite, setIsCreatingFavorite] = useState(false);
    const [isDeletingFavorite, setIsDeletingFavorite] = useState(false);
    const limit = 100;

    const handleClearAllSelectedItems = useCallback(() => {
        setSelectedItems([]);
    }, []);

    const { data: stockResponse, isLoading, error } = useGetStocksQuery(
        {
            page,
            limit,
            search: filters.search,
            lotNo: filters.lotNo,
            grade: filters.grade === 'any' ? undefined : filters.grade,
            broker: filters.broker === 'any' ? undefined : filters.broker,
            batchNumber: filters.batchNumber,
            isFavorited: true,
        },
        { skip: !userCognitoId },
    );

    const [exportStocksXlsx, { isLoading: isExporting }] = useExportStocksXlsxMutation();
    const [toggleFavorite] = useToggleFavoriteMutation();

    const stocksData: StockData[] = useMemo(
        () =>
            stockResponse?.data.map((stock: Stock) => ({
                id: stock.id,
                saleCode: stock.saleCode ?? 'N/A',
                broker: stock.broker ?? 'N/A',
                lotNo: stock.lotNo ?? 'N/A',
                mark: stock.mark ?? 'N/A',
                grade: stock.grade ?? 'N/A',
                invoiceNo: stock.invoiceNo ?? 'N/A',
                bags: stock.bags ?? 0,
                weight: stock.assignedWeight ?? stock.weight ?? 0,
                purchaseValue: stock.purchaseValue ?? 0,
                totalPurchaseValue: stock.totalPurchaseValue ?? 0,
                agingDays: stock.agingDays ?? 0,
                penalty: stock.penalty ?? 0,
                bgtCommission: stock.bgtCommission ?? 0,
                maerskFee: stock.maerskFee ?? 0,
                commission: stock.commission ?? 0,
                netPrice: stock.netPrice ?? 0,
                total: stock.total ?? 0,
                batchNumber: stock.batchNumber ?? null,
                lowStockThreshold: stock.lowStockThreshold ?? null,
                isLowStock: stock.lowStockThreshold != null && (stock.assignedWeight ?? stock.weight ?? 0) < stock.lowStockThreshold,
                adminCognitoId: stock.adminCognitoId ?? '',
                createdAt: stock.createdAt ?? '',
                updatedAt: stock.updatedAt ?? '',
                isFavorited: stock.isFavorited ?? false,
            })) || [],
        [stockResponse]
    );

    const totalPages = stockResponse?.meta.totalPages || 1;

    const handleSelectItem = useCallback(
        (itemId: number) => {
            setSelectedItems((prev) =>
                prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
            );
        },
        []
    );

    const handleSelectAll = useCallback(() => {
        if (stocksData.length === 0) {
            setSelectedItems([]);
            return;
        }
        if (selectedItems.length === stocksData.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(stocksData.map((item) => item.id));
        }
    }, [stocksData, selectedItems.length]);

    const handleExportXlsv = useCallback(
        async (stocks: StockData[]) => {
            try {
                if (!stocks || stocks.length === 0) {
                    throw new Error(t('stocks:errors.noItems', { defaultValue: 'No stock data to export' }));
                }
                console.log('Exporting favorite stocks to Excel:', stocks.length);
                const stockIds = stocks.map((stock) => stock.id);
                await exportStocksXlsx({
                    stockIds,
                    search: filters.search,
                    lotNo: filters.lotNo,
                    grade: filters.grade === 'any' ? undefined : filters.grade,
                    broker: filters.broker === 'any' ? undefined : filters.broker,
                    batchNumber: filters.batchNumber,
                    isFavorited: true,
                }).unwrap();
                toast.success(t('stocks:exportExcel', { defaultValue: 'Favorite stocks exported to Excel successfully' }));
                return true;
            } catch (error: any) {
                console.error('Failed to export Excel:', error);
                toast.error(
                    t('stocks:errors.excelError', { defaultValue: 'Failed to export Excel: ' }) +
                    (error.message || 'Unknown error')
                );
                throw error;
            }
        },
        [exportStocksXlsx, filters, t]
    );

    const handleFavoriteToggle = useCallback(
        async (stockId: number, isFavorited: boolean) => {
            if (!userCognitoId) {
                toast.error(t('stocks:errors.unauthorized', { defaultValue: 'User not authenticated' }));
                return;
            }

            try {
                if (isFavorited) {
                    setIsCreatingFavorite(true);
                } else {
                    setIsDeletingFavorite(true);
                }
                await toggleFavorite({ userCognitoId, stocksId: stockId }).unwrap();
                toast.success(
                    isFavorited
                        ? t('stocks:favoriteAdded', { defaultValue: 'Stock added to favorites' })
                        : t('stocks:favoriteRemoved', { defaultValue: 'Stock removed from favorites' })
                );
            } catch (error: any) {
                console.error('Failed to toggle favorite:', error);
                toast.error(
                    t('stocks:errors.favoriteError', { defaultValue: 'Error toggling favorite: ' }) +
                    (error.message || 'Unknown error')
                );
            } finally {
                setIsCreatingFavorite(false);
                setIsDeletingFavorite(false);
            }
        },
        [toggleFavorite, userCognitoId, t]
    );

    if (isAuthLoading || isLoading) return <Loading />;
    if (authError || error)
        return (
            <div className="text-red-500 dark:text-red-400 p-4">
                {t('stocks:errors.error', { defaultValue: 'Error loading favorite stocks' })}
            </div>
        );

    return (
        <div
            className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col bg-gray-50 dark:bg-gray-900 min-h-screen"
            style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
        >
            <Toaster richColors position="top-right" />
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                <FiltersBar />
            </div>
            <div className="flex flex-1 gap-4 mt-4">
                <div className="flex-1 overflow-x-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                            {t('stocks:favorites', { defaultValue: 'Favorite Stocks' })}
                        </h2>
                        <StocksActions
                            stocks={stocksData}
                            authUser={authData ?? null}
                            selectedItems={selectedItems}
                            handleSelectItem={handleSelectItem}
                            handleSelectAll={handleSelectAll}
                            handleClearAllSelectedItems={handleClearAllSelectedItems}
                            viewMode={viewMode}
                            loading={isLoading}
                            handleExportXlsv={handleExportXlsv}
                            isExporting={isExporting}
                            isCreatingFavorite={isCreatingFavorite}
                            isDeletingFavorite={isDeletingFavorite}
                            handleFavoriteToggle={handleFavoriteToggle}
                        />
                        {viewMode === 'list' ? (
                            <StockTable
                                stocks={stocksData}
                                authUser={authData ?? null}
                                selectedItems={selectedItems}
                                handleSelectItem={handleSelectItem}
                                handleSelectAll={handleSelectAll}
                                handleClearAllSelectedItems={handleClearAllSelectedItems}
                                viewMode={viewMode}
                                loading={isLoading}
                                handleExportXlsv={handleExportXlsv}
                                isExporting={isExporting}
                                isCreatingFavorite={isCreatingFavorite}
                                isDeletingFavorite={isDeletingFavorite}
                                handleFavoriteToggle={handleFavoriteToggle}
                            />
                        ) : (
                            <StockGrid
                                stocks={stocksData}
                                authUser={authData ?? null}
                                selectedItems={selectedItems}
                                handleSelectItem={handleSelectItem}
                                handleSelectAll={handleSelectAll}
                                handleClearAllSelectedItems={handleClearAllSelectedItems}
                                viewMode={viewMode}
                                loading={isLoading}
                                handleExportXlsv={handleExportXlsv}
                                isExporting={isExporting}
                                isCreatingFavorite={isCreatingFavorite}
                                isDeletingFavorite={isDeletingFavorite}
                                handleFavoriteToggle={handleFavoriteToggle}
                            />
                        )}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-between items-center">
                                <Button
                                    disabled={page === 1 || isLoading}
                                    onClick={() => setPage((prev) => prev - 1)}
                                    className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-200"
                                >
                                    {t('general:pagination:previous', { defaultValue: 'Previous' })}
                                </Button>
                                <span className="text-gray-700 dark:text-gray-200 font-medium">
                  {t('general:pagination:page', { defaultValue: 'Page {page} of {totalPages}', page, totalPages })}
                </span>
                                <Button
                                    disabled={page >= totalPages || isLoading}
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-200"
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

export default FavoritesPage;