'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { StockData, UserStockTableProps } from '@/state/stock';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const StockTable: React.FC<UserStockTableProps> = ({
                                                       stocks,
                                                       selectedItems,
                                                       handleSelectItem,
                                                       loading,
                                                       isExporting,
                                                   }) => {
    const { t } = useTranslation(['stocks', 'general']);

    return (
        <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 table-auto">
                    <thead className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-800 dark:to-blue-700 text-white">
                    <tr>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[50px]">
                            {t('stocks:select', { defaultValue: 'Select' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:lotNo', { defaultValue: 'Lot No' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:mark', { defaultValue: 'Mark' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:saleCode', { defaultValue: 'Sale Code' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[80px]">
                            {t('stocks:grade', { defaultValue: 'Grade' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:broker', { defaultValue: 'Broker' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:invoiceNo', { defaultValue: 'Invoice No' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[60px]">
                            {t('stocks:bags', { defaultValue: 'Bags' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[80px]">
                            {t('stocks:weight', { defaultValue: 'Weight (kg)' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:purchaseValue', { defaultValue: 'Purchase Value' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[120px]">
                            {t('stocks:totalPurchaseValue', { defaultValue: 'Total Purchase Value' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[80px]">
                            {t('stocks:agingDays', { defaultValue: 'Aging Days' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[80px]">
                            {t('stocks:penalty', { defaultValue: 'Penalty' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:bgtCommission', { defaultValue: 'BGT Comm' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:maerskFee', { defaultValue: 'Maersk Fee' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:commission', { defaultValue: 'Commission' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:netPrice', { defaultValue: 'Net Price' })}
                        </th>
                        <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[100px]">
                            {t('stocks:total', { defaultValue: 'Total' })}
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {Array.from({ length: 18 }).map((_, j) => (
                                    <td key={j} className="px-4 py-3">
                                        <Skeleton className="h-4 w-full rounded" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : stocks.length === 0 ? (
                        <tr>
                            <td colSpan={18} className="px-4 py-3 text-center">
                                <Alert
                                    variant="default"
                                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                                >
                                    {t('stocks:noStocksFound', { defaultValue: 'No stocks found.' })}
                                </Alert>
                            </td>
                        </tr>
                    ) : (
                        stocks.map((stock, index) => (
                            <tr
                                key={stock.id}
                                className={cn(
                                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700',
                                    stock.isLowStock ? 'bg-red-50 dark:bg-red-900/50' : '',
                                    'hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors duration-200',
                                    stock.isFavorited ? 'border-l-4 border-yellow-400 dark:border-yellow-500' : ''
                                )}
                            >
                                <td className="px-4 py-3">
                                    <Checkbox
                                        checked={selectedItems.includes(stock.id)}
                                        onCheckedChange={() => handleSelectItem(stock.id)}
                                        aria-label={t('stocks:selectStockAriaLabel', {
                                            defaultValue: `Select stock ${stock.lotNo}`,
                                        })}
                                        className="border-indigo-500 text-indigo-600 focus:ring-indigo-500"
                                        disabled={isExporting}
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
                                    {stock.lotNo}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.mark ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.saleCode ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.grade ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.broker?.replace(/_/g, ' ') ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.invoiceNo ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {stock.bags}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {stock.weight.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.purchaseValue.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.totalPurchaseValue.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    {stock.agingDays ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.penalty.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.bgtCommission.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.maerskFee.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.commission.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.netPrice.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.total.toFixed(2)}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockTable;