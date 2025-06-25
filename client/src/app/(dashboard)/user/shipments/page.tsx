"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetStocksQuery, useGetShipmentsQuery, useCreateShipmentMutation, useUpdateShipmentMutation } from "@/state/api";
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
    Skeleton,
    Alert,
    Fade,
    Checkbox,
    MenuItem,
    Select,
    InputAdornment,
    createTheme,
    ThemeProvider,
    SelectChangeEvent,
    Snackbar,
} from "@mui/material";
import { Search as SearchIcon, Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import debounce from "lodash.debounce";
import { skipToken } from "@reduxjs/toolkit/query";
import { Shipment, ShipmentFormData } from "@/state/shipment";
import { Stock } from "@/state/stock";
import { PackagingInstructions, Vessel } from "@/state/enums";

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

const ShipmentController = () => {
    const router = useRouter();
    const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [stocks, setStocks] = useState<Array<Stock & { selected: boolean; quantity: number }>>([]);
    const [form, setForm] = useState<ShipmentFormData>({
        items: [],
        consignee: "",
        vessel: Vessel.first,
        shipmark: "",
        packagingInstructions: PackagingInstructions.oneJutetwoPolly,
        additionalInstructions: "",
    });
    const [editingShipmentId, setEditingShipmentId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const debouncedSetSearch = useMemo(() => debounce((value: string) => setSearch(value), 300), []);

    const { data: stocksResponse, isLoading: stocksLoading } = useGetStocksQuery({
        page: page + 1,
        limit: rowsPerPage,
        search,
    });

    const { data: shipmentsResponse, isLoading: shipmentsLoading } = useGetShipmentsQuery(
        authUser?.cognitoInfo?.userId ? { userCognitoId: authUser.cognitoInfo.userId, page: 1, limit: 100 } : skipToken,
    );

    const [createShipment, { isLoading: creatingShipment }] = useCreateShipmentMutation();
    const [updateShipment, { isLoading: updatingShipment }] = useUpdateShipmentMutation();

    // Populate stocks with selection state
    useEffect(() => {
        if (stocksResponse?.data) {
            setStocks(
                stocksResponse.data.map((stock: Stock) => ({
                    ...stock,
                    selected: false,
                    quantity: 0,
                })),
            );
        }
    }, [stocksResponse]);

    const handleSelectStock = (id: number) => {
        setStocks((prev) =>
            prev.map((stock) => ({
                ...stock,
                selected: stock.id === id ? !stock.selected : stock.selected,
                quantity: stock.id === id && !stock.selected ? stock.weight : stock.quantity,
            })),
        );
    };

    const handleQuantityChange = (id: number, value: string) => {
        const numValue = parseFloat(value);
        setStocks((prev) =>
            prev.map((stock) => ({
                ...stock,
                quantity: stock.id === id && !isNaN(numValue) ? numValue : stock.quantity,
            })),
        );
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        setForm((prev) => ({ ...prev, [e.target.name!]: e.target.value }));
    };

    const validateForm = () => {
        if (!form.consignee) return "Consignee is required.";
        if (!form.shipmark) return "Shipmark is required.";
        const selectedStocks = stocks.filter((s) => s.selected);
        if (selectedStocks.length === 0) return "At least one stock must be selected.";
        for (const stock of selectedStocks) {
            if (stock.quantity <= 0) return `Quantity must be positive for stock ${stock.lotNo}.`;
            if (stock.quantity > stock.weight) return `Quantity for ${stock.lotNo} exceeds available ${stock.weight} kg.`;
        }
        return null;
    };

    const handleSubmit = async () => {
        const errorMsg = validateForm();
        if (errorMsg) {
            setError(errorMsg);
            return;
        }

        if (!authUser?.cognitoInfo?.userId) {
            setError("Missing user ID.");
            return;
        }

        const items = stocks
            .filter((s) => s.selected)
            .map((s) => ({
                stocksId: s.id,
                totalWeight: s.quantity,
            }));


        const payload = {
            items,
            shipmentDate: new Date().toISOString(),
            status: form.status ?? "Pending",
            consignee: form.consignee,
            vessel: form.vessel.toString(),
            shipmark: form.shipmark,
            packagingInstructions: form.packagingInstructions.toString(),
            additionalInstructions: form.additionalInstructions || undefined,
            userCognitoId: authUser.cognitoInfo.userId,
        };


        try {
            if (editingShipmentId) {
                await updateShipment({
                    userCognitoId: authUser.cognitoInfo.userId,
                    shipmentId: editingShipmentId,
                    shipment: payload,
                }).unwrap();
                setSuccessMessage("Shipment updated successfully!");
            } else {
                await createShipment(payload).unwrap();
                setSuccessMessage("Shipment created successfully!");
            }
            resetForm();
        } catch (err: any) {
            console.error("Shipment submission failed:", err);
            setError(err?.data?.message || "Failed to save shipment.");
        }
    };

    const handleEditShipment = (shipment: Shipment) => {
        setEditingShipmentId(shipment.id);
        setForm({
            items: shipment.items.map((item) => ({
                stocksId: item.stocksId,
                quantity: item.quantity,
            })),
            consignee: shipment.consignee,
            vessel: shipment.vessel as Vessel,
            shipmark: shipment.shipmark,
            packagingInstructions: shipment.packagingInstructions as PackagingInstructions,
            additionalInstructions: shipment.additionalInstructions || "",
        });

        setStocks((prev) =>
            prev.map((stock) => ({
                ...stock,
                selected: shipment.items.some((item) => item.stocksId === stock.id),
                quantity: shipment.items.find((item) => item.stocksId === stock.id)?.quantity || stock.quantity,
            })),
        );
    };

    const resetForm = () => {
        setForm({
            items: [],
            consignee: "",
            vessel: Vessel.first,
            shipmark: "",
            packagingInstructions: PackagingInstructions.oneJutetwoPolly,
            additionalInstructions: "",
        });
        setStocks((prev) =>
            prev.map((s) => ({
                ...s,
                selected: false,
                quantity: 0,
            })),
        );
        setEditingShipmentId(null);
        setError(null);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage(null);
    };

    if (authLoading || !authUser) {
        return (
            <Box sx={{ p: 3, maxWidth: 1300, mx: "auto" }}>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    p: { xs: 2, md: 3 },
                    maxWidth: 1300,
                    mx: "auto",
                    bgcolor: "background.default",
                    minHeight: "100vh",
                }}
            >
                <Snackbar
                    open={!!successMessage}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                    <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
                        {successMessage}
                    </Alert>
                </Snackbar>

                <Fade in timeout={500}>
                    <Box
                        sx={{
                            mb: 4,
                            py: 2,
                            px: 3,
                            bgcolor: "primary.main",
                            color: "white",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Manage Shipments
                        </Typography>
                    </Box>
                </Fade>

                <TextField
                    label="Search Stocks"
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
                    aria-label="Search stocks by lotNo or grade"
                />

                <Fade in timeout={600}>
                    <TableContainer component={Paper} sx={{ mb: 3, overflowX: "auto" }}>
                        <Table aria-label="Stocks selection table">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                    <TableCell>Select</TableCell>
                                    <TableCell>Lot No</TableCell>
                                    <TableCell>Mark</TableCell>
                                    <TableCell>Sale Code</TableCell>
                                    <TableCell>Grade</TableCell>
                                    <TableCell>Broker</TableCell>
                                    <TableCell>Invoice No</TableCell>
                                    <TableCell>Bags</TableCell>
                                    <TableCell>Weight (kg)</TableCell>
                                    <TableCell>Purchase Value</TableCell>
                                    <TableCell>Total Purchase Value</TableCell>
                                    <TableCell>Aging Days</TableCell>
                                    <TableCell>Penalty</TableCell>
                                    <TableCell>BGT Commission</TableCell>
                                    <TableCell>Maersk Fee</TableCell>
                                    <TableCell>Commission</TableCell>
                                    <TableCell>Net Price</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Assigned Quantity (kg)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stocksLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 19 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton variant="text" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : stocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={19}>
                                            <Alert severity="info">No stocks found.</Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stocks.map((stock, index) => (
                                        <TableRow
                                            key={stock.id}
                                            sx={{
                                                bgcolor: index % 2 === 0 ? "white" : "grey.50",
                                                "&:hover": { bgcolor: "grey.100" },
                                                transition: "background-color 0.2s",
                                            }}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={stock.selected}
                                                    onChange={() => handleSelectStock(stock.id)}
                                                    aria-label={`Select stock ${stock.lotNo}`}
                                                />
                                            </TableCell>
                                            <TableCell>{stock.lotNo}</TableCell>
                                            <TableCell>{stock.mark ?? "-"}</TableCell>
                                            <TableCell>{stock.saleCode ?? "-"}</TableCell>
                                            <TableCell>{stock.grade ?? "-"}</TableCell>
                                            <TableCell>{stock.broker ?? "-"}</TableCell>
                                            <TableCell>{stock.invoiceNo ?? "-"}</TableCell>
                                            <TableCell>{stock.bags}</TableCell>
                                            <TableCell>{stock.weight}</TableCell>
                                            <TableCell>{stock.purchaseValue}</TableCell>
                                            <TableCell>{stock.totalPurchaseValue}</TableCell>
                                            <TableCell>{stock.agingDays ?? "-"}</TableCell>
                                            <TableCell>{stock.penalty ?? "-"}</TableCell>
                                            <TableCell>{stock.bgtCommission ?? "-"}</TableCell>
                                            <TableCell>{stock.maerskFee ?? "-"}</TableCell>
                                            <TableCell>{stock.commission ?? "-"}</TableCell>
                                            <TableCell>{stock.netPrice ?? "-"}</TableCell>
                                            <TableCell>{stock.total ?? "-"}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={stock.selected ? stock.quantity : 0}
                                                    onChange={(e) => handleQuantityChange(stock.id, e.target.value)}
                                                    disabled={!stock.selected}
                                                    sx={{ width: 100 }}
                                                    inputProps={{ min: 0 }}
                                                    aria-label={`Assign quantity for ${stock.lotNo}`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Fade>

                <Fade in timeout={600}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            {editingShipmentId ? "Edit Shipment Details" : "New Shipment Details"}
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Section: Consignee Info */}
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Consignee Info
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                            <TextField
                                label="Consignee"
                                name="consignee"
                                value={form.consignee}
                                onChange={handleFormChange}
                                sx={{ flex: "1 0 200px" }}
                                required
                                aria-label="Consignee name"
                            />

                            {/* Section: Vessel */}
                            <Box sx={{ flex: "1 0 200px" }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                    Vessel
                                </Typography>
                                <Select
                                    name="vessel"
                                    value={form.vessel}
                                    onChange={handleSelectChange}
                                    fullWidth
                                    aria-label="Select vessel"
                                >
                                    <MenuItem value="first">First</MenuItem>
                                    <MenuItem value="second">Second</MenuItem>
                                    <MenuItem value="third">Third</MenuItem>
                                    <MenuItem value="fourth">Fourth</MenuItem>
                                </Select>
                            </Box>

                            {/* Section: Shipmark */}
                            <TextField
                                label="Shipmark"
                                name="shipmark"
                                value={form.shipmark}
                                onChange={handleFormChange}
                                sx={{ flex: "1 0 200px" }}
                                required
                                aria-label="Shipment Mark"
                            />

                            {/* Section: Packaging Instructions */}
                            <Box sx={{ flex: "1 0 200px" }}>
                                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                    Packaging Instructions
                                </Typography>
                                <Select
                                    name="packagingInstructions"
                                    value={form.packagingInstructions}
                                    onChange={handleSelectChange}
                                    fullWidth
                                    aria-label="Select packaging instructions"
                                >
                                    <MenuItem value="oneJuteTwoPolly">One Jute, Two Polly</MenuItem>
                                    <MenuItem value="oneJuteOnePolly">One Jute, One Polly</MenuItem>
                                </Select>
                            </Box>
                        </Box>

                        {/* Section: Additional Instructions */}
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Additional Instructions
                        </Typography>
                        <TextField
                            label="Additional Instructions"
                            name="additionalInstructions"
                            value={form.additionalInstructions}
                            onChange={handleFormChange}
                            multiline
                            rows={4}
                            sx={{ width: "100%", mb: 2 }}
                            aria-label="Additional shipment instructions"
                        />

                        {/* Section: Action Buttons */}
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleSubmit}
                                disabled={creatingShipment || updatingShipment}
                                aria-label={editingShipmentId ? "Update shipment" : "Create shipment"}
                            >
                                {creatingShipment || updatingShipment
                                    ? "Saving..."
                                    : editingShipmentId
                                        ? "Update Shipment"
                                        : "Create Shipment"}
                            </Button>
                            {editingShipmentId && (
                                <Button variant="outlined" color="secondary" onClick={resetForm} aria-label="Cancel editing">
                                    Cancel
                                </Button>
                            )}
                        </Box>
                    </Paper>
                </Fade>

                <Fade in timeout={600}>
                    <TableContainer component={Paper}>
                        <Typography variant="h6" sx={{ p: 2 }}>
                            Existing Shipments
                        </Typography>
                        <Table aria-label="Existing shipments table">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "grey.100" }}>
                                    <TableCell>Shipmark</TableCell>
                                    <TableCell>Consignee</TableCell>
                                    <TableCell>Vessel</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shipmentsLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton variant="text" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : shipmentsResponse?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Alert severity="info">No shipments found.</Alert>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shipmentsResponse?.data.map((shipment: Shipment, index: number) => (
                                        <TableRow
                                            key={shipment.id}
                                            sx={{
                                                bgcolor: index % 2 === 0 ? "white" : "grey.50",
                                                "&:hover": { bgcolor: "grey.100" },
                                                transition: "background-color 0.2s",
                                            }}
                                        >
                                            <TableCell>{shipment.shipmark}</TableCell>
                                            <TableCell>{shipment.consignee}</TableCell>
                                            <TableCell>{shipment.vessel}</TableCell>
                                            <TableCell>{shipment.status}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={shipmentsResponse?.meta.total || 0}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ bgcolor: "grey.100" }}
                        />
                    </TableContainer>
                </Fade>
            </Box>
        </ThemeProvider>
    );

};

export default ShipmentController;