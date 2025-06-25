"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { cleanParams } from "@/lib/utils";
import { FiltersState, setFilters } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { Broker, TeaGrade } from "@/state/enums";
import FiltersBar from "@/app/(dashboard)/admin/outLots/FiltersBar";
import OutLots from "@/app/(dashboard)/admin/outLots/OutLots";

const AdminOutLotsPage = () => {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const isFiltersFullOpen = useAppSelector((state) => state.global.isFiltersFullOpen);

    useEffect(() => {
        const initialFilters = Array.from(searchParams.entries()).reduce(
            (acc: Partial<FiltersState>, [key, value]) => {
                const validKeys: (keyof FiltersState)[] = [
                    "auction",
                    "lotNo",
                    "broker",
                    "sellingMark",
                    "grade",
                    "invoiceNo",
                    "bags",
                    "netWeight",
                    "totalWeight",
                    "baselinePrice",
                    "manufactureDate",
                    "adminCognitoId",
                    "search",
                ];

                if (validKeys.includes(key as keyof FiltersState)) {
                    const typedKey = key as keyof FiltersState;

                    if (["bags", "netWeight", "totalWeight", "baselinePrice"].includes(typedKey)) {
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                            acc[typedKey] = numValue as any;
                        }
                    } else if (typedKey === "grade" && (Object.values(TeaGrade).includes(value as TeaGrade) || value === "any")) {
                        acc.grade = value as TeaGrade | "any";
                    } else if (typedKey === "broker" && (Object.values(Broker).includes(value as Broker) || value === "any")) {
                        acc.broker = value as Broker | "any";
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
                    <OutLots />
                </div>
            </div>
        </div>
    );
};

export default AdminOutLotsPage;