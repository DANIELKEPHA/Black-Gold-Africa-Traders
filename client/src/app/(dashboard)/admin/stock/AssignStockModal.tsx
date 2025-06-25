"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import {
    useBulkAssignStocksMutation,
    useUnassignStockMutation,
    useGetAuthUserQuery,
    useGetLoggedInUsersQuery,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { Stock } from "@/state/stock";
import {StocksResponse} from "@/state";

interface User {
    userCognitoId: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    role: string;
    assignedStocks?: Array<{
        id: number;
        stocksId: number;
        userCognitoId: string;
        assignedWeight: number;
        assignedAt: string;
        stocks: Stock | null;
    }>;
}

// Mapping function to transform StocksResponse to Stock
export const mapStocksResponseToStock = (stock: StocksResponse): Stock => ({
    id: stock.id,
    saleCode: stock.saleCode,
    broker: stock.broker,
    lotNo: stock.lotNo,
    mark: stock.mark,
    grade: stock.grade,
    invoiceNo: stock.invoiceNo,
    bags: stock.bags,
    weight: stock.weight,
    purchaseValue: stock.purchaseValue,
    totalPurchaseValue: stock.totalPurchaseValue,
    agingDays: stock.agingDays,
    penalty: stock.penalty,
    bgtCommission: stock.bgtCommission,
    maerskFee: stock.maerskFee,
    commission: stock.commission,
    netPrice: stock.netPrice,
    total: stock.total,
    batchNumber: stock.batchNumber,
    lowStockThreshold: stock.lowStockThreshold,
    createdAt: stock.createdAt,
    updatedAt: stock.updatedAt,
    assignedWeight: stock.assignedWeight,
    assignedAt: stock.assignedAt ?? null, // Convert undefined to null
    adminCognitoId: stock.adminCognitoId,
    assignments: stock.assignments,
    admin: stock.admin ?? null, // Ensure admin is null if undefined
});

interface AssignStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    stockIds: number[];
    stocksData: Stock[];
}

const AssignStockModal: React.FC<AssignStockModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               stockIds,
                                                               stocksData,
                                                           }) => {
    const { t } = useTranslation(["stocks", "general"]);
    const { data: authUser } = useGetAuthUserQuery();
    const [bulkAssignStocks, { isLoading: isAssigning }] = useBulkAssignStocksMutation();
    const [unassignStock, { isLoading: isUnassigning }] = useUnassignStockMutation();
    const { data: usersResponse, isLoading: isUsersLoading, error: usersError } = useGetLoggedInUsersQuery({
        page: 1,
        limit: 100,
        includeAssignedStocks: true,
    });

    const users: User[] = useMemo(() => {
        return (
            usersResponse?.data?.data
                ?.filter((user) => user.role === "user")
                .map((user) => ({
                    ...user,
                    name: user.name ?? undefined,
                    email: user.email ?? undefined,
                    phoneNumber: user.phoneNumber ?? undefined,
                    assignedStocks: user.assignedStocks ?? [],
                })) || []
        );
    }, [usersResponse]);

    const [userCognitoId, setUserCognitoId] = useState<string>("");
    const isAdmin = authUser?.userRole === "admin";
    const hasShownErrorToast = useRef(false);

    useEffect(() => {
        if (isOpen) {
            setUserCognitoId("");
            hasShownErrorToast.current = false;
        }
    }, [isOpen]);

    useEffect(() => {
        console.log(
            `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Users Response:`,
            { usersResponse, isUsersLoading, usersError, users }
        );
    }, [usersResponse, isUsersLoading, usersError, users]);

    if (usersError && !hasShownErrorToast.current) {
        const errorMessage =
            (usersError as any)?.data?.message ||
            (usersError as any)?.error ||
            (usersError as any)?.status === 400
                ? t("stocks:errors.invalidRequest", { defaultValue: "Invalid request to fetch users" })
                : t("stocks:errors.fetchUsersFailed", { defaultValue: "Failed to fetch users" });
        toast.error(errorMessage);
        console.error(
            `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Users fetch error:`,
            usersError
        );
        hasShownErrorToast.current = true;
    }

    const handleAssign = async () => {
        if (!isAdmin) {
            toast.error(t("stocks:errors.unauthorized", { defaultValue: "Unauthorized" }));
            return;
        }
        if (!userCognitoId) {
            toast.error(t("stocks:errors.missingUser", { defaultValue: "Please select a user" }));
            return;
        }
        if (stockIds.length === 0) {
            toast.error(t("stocks:errors.noStocksSelected", { defaultValue: "Please select at least one stock" }));
            return;
        }

        const assignments = stockIds.map((stockId) => ({ stockId }));
        try {
            await bulkAssignStocks({
                userCognitoId,
                assignments,
            }).unwrap();
            toast.success(t("stocks:success.stocksAssigned", { defaultValue: "Stocks assigned successfully" }));
            console.log(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Assigned stocks:`,
                { userCognitoId, stockIds }
            );
            onClose();
        } catch (error: any) {
            let message = t("stocks:errors.assignFailed", { defaultValue: "Failed to assign stocks" });
            if (error?.data?.message?.includes("Stock is already assigned")) {
                message = t("stocks:errors.alreadyAssigned", {
                    defaultValue: error.data.message,
                    message: error.data.message,
                });
            } else if (error?.data?.message?.includes("Stocks with IDs")) {
                message = t("stocks:errors.stockNotFound", {
                    defaultValue: error.data.message,
                    message: error.data.message,
                });
            } else if (error?.data?.message?.includes("User with Cognito ID")) {
                message = t("stocks:errors.userNotFound", {
                    defaultValue: error.data.message,
                    message: error.data.message,
                });
            }

            toast.error(message, {
                description: error?.data?.message?.includes("Stock is already assigned")
                    ? t("stocks:errors.alreadyAssignedAction", {
                        defaultValue: "Please unassign the stock(s) before reassigning.",
                    })
                    : undefined,
                action: error?.data?.message?.includes("Stock is already assigned")
                    ? {
                        label: t("stocks:unassign", { defaultValue: "Unassign" }),
                        onClick: () => {
                            // Navigate to unassign page or trigger unassign modal
                            console.log(
                                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Navigate to unassign for stocks:`,
                                stockIds
                            );
                            // Example: router.push(`/stocks/unassign?stockIds=${stockIds.join(",")}`);
                        },
                    }
                    : undefined,
            });

            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Assign error:`,
                {
                    message: error?.data?.message,
                    status: error?.status,
                    details: error?.data?.details,
                    stockIds,
                    userCognitoId,
                }
            );
        }
    };

    const handleUnassign = async (stockId: number, userId: string) => {
        if (!isAdmin) {
            toast.error(t("stocks:errors.unauthorized", { defaultValue: "Unauthorized" }));
            return;
        }
        try {
            await unassignStock({ stockId, userCognitoId: userId }).unwrap();
            toast.success(t("stocks:success.stockUnassigned", { defaultValue: "Stock unassigned successfully" }));
            console.log(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Unassigned stock:`,
                { stockId, userId }
            );
        } catch (error: any) {
            const message =
                error?.data?.message ||
                t("stocks:errors.unassignFailed", { defaultValue: "Failed to unassign stock" });
            toast.error(message);
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Unassign error:`,
                error
            );
        }
    };

    if (!stocksData.length) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <Toaster />
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800 rounded-sm">
                <DialogHeader>
                    <DialogTitle className="text-blue-700 dark:text-blue-200">
                        {t("stocks:assignStocks", { defaultValue: "Assign Stocks" })}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="userCognitoId" className="text-gray-900 dark:text-gray-100">
                            {t("stocks:selectUser", { defaultValue: "Select User" })}
                        </Label>
                        <Select
                            value={userCognitoId}
                            onValueChange={setUserCognitoId}
                            disabled={isAssigning || isUsersLoading || !isAdmin || users.length === 0}
                        >
                            <SelectTrigger
                                id="userCognitoId"
                                className="mt-1 rounded-sm border-gray-300 dark:border-gray-600"
                            >
                                <SelectValue
                                    placeholder={
                                        isUsersLoading
                                            ? t("stocks:loadingUsers", { defaultValue: "Loading users..." })
                                            : users.length === 0
                                                ? t("stocks:noUsers", { defaultValue: "No users available" })
                                                : t("stocks:selectUserPlaceholder", { defaultValue: "Select a user" })
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800">
                                {users.length === 0 && !isUsersLoading ? (
                                    <div className="text-gray-500 dark:text-gray-400 p-2">
                                        {t("stocks:noUsers", { defaultValue: "No users available" })}
                                    </div>
                                ) : (
                                    users.map((user) => (
                                        <SelectItem key={user.userCognitoId} value={user.userCognitoId}>
                                            {user.name || user.email || user.userCognitoId}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    {stocksData.map((stock) => (
                        <div key={stock.id} className="space-y-2">
                            <Label className="text-gray-900 dark:text-gray-100">
                                {t("stocks:stockDetails", { defaultValue: "Stock Details" })} - {stock.lotNo}
                            </Label>
                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-sm">
                                <p className="text-gray-900 dark:text-gray-100">
                                    {t("stocks:weight", { defaultValue: "Weight" })}: {stock.weight.toFixed(2)} kg
                                </p>
                                <p className="text-gray-900 dark:text-gray-100">
                                    {t("stocks:grade", { defaultValue: "Grade" })}: {stock.grade}
                                </p>
                                <p className="text-gray-900 dark:text-gray-100">
                                    {t("stocks:broker", { defaultValue: "Broker" })}: {stock.broker}
                                </p>
                            </div>
                            {stock.assignments && stock.assignments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    <h4 className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {t("stocks:currentAssignments", { defaultValue: "Current Assignments" })}
                                    </h4>
                                    {stock.assignments.map((assignment) => {
                                        const user = users.find((u) => u.userCognitoId === assignment.userCognitoId);
                                        return (
                                            <div
                                                key={assignment.userCognitoId}
                                                className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-sm"
                                            >
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    {user?.name || user?.email || assignment.userCognitoId}:{" "}
                                                    {assignment.assignedWeight} kg
                                                </span>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleUnassign(stock.id, assignment.userCognitoId)}
                                                    disabled={isUnassigning || !isAdmin}
                                                >
                                                    {isUnassigning ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {userCognitoId && (
                                <div className="mt-2 space-y-2">
                                    <h4 className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                                        {t("stocks:userAssignedStocks", { defaultValue: "User's Assigned Stocks" })}
                                    </h4>
                                    {users
                                        .find((u) => u.userCognitoId === userCognitoId)
                                        ?.assignedStocks?.filter((a) => a.stocks != null)
                                        .map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-sm"
                                            >
                                                <span className="text-gray-900 dark:text-gray-100">
                                                    Lot No: {assignment.stocks?.lotNo || "N/A"} - {assignment.assignedWeight} kg
                                                </span>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleUnassign(assignment.stocksId, assignment.userCognitoId)}
                                                    disabled={isUnassigning || !isAdmin}
                                                >
                                                    {isUnassigning ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        )) || (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            {t("stocks:noAssignedStocks", { defaultValue: "No assigned stocks for this user" })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-sm border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400"
                        disabled={isAssigning || isUnassigning}
                    >
                        {t("general:actions.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button
                        onClick={handleAssign}
                        className="rounded-sm bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isAssigning || isUnassigning || !isAdmin}
                    >
                        {isAssigning ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            t("stocks:actions.assign", { defaultValue: "Assign" })
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AssignStockModal;