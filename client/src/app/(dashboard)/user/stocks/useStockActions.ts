'use client';

import { toast } from 'sonner';
import { StocksResponse } from '@/state';

export const useStockActions = () => {
    const handleExportCsv = async (stocks?: StocksResponse[]) => {
        try {
            if (!stocks || stocks.length === 0) {
                throw new Error('No stock data to export');
            }
            console.log('Exporting stocks:', stocks.length);
            const csvData = [
                [
                    'id',
                    'saleCode',
                    'broker',
                    'lotNo',
                    'mark',
                    'grade',
                    'invoiceNo',
                    'bags',
                    'weight',
                    'purchaseValue',
                    'totalPurchaseValue',
                    'agingDays',
                    'penalty',
                    'bgtCommission',
                    'maerskFee',
                    'commission',
                    'netPrice',
                    'total',
                    'batchNumber',
                    'lowStockThreshold',
                    'adminCognitoId',
                ],
                ...stocks.map((stock) => [
                    stock.id,
                    stock.saleCode,
                    stock.broker,
                    stock.lotNo,
                    stock.mark || '',
                    stock.grade,
                    stock.invoiceNo || '',
                    stock.bags,
                    stock.weight,
                    stock.purchaseValue,
                    stock.totalPurchaseValue,
                    stock.agingDays,
                    stock.penalty,
                    stock.bgtCommission,
                    stock.maerskFee,
                    stock.commission,
                    stock.netPrice,
                    stock.total,
                    stock.batchNumber || '',
                    stock.lowStockThreshold != null ? stock.lowStockThreshold : '',
                    stock.adminCognitoId,
                ]),
            ];
            const csvContent = csvData.map((row) => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'stocks_export.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Stocks exported successfully');
            console.log('CSV exported successfully');
            return true;
        } catch (error: any) {
            console.error('Failed to export CSV:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            toast.error('Failed to export CSV: ' + (error.message || 'Unknown error'));
            return error;
        }
    };

    return {
        handleExportCsv,
    };
};