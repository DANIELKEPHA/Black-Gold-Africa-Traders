"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Typography,
    Skeleton,
    Alert,
    Fade,
    Box,
} from "@mui/material";
import { Shipment } from "@/state/shipment";

interface ExistingShipmentsProps {
    shipments: Shipment[];
    shipmentsLoading: boolean;
    page: number;
    rowsPerPage: number;
    totalShipments: number;
    handleChangePage: (event: unknown, newPage: number) => void;
    handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ExistingShipments: React.FC<ExistingShipmentsProps> = ({
                                                                 shipments,
                                                                 shipmentsLoading,
                                                                 page,
                                                                 rowsPerPage,
                                                                 totalShipments,
                                                                 handleChangePage,
                                                                 handleChangeRowsPerPage,
                                                             }) => {
    return (
        <Fade in timeout={400}>
            <Box sx={{ mx: { xs: 2, sm: 4 }, my: 2, maxWidth: "100%", boxSizing: "border-box" }}>
                <Paper sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                    <Typography
                        variant="h6"
                        sx={{
                            p: 1.5,
                            fontSize: "1.125rem",
                            fontWeight: 500,
                            color: "text.primary",
                            bgcolor: "grey.50",
                        }}
                    >
                        Existing Shipments
                    </Typography>
                    <TableContainer sx={{ maxHeight: 400, overflowX: "auto" }}>
                        <Table aria-label="Existing shipments table" sx={{ minWidth: 600 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                    <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" }}>
                                        Shipmark
                                    </TableCell>
                                    <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" }}>
                                        Consignee
                                    </TableCell>
                                    <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", display: { xs: "none", sm: "table-cell" } }}>
                                        Vessel
                                    </TableCell>
                                    <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" }}>
                                        Status
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shipmentsLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 4 }).map((_, j) => (
                                                <TableCell key={j} sx={{ py: 0.75, px: 1.5, display: j === 2 ? { xs: "none", sm: "table-cell" } : "table-cell" }}>
                                                    <Skeleton variant="text" height={16} />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : shipments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{ py: 1.5, px: 1.5, textAlign: "center" }}>
                                            <Alert severity="info" sx={{ py: 0.5, fontSize: "0.8rem" }}>
                                                No shipments found.
                                            </Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shipments.map((shipment: Shipment, index: number) => (
                                        <TableRow
                                            key={shipment.id}
                                            sx={{
                                                bgcolor: index % 2 === 0 ? "white" : "grey.50",
                                                "&:hover": { bgcolor: "grey.100" },
                                                transition: "background-color 0.2s",
                                            }}
                                        >
                                            <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", color: "text.primary" }}>
                                                {shipment.shipmark}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", color: "text.primary" }}>
                                                {shipment.consignee}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", color: "text.primary", display: { xs: "none", sm: "table-cell" } }}>
                                                {shipment.vessel}
                                            </TableCell>
                                            <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8rem", color: "text.primary" }}>
                                                {shipment.status}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={totalShipments}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{
                            bgcolor: "grey.100",
                            py: 0.5,
                            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.75rem" },
                            "& .MuiTablePagination-select": { py: 0.25 },
                        }}
                    />
                </Paper>
            </Box>
        </Fade>
    );
};

export default ExistingShipments;