"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { formatBrokerName } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetLoggedInUsersQuery, useBulkAssignStocksMutation } from "@/state/api";
import { Checkbox } from "@/components/ui/checkbox";
import {StocksResponse} from "@/state";

export interface StocksGridProps {
    stocksData: StocksResponse[];
    selectedItems: number[];
    handleSelectItem: (itemId: number) => void;
    handleDelete: (id: number) => Promise<void>;
    isDeleting: Record<number, boolean>;
}

const StockGrid: React.FC<StocksGridProps> = ({
                                                  stocksData,
                                                  selectedItems,
                                                  handleSelectItem,
                                                  handleDelete,
                                                  isDeleting,
                                              }) => {
    const { t } = useTranslation(["stocks", "general"]);
    const router = useRouter();
    const { data: authUser } = useGetAuthUserQuery();
    const isAdmin = authUser?.userRole === "admin";
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedUserCognitoId, setSelectedUserCognitoId] = useState<string>("");
    const [bulkAssignStocks] = useBulkAssignStocksMutation();

    const { data: usersResponse, isLoading: usersLoading } = useGetLoggedInUsersQuery({
        page: 1,
        limit: 100,
        includeAssignedStocks: false,
        includeShipments: false,
        includeFavoritedStocks: false,
    });

    const handleCardClick = (stockId: number) => {
        router.push(`/admin/stocks/${stockId}`);
    };

    const handleBulkAssign = async () => {
        if (!authUser || authUser.userRole.toLowerCase() !== "admin") {
            setErrorMessage(t("stocks:errors.adminOnly", { defaultValue: "Only admins can assign stocks." }));
            return;
        }
        if (!selectedUserCognitoId) {
            setErrorMessage(t("stocks:errors.selectUser", { defaultValue: "Please select a user." }));
            return;
        }
        if (!selectedItems.length) {
            setErrorMessage(t("stocks:errors.selectStock", { defaultValue: "Please select at least one stock." }));
            return;
        }

        const payload = {
            userCognitoId: selectedUserCognitoId,
            assignments: selectedItems.map((stockId) => ({ stockId })),
        };

        console.log("StockGrid: Sending Bulk Assign Payload:", JSON.stringify(payload, null, 2));

        try {
            await bulkAssignStocks(payload).unwrap();
            setErrorMessage(null);
            setSelectedUserCognitoId("");
        } catch (error: any) {
            console.error("StockGrid: Bulk Assign Error:", JSON.stringify({
                status: error.status,
                data: error.data,
                details: error.data?.details?.map((e: any) => ({
                    path: e.path,
                    message: e.message,
                    code: e.code,
                    ...(e.expected ? { expected: e.expected } : {}),
                    ...(e.received ? { received: e.received } : {}),
                    ...(e.keys ? { keys: e.keys } : {}),
                })),
                rawError: error,
            }, null, 2));
            const message =
                error.data?.message ||
                error.data?.details?.map((e: any) => e.message).join(", ") ||
                t("stocks:errors.assignFailed", { defaultValue: "Failed to assign stocks." });
            setErrorMessage(message);
        }
    };

    // Helper to safely render potentially object fields
    const renderField = (value: any): string => {
        if (value == null) return "N/A";
        if (typeof value === "object" && "text" in value) return value.text;
        if (typeof value === "object" && "label" in value) return value.label;
        return String(value);
    };

    return (
        <div className="space-y-4">
            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
            {isAdmin && (
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedUserCognitoId}
                        onValueChange={setSelectedUserCognitoId}
                        disabled={usersLoading}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder={t("stocks:selectUser", { defaultValue: "Select User" })} />
                        </SelectTrigger>
                        <SelectContent>
                            {usersResponse?.data?.data?.map((user) => (
                                <SelectItem key={user.userCognitoId} value={user.userCognitoId}>
                                    {user.name || user.userCognitoId}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleBulkAssign}
                        disabled={!selectedItems.length || !selectedUserCognitoId || usersLoading}
                        className="rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {t("stocks:actions.bulkAssign", { defaultValue: "Bulk Assign Stocks" })}
                    </Button>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stocksData.length > 0 ? (
                    stocksData.map((stock) => (
                        <Card
                            key={stock.id}
                            className={`cursor-pointer rounded-sm border-gray-200 dark:border-gray-700 ${
                                selectedItems.includes(stock.id) ? "bg-blue-50 dark:bg-blue-800" : "bg-white dark:bg-gray-900"
                            }`}
                            onClick={() => handleCardClick(stock.id)}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    {stock.lotNo}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedItems.includes(stock.id)}
                                        onCheckedChange={() => handleSelectItem(stock.id)}
                                        aria-label={t("stocks:actions.selectItem", {
                                            defaultValue: "Select item {{lotNo}}",
                                            lotNo: stock.lotNo,
                                        })}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                        {t("stocks:actions.selectItem", { defaultValue: "Select item" })}
                                    </span>
                                </div>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:mark", { defaultValue: "Mark" })}:
                                    </span>{" "}
                                    {renderField(stock.mark)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:grade", { defaultValue: "Grade" })}:
                                    </span>{" "}
                                    {renderField(stock.grade)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:broker", { defaultValue: "Broker" })}:
                                    </span>{" "}
                                    {renderField(formatBrokerName(stock.broker))}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:saleCode", { defaultValue: "Sale Code" })}:
                                    </span>{" "}
                                    {renderField(stock.saleCode)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:bags", { defaultValue: "Bags" })}:
                                    </span>{" "}
                                    {stock.bags}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:weight", { defaultValue: "Weight" })}:
                                    </span>{" "}
                                    {stock.weight.toFixed(2)} kg
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:purchaseValue", { defaultValue: "Purchase Value" })}:
                                    </span>{" "}
                                    ${stock.purchaseValue.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:totalPurchaseValue", { defaultValue: "Total Purchase Value" })}:
                                    </span>{" "}
                                    ${stock.totalPurchaseValue.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:agingDays", { defaultValue: "Aging Days" })}:
                                    </span>{" "}
                                    {stock.agingDays}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:penalty", { defaultValue: "Penalty" })}:
                                    </span>{" "}
                                    ${stock.penalty.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:bgtCommission", { defaultValue: "BGT Commission" })}:
                                    </span>{" "}
                                    ${stock.bgtCommission.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:maerskFee", { defaultValue: "Maersk Fee" })}:
                                    </span>{" "}
                                    ${stock.maerskFee.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:commission", { defaultValue: "Commission" })}:
                                    </span>{" "}
                                    ${stock.commission.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:netPrice", { defaultValue: "Net Price" })}:
                                    </span>{" "}
                                    ${stock.netPrice.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:total", { defaultValue: "Total" })}:
                                    </span>{" "}
                                    ${stock.total.toFixed(2)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:batchNumber", { defaultValue: "Batch Number" })}:
                                    </span>{" "}
                                    {renderField(stock.batchNumber)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:lowStockThreshold", { defaultValue: "Low Stock Threshold" })}:
                                    </span>{" "}
                                    {stock.lowStockThreshold != null ? stock.lowStockThreshold.toFixed(2) : "N/A"} kg
                                </p>
                                <p className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t("stocks:invoiceNo", { defaultValue: "Invoice Number" })}:
                                    </span>{" "}
                                    {renderField(stock.invoiceNo)}
                                </p>
                                {isAdmin && (
                                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(stock.id)}
                                            disabled={isDeleting[stock.id] ?? false}
                                            className="rounded-sm bg-red-600 hover:bg-red-700 text-white"
                                            aria-label={t("stocks:actions.delete", {
                                                defaultValue: "Delete item {{lotNo}}",
                                                lotNo: stock.lotNo,
                                            })}
                                        >
                                            {isDeleting[stock.id]
                                                ? t("stocks:deleting", { defaultValue: "Deleting..." })
                                                : t("stocks:actions.delete", { defaultValue: "Delete" })}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-4 text-gray-500 dark:text-gray-400">
                        {t("stocks:noStocks", { defaultValue: "No stocks found" })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockGrid;