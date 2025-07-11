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
    Chip,
    Avatar,
    Card,
    CardHeader,
    CardContent,
    Divider,
    IconButton,
    LinearProgress,
    Grid
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    FilterAlt as FilterIcon,
    Refresh as RefreshIcon,
    ArrowDropDown as ArrowDropDownIcon,
    CheckCircle as CheckCircleIcon,
    LocalShipping as ShippingIcon,
    Inventory as InventoryIcon,
    Person as PersonIcon,
    CalendarToday as DateIcon,
    Description as DescriptionIcon,
    Email as EmailIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import {
    useGetShipmentsQuery,
    useGetLoggedInUsersQuery,
    useUpdateShipmentMutation,
    useUpdateShipmentStatusMutation,
} from '@/state/api';
import { Shipment, ShipmentResponse } from '@/state/shipment';
import { ShipmentStatus } from '@/state/enums';
import { UserResponse } from '@/state/user';

type StatusOption = {
    value: ShipmentStatus | '';
    label: string;
    icon?: React.ReactNode;
};

// Modern theme with professional color palette
const theme = createTheme({
    palette: {
        primary: { main: '#3f51b5' },
        secondary: { main: '#ff4081' },
        background: { default: '#f8fafc', paper: '#ffffff' },
        success: { main: '#4caf50' },
        warning: { main: '#ff9800' },
        error: { main: '#f44336' },
        info: { main: '#2196f3' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
            fontSize: '1.8rem',
            letterSpacing: '-0.5px'
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.3rem'
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.1rem'
        },
        subtitle1: {
            fontWeight: 500,
            fontSize: '0.9rem'
        },
        body1: {
            fontSize: '0.875rem'
        }
    },
    shape: {
        borderRadius: 12
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                }
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    padding: '8px 16px',
                    fontWeight: 500,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none'
                    }
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none'
                    }
                }
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    color: '#374151',
                    backgroundColor: '#f9fafb'
                },
                root: {
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                }
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    fontSize: '0.75rem'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                    }
                }
            }
        }
    },
});

const statusColors = {
    [ShipmentStatus.Pending]: { bg: '#fff3e0', text: '#e65100' },
    [ShipmentStatus.Approved]: { bg: '#e3f2fd', text: '#1565c0' },
    [ShipmentStatus.Shipped]: { bg: '#e8f5e9', text: '#2e7d32' },
    [ShipmentStatus.Delivered]: { bg: '#e8f5e9', text: '#1b5e20' },
    [ShipmentStatus.Cancelled]: { bg: '#ffebee', text: '#c62828' }
};

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
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [updateShipment] = useUpdateShipmentMutation();
    const [updateShipmentStatus, { isLoading: isUpdatingStatus }] = useUpdateShipmentStatusMutation();

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

    const { data: shipmentsData, isLoading: isShipmentsLoading, error: shipmentsError, refetch: refetchShipments } = useGetShipmentsQuery(
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
    }, [shipmentsData, shipmentsError, usersData, usersError]);

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
            await updateShipmentStatus({
                id: selectedShipment.id,
                status: newStatus as ShipmentStatus,
            }).unwrap();
            setSuccessMessage('Shipment status updated successfully');
            refetchShipments();
            closeDetails();
        } catch (error) {
            console.error(`[${time()}] Error updating shipment status:`, error);
            setErrorMessage((error as any).data?.message || 'Failed to update shipment status');
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

    const statusOptions: StatusOption[] = useMemo(
        () => [
            { value: '', label: 'All Statuses' },
            ...Object.values(ShipmentStatus).map((status) => ({
                value: status,
                label: status,
                icon: status === ShipmentStatus.Delivered ? <CheckCircleIcon fontSize="small" /> :
                    status === ShipmentStatus.Shipped ? <ShippingIcon fontSize="small" /> :
                        <InventoryIcon fontSize="small" />
            })),
        ],
        []
    );

    const toggleFilters = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    const getStatusCount = (status: ShipmentStatus) => {
        return shipmentsData?.data?.filter(s => s.status === status).length || 0;
    };

    if (!isAuthChecked) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                bgcolor: 'background.default'
            }}>
                <LinearProgress sx={{ width: '100%', maxWidth: 360 }} />
            </Box>
        );
    }

    if (isShipmentsLoading || isUsersLoading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                bgcolor: 'background.default'
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <LinearProgress sx={{ width: '100%', maxWidth: 360, mb: 2 }} />
                    <Typography variant="body1">Loading shipment data...</Typography>
                </Box>
            </Box>
        );
    }

    if (shipmentsError || usersError) {
        const error = shipmentsError || usersError;
        if ((error as any).status === 401 || (error as any).data?.message?.includes('Unauthorized')) {
            return (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    bgcolor: 'background.default',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
                        Your session has expired. Please log in again.
                    </Alert>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            await signOut();
                            router.push('/login');
                        }}
                    >
                        Log In
                    </Button>
                </Box>
            );
        }
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                bgcolor: 'background.default'
            }}>
                <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
                    Error: {(error as any).data?.message || 'Failed to fetch data'}
                </Alert>
            </Box>
        );
    }

    if (!shipmentsData?.data?.length) {
        return (
            <ThemeProvider theme={theme}>
                <Box sx={{
                    p: { xs: 2, md: 4 },
                    maxWidth: 1400,
                    mx: 'auto',
                    bgcolor: 'background.default',
                    minHeight: '100vh'
                }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" gutterBottom>
                            Shipment Reports
                        </Typography>
                        <Typography color="text.secondary">
                            No shipments found matching your criteria
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={() => refetchShipments()}
                    >
                        Refresh Data
                    </Button>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                p: { xs: 2, md: 4 },
                maxWidth: 1800,
                mx: 'auto',
                bgcolor: 'background.default',
                minHeight: '100vh'
            }}>
                <Snackbar
                    open={!!successMessage || !!errorMessage}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={successMessage ? 'success' : 'error'}
                        sx={{ width: '100%' }}
                        elevation={6}
                    >
                        {successMessage || errorMessage}
                    </Alert>
                </Snackbar>

                {/* Header Section */}
                <Box sx={{
                    mb: 4,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Shipment Reports
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {shipmentsData?.meta?.total || 0} total shipments
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => refetchShipments()}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant={isFilterOpen ? "contained" : "outlined"}
                            startIcon={<FilterIcon />}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={toggleFilters}
                        >
                            Filters
                        </Button>
                    </Box>
                </Box>

                {/* Status Summary Cards */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                    gap: 2,
                    mb: 4
                }}>
                    {statusOptions.slice(1).map((status) => (
                        <Card key={status.value} sx={{
                            borderLeft: `4px solid ${statusColors[status.value as ShipmentStatus].text}`,
                            '&:hover': {
                                borderLeftWidth: 6,
                                transition: 'border-left-width 0.2s ease'
                            }
                        }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{
                                        bgcolor: statusColors[status.value as ShipmentStatus].bg,
                                        color: statusColors[status.value as ShipmentStatus].text
                                    }}>
                                        {status.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            {status.label}
                                        </Typography>
                                        <Typography variant="h5" fontWeight={600}>
                                            {getStatusCount(status.value as ShipmentStatus)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Filter Section */}
                <Fade in={isFilterOpen}>
                    <Box sx={{
                        mb: 3,
                        p: 3,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 1
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Filter Shipments
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                            gap: 2
                        }}>
                            <TextField
                                fullWidth
                                label="Search"
                                placeholder="Shipmark, consignee..."
                                value={searchTerm}
                                onChange={handleSearch}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Select
                                fullWidth
                                value={statusFilter}
                                onChange={handleStatusFilter}
                                displayEmpty
                                renderValue={(selected) => selected || "Status"}
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {option.icon}
                                            {option.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            <Select
                                fullWidth
                                value={clientFilter}
                                onChange={handleClientFilter}
                                displayEmpty
                                renderValue={(selected) => selected ? usersData?.data?.data?.find(u => u.userCognitoId === selected)?.name || "Client" : "All Clients"}
                            >
                                <MenuItem value="">All Clients</MenuItem>
                                {usersData?.data?.data?.map((user) => (
                                    <MenuItem key={user.userCognitoId} value={user.userCognitoId}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{
                                                width: 24,
                                                height: 24,
                                                bgcolor: 'primary.main',
                                                fontSize: '0.75rem'
                                            }}>
                                                {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                            </Avatar>
                                            {user.name || user.email || user.userCognitoId}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            <Select
                                fullWidth
                                value={limit}
                                onChange={handleLimitChange}
                                renderValue={(selected) => `Show ${selected}`}
                            >
                                <MenuItem value={10}>10 per page</MenuItem>
                                <MenuItem value={20}>20 per page</MenuItem>
                                <MenuItem value={50}>50 per page</MenuItem>
                            </Select>
                        </Box>
                    </Box>
                </Fade>

                {/* Main Table */}
                <Card>
                    <TableContainer component={Paper} elevation={0}>
                        <Table aria-label="Shipments table" sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Shipmark</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Consignee</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {shipmentsData.data.map((shipment: Shipment) => {
                                    const user = getUserForShipment(shipment);
                                    return (
                                        <TableRow
                                            key={shipment.id}
                                            hover
                                            sx={{
                                                '&:last-child td': { borderBottom: 0 },
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => openDetails(shipment)}
                                        >
                                            <TableCell>
                                                <Typography fontWeight={500}>
                                                    {shipment.shipmark}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: 'primary.main',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight={500}>
                                                            {user.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {user.email || user.userCognitoId}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{shipment.consignee}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <DateIcon color="action" fontSize="small" />
                                                    {format(new Date(shipment.shipmentDate), 'MMM dd, yyyy')}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={shipment.status}
                                                    sx={{
                                                        backgroundColor: statusColors[shipment.status].bg,
                                                        color: statusColors[shipment.status].text,
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    endIcon={<MoreIcon />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDetails(shipment);
                                                    }}
                                                >
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50]}
                        component="div"
                        count={shipmentsData?.meta.total || 0}
                        rowsPerPage={limit}
                        page={page}
                        onPageChange={(event, newPage) => setPage(newPage)}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    />
                </Card>

                {/* Shipment Details Dialog */}
                <Dialog
                    open={!!selectedShipment}
                    onClose={closeDetails}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'visible'
                        }
                    }}
                >
                    <DialogTitle sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Box>
                            <Typography variant="h6">Shipment Details</Typography>
                            <Typography variant="subtitle1" color="rgba(255,255,255,0.7)">
                                {selectedShipment?.shipmark}
                            </Typography>
                        </Box>
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={closeDetails}
                            aria-label="close"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ p: 0 }}>
                        {selectedShipment && (
                            <Box>
                                {/* Header Section */}
                                <Box sx={{
                                    p: 3,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <Box>
                                        <Typography variant="h6" gutterBottom>
                                            {selectedShipment.consignee}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <ShippingIcon fontSize="small" />
                                                    Vessel: {selectedShipment.vessel || 'N/A'}
                                                </Box>
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <DateIcon fontSize="small" />
                                                    {format(new Date(selectedShipment.shipmentDate), 'PP')}
                                                </Box>
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                                        sx={{ minWidth: 180 }}
                                        renderValue={(selected) => (
                                            <Chip
                                                label={selected}
                                                sx={{
                                                    backgroundColor: statusColors[selected as ShipmentStatus].bg,
                                                    color: statusColors[selected as ShipmentStatus].text,
                                                    fontWeight: 600,
                                                    width: '100%'
                                                }}
                                            />
                                        )}
                                    >
                                        {statusOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value} disabled={option.value === ''}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {option?.icon}
                                                    {option.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                {/* Main Content */}
                                <Box sx={{ p: 3 }}>
                                    {/* Container with Flexbox, wrap on small screens */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {/* Client Info Card */}
                                        <Box sx={{ flex: '1 1 100%', maxWidth: { md: '48%' } }}>
                                            <Card variant="outlined">
                                                <CardHeader
                                                    title="Client Information"
                                                    avatar={
                                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                    }
                                                />
                                                <Divider />
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                                                            {getUserForShipment(selectedShipment).name?.charAt(0) ||
                                                                getUserForShipment(selectedShipment).email?.charAt(0) ||
                                                                '?'}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={500}>
                                                                {getUserForShipment(selectedShipment).name || 'N/A'}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {getUserForShipment(selectedShipment).email || 'N/A'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DescriptionIcon fontSize="small" />
                                                            Client ID: {selectedShipment.userCognitoId}
                                                        </Box>
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Box>

                                        {/* Shipment Details */}
                                        <Box sx={{ flex: '1 1 100%', maxWidth: { md: '48%' } }}>
                                            <Card variant="outlined">
                                                <CardHeader
                                                    title="Shipment Details"
                                                    avatar={
                                                        <Avatar sx={{ bgcolor: 'info.main' }}>
                                                            <DescriptionIcon />
                                                        </Avatar>
                                                    }
                                                />
                                                <Divider />
                                                <CardContent>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Packaging Instructions
                                                        </Typography>
                                                        <Typography>{selectedShipment.packagingInstructions || 'N/A'}</Typography>
                                                    </Box>
                                                    {selectedShipment.additionalInstructions && (
                                                        <Box>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Additional Instructions
                                                            </Typography>
                                                            <Typography>{selectedShipment.additionalInstructions}</Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Box>
                                    </Box>

                                    {/* Items Table (full width) */}
                                    <Box sx={{ mt: 3 }}>
                                        <Card variant="outlined">
                                            <CardHeader
                                                title="Items"
                                                avatar={
                                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                                        <InventoryIcon />
                                                    </Avatar>
                                                }
                                                action={
                                                    <Chip
                                                        label={`${selectedShipment.items?.length || 0} items`}
                                                        color="primary"
                                                        size="small"
                                                    />
                                                }
                                            />
                                            <Divider />
                                            <CardContent sx={{ p: 0 }}>
                                                <TableContainer sx={{ maxHeight: 440 }}>
                                                    <Table stickyHeader size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Stock ID</TableCell>
                                                                <TableCell>Lot No</TableCell>
                                                                <TableCell>Mark</TableCell>
                                                                <TableCell>Grade</TableCell>
                                                                <TableCell align="right">Bags</TableCell>
                                                                <TableCell align="right">Weight (kg)</TableCell>
                                                                <TableCell align="right">Assigned Qty</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {Array.isArray(selectedShipment.items) && selectedShipment.items.length > 0 ? (
                                                                selectedShipment.items.map((item) => (
                                                                    <TableRow key={item.id}>
                                                                        <TableCell>{item.stocksId}</TableCell>
                                                                        <TableCell>{item.stock?.lotNo || '-'}</TableCell>
                                                                        <TableCell>{item.stock?.mark || '-'}</TableCell>
                                                                        <TableCell>{item.stock?.grade || '-'}</TableCell>
                                                                        <TableCell align="right">{item.stock?.bags || '-'}</TableCell>
                                                                        <TableCell align="right">{item.stock?.weight || '-'}</TableCell>
                                                                        <TableCell align="right">{item.quantity}</TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} align="center">
                                                                        No items available
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </CardContent>
                                        </Card>
                                    </Box>
                                </Box>

                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Button
                            variant="outlined"
                            onClick={closeDetails}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleStatusUpdate}
                            disabled={isUpdatingStatus || !newStatus || newStatus === selectedShipment?.status}
                            startIcon={isUpdatingStatus ? null : <CheckCircleIcon />}
                        >
                            {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </ThemeProvider>
    );
};

export default ReportsPage;