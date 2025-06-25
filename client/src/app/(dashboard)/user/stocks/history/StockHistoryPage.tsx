// 'use client';
//
// import { NAVBAR_HEIGHT } from '@/lib/constants';
// import { useSearchParams } from 'next/navigation';
// import React, { useEffect, useState, useCallback } from 'react';
// import { cleanParams } from '@/lib/utils';
// import { FiltersState, setFilters } from '@/state';
// import { useAppDispatch, useAppSelector } from '@/state/redux';
// import { useTranslation } from 'react-i18next';
// import { useGetAuthUserQuery, useGetUserStockHistoryQuery } from '@/state/api';
// import Loading from '@/components/Loading';
// import { StockData, StockHistory } from '@/state/stock';
// import { Broker, TeaGrade } from '@/state/enums';
// import Link from 'next/link';
// import {toast, Toaster} from 'sonner';
// import FiltersBar from "@/app/(dashboard)/user/stocks/FiltersBar";
// import StocksActions from "@/app/(dashboard)/user/stocks/StocksActions";
// import StockTable from "@/app/(dashboard)/user/stocks/StockTable";
// import StockGrid from "@/app/(dashboard)/user/stocks/StockGrid";
// import {Button} from "@/components/ui/button";
//
// const StockHistoryPage = () => {
//     const { t } = useTranslation(['stocks', 'general']);
//     const searchParams = useSearchParams();
//     const dispatch = useAppDispatch();
//     const isFiltersFullOpen = useAppSelector((state) => state.global.isFiltersFullOpen);
//     const viewMode = useAppSelector((state) => state.global.viewMode);
//     const filters = useAppSelector((state) => state.global.filters);
//     const { data: authData, isLoading: isAuthLoading, isError: authError } = useGetAuthUserQuery();
//     const userCognitoId = authData?.cognitoInfo?.userId;
//     const [selectedItems, setSelectedItems] = useState<number[]>([]);
//     const [page, setPage] = useState(1);
//     const limit = 20;
//
//     useEffect(() => {
//         const initialFilters = Array.from(searchParams.entries()).reduce(
//             (acc: Partial<FiltersState>, [key, value]) => {
//                 const validKeys: (keyof FiltersState)[] = [
//                     'lotNo',
//                     'grade',
//                     'broker',
//                     'saleCode',
//                     'search',
//                     'sortBy',
//                     'sortOrder',
//                 ];
//
//                 if (validKeys.includes(key as keyof FiltersState)) {
//                     const typedKey = key as keyof FiltersState;
//
//                     if (typedKey === 'grade' && (Object.values(TeaGrade).includes(value as TeaGrade) || value === 'any')) {
//                         acc.grade = value as TeaGrade | 'any';
//                     } else if (typedKey === 'broker' && (Object.values(Broker).includes(value as Broker) || value === 'any')) {
//                         acc.broker = value as Broker | 'any';
//                     } else if (typedKey === 'sortBy' && ['assignedAt', 'stocksId', 'assignedWeight'].includes(value)) {
//                         acc.sortBy = value as any;
//                     } else if (typedKey === 'sortOrder' && ['asc', 'desc'].includes(value)) {
//                         acc.sortOrder = value as any;
//                     } else if (value !== '') {
//                         acc[typedKey] = value as any;
//                     }
//                 }
//                 return acc;
//             },
//             {} as Partial<FiltersState>,
//         );
//
//         dispatch(setFilters(cleanParams(initialFilters)));
//     }, [searchParams, dispatch]);
//
//     const { data: stockHistoryResponse, isLoading, error } = useGetUserStockHistoryQuery(
//         {
//             userCognitoId: userCognitoId || '',
//             page,
//             limit,
//             search: filters.search,
//             sortBy: (filters.sortBy as 'assignedAt' | 'stocksId' | 'assignedWeight') || 'assignedAt',
//             sortOrder: (filters.sortOrder as 'asc' | 'desc') || 'desc',
//             // grade: filters.grade === 'any' ? undefined : filters.grade as TeaGrade,
//             // broker: filters.broker === 'any' ? undefined : filters.broker as Broker,
//         },
//         { skip: !userCognitoId },
//     );
//
//     const stocksData: StockData[] =
//         stockHistoryResponse?.data.data.map((entry: StockHistory) => ({
//             id: entry.stocksId,
//             saleCode: entry.details.saleCode,
//             broker: entry.details.broker as Broker,
//             lotNo: entry.details.lotNo,
//             mark: entry.details.mark,
//             grade: entry.details.grade as TeaGrade,
//             invoiceNo: entry.details.invoiceNo,
//             bags: entry.details.bags,
//             weight: entry.details.assignedWeight ?? entry.details.weight,
//             purchaseValue: entry.details.purchaseValue,
//             batchNumber: entry.details.batchNumber,
//             lowStockThreshold: entry.details.lowStockThreshold,
//             isLowStock:
//                 entry.details.lowStockThreshold != null &&
//                 (entry.details.assignedWeight ?? entry.details.weight) < entry.details.lowStockThreshold,
//             isFavorited: authData?.userInfo?.favoritedStocks?.some((fav: Stock) => fav.id === entry.stocksId) || false,
//             assignedWeight: entry.details.assignedWeight,
//             createdAt: entry.details.createdAt,
//             updatedAt: entry.details.updatedAt,
//         })) || [];
//
//     const totalPages = stockHistoryResponse?.data.meta.totalPages || 1;
//
//     const handleSelectItem = useCallback(
//         (itemId: number) => {
//             setSelectedItems((prev) =>
//                 prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
//             );
//         },
//         [],
//     );
//
//     const handleSelectAll = useCallback(() => {
//         if (stocksData.length === 0) {
//             setSelectedItems([]);
//             return;
//         }
//         if (selectedItems.length === stocksData.length) {
//             setSelectedItems([]);
//         } else {
//             setSelectedItems(stocksData.map((item) => item.id));
//         }
//     }, [stocksData, selectedItems.length]);
//
//     const handleFavoriteToggle = async (stockId: number, isFavorited: boolean) => {
//         if (!userCognitoId) {
//             toast.error(t('stocks:errors.noUser', { defaultValue: 'User not authenticated' }));
//             return;
//         }
//         try {
//             await toggleFavorite({ userCognitoId, stockId }).unwrap();
//             toast.success(
//                 isFavorited
//                     ? t('stocks:success.favoriteRemoved', { defaultValue: 'Stock removed from favorites' })
//                     : t('stocks:success.favoriteAdded', { defaultValue: 'Stock added to favorites' }),
//             );
//         } catch (err) {
//             toast.error(t('stocks:errors.favoriteError', { defaultValue: 'Failed to toggle favorite' }));
//         }
//     };
//
//     const handleExportCsv = async () => {
//         try {
//             if (!stocksData || stocksData.length === 0) {
//                 throw new Error('No stock data to export');
//             }
//             const ids = selectedItems.length > 0 ? selectedItems : stocksData.map((item) => item.id);
//             if (ids.length === 0) {
//                 toast.error(t('stocks:errors.noItems', { defaultValue: 'No stocks available to export' }));
//                 return;
//             }
//             const csvData = [
//                 [
//                     'id',
//                     'saleCode',
//                     'broker',
//                     'lotNo',
//                     'mark',
//                     'grade',
//                     'invoiceNo',
//                     'bags',
//                     'weight',
//                     'purchaseValue',
//                     'batchNumber',
//                     'lowStockThreshold',
//                 ],
//                 ...stocksData
//                     .filter((stock) => ids.includes(stock.id))
//                     .map((stock) => [
//                         stock.id,
//                         stock.saleCode,
//                         stock.broker,
//                         stock.lotNo,
//                         stock.mark,
//                         stock.grade,
//                         stock.invoiceNo,
//                         stock.bags,
//                         stock.weight,
//                         stock.purchaseValue,
//                         stock.batchNumber || '',
//                         stock.lowStockThreshold != null ? stock.lowStockThreshold : '',
//                     ]),
//             ];
//             const csvContent = csvData.map((row) => row.join(',')).join('\n');
//             const blob = new Blob([csvContent], { type: 'text/csv' });
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement('a');
//             a.href = url;
//             a.download = 'stock_history_export.csv';
//             a.click();
//             window.URL.revokeObjectURL(url);
//             toast.success(t('stocks:success.csvDownloaded', { defaultValue: 'CSV downloaded successfully' }));
//         } catch (error: any) {
//             toast.error(t('stocks:errors.csvError', { defaultValue: 'Failed to export CSV' }));
//         }
//     };
//
//     const handleUploadCsv = async (file: File, duplicateAction: 'skip' | 'replace') => {
//         toast.error(t('stocks:errors.uploadNotImplemented', { defaultValue: 'CSV upload not implemented' }));
//     };
//
//     const handleAdjustStock = async (stockId: number, weight: number, reason: string) => {
//         toast.error(t('stocks:errors.adjustNotImplemented', { defaultValue: 'Stock adjustment not implemented' }));
//     };
//
//     const handleAssignStock = async (stockId: number, userCognitoId: string, assignedWeight: number) => {
//         toast.error(t('stocks:errors.assignNotImplemented', { defaultValue: 'Stock assignment not implemented' }));
//     };
//
//     if (isAuthLoading || isLoading) return <Loading />;
//     if (authError || error)
//         return <div className='text-red-500 p-4'>{t('stocks:errors.error', { defaultValue: 'Error' })}: {JSON.stringify(error)}</div>;
//
//     return (
//         <div
//             className='w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col bg-gray-50 dark:bg-gray-900'
//             style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
//         >
//             <Toaster position='top-right' richColors />
//             <div className='sticky top-0 z-10'>
//                 <div className='flex justify-between items-center mb-4'>
//                     <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
//                         {t('stocks:stockHistoryTitle', { defaultValue: 'Stock Assignment History' })}
//                     </h1>
//                     <Link href='/user/stocks' className='text-blue-600 hover:underline'>
//                         {t('stocks:viewCurrentStocks', { defaultValue: 'View Current Stocks' })}
//                     </Link>
//                 </div>
//                 <FiltersBar />
//             </div>
//             <div className='flex flex-1 gap-4 mt-4'>
//                 <div className='flex-1 overflow-x-auto'>
//                     <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
//                         <StocksActions
//                             stocks={stocksData}
//                             authUser={authData}
//                             selectedItems={selectedItems}
//                             handleSelectAll={handleSelectAll}
//                             handleSelectStock={handleSelectItem}
//                             handleFavoriteToggle={handleFavoriteToggle}
//                             handleExportCsv={handleExportCsv}
//                             handleUploadCsv={handleUploadCsv}
//                             handleAdjustStock={handleAdjustStock}
//                             handleAssignStock={handleAssignStock}
//                             viewMode={viewMode}
//                             loading={isLoading}
//                             isCreatingFavorite={false}
//                             isDeletingFavorite={false}
//                         />
//                         {viewMode === 'list' ? (
//                             <StockTable
//                                 stocks={stocksData}
//                                 authUser={authData}
//                                 selectedItems={selectedItems}
//                                 handleSelectItem={handleSelectItem}
//                                 handleSelectAll={handleSelectAll}
//                                 viewMode={viewMode}
//                                 loading={isLoading}
//                                 isCreatingFavorite={false}
//                                 isDeletingFavorite={false}
//                                 handleFavoriteToggle={handleFavoriteToggle}
//                                 handleExportCsv={handleExportCsv}
//                                 handleUploadCsv={handleUploadCsv}
//                                 handleAdjustStock={handleAdjustStock}
//                                 handleAssignStock={handleAssignStock}
//                             />
//                         ) : (
//                             <StockGrid
//                                 stocks={stocksData}
//                                 authUser={authData}
//                                 selectedItems={selectedItems}
//                                 handleSelectItem={handleSelectItem}
//                                 handleSelectAll={handleSelectAll}
//                                 viewMode={viewMode}
//                                 loading={isLoading}
//                                 isCreatingFavorite={false}
//                                 isDeletingFavorite={false}
//                                 handleFavoriteToggle={handleFavoriteToggle}
//                                 handleExportCsv={handleExportCsv}
//                                 handleUploadCsv={handleUploadCsv}
//                                 handleAdjustStock={handleAdjustStock}
//                                 handleAssignStock={handleAssignStock}
//                             />
//                         )}
//                         {totalPages > 1 && (
//                             <div className='mt-6 flex justify-between items-center'>
//                                 <Button
//                                     disabled={page === 1 || isLoading}
//                                     onClick={() => setPage((prev) => prev - 1)}
//                                     className='rounded-lg bg-indigo-600 text-white hover:bg-indigo-700'
//                                 >
//                                     {t('general:pagination:previous', { defaultValue: 'Previous' })}
//                                 </Button>
//                                 <span className='text-gray-700 dark:text-gray-200'>
//                                     {t('general:pagination:page', { defaultValue: 'Page {page} of {totalPages}', page, totalPages })}
//                                 </span>
//                                 <Button
//                                     disabled={page >= totalPages || isLoading}
//                                     onClick={() => setPage((prev) => prev + 1)}
//                                     className='rounded-lg bg-indigo-600 text-white hover:bg-indigo-700'
//                                 >
//                                     {t('general:pagination:next', { defaultValue: 'Next' })}
//                                 </Button>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default StockHistoryPage;