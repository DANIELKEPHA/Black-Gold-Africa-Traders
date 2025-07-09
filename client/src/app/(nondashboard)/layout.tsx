"use client";

import Navbar from "@/components/Navbar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// ✅ Define all public routes here
const PUBLIC_ROUTES = ["/", "/discover", "/explore", "/privacyPolicy"];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery(undefined, {
    skip: isPublicRoute, // ✅ skip auth query on public routes
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!isPublicRoute);

  useEffect(() => {
    if (isPublicRoute) return;

    if (authUser) {
      const userRole = authUser.userRole?.toLowerCase();
      if (
          userRole === "admin" &&
          (pathname.startsWith("/search") || pathname === "/")
      ) {
        router.push("/admin/catalog", { scroll: false });
      } else {
        setIsLoading(false);
      }
    }
  }, [authUser, router, pathname, isPublicRoute]);

  if (!isPublicRoute && (authLoading || isLoading)) {
    return <>Loading...</>;
  }

  return (
      <div className="h-full w-full">
        <Navbar />
        <main
            className={`h-full flex w-full flex-col`}
            style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}
        >
          {children}
        </main>
      </div>
  );
};

export default Layout;
