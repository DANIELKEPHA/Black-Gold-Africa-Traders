'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { StockData, UserStockTableProps } from '@/state/stock';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StockTable: React.FC<UserStockTableProps> = ({
                                                       stocks,
                                                       selectedItems,
                                                       handleSelectItem,
                                                       handleClearAllSelectedItems,
                                                       loading,
                                                       isExporting,
                                                       isCreatingFavorite,
                                                       isDeletingFavorite,
                                                       handleFavoriteToggle,
                                                   }) => {
    const { t } = useTranslation(['stocks', 'general']);

    const handleSelectAll = () => {
        if (selectedItems.length === stocks.length && stocks.length > 0) {
            handleClearAllSelectedItems();
        } else {
            const unselectedItems = stocks
                .filter((stock) => !selectedItems.includes(stock.id))
                .map((stock) => stock.id);
            unselectedItems.forEach((id) => handleSelectItem(id));
        }
    };

    return (
        <div className="space-y-4 overflow-x-auto">
            <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 min-w-full">
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={selectedItems.length > 0 && selectedItems.length === stocks.length}
                                onCheckedChange={handleSelectAll}
                                aria-label={t('stocks:selectAll', { defaultValue: 'Select all stocks' })}
                                className="border-gray-300 dark:border-gray-600"
                                disabled={isExporting || loading || stocks.length === 0}
                            />
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:favorite', { defaultValue: 'Favorite' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:lotNo', { defaultValue: 'Lot Number' })}</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">{t('stocks:mark', { defaultValue: 'Mark' })}</TableHead>
                        <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t('stocks:saleCode', { defaultValue: 'Sale Code' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:grade', { defaultValue: 'Grade' })}</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs sm:text-sm">{t('stocks:broker', { defaultValue: 'Broker' })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t('stocks:invoiceNo', { defaultValue: 'Invoice Number' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:bags', { defaultValue: 'Bags' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:weight', { defaultValue: 'Weight' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:purchaseValue', { defaultValue: 'Purchase Value' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:totalPurchaseValue', { defaultValue: 'Total Purchase Value' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm text-red-600 dark:text-red-800">{t('stocks:agingDays', { defaultValue: 'Aging Days' })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t('stocks:penalty', { defaultValue: 'Penalty' })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t('stocks:bgtCommission', { defaultValue: 'BGT Commission' })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t('stocks:maerskFee', { defaultValue: 'Maersk Fee' })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t('stocks:commission', { defaultValue: 'Commission' })}</TableHead>
                        <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t('stocks:netPrice', { defaultValue: 'Net Price' })}</TableHead>
                        <TableHead className="text-xs sm:text-sm">{t('stocks:total', { defaultValue: 'Total' })}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: 19 }).map((_, j) => (
                                    <TableCell key={j}>
                                        <Skeleton className="h-4 w-full rounded" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : stocks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={19} className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                <AlertDescription>
                                    {t('stocks:noStocksFound', { defaultValue: 'No stocks found.' })}
                                </AlertDescription>
                            </TableCell>
                        </TableRow>
                    ) : (
                        stocks.map((stock) => (
                            <TableRow
                                key={stock.id}
                                className={cn(
                                    selectedItems.includes(stock.id)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                        : stock.isLowStock
                                            ? 'bg-red-50 dark:bg-red-900/30'
                                            : stock.isFavorited
                                                ? 'bg-yellow-50 dark:bg-yellow-900/30'
                                                : '',
                                    'hover:bg-gray-100 dark:hover:bg-gray-800'
                                )}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedItems.includes(stock.id)}
                                        onCheckedChange={() => handleSelectItem(stock.id)}
                                        aria-label={t('stocks:selectStockAriaLabel', {
                                            defaultValue: `Select stock ${stock.lotNo}`,
                                        })}
                                        className="border-gray-300 dark:border-gray-600"
                                        disabled={isExporting}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleFavoriteToggle(stock.id, !stock.isFavorited)}
                                        disabled={isExporting || isCreatingFavorite || isDeletingFavorite}
                                        aria-label={
                                            stock.isFavorited
                                                ? t('stocks:removeFavorite', { defaultValue: 'Remove Favorite' })
                                                : t('stocks:addFavorite', { defaultValue: 'Add Favorite' })
                                        }
                                        className={cn(
                                            'p-1.5 rounded-full',
                                            stock.isFavorited
                                                ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
                                                : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                                        )}
                                    >
                                        <Star className={cn('w-4 h-4', stock.isFavorited && 'fill-current')} />
                                    </Button>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                        {stock.lotNo}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.mark}</TableCell>
                                <TableCell className="hidden md:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.saleCode}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.grade}</TableCell>
                                <TableCell className="hidden sm:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.broker.replace(/_/g, ' ')}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.invoiceNo}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.bags}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{stock.weight.toFixed(2)} kg</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.purchaseValue.toFixed(2)}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.totalPurchaseValue.toFixed(2)}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-red-600 dark:text-red-800">{stock.agingDays}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.penalty.toFixed(2)}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.bgtCommission.toFixed(2)}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.maerskFee.toFixed(2)}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.commission.toFixed(2)}</TableCell>
                                <TableCell className="hidden lg:table-cell text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.netPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">${stock.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default StockTable;