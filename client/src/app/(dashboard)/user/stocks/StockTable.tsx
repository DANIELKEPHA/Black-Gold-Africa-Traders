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
                                                   }) => {
    const { t } = useTranslation(['stocks', 'general']);

    return (
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[50px]">
                            {t('stocks:select', { defaultValue: 'Select' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:lotNo', { defaultValue: 'Lot No' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:mark', { defaultValue: 'Mark' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:saleCode', { defaultValue: 'Sale Code' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[80px]">
                            {t('stocks:grade', { defaultValue: 'Grade' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:broker', { defaultValue: 'Broker' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:invoiceNo', { defaultValue: 'Invoice No' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[60px]">
                            {t('stocks:bags', { defaultValue: 'Bags' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[80px]">
                            {t('stocks:weight', { defaultValue: 'Weight (kg)' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:purchaseValue', { defaultValue: 'Purchase Value' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[120px]">
                            {t('stocks:totalPurchaseValue', { defaultValue: 'Total Purchase Value' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[80px]">
                            {t('stocks:agingDays', { defaultValue: 'Aging Days' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[80px]">
                            {t('stocks:penalty', { defaultValue: 'Penalty' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:bgtCommission', { defaultValue: 'BGT Commission' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:maerskFee', { defaultValue: 'Maersk Fee' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:commission', { defaultValue: 'Commission' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:netPrice', { defaultValue: 'Net Price' })}
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                            {t('stocks:total', { defaultValue: 'Total' })}
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {Array.from({ length: 18 }).map((_, j) => (
                                    <td key={j} className="px-2 py-2">
                                        <Skeleton className="h-4 w-full" />
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : stocks.length === 0 ? (
                        <tr>
                            <td colSpan={18} className="px-2 py-2 text-center">
                                <Alert
                                    variant="default"
                                    className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
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
                                    index % 2 === 0
                                        ? 'bg-white dark:bg-gray-800'
                                        : 'bg-gray-50 dark:bg-gray-700',
                                    'hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
                                )}
                            >
                                <td className="px-2 py-2">
                                    <Checkbox
                                        checked={selectedItems.includes(stock.id)}
                                        onCheckedChange={() => handleSelectItem(stock.id)}
                                        aria-label={t('stocks:selectStockAriaLabel', {
                                            defaultValue: `Select stock ${stock.lotNo}`,
                                        })}
                                    />
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.lotNo}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.mark ?? '-'}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.saleCode ?? '-'}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.grade ?? '-'}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.broker ?? '-'}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {stock.invoiceNo ?? '-'}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    {stock.bags}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    {stock.weight.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.purchaseValue.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.totalPurchaseValue.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    {stock.agingDays ?? '-'}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.penalty.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.bgtCommission.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.maerskFee.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.commission.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
                                    ${stock.netPrice.toFixed(2)}
                                </td>
                                <td className="px-2 py-2 text-sm text-gray-900 dark:text-gray-100">
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