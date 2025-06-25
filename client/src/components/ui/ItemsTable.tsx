import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemsTableProps {
    headers: string[];
    rows: (string | React.ReactNode)[][];
    isLoading: boolean;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({ headers, rows, isLoading }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {headers.map((header, i) => (
                        <TableHead key={i}>{header}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            {headers.map((_, j) => (
                                <TableCell key={j}>
                                    <Skeleton className="h-4 w-full" />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                    : rows.map((row, i) => (
                        <TableRow key={i}>
                            {row.map((cell, j) => (
                                <TableCell key={j}>{cell}</TableCell>
                            ))}
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
    );
};
