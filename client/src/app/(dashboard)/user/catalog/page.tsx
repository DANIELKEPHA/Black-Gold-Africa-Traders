"use client"

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters } from "@/state";
import { useAppDispatch } from "@/state/redux";
import FiltersBar from "@/app/(dashboard)/user/catalog/FiltersBar";
import Catalog from "@/app/(dashboard)/user/catalog/Catalog";

const UserCatalogPage = () => {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initialFilters = Array.from(searchParams.entries()).reduce(
            (acc: Partial<FiltersState>, [key, value]) => {
                const validKeys: (keyof FiltersState)[] = [
                    "lotNo",
                    "sellingMark",
                    "producerCountry",
                    "manufactureDate",
                    "saleCode",
                    "category",
                    "grade",
                    "broker",
                    "invoiceNo",
                    "search",
                ];

                if (validKeys.includes(key as keyof FiltersState)) {
                    acc[key as keyof FiltersState] = value as any;
                }
                return acc;
            },
            {} as Partial<FiltersState>
        );

        dispatch(setFilters(cleanParams(initialFilters)));
    }, [searchParams, dispatch]);

    return (
        <div
            className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col bg-gray-50 dark:bg-gray-900"
            style={{ minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
        >
            <div className="sticky top-0 z-10">
                <FiltersBar />
            </div>
            <div className="flex flex-1 gap-4 mt-4">
                <div className="flex-1 overflow-x-auto">
                    <Catalog />
                </div>
            </div>
        </div>
    );
};

export default UserCatalogPage;