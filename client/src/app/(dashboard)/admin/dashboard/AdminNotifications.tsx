"use client";

import { useState } from "react";
import { useGetAuthUserQuery, useGetNotificationsQuery } from "@/state/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification, ShipmentStatus } from "@/state";

export default function AdminNotifications() {
    const { data: authUser, isLoading: isAuthLoading, error: authError } =
        useGetAuthUserQuery();
    const queryClient = useQueryClient();
    const [filters] = useState({ status: undefined, clientCognitoId: undefined });

    const {
        data: notifications,
        isLoading: isNotificationsLoading,
        error: notificationsError,
    } = useGetNotificationsQuery(filters, {
        skip:
            !authUser?.cognitoInfo?.userId ||
            authUser?.userRole.toLowerCase() !== "admin",
    });

    const markAsRead = useMutation({
        mutationFn: async (notificationId: number) => {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ read: true }),
            });
            if (!response.ok) throw new Error("Failed to mark notification as read");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api", "getNotifications"] });
            toast.success("Notification marked as read");
        },
        onError: () => toast.error("Failed to mark notification as read"),
    });

    const updateShipmentStatus = useMutation({
        mutationFn: async ({
                               shipmentId,
                               status,
                           }: {
            shipmentId: number;
            status: ShipmentStatus;
        }) => {
            const response = await fetch(`/api/shipments/${shipmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error("Failed to update shipment status");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api", "getNotifications"] });
            toast.success("Shipment status updated");
        },
        onError: () => toast.error("Failed to update shipment status"),
    });

    if (isAuthLoading || isNotificationsLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (authError || authUser?.userRole.toLowerCase() !== "admin") {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-600">Access denied: Admins only</p>
                    <Button
                        onClick={() => (window.location.href = "/login")}
                        className="mt-4"
                    >
                        Log In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <Toaster richColors position="top-right" />
            <h1 className="text-2xl font-bold mb-6">Admin Notifications</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Shipmark</TableHead>
                        <TableHead>Consignee</TableHead>
                        <TableHead>Vessel</TableHead>
                        <TableHead>Packaging Instructions</TableHead>
                        <TableHead>Additional Instructions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Catalogs</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {notifications?.length ? (
                        notifications.map((notification: Notification) => (
                            <TableRow key={notification.id}>
                                <TableCell>{notification.shipment.shipmark}</TableCell>
                                <TableCell>{notification.shipment.consignee}</TableCell>
                                <TableCell>{notification.shipment.vessel}</TableCell>
                                <TableCell>
                                    {notification.shipment.packagingInstructions}
                                </TableCell>
                                <TableCell>
                                    {notification.shipment.additionalInstructions || "N/A"}
                                </TableCell>
                                <TableCell>{notification.shipment.status}</TableCell>
                                <TableCell>
                                    {notification.shipment.catalogIds.join(", ")}
                                </TableCell>
                                <TableCell>{notification.shipment.client.name}</TableCell>
                                <TableCell>
                                    {!notification.read && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => markAsRead.mutate(notification.id)}
                                        >
                                            Mark as Read
                                        </Button>
                                    )}
                                    {notification.shipment.status === ShipmentStatus.Pending && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    updateShipmentStatus.mutate({
                                                        shipmentId: notification.shipmentId,
                                                        status: ShipmentStatus.Approved,
                                                    })
                                                }
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    updateShipmentStatus.mutate({
                                                        shipmentId: notification.shipmentId,
                                                        status: ShipmentStatus.Cancelled,
                                                    })
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center">
                                No notifications found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}