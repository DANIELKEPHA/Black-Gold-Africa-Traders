'use client';

import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { debounce } from 'lodash';
import { cleanParams } from '@/lib/utils';
import { FiltersState, setFilters } from '@/state';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Broker, TeaGrade } from '@/state/enums';

interface FilterOptions {
    grades?: TeaGrade[];
    brokers?: Broker[];
    bags?: { min: number; max: number };
    weight?: { min: number; max: number };
    purchaseValue?: { min: number; max: number };
    totalPurchaseValue?: { min: number; max: number };
    agingDays?: { min: number; max: number };
    penalty?: { min: number; max: number };
    bgtCommission?: { min: number; max: number };
    maerskFee?: { min: number; max: number };
    commission?: { min: number; max: number };
    netPrice?: { min: number; max: number };
    total?: { min: number; max: number };
    lowStockThreshold?: { min: number; max: number };
}

export const useStockFilters = () => {
    const { t } = useTranslation(['stocks', 'general']);
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const filters = useSelector((state: any) => state.global.filters) as FiltersState;
    const [localFilters, setLocalFilters] = useState<FiltersState>({ ...filters });
    const [errors, setErrors] = useState<Partial<Record<keyof FiltersState, string>>>({});

    const filterOptions: FilterOptions = {
        grades: Object.values(TeaGrade),
        brokers: Object.values(Broker),
        bags: { min: 1, max: 1000 },
        weight: { min: 0, max: 100000 },
        purchaseValue: { min: 0, max: 10000 },
        totalPurchaseValue: { min: 0, max: 1000000 },
        agingDays: { min: 0, max: 365 },
        penalty: { min: 0, max: 1000 },
        bgtCommission: { min: 0, max: 1000 },
        maerskFee: { min: 0, max: 1000 },
        commission: { min: 0, max: 1000 },
        netPrice: { min: 0, max: 10000 },
        total: { min: 0, max: 1000000 },
        lowStockThreshold: { min: 0, max: 10000 },
    };
    const isFilterOptionsLoading = false;

    const updateURL = useCallback(
        (newFilters: FiltersState) => {
            const debouncedUpdate = debounce((filters: FiltersState) => {
                const cleanFilters = cleanParams({
                    ...filters,
                    saleCode: filters.saleCode === 'any' ? undefined : filters.saleCode,
                    grade: filters.grade === 'any' ? undefined : filters.grade,
                    broker: filters.broker === 'any' ? undefined : filters.broker,
                    manufactureDate: filters.manufactureDate === '' ? undefined : filters.manufactureDate,
                });
                const updatedSearchParams = new URLSearchParams();
                Object.entries(cleanFilters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        updatedSearchParams.set(key, value.toString());
                    }
                });
                router.push(`${pathname}?${updatedSearchParams.toString()}`);
            }, 300);
            debouncedUpdate(newFilters);
        },
        [pathname, router]
    );

    const validateFilter = (key: keyof FiltersState, value: any): string | undefined => {
        if (
            [
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
                'lowStockThreshold',
            ].includes(key)
        ) {
            const num = parseFloat(value);
            if (value && isNaN(num)) return t('stocks:errors.invalidNumber', { defaultValue: 'Invalid number' });
            if (key === 'bags' && num < 1) return t('stocks:errors.bagsTooLow', { defaultValue: 'Bags must be at least 1' });
            if (['weight', 'lowStockThreshold'].includes(key) && num < 0)
                return t('stocks:errors.negativeValue', { defaultValue: 'Value cannot be negative' });
        }
        return undefined;
    };

    const handleFilterChange = (key: keyof FiltersState, value: string) => {
        let newValue: FiltersState[typeof key];
        if (value === '' || value === 'any') {
            newValue = ['saleCode', 'grade', 'broker'].includes(key) ? 'any' : undefined;
        } else if (
            [
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
                'lowStockThreshold',
            ].includes(key)
        ) {
            const num = parseFloat(value);
            newValue = isNaN(num) ? undefined : num;
        } else {
            newValue = value;
        }
        setLocalFilters((prev) => ({ ...prev, [key]: newValue }));
        setErrors((prev) => ({ ...prev, [key]: validateFilter(key, value) }));
        dispatch(setFilters({ ...filters, [key]: newValue }));
        updateURL({ ...filters, [key]: newValue });
    };

    const handleSubmit = () => {
        if (Object.values(errors).some((error) => error)) {
            toast.error(t('stocks:errors.invalidFilters', { defaultValue: 'Invalid filter values' }));
            return;
        }
        dispatch(setFilters(localFilters));
        updateURL(localFilters);
        toast.success(t('stocks:filterApplied', { defaultValue: 'Filters applied successfully' }));
    };

    const handleReset = () => {
        setLocalFilters({} as FiltersState);
        dispatch(setFilters({} as FiltersState));
        updateURL({} as FiltersState);
        setErrors({});
        toast.info(t('stocks:filtersReset', { defaultValue: 'Filters reset' }));
    };

    return {
        filters,
        localFilters,
        errors,
        filterOptions,
        isFilterOptionsLoading,
        handleFilterChange,
        handleSubmit,
        handleReset,
        formatDate: (date?: string) => (date ? new Date(date).toISOString().slice(0, 10) : ''),
    };
};