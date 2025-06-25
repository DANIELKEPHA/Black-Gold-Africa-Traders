"use client";

import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import React, { useEffect, useState } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const role = authUser.userRole?.toLowerCase();
      if (
          (role === "admin" && pathname.startsWith("/user")) ||
          (role === "user" && pathname.startsWith("/admin"))
      ) {
        router.push(
            role === "admin" ? "/admin/dashboard" : "/user/dashboard",
            { scroll: false }
        );
      } else {
        setIsLoading(false);
      }
    }
  }, [authUser, router, pathname]);

  if (authLoading || isLoading) return <>Loading...</>;
  if (!authUser?.userRole) return null;

  const role = authUser.userRole.toLowerCase();
  if (role !== "admin" && role !== "user") return null;

  return (
      <SidebarProvider>
        <div className="min-h-screen w-full bg-primary-100">
          <Toaster position="top-right" richColors />
          <Navbar />
          <div style={{ marginTop: `${NAVBAR_HEIGHT}px` }}>
            <main className="flex">
              <Sidebar userType={role} />
              <div className="flex-grow transition-all duration-300">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
};

export default DashboardLayout;
