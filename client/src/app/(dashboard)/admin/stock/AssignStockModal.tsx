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
import { Loader2, Trash2, User, Package, Scale, Tag, UserCheck, AlertCircle } from "lucide-react";
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
const mapStocksResponseToStock = (stock: StocksResponse): Stock => ({
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
    assignedAt: stock.assignedAt ?? null,
    adminCognitoId: stock.adminCognitoId,
    assignments: stock.assignments,
    admin: stock.admin ?? null,
    isFavorited: false
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
                ? t("stocks:errors.invalidRequest", { defaultValue: "Invalid request to fetch contact-forms" })
                : t("stocks:errors.fetchUsersFailed", { defaultValue: "Failed to fetch contact-forms" });
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
                            console.log(
                                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Navigate to unassign for stocks:`,
                                stockIds
                            );
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
            toast.error(t("stocks:errors.UnassignFailed", { defaultValue: "Unauthorized" }));
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
        <Dialog open={isOpen} onOpenChange={type => console.log(type)}>
            <Toaster position="top-center" richColors />
            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-lg shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        {t("stocks:assignStocks", { defaultValue: "Assign Stocks" })}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Selection Card */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <Label htmlFor="userCognitoId" className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {t("stocks:selectUser", { defaultValue: "Select User" })}
                            </Label>
                        </div>

                        <Select
                            value={userCognitoId}
                            onValueChange={setUserCognitoId}
                            disabled={isAssigning || isUsersLoading || !isAdmin || users.length === 0}
                        >
                            <SelectTrigger
                                id="userCognitoId"
                                className="w-full h-12 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
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
                            <SelectContent className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                                {users.length === 0 && !isUsersLoading ? (
                                    <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                                        <AlertCircle className="w-5 h-5 mr-2" />
                                        {t("stocks:noUsers", { defaultValue: "No users available" })}
                                    </div>
                                ) : (
                                    users.map((user) => (
                                        <SelectItem
                                            key={user.userCognitoId}
                                            value={user.userCognitoId}
                                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name || user.email || user.userCognitoId}</p>
                                                    {user.email && <p className="text-xs text-gray-500">{user.email}</p>}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stocks List */}
                    <div className="space-y-6">
                        {stocksData.map((stock) => (
                            <div key={stock.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                {/* Stock Header */}
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-blue-600" />
                                        {stock.lotNo} - {stock.grade}
                                    </h3>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stock.weight.toFixed(2)} kg
                  </span>
                                </div>

                                {/* Stock Details */}
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Lot No:</strong> {stock.lotNo || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Invoice No:</strong> {stock.invoiceNo || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Bags:</strong> {stock.bags || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Purchase Value:</strong> {stock.purchaseValue?.toFixed(2) || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Scale className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Weight:</strong> {stock.weight.toFixed(2)} kg
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Grade:</strong> {stock.grade}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <strong>Broker:</strong> {stock.broker}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Current Assignments */}
                                    {stock.assignments && stock.assignments.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-blue-600" />
                                                {t("stocks:currentAssignments", { defaultValue: "Current Assignments" })}
                                            </h4>
                                            <div className="space-y-2">
                                                {stock.assignments.map((assignment) => {
                                                    const user = users.find((u) => u.userCognitoId === assignment.userCognitoId);
                                                    return (
                                                        <div
                                                            key={assignment.userCognitoId}
                                                            className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                                    <User className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                                                                </div>
                                                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                    {user?.name || user?.email || assignment.userCognitoId}
                                                                </span>
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                    ({assignment.assignedWeight} kg)
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleUnassign(stock.id, assignment.userCognitoId)}
                                                                disabled={isUnassigning || !isAdmin}
                                                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                                        </div>
                                    )}
                                </div>

                                {/* User's Assigned Stocks */}
                                {userCognitoId && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            <Package className="w-4 h-4 text-blue-600" />
                                            {t("stocks:userAssignedStocks", { defaultValue: "User's Assigned Stocks" })}
                                        </h4>
                                        <div className="space-y-2">
                                            {users
                                                .find((u) => u.userCognitoId === userCognitoId)
                                                ?.assignedStocks?.filter((a) => a.stocks != null)
                                                .map((assignment) => (
                                                    <div
                                                        key={assignment.id}
                                                        className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Tag className="w-4 h-4 text-gray-500" />
                                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                Lot No: {assignment.stocks?.lotNo || "N/A"} - {assignment.assignedWeight} kg
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleUnassign(assignment.stocksId, assignment.userCognitoId)}
                                                            disabled={isUnassigning || !isAdmin}
                                                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            {isUnassigning ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )) || (
                                                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                    {t("stocks:noAssignedStocks", { defaultValue: "No assigned stocks for this user" })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 h-10 px-6"
                            disabled={isAssigning || isUnassigning}
                        >
                            {t("general:actions.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button
                            onClick={handleAssign}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 shadow-sm"
                            disabled={isAssigning || isUnassigning || !isAdmin || !userCognitoId}
                        >
                            {isAssigning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    {t("stocks:actions.assigning", { defaultValue: "Assigning..." })}
                                </>
                            ) : (
                                <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    {t("stocks:actions.assign", { defaultValue: "Assign" })}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { AssignStockModal, mapStocksResponseToStock };