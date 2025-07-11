'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'sonner';
import { useGetAuthUserQuery, useGetUserStockHistoryQuery, useExportStocksXlsxMutation } from '@/state/api';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import Loading from '@/components/Loading';
import { Broker, TeaGrade } from '@/state/enums';
import { UserStockHistoryEntry } from '@/state/stock';

interface StockDetailsProps {
    params: { id: string };
}

const StockDetails: React.FC<StockDetailsProps> = ({ params }) => {
    const { t } = useTranslation(['stocks', 'general']);
    const router = useRouter();
    const { data: authData, isLoading, isError } = useGetAuthUserQuery();
    const userCognitoId = authData?.cognitoInfo?.userId;
    const { data: stockHistoryResponse, isLoading: isStockLoading, error } = useGetUserStockHistoryQuery(
        {
            userCognitoId: userCognitoId || '',
            search: params.id,
        },
        { skip: !userCognitoId },
    );
    const [exportStocksXlsx, { isLoading: isExporting }] = useExportStocksXlsxMutation();

    const stock: UserStockHistoryEntry | undefined = stockHistoryResponse?.data.find(
        (entry) => entry.details.lotNo === params.id
    );

    const handleDownload = async () => {
        try {
            if (!stock) {
                toast.error(t('stocks:errors.noItems', { defaultValue: 'No stock data to export' }));
                return;
            }
            await exportStocksXlsx({ stockIds: [stock.stocksId] }).unwrap();
            toast.success(t('stocks:success.csvDownloaded', { defaultValue: 'Excel downloaded successfully' }));
        } catch (err: any) {
            toast.error(t('stocks:errors.excelError', { defaultValue: 'Failed to export Excel' }));
        }
    };

    if (isStockLoading || isLoading) return <Loading />;
    if (error || isError || !stock)
        return <div className='text-red-500 p-4'>{t('stocks:errors.error', { defaultValue: 'Error' })}</div>;

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-8'>
            <Toaster />
            <div className='max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8'>
                <h2 className='text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6'>
                    {t('stocks:stockDetails', { defaultValue: 'Stock Details' })}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <p className='font-semibold'>{t('stocks:lotNo', { defaultValue: 'Lot Number' })}:</p>
                        <p>{stock.details.lotNo}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:mark', { defaultValue: 'Mark' })}:</p>
                        <p>{stock.details.mark || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:grade', { defaultValue: 'Grade' })}:</p>
                        <p>{stock.details.grade || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:invoiceNo', { defaultValue: 'Invoice Number' })}:</p>
                        <p>{stock.details.invoiceNo || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:saleCode', { defaultValue: 'Sale Code' })}:</p>
                        <p>{stock.details.saleCode || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:bags', { defaultValue: 'Bags' })}:</p>
                        <p>{stock.details.bags}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:weight', { defaultValue: 'Weight' })}:</p>
                        <p>{(stock.details.assignedWeight ?? stock.details.weight).toFixed(2)} kg</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:purchaseValue', { defaultValue: 'Purchase Value' })}:</p>
                        <p>${stock.details.purchaseValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:totalPurchaseValue', { defaultValue: 'Total Purchase Value' })}:</p>
                        <p>${stock.details.totalPurchaseValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:agingDays', { defaultValue: 'Aging Days' })}:</p>
                        <p>{stock.details.agingDays}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:penalty', { defaultValue: 'Penalty' })}:</p>
                        <p>${stock.details.penalty.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:bgtCommission', { defaultValue: 'BGT Commission' })}:</p>
                        <p>${stock.details.bgtCommission.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:maerskFee', { defaultValue: 'Maersk Fee' })}:</p>
                        <p>${stock.details.maerskFee.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:commission', { defaultValue: 'Commission' })}:</p>
                        <p>${stock.details.commission.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:netPrice', { defaultValue: 'Net Price' })}:</p>
                        <p>${stock.details.netPrice.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:total', { defaultValue: 'Total' })}:</p>
                        <p>${stock.details.total.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:batchNumber', { defaultValue: 'Batch Number' })}:</p>
                        <p>{stock.details.batchNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <p className='font-semibold'>{t('stocks:lowStockThreshold', { defaultValue: 'Low Stock Threshold' })}:</p>
                        <p>{stock.details.lowStockThreshold != null ? stock.details.lowStockThreshold.toFixed(2) : 'N/A'} kg</p>
                    </div>
                </div>
                <div className='mt-6 flex justify-between'>
                    <Button
                        variant='outline'
                        onClick={() => router.push('/dashboard/stock')}
                        className='rounded-sm px-6 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    >
                        {t('general:actions.back', { defaultValue: 'Back' })}
                    </Button>
                    <div className='space-x-2'>
                        <Button
                            onClick={handleDownload}
                            disabled={isExporting}
                            className='rounded-sm px-6 bg-blue-600 hover:bg-blue-700 text-white'
                        >
                            {isExporting ? (
                                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                            ) : (
                                <Download className='w-4 h-4 mr-2' />
                            )}
                            {t('stocks:actions.download', { defaultValue: 'Download' })}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDetails;