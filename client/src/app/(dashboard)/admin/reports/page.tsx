'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
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
    Select,
    MenuItem,
    Button,
    Typography,
    Alert,
    Fade,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    createTheme,
    ThemeProvider,
    Snackbar,
    SelectChangeEvent,
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import {
    useGetShipmentsQuery,
    useGetLoggedInUsersQuery,
    useUpdateShipmentMutation,
    useUpdateShipmentStatusMutation,
} from '@/state/api';
import { Shipment, ShipmentResponse } from '@/state/shipment';
import { ShipmentStatus } from '@/state/enums';
import { UserResponse } from '@/state/user';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#757575' },
        background: { default: '#f5f7fa', paper: '#ffffff' },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
    },
    components: {
        MuiPaper: {
            styleOverrides: { root: { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
        },
        MuiButton: {
            styleOverrides: { root: { borderRadius: 8, textTransform: 'none', padding: '8px 16px' } },
        },
        MuiTableCell: {
            styleOverrides: { head: { fontWeight: 600, color: '#424242' } },
        },
    },
});

const ReportsPage = () => {
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');
    const [clientFilter, setClientFilter] = useState<string>('');
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [newStatus, setNewStatus] = useState<ShipmentStatus | ''>('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [updateShipment] = useUpdateShipmentMutation();
    const [updateShipmentStatus, { isLoading: isUpdatingStatus, error: updateStatusError, isSuccess: updateStatusSuccess }] =
        useUpdateShipmentStatusMutation();

    const time = () => new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                console.log(`[${time()}] Authenticated user:`, user);
                setIsAuthChecked(true);
            } catch (error) {
                console.error(`[${time()}] Authentication error:`, error);
                await signOut();
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    const shipmentQueryParams = useMemo(
        () => ({
            page: page + 1,
            limit,
            search: searchTerm || undefined,
            status: statusFilter || undefined,
            userCognitoId: clientFilter || undefined,
        }),
        [page, limit, searchTerm, statusFilter, clientFilter]
    );

    const { data: shipmentsData, isLoading: isShipmentsLoading, error: shipmentsError } = useGetShipmentsQuery(
        shipmentQueryParams,
        { skip: !isAuthChecked }
    );

    const { data: usersData, isLoading: isUsersLoading, error: usersError } = useGetLoggedInUsersQuery(
        { page: 1, limit: 100, search: '', includeShipments: true },
        { skip: !isAuthChecked }
    );

    useEffect(() => {
        if (shipmentsData) console.log(`[${time()}] getAllShipments Response:`, JSON.stringify(shipmentsData, null, 2));
        if (shipmentsError) console.error(`[${time()}] getAllShipments Error:`, shipmentsError);
        if (usersData) console.log(`[${time()}] getUsers Response:`, JSON.stringify(usersData, null, 2));
        if (usersError) console.error(`[${time()}] getUsers Error:`, usersError);
        if (updateStatusSuccess) {
            setSuccessMessage('Shipment status updated successfully');
            setSelectedShipment((prev) => (prev ? { ...prev, status: newStatus as ShipmentStatus } : null));
            setNewStatus('');
        }
        if (updateStatusError) {
            setErrorMessage((updateStatusError as any).data?.message || 'Failed to update shipment status');
        }
    }, [shipmentsData, shipmentsError, usersData, usersError, updateStatusSuccess, updateStatusError, newStatus]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const handleStatusFilter = (e: SelectChangeEvent<string>) => {
        setStatusFilter(e.target.value as ShipmentStatus);
        setPage(0);
    };

    const handleClientFilter = (e: SelectChangeEvent<string>) => {
        setClientFilter(e.target.value);
        setPage(0);
    };

    const handleLimitChange = (e: SelectChangeEvent<number>) => {
        setLimit(Number(e.target.value));
        setPage(0);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLimit(parseInt(e.target.value, 10));
        setPage(0);
    };

    const openDetails = (shipment: Shipment) => {
        setSelectedShipment(shipment);
        setNewStatus(shipment.status);
    };

    const closeDetails = () => {
        setSelectedShipment(null);
        setNewStatus('');
        setErrorMessage(null);
    };

    const handleStatusUpdate = async () => {
        if (!selectedShipment || !newStatus) {
            setErrorMessage('Please select a valid status');
            return;
        }
        try {
            const response = await updateShipmentStatus({
                id: selectedShipment.id,
                status: newStatus as ShipmentStatus,
            }).unwrap();
            // Update local state with the returned shipment data
            setSelectedShipment((prev) => (prev ? { ...prev, ...response.data } : null));
        } catch (error) {
            console.error(`[${time()}] Error updating shipment status:`, error);
        }
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    const getUserForShipment = (shipment: Shipment) => {
        const users = usersData?.data?.data as UserResponse[];
        return (
            users?.find((user) => user.userCognitoId === shipment.userCognitoId) || {
                name: 'N/A',
                email: 'N/A',
                userCognitoId: shipment.userCognitoId,
            }
        );
    };

    const statusOptions = useMemo(
        () => [
            { value: '', label: 'Select Status' },
            ...Object.values(ShipmentStatus).map((status) => ({ value: status, label: status })),
        ],
        []
    );

    if (!isAuthChecked) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <Typography>Checking authentication...</Typography>
            </Box>
        );
    }

    if (isShipmentsLoading || isUsersLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <Typography>Loading data...</Typography>
            </Box>
        );
    }

    if (shipmentsError || usersError) {
        const error = shipmentsError || usersError;
        if ((error as any).status === 401 || (error as any).data?.message?.includes('Unauthorized')) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                    <Typography color="error">Unauthorized: Please log in again.</Typography>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={async () => {
                            await signOut();
                            router.push('/login');
                        }}
                        sx={{ ml: 2 }}
                    >
                        Log In
                    </Button>
                </Box>
            );
        }
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <Alert severity="error">Error: {(error as any).data?.message || 'Failed to fetch data'}</Alert>
            </Box>
        );
    }

    if (!shipmentsData?.data?.length) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <Typography>No shipments found.</Typography>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto', bgcolor: 'background.default', minHeight: '100vh' }}>
                <Snackbar
                    open={!!successMessage || !!errorMessage}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={successMessage ? 'success' : 'error'} sx={{ width: '100%' }}>
                        {successMessage || errorMessage}
                    </Alert>
                </Snackbar>

                <Fade in timeout={500}>
                    <Box sx={{ mb: 4, py: 2, px: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                        <Typography variant="h4">Shipment Reports</Typography>
                    </Box>
                </Fade>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, bgcolor: 'white', p: 2, borderRadius: 2 }}>
                    <TextField
                        label="Search by Shipmark or Consignee"
                        value={searchTerm}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flex: '1 0 200px' }}
                        aria-label="Search shipments"
                    />
                    <Select value={statusFilter} onChange={handleStatusFilter} sx={{ flex: '1 0 200px' }} displayEmpty aria-label="Filter by status">
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    <Select value={clientFilter} onChange={handleClientFilter} sx={{ flex: '1 0 200px' }} displayEmpty aria-label="Filter by client">
                        <MenuItem value="">All Clients</MenuItem>
                        {usersData?.data?.data?.map((user) => (
                            <MenuItem key={user.userCognitoId} value={user.userCognitoId}>
                                {user.name || user.email || user.userCognitoId}
                            </MenuItem>
                        ))}
                    </Select>
                    <Select<number>
                        value={limit}
                        onChange={handleLimitChange}
                        sx={{ flex: '1 0 100px' }}
                        aria-label="Rows per page"
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </Box>

                <Fade in timeout={600}>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table aria-label="Shipments table">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                    <TableCell>Shipmark</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Consignee</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shipmentsData.data.map((shipment: Shipment, index: number) => {
                                    const user = getUserForShipment(shipment);
                                    return (
                                        <TableRow
                                            key={shipment.id}
                                            sx={{
                                                bgcolor: index % 2 === 0 ? 'white' : 'grey.50',
                                                '&:hover': { bgcolor: 'grey.100' },
                                                transition: 'background-color 0.2s',
                                            }}
                                        >
                                            <TableCell>{shipment.shipmark}</TableCell>
                                            <TableCell>{user.name || user.email || user.userCognitoId}</TableCell>
                                            <TableCell>{shipment.consignee}</TableCell>
                                            <TableCell>{format(new Date(shipment.shipmentDate), 'PP')}</TableCell>
                                            <TableCell>
                                                <Typography
                                                    sx={{
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'medium',
                                                        bgcolor:
                                                            shipment.status === ShipmentStatus.Pending
                                                                ? 'yellow.100'
                                                                : shipment.status === ShipmentStatus.Approved
                                                                    ? 'blue.100'
                                                                    : shipment.status === ShipmentStatus.Shipped
                                                                        ? 'indigo.100'
                                                                        : shipment.status === ShipmentStatus.Delivered
                                                                            ? 'green.100'
                                                                            : 'red.100',
                                                        color:
                                                            shipment.status === ShipmentStatus.Pending
                                                                ? 'yellow.800'
                                                                : shipment.status === ShipmentStatus.Shipped
                                                                    ? 'blue.800'
                                                                    : shipment.status === ShipmentStatus.Cancelled
                                                                        ? 'indigo.800'
                                                                        : shipment.status === ShipmentStatus.Delivered
                                                                            ? 'green.800'
                                                                            : 'red.800',
                                                    }}
                                                >
                                                    {shipment.status}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => openDetails(shipment)}
                                                    aria-label={`View details for shipment ${shipment.shipmark}`}
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 20, 50]}
                            component="div"
                            count={shipmentsData?.meta.total || 0}
                            rowsPerPage={limit}
                            page={page}
                            onPageChange={(event, newPage) => setPage(newPage)}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            sx={{ backgroundColor: 'grey.100' }}
                        />
                    </TableContainer>
                </Fade>

                <Dialog open={!!selectedShipment} onClose={closeDetails}>
                    <DialogTitle>
                        Shipment Details - {selectedShipment?.shipmark}
                        <Button
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                            onClick={closeDetails}
                            aria-label="Close dialog"
                        >
                            <CloseIcon />
                        </Button>
                    </DialogTitle>
                    <DialogContent>
                        {selectedShipment && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6">General Information</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Shipmark
                                        </Typography>
                                        <Typography>{selectedShipment.shipmark}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                                            fullWidth
                                            aria-label="Update shipment status"
                                        >
                                            {statusOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Shipment Date
                                        </Typography>
                                        <Typography>{format(new Date(selectedShipment.shipmentDate), 'PP')}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Consignee
                                        </Typography>
                                        <Typography>{selectedShipment.consignee}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Vessel
                                        </Typography>
                                        <Typography>{selectedShipment.vessel}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Packaging Instructions
                                        </Typography>
                                        <Typography>{selectedShipment.packagingInstructions}</Typography>
                                    </Box>
                                    {selectedShipment.additionalInstructions && (
                                        <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Additional Instructions
                                            </Typography>
                                            <Typography>{selectedShipment.additionalInstructions}</Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    Client Information
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Name
                                        </Typography>
                                        <Typography>{getUserForShipment(selectedShipment).name || 'N/A'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography>{getUserForShipment(selectedShipment).email || 'N/A'}</Typography>
                                    </Box>
                                </Box>
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    Items
                                </Typography>
                                <TableContainer sx={{ overflowX: 'auto' }}>
                                    <Table aria-label="Shipment items table">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                                <TableCell>Stock ID</TableCell>
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
                                            {Array.isArray(selectedShipment.items) && selectedShipment.items.length > 0 ? (
                                                selectedShipment.items.map((item, index) => (
                                                    <TableRow
                                                        key={item.id}
                                                        sx={{
                                                            bgcolor: index % 2 === 0 ? 'white' : 'grey.50',
                                                            '&:hover': { bgcolor: 'grey.100' },
                                                        }}
                                                    >
                                                        <TableCell>{item.stocksId}</TableCell>
                                                        <TableCell>{item.stock?.lotNo ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.mark ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.saleCode ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.grade ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.broker ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.invoiceNo ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.bags ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.weight ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.purchaseValue ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.totalPurchaseValue ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.agingDays ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.penalty ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.bgtCommission ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.maerskFee ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.commission ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.netPrice ?? '-'}</TableCell>
                                                        <TableCell>{item.stock?.total ?? '-'}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={19} align="center">
                                                        No items available
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={closeDetails}
                            aria-label="Close dialog"
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleStatusUpdate}
                            disabled={isUpdatingStatus || !newStatus || newStatus === selectedShipment?.status}
                            aria-label="Save shipment status"
                        >
                            {isUpdatingStatus ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};

export default ReportsPage;