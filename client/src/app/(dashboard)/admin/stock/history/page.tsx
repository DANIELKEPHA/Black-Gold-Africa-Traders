"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FiltersState, setFilters } from "@/state";
import { useGetStocksQuery } from "@/state/api";
import { format } from "date-fns";

// Assuming formatBrokerName is defined in your utils
const formatBrokerName = (broker: string | null) => (broker ? broker.replace(/_/g, " ") : null);

// Define filter fields for the assignment history
interface FilterField {
    key: keyof FiltersState;
    placeholder: string;
    options?: string[];
    type?: "text" | "select";
}

const StockAssignmentHistoryPage: React.FC = () => {
    const { t } = useTranslation(["stocks", "general"]);
    const dispatch = useDispatch();
    const filters = useSelector((state: any) => state.global.filters);
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, error } = useGetStocksQuery({
        ...filters,
        page,
        limit,
        assignmentStatus: "assigned", // Only show assigned stocks
    });

    const filterFields: FilterField[] = [
        {
            key: "lotNo",
            placeholder: "Lot Number",
            type: "text",
        },
        {
            key: "saleCode",
            placeholder: "Sale Code",
            type: "text",
        },
        {
            key: "user",
            placeholder: "User",
            type: "text",
        },
    ];

    const handleFilterChange = (key: keyof FiltersState, value: string | undefined) => {
        dispatch(setFilters({ [key]: value || undefined }));
    };

    const getInputValue = (key: keyof FiltersState): string => {
        return filters[key] ?? "";
    };

    useEffect(() => {
        if (error) {
            toast.error(
                t("stocks:errors.fetchAssignments", {
                    defaultValue: "Failed to fetch assignment history",
                }),
            );
        }
    }, [error, t]);

    return (
        <div className="container mx-auto p-6">
            <Toaster position="top-right" richColors />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                {t("stocks:assignmentHistory", { defaultValue: "Stock Assignment History" })}
            </h1>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    {filterFields.map(({ key, placeholder, type, options }) => (
                        <div key={key} className="flex flex-col w-60">
                            <Label className="font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {t(`stocks:${key}`, { defaultValue: placeholder })}
                            </Label>
                            {type === "select" ? (
                                <Select
                                    value={filters[key] ?? "any"}
                                    onValueChange={(value) =>
                                        handleFilterChange(key, value === "any" ? undefined : value)
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500">
                                        <SelectValue
                                            placeholder={t(`stocks:${placeholder}`, { defaultValue: placeholder })}
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-900 border-indigo-500">
                                        <SelectItem value="any">
                                            {t(`stocks:any${key.charAt(0).toUpperCase() + key.slice(1)}`, {
                                                defaultValue: `Any ${key}`,
                                            })}
                                        </SelectItem>
                                        {options?.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    type={type}
                                    placeholder={t(`stocks:${placeholder}`, { defaultValue: placeholder })}
                                    value={getInputValue(key)}
                                    onChange={(e) => handleFilterChange(key, e.target.value)}
                                    className="rounded-md border-indigo-500 dark:border-indigo-600 bg-white dark:bg-gray-900 focus:ring-indigo-500"
                                    disabled={isLoading}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 overflow-x-auto">
                {isLoading ? (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        {t("stocks:loading", { defaultValue: "Loading..." })}
                    </div>
                ) : data?.data.length ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("stocks:lotNo", { defaultValue: "Lot No" })}</TableHead>
                                    <TableHead>{t("stocks:mark", { defaultValue: "Mark" })}</TableHead>
                                    <TableHead>{t("stocks:grade", { defaultValue: "Grade" })}</TableHead>
                                    <TableHead>{t("stocks:broker", { defaultValue: "Broker" })}</TableHead>
                                    <TableHead>{t("stocks:saleCode", { defaultValue: "Sale Code" })}</TableHead>
                                    <TableHead>{t("stocks:bags", { defaultValue: "Bags" })}</TableHead>
                                    <TableHead>{t("stocks:weight", { defaultValue: "Weight" })}</TableHead>
                                    <TableHead>{t("stocks:purchaseValue", { defaultValue: "Purchase Value" })}</TableHead>
                                    <TableHead>{t("stocks:totalPurchaseValue", { defaultValue: "Total Purchase Value" })}</TableHead>
                                    <TableHead>{t("stocks:agingDays", { defaultValue: "Aging Days" })}</TableHead>
                                    <TableHead>{t("stocks:penalty", { defaultValue: "Penalty" })}</TableHead>
                                    <TableHead>{t("stocks:bgtCommission", { defaultValue: "BGT Commission" })}</TableHead>
                                    <TableHead>{t("stocks:maerskFee", { defaultValue: "Maersk Fee" })}</TableHead>
                                    <TableHead>{t("stocks:commission", { defaultValue: "Commission" })}</TableHead>
                                    <TableHead>{t("stocks:netPrice", { defaultValue: "Net Price" })}</TableHead>
                                    <TableHead>{t("stocks:total", { defaultValue: "Total" })}</TableHead>
                                    <TableHead>{t("stocks:invoiceNo", { defaultValue: "Invoice No" })}</TableHead>
                                    <TableHead>{t("stocks:assignedWeight", { defaultValue: "Assigned Weight" })}</TableHead>
                                    <TableHead>{t("stocks:assignedAt", { defaultValue: "Assigned At" })}</TableHead>
                                    <TableHead>{t("stocks:user", { defaultValue: "Assigned To" })}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.data.map((stock) =>
                                    stock.assignments.map((assignment) => (
                                        <TableRow key={`${stock.id}-${assignment.userCognitoId}`}>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.lotNo}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.mark ?? "N/A"}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.grade ?? "N/A"}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{formatBrokerName(stock.broker) ?? "N/A"}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.saleCode ?? "N/A"}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.bags}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.weight.toFixed(2)} kg</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.purchaseValue.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.totalPurchaseValue.toFixed(2)}</TableCell>
                                            <TableCell className="text-red-600 dark:text-red-800">{stock.agingDays}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.penalty.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.bgtCommission.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.maerskFee.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.commission.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.netPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">${stock.total.toFixed(2)}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{stock.invoiceNo ?? "N/A"}</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">{assignment.assignedWeight.toFixed(2)} kg</TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">
                                                {assignment.assignedAt
                                                    ? format(new Date(assignment.assignedAt), "PPp")
                                                    : t("stocks:notAvailable", { defaultValue: "N/A" })}
                                            </TableCell>
                                            <TableCell className="text-gray-800 dark:text-gray-200">
                                                {assignment.user?.name ||
                                                    assignment.user?.email ||
                                                    assignment.userCognitoId ||
                                                    t("stocks:notAvailable", { defaultValue: "N/A" })}
                                            </TableCell>
                                        </TableRow>
                                    )),
                                )}
                            </TableBody>
                        </Table>
                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-4">
                            <div className="text-gray-600 dark:text-gray-400">
                                {t("stocks:showing", {
                                    defaultValue: "Showing {{start}} to {{end}} of {{total}}",
                                    start: (page - 1) * limit + 1,
                                    end: Math.min(page * limit, data?.meta.total || 0),
                                    total: data?.meta.total || 0,
                                })}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={page === 1 || isLoading}
                                    aria-label={t("stocks:previousPage", { defaultValue: "Previous Page" })}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= (data?.meta.totalPages || 1) || isLoading}
                                    aria-label={t("stocks:nextPage", { defaultValue: "Next Page" })}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        {t("stocks:noAssignments", { defaultValue: "No assignments found" })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockAssignmentHistoryPage;