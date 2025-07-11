'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { StockData, UserStockTableProps } from '@/state/stock';
import { cn } from '@/lib/utils';
import {Skeleton} from "@/components/ui/skeleton";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2 rounded" />
                        </CardHeader>
                        <CardContent>
                            {Array.from({ length: 8 }).map((_, j) => (
                                <Skeleton key={j} className="h-4 w-full rounded mb-2" />
                            ))}
                        </CardContent>
                    </Card>
                ))
            ) : stocks.length === 0 ? (
                <div className="col-span-full text-center">
                    <Card className="bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700">
                        <CardContent className="pt-6">
                            <p className="text-blue-800 dark:text-blue-200">{t('stocks:noStocksFound', { defaultValue: 'No stocks found.' })}</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                stocks.map((stock) => (
                    <Card
                        key={stock.id}
                        className={cn(
                            'dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-shadow duration-200 hover:shadow-lg',
                            stock.isLowStock ? 'border-red-300 dark:border-red-700' : '',
                            stock.isFavorited ? 'border-yellow-400 dark:border-yellow-500 border-2' : ''
                        )}
                    >
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700">
                            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stock.lotNo}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedItems.includes(stock.id)}
                                    onCheckedChange={() => handleSelectItem(stock.id)}
                                    disabled={loading || isExporting}
                                    aria-label={t('stocks:selectStockAriaLabel', { defaultValue: `Select stock ${stock.lotNo}` })}
                                    className="border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFavoriteToggle(stock.id, !stock.isFavorited)}
                                    disabled={loading || isCreatingFavorite || isDeletingFavorite || isExporting}
                                    aria-label={stock.isFavorited ? t('stocks:removeFavorite', { defaultValue: 'Remove Favorite' }) : t('stocks:addFavorite', { defaultValue: 'Add Favorite' })}
                                    className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                                >
                                    <Star className={cn('w-4 h-4', stock.isFavorited && 'fill-current')} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:id', { defaultValue: 'ID' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.id}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:saleCode', { defaultValue: 'Sale Code' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.saleCode || '-'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:broker', { defaultValue: 'Broker' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.broker?.replace(/_/g, ' ') || '-'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:mark', { defaultValue: 'Mark' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.mark || '-'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:grade', { defaultValue: 'Grade' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.grade || '-'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:invoiceNo', { defaultValue: 'Invoice No' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.invoiceNo || '-'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:bags', { defaultValue: 'Bags' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.bags}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:weight', { defaultValue: 'Weight' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.weight.toFixed(2)} kg</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:purchaseValue', { defaultValue: 'Purchase Value' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.purchaseValue.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:totalPurchaseValue', { defaultValue: 'Total Purchase Value' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.totalPurchaseValue.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:agingDays', { defaultValue: 'Aging Days' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">{stock.agingDays || '-'}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:penalty', { defaultValue: 'Penalty' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.penalty.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:bgtCommission', { defaultValue: 'BGT Commission' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.bgtCommission.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:maerskFee', { defaultValue: 'Maersk Fee' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.maerskFee.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:commission', { defaultValue: 'Commission' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.commission.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:netPrice', { defaultValue: 'Net Price' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.netPrice.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{t('stocks:total', { defaultValue: 'Total' })}:</p>
                                    <p className="text-gray-600 dark:text-gray-300">${stock.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

export default StockGrid;