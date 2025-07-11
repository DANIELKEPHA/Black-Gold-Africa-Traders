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

const Stocks: React.FC = () => {
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

    const { data: stockResponse, isLoading, error } = useGetStocksQuery(
        {
            page,
            limit,
            search: filters.search,
            lotNo: filters.lotNo,
            grade: filters.grade === 'any' ? undefined : filters.grade,
            broker: filters.broker === 'any' ? undefined : filters.broker,
            batchNumber: filters.batchNumber,
        },
        { skip: !userCognitoId },
    );

    const [exportStocksXlsx, { isLoading: isExporting }] = useExportStocksXlsxMutation();
    const [toggleFavorite] = useToggleFavoriteMutation();

    // Memoize stocksData to ensure stable reference
    const stocksData: StockData[] = useMemo(
        () =>
            stockResponse?.data.map((stock: Stock) => ({
                id: stock.id,
                saleCode: stock.saleCode,
                broker: stock.broker,
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
                isFavorited: stock.isFavorited || false, // Use server-provided isFavorited if available
            })) || [],
        [stockResponse]
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

    const handleExportExcel = async (stocks?: StockData[]) => {
        try {
            if (!stocks || stocks.length === 0) {
                throw new Error(t('stocks:errors.noItems', { defaultValue: 'No stock data to export' }));
            }
            console.log('Exporting stocks to Excel:', stocks.length);
            const stockIds = stocks.map((stock) => stock.id);
            await exportStocksXlsx({
                stockIds,
                search: filters.search,
                lotNo: filters.lotNo,
                grade: filters.grade === 'any' ? undefined : filters.grade,
                broker: filters.broker === 'any' ? undefined : filters.broker,
                batchNumber: filters.batchNumber,
            }).unwrap();
            toast.success(t('stocks:exportExcel', { defaultValue: 'Stocks exported to Excel successfully' }));
            return true;
        } catch (error: any) {
            console.error('Failed to export Excel:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            toast.error(t('stocks:errors.excelError', { defaultValue: 'Failed to export Excel: ' }) + (error.message || 'Unknown error'));
            return error;
        }
    };

    const handleFavoriteToggle = async (stockId: number, isFavorited: boolean) => {
        if (!userCognitoId) {
            toast.error(t('stocks:errors.unauthorized', { defaultValue: 'User not authenticated' }));
            return;
        }

        try {
            if (isFavorited) {
                setIsCreatingFavorite(true);
                await toggleFavorite({ userCognitoId, stocksId: stockId }).unwrap();
                toast.success(t('stocks:favoriteAdded', { defaultValue: 'Stock added to favorites' }));
            } else {
                setIsDeletingFavorite(true);
                await toggleFavorite({ userCognitoId, stocksId: stockId }).unwrap();
                toast.success(t('stocks:favoriteRemoved', { defaultValue: 'Stock removed from favorites' }));
            }
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
    };


    if (isAuthLoading || isLoading) return <Loading />;
    if (authError || error)
        return (
            <div className="text-red-500 p-4">
                {t('stocks:errors.error', { defaultValue: 'Error' })}
            </div>
        );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <Toaster richColors position="top-right" />
            <StocksActions
                stocks={stocksData}
                authUser={authData ?? null}
                selectedItems={selectedItems}
                handleSelectItem={handleSelectItem}
                handleSelectAll={handleSelectAll}
                viewMode={viewMode}
                loading={isLoading}
                handleExportXlsv={handleExportExcel}
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
                    viewMode={viewMode}
                    loading={isLoading}
                    handleExportXlsv={handleExportExcel}
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
                    viewMode={viewMode}
                    loading={isLoading}
                    handleExportXlsv={handleExportExcel}
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
    );
};

export default Stocks;