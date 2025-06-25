"use client";

import { NAVBAR_HEIGHT } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { Home, LayoutDashboard, Building, NotebookPen, BarChart, Settings, Package, Heart, User, DollarSign, ShoppingCart } from "lucide-react";

interface NavLink {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const Navbar = () => {
    const { data: authUser } = useGetAuthUserQuery();
    const router = useRouter();
    const pathname = usePathname();

    const isDashboardPage = pathname.includes("/admin") || pathname.includes("/user");

    const handleSignOut = async () => {
        await signOut();
        window.location.href = "/";
    };

    const publicLinks: NavLink[] = [
        { href: "/", label: "Home", icon: Home },
        { href: "/discover", label: "About", icon: Building },
        { href: "/explore", label: "Products", icon: Package },
    ];

    const adminLinks: NavLink[] = [
        // { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/catalog", label: "Catalogs", icon: Building },
        { href: "/admin/stock", label: "Stock", icon: NotebookPen },
        { href: "/admin/outLots", label: "Out Lots", icon: ShoppingCart },
        { href: "/admin/sellingPrices", label: "Selling Prices", icon: DollarSign },
        { href: "/admin/reports", label: "Reports", icon: BarChart },
    ];

    const userLinks: NavLink[] = [
        // { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/user/catalog", label: "Catalogs", icon: Building },
        { href: "/user/stocks", label: "Stocks", icon: NotebookPen },
        { href: "/user/outLots", label: "Out Lots", icon: ShoppingCart },
        { href: "/user/sellingPrices", label: "Selling Prices", icon: DollarSign },
        { href: "/user/shipments", label: "Shipments", icon: User },
    ];

    const navLinks = authUser
        ? authUser.userRole?.toLowerCase() === "admin"
            ? adminLinks
            : userLinks
        : publicLinks;

    return (
        <div
            className="fixed top-0 left-0 w-full z-50 shadow-xl"
            style={{ height: `${NAVBAR_HEIGHT}px` }}
        >
            <div className="flex justify-between items-center w-full py-3 px-8 bg-primary-700 text-white">
                <div className="flex items-center gap-4 md:gap-6">
                    {isDashboardPage && (
                        <div className="md:hidden">
                            <SidebarTrigger />
                        </div>
                    )}
                    <Link
                        href="/"
                        className="cursor-pointer hover:!text-primary-300"
                        scroll={false}
                    >
                        <div className="flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={24}
                                height={24}
                                className="w-6 h-6"
                            />
                            <div className="text-xl font-bold">
                                Black Gold&nbsp;
                                <span className="text-yellow-500 font-light hover:!text-yellow-300"
                                >
                                    Africa Traders Ltd
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-5">
                    <nav className="hidden md:flex gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 transition-colors duration-200 ${
                                    pathname === link.href
                                        ? "text-secondary-500 font-semibold"
                                        : "hover:text-primary-300"
                                }`}
                            >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {authUser ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                                <Avatar>
                                    <AvatarFallback className="bg-primary-600">
                                        {authUser.userRole?.[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-primary-200 hidden md:block">
                                    {authUser.userInfo?.name}
                                </p>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white text-primary-700">
                                <DropdownMenuItem
                                    className="cursor-pointer hover:!bg-primary-700 hover:!text-primary-100"
                                    onClick={handleSignOut}
                                >
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Link href="/signin">
                                <Button
                                    variant="outline"
                                    className="text-white border-white bg-transparent hover:bg-white hover:text-primary-700 rounded-lg"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button
                                    variant="secondary"
                                    className="text-white bg-secondary-600 hover:bg-white hover:text-primary-700 rounded-lg"
                                >
                                    Sign Up
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;