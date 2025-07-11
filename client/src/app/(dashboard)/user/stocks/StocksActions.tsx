'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Star } from 'lucide-react';
import { UserStockTableProps } from '@/state/stock';
import { toast } from 'sonner';

const StocksActions: React.FC<UserStockTableProps> = ({
                                                          stocks,
                                                          authUser,
                                                          selectedItems,
                                                          handleSelectItem,
                                                          handleSelectAll,
                                                          handleExportXlsv,
                                                          isExporting,
                                                          viewMode,
                                                          loading,
                                                          isCreatingFavorite,
                                                          isDeletingFavorite,
                                                          handleFavoriteToggle,
                                                          handleClearAllSelectedItems,
                                                      }) => {
    const { t } = useTranslation(['stocks', 'general']);
    const router = useRouter();

    const handleExcelExport = async () => {
        try {
            if (!stocks || stocks.length === 0) {
                toast.error(t('stocks:errors.noItems', { defaultValue: 'No stock data available to export' }));
                return;
            }

            const selectedStocks = stocks.filter((stock) => selectedItems.includes(stock.id));
            if (selectedStocks.length === 0) {
                toast.warning(t('stocks:errors.noItemsSelected', { defaultValue: 'No items selected' }));
                return;
            }

            await handleExportXlsv(selectedStocks); // Pass selectedStocks explicitly
            toast.success(t('stocks:exportExcel', { defaultValue: 'Stocks exported to Excel successfully' }));
        } catch (error: any) {
            console.error('Failed to export Excel:', error);
            toast.error(
                t('stocks:errors.excelError', { defaultValue: 'Failed to export Excel: ' }) +
                (error.message || 'Unknown error')
            );
        }
    };

    const handleAddFavorites = async () => {
        if (selectedItems.length === 0) {
            toast.warning(t('stocks:errors.noItemsSelected', { defaultValue: 'No items selected' }));
            return;
        }
        try {
            for (const stockId of selectedItems) {
                await handleFavoriteToggle(stockId, true);
            }
            toast.success(t('stocks:favoritesAdded', { defaultValue: 'Selected stocks added to favorites' }));
            handleClearAllSelectedItems(); // Clear selection after adding favorites
        } catch (error: any) {
            console.error('Failed to add favorites:', error);
            toast.error(
                t('stocks:errors.favoriteError', { defaultValue: 'Failed to add favorites: ' }) +
                (error.message || 'Unknown error')
            );
        }
    };

    const handleRemoveFavorites = async () => {
        if (selectedItems.length === 0) {
            toast.warning(t('stocks:errors.noItemsSelected', { defaultValue: 'No items selected' }));
            return;
        }
        try {
            for (const stockId of selectedItems) {
                await handleFavoriteToggle(stockId, false);
            }
            toast.success(t('stocks:favoritesRemoved', { defaultValue: 'Selected stocks removed from favorites' }));
            handleClearAllSelectedItems(); // Clear selection after removing favorites
        } catch (error: any) {
            console.error('Failed to remove favorites:', error);
            toast.error(
                t('stocks:errors.favoriteError', { defaultValue: 'Failed to remove favorites: ' }) +
                (error.message || 'Unknown error')
            );
        }
    };

    const handleViewFavorites = () => {
        router.push('/user/stocks/favorites');
    };

    return (
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={loading || stocks.length === 0}
                    className="rounded-lg border-indigo-300 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors duration-200"
                >
                    {selectedItems.length === stocks.length && stocks.length > 0
                        ? t('stocks:deselectAll', { defaultValue: 'Deselect All' })
                        : t('stocks:selectAll', { defaultValue: 'Select All' })}
                </Button>
                <Button
                    onClick={handleExcelExport}
                    disabled={loading || isExporting || stocks.length === 0 || selectedItems.length === 0}
                    className="rounded-lg bg-green-600 text-white hover:bg-green-700 dark:hover:bg-green-800 transition-colors duration-200"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    {t('stocks:exportExcel', { defaultValue: 'Export Excel' })}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleAddFavorites}
                    disabled={loading || isCreatingFavorite || isDeletingFavorite || selectedItems.length === 0}
                    className="rounded-lg border-indigo-300 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors duration-200"
                >
                    <Star className="w-4 h-4 mr-2" />
                    {t('stocks:addFavorites', { defaultValue: 'Add to Favorites' })}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleRemoveFavorites}
                    disabled={loading || isCreatingFavorite || isDeletingFavorite || selectedItems.length === 0}
                    className="rounded-lg border-indigo-300 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors duration-200"
                >
                    <Star className="w-4 h-4 mr-2" />
                    {t('stocks:removeFavorites', { defaultValue: 'Remove from Favorites' })}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleViewFavorites}
                    disabled={loading}
                    className="rounded-lg border-indigo-300 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors duration-200"
                >
                    {t('stocks:viewFavorites', { defaultValue: 'View Favorites' })}
                </Button>
            </div>
        </div>
    );
};

export default StocksActions;