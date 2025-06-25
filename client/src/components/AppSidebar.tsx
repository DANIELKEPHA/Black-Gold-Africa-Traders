"use client";

import { usePathname } from "next/navigation";
import React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "./ui/sidebar";
import {
    BarChart,
    Building,
    Heart,
    Home,
    LayoutDashboard,
    NotebookPen,
    Package,
    Settings,
    User,
    X,
    Menu,
    ShoppingCart,
    DollarSign,
} from "lucide-react";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AppSidebarProps {
    userType: "admin" | "user";
}

interface NavLink {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
}

const AppSidebar = ({ userType }: AppSidebarProps) => {
    const pathname = usePathname();
    const { toggleSidebar, open } = useSidebar();

    const navLinks: NavLink[] =
        userType === "admin"
            ? [
                { icon: Home, label: "Home", href: "/" },
                // { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
                { icon: Building, label: "Catalogs", href: "/admin/catalog" },
                { icon: NotebookPen, label: "Stocks", href: "/admin/stock" },
                { icon: ShoppingCart, label: "Out Lots", href: "/admin/outLots" },
                { icon: DollarSign, label: "Selling PriceS", href: "/admin/sellingPrices" },
                { icon: BarChart, label: "Reports", href: "/admin/reports" },
            ]
            : [
                { icon: Home, label: "Home", href: "/" },
                // { icon: LayoutDashboard, label: "Dashboard", href: "/user/dashboard" },
                { icon: Building, label: "Catalogs", href: "/user/catalog" },
                { icon: NotebookPen, label: "Stocks", href: "/user/stocks" },
                { icon: ShoppingCart, label: "Out Lots", href: "/user/outLots" },
                { icon: DollarSign, label: "Selling Price", href: "/user/sellingPrices" },
                { icon: BarChart, label: "Shipments", href: "/user/shipments" },
            ];

    return (
        <Sidebar
            collapsible="icon"
            className="fixed left-0 bg-white shadow-lg"
            style={{
                top: `${NAVBAR_HEIGHT}px`,
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div
                            className={cn(
                                "flex min-h-[56px] w-full items-center pt-3 mb-3",
                                open ? "justify-between px-6" : "justify-center"
                            )}
                        >
                            {open ? (
                                <>
                                    <h1 className="text-xl font-bold text-gray-800">
                                        {userType === "admin" ? "Admin View" : "User View"}
                                    </h1>
                                    <button
                                        className="hover:bg-gray-100 p-2 rounded-md"
                                        onClick={() => toggleSidebar()}
                                    >
                                        <X className="h-6 w-6 text-gray-600" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="hover:bg-gray-100 p-2 rounded-md"
                                    onClick={() => toggleSidebar()}
                                >
                                    <Menu className="h-6 w-6 text-gray-600" />
                                </button>
                            )}
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;

                        return (
                            <SidebarMenuItem key={link.href}>
                                <SidebarMenuButton
                                    asChild
                                    className={cn(
                                        "flex items-center px-7 py-7",
                                        isActive
                                            ? "bg-gray-100"
                                            : "text-gray-600 hover:bg-gray-100",
                                        open ? "text-blue-600" : "ml-[5px]"
                                    )}
                                >
                                    <Link href={link.href} className="w-full" scroll={false}>
                                        <div className="flex items-center gap-3">
                                            <link.icon
                                                className={`h-5 w-5 ${
                                                    isActive ? "text-blue-600" : "text-gray-600"
                                                }`}
                                            />
                                            <span
                                                className={`font-medium ${
                                                    isActive ? "text-blue-600" : "text-gray-600"
                                                }`}
                                            >
                                                {link.label}
                                            </span>
                                        </div>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
};

export default AppSidebar;