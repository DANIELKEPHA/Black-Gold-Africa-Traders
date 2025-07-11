'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockData, UserStockTableProps } from '@/state/stock';
import {cn} from "@/lib/utils";

const StockGrid: React.FC<UserStockTableProps> = ({
                                                      stocks,
                                                      selectedItems,
                                                      handleSelectItem,
                                                      loading,
                                                      isExporting,
                                                      isCreatingFavorite,
                                                      isDeletingFavorite,
                                                      handleFavoriteToggle,
                                                  }) => {
    const { t } = useTranslation(['stocks', 'general']);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
                <Card key={stock.id} className={cn(
                    'dark:bg-gray-800',
                    stock.isLowStock ? 'border-red-300 dark:border-red-700' : '',
                    stock.isFavorited ? 'border-yellow-400 dark:border-yellow-500' : ''
                )}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">{stock.lotNo}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedItems.includes(stock.id)}
                                onCheckedChange={() => handleSelectItem(stock.id)}
                                disabled={loading || isExporting}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFavoriteToggle(stock.id, !stock.isFavorited)}
                                disabled={loading || isCreatingFavorite || isDeletingFavorite || isExporting}
                            >
                                {stock.isFavorited
                                    ? t('stocks:removeFavorite', { defaultValue: 'Remove Favorite' })
                                    : t('stocks:addFavorite', { defaultValue: 'Add Favorite' })}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:id', { defaultValue: 'ID' })}:</strong> {stock.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:saleCode', { defaultValue: 'Sale Code' })}:</strong> {stock.saleCode || '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:broker', { defaultValue: 'Broker' })}:</strong> {stock.broker?.replace(/_/g, ' ') || '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:mark', { defaultValue: 'Mark' })}:</strong> {stock.mark || '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:grade', { defaultValue: 'Grade' })}:</strong> {stock.grade || '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:invoiceNo', { defaultValue: 'Invoice No' })}:</strong> {stock.invoiceNo || '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:bags', { defaultValue: 'Bags' })}:</strong> {stock.bags}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:weight', { defaultValue: 'Weight' })}:</strong> {stock.weight} kg
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:purchaseValue', { defaultValue: 'Purchase Value' })}:</strong> ${stock.purchaseValue.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:totalPurchaseValue', { defaultValue: 'Total Purchase Value' })}:</strong> ${stock.totalPurchaseValue.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:agingDays', { defaultValue: 'Aging Days' })}:</strong> {stock.agingDays || '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:penalty', { defaultValue: 'Penalty' })}:</strong> ${stock.penalty.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:bgtCommission', { defaultValue: 'BGT Commission' })}:</strong> ${stock.bgtCommission.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:maerskFee', { defaultValue: 'Maersk Fee' })}:</strong> ${stock.maerskFee.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:commission', { defaultValue: 'Commission' })}:</strong> ${stock.commission.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:netPrice', { defaultValue: 'Net Price' })}:</strong> ${stock.netPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{t('stocks:total', { defaultValue: 'Total' })}:</strong> ${stock.total.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default StockGrid;