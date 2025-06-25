"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGetLoggedInUsersQuery, useGetUserStockHistoryQuery } from "@/state/api";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Fade,
    TableSortLabel,
    InputAdornment,
    Skeleton,
    createTheme,
    ThemeProvider,
} from "@mui/material";
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { skipToken } from "@reduxjs/toolkit/query";
import debounce from "lodash.debounce";
import {ApiError} from "@/state/stock";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const theme = createTheme({
    palette: {
        primary: { main: "#1976d2" },
        secondary: { main: "#757575" },
        background: { default: "#f5f7fa", paper: "#ffffff" },
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 500 },
    },
    components: {
        MuiPaper: {
            styleOverrides: { root: { borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
        },
        MuiButton: {
            styleOverrides: { root: { borderRadius: 8, textTransform: "none", padding: "8px 16px" } },
        },
        MuiTableCell: {
            styleOverrides: { head: { fontWeight: 600, color: "#424242" } },
        },
    },
});

const AdminStockHistoryPage = () => {
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(0);
    const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
    const [historySearch, setHistorySearch] = useState("");
    const [sortBy, setSortBy] = useState<"assignedAt" | "stocksId" | "assignedWeight">("assignedAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const debouncedSetSearch = useMemo(() => debounce((value: string) => setSearch(value), 300), []);
    const debouncedSetHistorySearch = useMemo(() => debounce((value: string) => setHistorySearch(value), 300), []);

    const { data: usersResponse, isLoading: usersLoading, error: usersError } = useGetLoggedInUsersQuery({
        page: page + 1,
        limit: rowsPerPage,
        search,
        includeAssignedStocks: true,
        includeShipments: false,
        includeFavoritedStocks: false,
    });

    const { data: historyResponse, isLoading: historyLoading, error: historyError } = useGetUserStockHistoryQuery(
        selectedUser
            ? {
                userCognitoId: selectedUser,
                page: historyPage + 1,
                limit: historyRowsPerPage,
                search: historySearch,
                sortBy,
                sortOrder,
            }
            : skipToken
    );

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleHistoryChangePage = (event: unknown, newPage: number) => {
        setHistoryPage(newPage);
    };

    const handleHistoryChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHistoryRowsPerPage(parseInt(event.target.value, 10));
        setHistoryPage(0);
    };

    const handleSort = (newSortBy: typeof sortBy) => {
        if (newSortBy === sortBy) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(newSortBy);
            setSortOrder("desc");
        }
    };

    const chartData = {
        labels: Array.isArray(historyResponse)
            ? historyResponse.map((a) =>
                new Date(a.assignedAt).toLocaleDateString("en-US", {
                    timeZone: "Africa/Nairobi",
                }),
            )
            : [],
        datasets: [
            {
                label: "Assigned Weight Over Time",
                data: Array.isArray(historyResponse)
                    ? historyResponse.map((a) => a.assignedWeight)
                    : [],
                borderColor: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.2)",
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };


    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" as const, labels: { font: { size: 14 } } },
            tooltip: { enabled: true },
            title: { display: false },
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.05)" } },
        },
    };

    const selectedUserName = usersResponse?.data?.data?.find((user) => user.userCognitoId === selectedUser)?.name || selectedUser || "N/A";

    const handleBackToStocks = () => {
        router.push("/admin/stock");
    };

    const isFetchBaseQueryError = (error: unknown): error is ApiError => {
        return typeof error === "object" && error !== null && "status" in error && "data" in error;
    };

    if (usersLoading) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    if (usersError) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {isFetchBaseQueryError(usersError)
                        ? usersError.data.message || usersError.data.error || "Failed to load users."
                        : "An unexpected error occurred while loading users."}
                </Alert>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto", bgcolor: "background.default", minHeight: "100vh" }}>
                <Fade in timeout={500}>
                    <Box sx={{ mb: 4, py: 2, px: 3, bgcolor: "primary.main", color: "white", borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            User Stock Assignment History
                        </Typography>
                    </Box>
                </Fade>

                <TextField
                    label="Search Users"
                    variant="outlined"
                    value={search}
                    onChange={(e) => debouncedSetSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 3, width: { xs: "100%", sm: 300 }, bgcolor: "white", borderRadius: 1 }}
                    aria-label="Search users by name, email, or cognito ID"
                    inputProps={{ "data-testid": "user-search-input" }}
                />

                <Fade in timeout={500}>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table aria-label="Users table">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Cognito ID</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {usersResponse?.data?.data?.length ? (
                                    usersResponse.data.data.map((user, index) => (
                                        <TableRow
                                            key={user.userCognitoId}
                                            sx={{
                                                bgcolor: index % 2 === 0 ? "white" : "grey.50",
                                                "&:hover": { bgcolor: "grey.100" },
                                                transition: "background-color 0.2s",
                                            }}
                                            data-testid={`user-row-${user.userCognitoId}`}
                                        >
                                            <TableCell>{user.name || "N/A"}</TableCell>
                                            <TableCell>{user.email || "N/A"}</TableCell>
                                            <TableCell>{user.userCognitoId}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedUser(user.userCognitoId);
                                                        setHistoryPage(0);
                                                        setHistorySearch("");
                                                    }}
                                                    aria-label={`View stock history for ${user.name || user.userCognitoId}`}
                                                    data-testid={`view-history-${user.userCognitoId}`}
                                                >
                                                    View Stock History
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography color="textSecondary">No users found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={usersResponse?.data?.meta?.total || 0}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ bgcolor: "grey.100" }}
                            aria-label="User table pagination"
                        />
                    </TableContainer>
                </Fade>

                {selectedUser && (
                    <Fade in timeout={500}>
                        <Box sx={{ mt: 4 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
                                <Typography variant="h5">Stock Assignment History for {selectedUserName}</Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={handleBackToStocks}
                                    aria-label="Back to stock management"
                                    data-testid="back-to-stocks"
                                >
                                    Back to Stocks
                                </Button>
                            </Box>

                            <TextField
                                label="Search Stock Assignments"
                                variant="outlined"
                                value={historySearch}
                                onChange={(e) => debouncedSetHistorySearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 3, width: { xs: "100%", sm: 300 }, bgcolor: "white", borderRadius: 1 }}
                                aria-label="Search stock assignments by lot number or other fields"
                                inputProps={{ "data-testid": "history-search-input" }}
                            />

                            {historyLoading ? (
                                <Box>
                                    <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                                    ))}
                                </Box>
                            ) : historyError ? (
                                <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }} data-testid="history-error">
                                    {isFetchBaseQueryError(historyError)
                                        ? historyError.data.message || historyError.data.error || "Failed to load stock history."
                                        : "An unexpected error occurred while loading stock history."}
                                </Alert>
                            ) : !Array.isArray(historyResponse) || historyResponse.length === 0
                                ? (
                                <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }} data-testid="no-history">
                                    No stock assignments found for this user.
                                </Alert>
                            ) : (
                                <>
                                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                                        <Table aria-label="Stock assignment history table">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                                    <TableCell>
                                                        <TableSortLabel
                                                            active={sortBy === "stocksId"}
                                                            direction={sortBy === "stocksId" ? sortOrder : "asc"}
                                                            onClick={() => handleSort("stocksId")}
                                                            aria-label="Sort by Stock ID"
                                                        >
                                                            Stock ID
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell>Sale Code</TableCell>
                                                    <TableCell>Lot No</TableCell>
                                                    <TableCell>Grade</TableCell>
                                                    <TableCell>Broker</TableCell>
                                                    <TableCell>Invoice No</TableCell>
                                                    <TableCell>Bags</TableCell>
                                                    <TableCell>
                                                        <TableSortLabel
                                                            active={sortBy === "assignedWeight"}
                                                            direction={sortBy === "assignedWeight" ? sortOrder : "asc"}
                                                            onClick={() => handleSort("assignedWeight")}
                                                            aria-label="Sort by Assigned Weight"
                                                        >
                                                            Assigned Weight (kg)
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TableSortLabel
                                                            active={sortBy === "assignedAt"}
                                                            direction={sortBy === "assignedAt" ? sortOrder : "asc"}
                                                            onClick={() => handleSort("assignedAt")}
                                                            aria-label="Sort by Assigned At"
                                                        >
                                                            Assigned At
                                                        </TableSortLabel>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {historyResponse.map((assignment, index) => (
                                                    <TableRow
                                                        key={assignment.id}
                                                        sx={{
                                                            bgcolor: index % 2 === 0 ? "white" : "grey.50",
                                                            "&:hover": { bgcolor: "grey.100" },
                                                            transition: "background-color 0.2s",
                                                        }}
                                                        data-testid={`history-row-${assignment.id}`}
                                                    >

                                                    <TableCell>{assignment.stocksId}</TableCell>
                                                        <TableCell>{assignment.details.saleCode || "N/A"}</TableCell>
                                                        <TableCell>{assignment.details.lotNo || "N/A"}</TableCell>
                                                        <TableCell>{assignment.details.grade || "N/A"}</TableCell>
                                                        <TableCell>{assignment.details.broker || "N/A"}</TableCell>
                                                        <TableCell>{assignment.details.invoiceNo || "N/A"}</TableCell>
                                                        <TableCell>{assignment.details.bags || "N/A"}</TableCell>
                                                        <TableCell>{assignment.assignedWeight.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            {new Date(assignment.assignedAt).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <TablePagination
                                            rowsPerPageOptions={[5, 10, 25]}
                                            component="div"
                                            count={historyResponse?.length || 0}
                                            rowsPerPage={historyRowsPerPage}
                                            page={historyPage}
                                            onPageChange={handleHistoryChangePage}
                                            onRowsPerPageChange={handleHistoryChangeRowsPerPage}
                                            sx={{ bgcolor: "grey.100" }}
                                            aria-label="Stock history table pagination"
                                        />
                                    </TableContainer>
                                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                                        <Typography variant="h6" sx={{ mb: 2 }}>
                                            Assignment Weight Trend
                                        </Typography>
                                        <Line data={chartData} options={chartOptions} />
                                    </Paper>
                                </>
                            )}
                        </Box>
                    </Fade>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default AdminStockHistoryPage;