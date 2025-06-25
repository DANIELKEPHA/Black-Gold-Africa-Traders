import * as React from "react";
import { cn } from "@/lib/utils";

export function Pagination({ children, className }: React.HTMLAttributes<HTMLElement>) {
    return (
        <nav
            role="navigation"
            aria-label="pagination"
            className={cn("flex items-center justify-between", className)}
        >
            {children}
        </nav>
    );
}

export function PaginationContent({ children, className }: React.HTMLAttributes<HTMLUListElement>) {
    return <ul className={cn("inline-flex items-center -space-x-px", className)}>{children}</ul>;
}

export function PaginationItem({ children, className }: React.HTMLAttributes<HTMLLIElement>) {
    return <li className={cn("inline", className)}>{children}</li>;
}

export function PaginationLink({
                                   className,
                                   isActive,
                                   ...props
                               }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { isActive?: boolean }) {
    return (
        <a
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "px-3 py-2 leading-tight border rounded-md text-sm",
                isActive
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300",
                className
            )}
            {...props}
        />
    );
}

export function PaginationPrevious({
                                       className,
                                       disabled,
                                       ...props
                                   }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn(
                "px-3 py-2 ml-0 leading-tight text-sm border border-gray-300 rounded-l-md",
                "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            disabled={disabled}
            {...props}
        >
            Previous
        </button>
    );
}


export function PaginationNext({
                                   className,
                                   disabled,
                                   ...props
                               }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn(
                "px-3 py-2 leading-tight text-sm border border-gray-300 rounded-r-md",
                "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            disabled={disabled}
            {...props}
        >
            Next
        </button>
    );
}
