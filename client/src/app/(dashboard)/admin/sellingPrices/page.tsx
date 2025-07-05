"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters } from "@/state";
import { useAppDispatch } from "@/state/redux";
import FiltersBar from "@/app/(dashboard)/admin/sellingPrices/FiltersBar";
import SellingPrices from "@/app/(dashboard)/admin/sellingPrices/SellingPrice";

const AdminSellingPricesPage = () => {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initialFilters = Array.from(searchParams.entries()).reduce(
            (acc: Partial<FiltersState>, [key, value]) => {
                const validKeys: (keyof FiltersState)[] = [
                    "lotNo",
                    "sellingMark",
                    "grade",
                    "invoiceNo",
                    "broker",
                    "bags",
                    "netWeight",
                    "totalWeight",
                    "askingPrice",
                    "purchasePrice",
                    "producerCountry",
                    "manufactureDate",
                    "saleCode",
                    "category",
                    "reprint",
                    "search",
                ];

                if (validKeys.includes(key as keyof FiltersState)) {
                    const typedKey = key as keyof FiltersState;

                    if (["bags", "netWeight", "totalWeight", "askingPrice", "purchasePrice"].includes(typedKey)) {
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                            acc[typedKey] = numValue as any;
                        }
                    } else if (["category", "grade", "broker"].includes(typedKey) && (value === "any" || value)) {
                        acc[typedKey] = value as any;
                    } else if (value !== "") {
                        acc[typedKey] = value as any;
                    }
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
                    <SellingPrices />
                </div>
            </div>
        </div>
    );
};

export default AdminSellingPricesPage;