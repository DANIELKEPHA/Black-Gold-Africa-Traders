"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { useGetLoggedInUsersQuery, useBulkAssignStocksMutation, useGetAuthUserQuery } from "@/state/api";
import { formatBrokerName } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {StocksResponse} from "@/state";

export interface StocksTableProps {
    stocksData: StocksResponse[];
    selectedItems: number[];
    handleSelectItem: (id: number) => void;
}

const StockTable: React.FC<StocksTableProps> = ({ stocksData, selectedItems, handleSelectItem }) => {
    const { t } = useTranslation(["stocks", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
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

    const handleSelectAll = () => {
        if (stocksData.length === 0) return;
        if (selectedItems.length === stocksData.length) {
            stocksData.forEach((stock) => handleSelectItem(stock.id)); // Deselect all
        } else {
            stocksData.forEach((stock) => {
                if (!selectedItems.includes(stock.id)) {
                    handleSelectItem(stock.id); // Select all
                }
            });
        }
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

        console.log("StockTable: Sending Bulk Assign Payload:", JSON.stringify(payload, null, 2));

        try {
            await bulkAssignStocks(payload).unwrap();
            setErrorMessage(null);
            setSelectedUserCognitoId("");
        } catch (error: any) {
            console.error("StockTable: Bulk Assign Error:", JSON.stringify({
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

    return (
        <div className="space-y-4">
            {errorMessage && (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}
            {authUser?.userRole.toLowerCase() === "admin" && (
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
            <Table className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={selectedItems.length === stocksData.length && stocksData.length > 0}
                                onCheckedChange={handleSelectAll}
                                aria-label={t("stocks:actions.selectAll", { defaultValue: "Select all" })}
                                className="border-gray-300 dark:border-gray-600"
                            />
                        </TableHead>
                        <TableHead>{t("stocks:lotNo", { defaultValue: "Lot Number" })}</TableHead>
                        <TableHead>{t("stocks:mark", { defaultValue: "Mark" })}</TableHead>
                        <TableHead>{t("stocks:grade", { defaultValue: "Grade" })}</TableHead>
                        <TableHead>{t("stocks:broker", { defaultValue: "Broker" })}</TableHead>
                        <TableHead>{t("stocks:saleCode", { defaultValue: "Sale Code" })}</TableHead>
                        <TableHead>{t("stocks:bags", { defaultValue: "Bags" })}</TableHead>
                        <TableHead>{t("stocks:weight", { defaultValue: "Weight" })}</TableHead>
                        <TableHead>{t("stocks:purchaseValue", { defaultValue: "Purchase Value" })}</TableHead>
                        <TableHead>{t("stocks:totalPurchaseValue", { defaultValue: "Total Purchase Value" })}</TableHead>
                        <TableHead className="text-red-600 dark:text-red-800">{t("stocks:agingDays", { defaultValue: "Aging Days" })}</TableHead>
                        <TableHead>{t("stocks:penalty", { defaultValue: "Penalty" })}</TableHead>
                        <TableHead>{t("stocks:bgtCommission", { defaultValue: "BGT Commission" })}</TableHead>
                        <TableHead>{t("stocks:maerskFee", { defaultValue: "Maersk Fee" })}</TableHead>
                        <TableHead>{t("stocks:commission", { defaultValue: "Commission" })}</TableHead>
                        <TableHead>{t("stocks:netPrice", { defaultValue: "Net Price" })}</TableHead>
                        <TableHead>{t("stocks:total", { defaultValue: "Total" })}</TableHead>
                        <TableHead>{t("stocks:invoiceNo", { defaultValue: "Invoice Number" })}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocksData.length > 0 ? (
                        stocksData.map((stock) => (
                            <TableRow
                                key={stock.id}
                                className={`${
                                    selectedItems.includes(stock.id)
                                        ? "bg-indigo-50 dark:bg-indigo-900/30"
                                        : "bg-white dark:bg-gray-900"
                                } hover:bg-gray-100 dark:hover:bg-gray-800`}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedItems.includes(stock.id)}
                                        onCheckedChange={() => handleSelectItem(stock.id)}
                                        aria-label={t("stocks:actions.selectItem", {
                                            defaultValue: "Select item {{lotNo}}",
                                            lotNo: stock.lotNo,
                                        })}
                                        className="border-gray-300 dark:border-gray-600"
                                    />
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">{stock.lotNo}</TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">{stock.mark ?? "N/A"}</TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">{stock.grade ?? "N/A"}</TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    {formatBrokerName(stock.broker) ?? "N/A"}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">{stock.saleCode ?? "N/A"}</TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">{stock.bags}</TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    {stock.weight.toFixed(2)} kg
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.purchaseValue.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.totalPurchaseValue.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-red-600 dark:text-red-800">{stock.agingDays}</TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.penalty.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.bgtCommission.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.maerskFee.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.commission.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.netPrice.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">
                                    ${stock.total.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-gray-800 dark:text-gray-200">{stock.invoiceNo ?? "N/A"}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={18} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                {t("stocks:noStocks", { defaultValue: "No stocks found" })}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default StockTable;