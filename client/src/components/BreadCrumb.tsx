import React from 'react';
import { ChevronRight } from 'lucide-react';

type BreadcrumbItem = {
    label: string;
    href?: string;
};

type BreadcrumbProps = {
    items: BreadcrumbItem[];
};

const BreadCrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav className="bg-gray-100 px-6 py-3 text-sm text-gray-600 font-medium">
            <ol className="flex items-center space-x-2">
                {items.map((item: BreadcrumbItem, index: number) => (
                    <li key={index} className="flex items-center">
                        {index !== 0 && (
                            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        )}
                        {index !== items.length - 1 ? (
                            <a href={item.href} className="hover:underline text-gray-700">
                                {item.label}
                            </a>
                        ) : (
                            <span className="text-green-800">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default BreadCrumb;
