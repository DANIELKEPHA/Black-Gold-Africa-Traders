'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
                                                      }) => {
    const { t } = useTranslation(['stocks', 'general']);
    const router = useRouter();

    const handleExcelExport = async () => {
        try {
            const selectedStocks = stocks.filter((stock) => selectedItems.includes(stock.id));
            if (selectedStocks.length === 0) {
                toast.warning(t('stocks:errors.noItemsSelected', { defaultValue: 'No items selected' }));
                return;
            }
            await handleExportXlsv;
        } catch (error) {
            toast.error(t('stocks:errors.excelError', { defaultValue: 'Failed to export Excel' }));
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
        } catch (error) {
            // Error is handled in handleFavoriteToggle
        }
    };

    const handleViewFavorites = () => {
        router.push('/user/stocks/favorites');
    };

    return (
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={loading || stocks.length === 0}
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                >
                    {selectedItems.length === stocks.length && stocks.length > 0
                        ? t('stocks:deselectAll', { defaultValue: 'Deselect All' })
                        : t('stocks:selectAll', { defaultValue: 'Select All' })}
                </Button>
                <Button
                    onClick={handleExcelExport}
                    disabled={loading || isExporting || selectedItems.length === 0}
                    className="bg-green-600 text-white hover:bg-green-700"
                >
                    {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {t('stocks:exportExcel', { defaultValue: 'Export Excel' })}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleAddFavorites}
                    disabled={loading || isCreatingFavorite || isDeletingFavorite || selectedItems.length === 0}
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                >
                    {t('stocks:addFavorites', { defaultValue: 'Add Selected to Favorites' })}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleViewFavorites}
                    disabled={loading}
                    className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900"
                >
                    {t('stocks:viewFavorites', { defaultValue: 'View Favorites' })}
                </Button>
            </div>
        </div>
    );
};

export default StocksActions;