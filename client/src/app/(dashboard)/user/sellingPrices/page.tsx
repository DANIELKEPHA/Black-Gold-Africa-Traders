"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters, setViewMode, toggleFiltersFullOpen } from "@/state";
import { useGetAuthUserQuery } from "@/state/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { List, Grid } from "lucide-react";
import FiltersBar from "@/app/(dashboard)/user/sellingPrices/FiltersBar";
import SellingPrices from "@/app/(dashboard)/user/sellingPrices/SellingPrices";

const UserSellingPricesPage = () => {
    const { t } = useTranslation("sellingPrices");
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const isFiltersFullOpen = useAppSelector((state) => state.global.isFiltersFullOpen);
    const filters = useAppSelector((state) => state.global.filters);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();

    useEffect(() => {
        if (authLoading) return;
        if (authError || !authUser?.cognitoInfo?.userId) {
            toast.error(t("errors.unauthorized"), {
                description: t("errors.unauthorizedDesc"),
            });
            router.replace("/login");
        }
    }, [authUser, authLoading, authError, router, t]);

    const numberKeys = ["bags", "netWeight", "totalWeight", "askingPrice", "purchasePrice", "reprint"] as const;
    const stringKeys = [
        "lotNo",
        "sellingMark",
        "country",
        "manufactureDate",
        "invoiceNo",
        "saleCode",
        "search",
        "category",
        "grade",
        "broker",
    ] as const;

    type NumberKey = typeof numberKeys[number];
    type StringKey = typeof stringKeys[number];

    const isNumberKey = (key: string): key is NumberKey => numberKeys.includes(key as NumberKey);
    const isStringKey = (key: string): key is StringKey => stringKeys.includes(key as StringKey);

    useEffect(() => {
        const initialFilters = Array.from(searchParams.entries()).reduce(
            (acc, [key, value]) => {
                if (isNumberKey(key)) {
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                        acc[key] = numValue;
                    }
                } else if (isStringKey(key) && value !== "") {
                    acc[key] = value;
                }
                return acc;
            },
            {} as Record<NumberKey | StringKey, string | number>
        );

        dispatch(setFilters(cleanParams(initialFilters as Partial<FiltersState>)));
    }, [searchParams, dispatch]);

    const toggleViewMode = () => {
        dispatch(setViewMode(viewMode === "list" ? "grid" : "list"));
    };

    if (authLoading) return <Loading />;
    if (authError || !authUser?.cognitoInfo?.userId) return null;

    return (
        <div
            className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col bg-gray-50 dark:bg-gray-900"
            style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
        >
            <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm z-10 mb-4">
                <FiltersBar />
            </div>
            <div className="flex-1 overflow-x-auto">
                <SellingPrices selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
            </div>
        </div>
    );
};

export default UserSellingPricesPage;