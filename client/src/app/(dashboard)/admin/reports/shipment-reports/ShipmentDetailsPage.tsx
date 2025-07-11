'use client';
import React, {useState, useEffect, useMemo} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { fetchAuthSession, getCurrentUser, signOut } from 'aws-amplify/auth';
import {
    Box,
    Button,
    Typography,
    ThemeProvider,
    Snackbar,
    Alert,
    Card,
    CardHeader,
    CardContent,
    Divider,
    Avatar,
    Chip,
    Select,
    MenuItem,
    IconButton,
    LinearProgress,
    Table,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    TableHead,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    LocalShipping as ShippingIcon,
    Inventory as InventoryIcon,
    Person as PersonIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { useGetShipmentsQuery, useUpdateShipmentStatusMutation } from '@/state/api';
import { ShipmentStatus } from '@/state/enums';
import { createTheme } from '@mui/material/styles';

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
        h4: { fontWeight: 700, fontSize: '1.8rem', letterSpacing: '-0.5px' },
        h5: { fontWeight: 600, fontSize: '1.3rem' },
        h6: { fontWeight: 600, fontSize: '1.1rem' },
        subtitle1: { fontWeight: 500, fontSize: '0.9rem' },
        body1: { fontSize: '0.875rem' },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                },
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
                    '&:hover': { boxShadow: 'none' },
                },
                contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: { fontWeight: 600, color: '#374151', backgroundColor: '#f9fafb' },
                root: { borderBottom: '1px solid rgba(0,0,0,0.05)' },
            },
        },
        MuiChip: {
            styleOverrides: { root: { fontWeight: 500, fontSize: '0.75rem' } },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                    },
                },
            },
        },
    },
});

const statusColors = {
    [ShipmentStatus.Pending]: { bg: '#fff3e0', text: '#e65100' },
    [ShipmentStatus.Approved]: { bg: '#e3f2fd', text: '#1565c0' },
    [ShipmentStatus.Shipped]: { bg: '#e8f5e9', text: '#2e7d32' },
    [ShipmentStatus.Delivered]: { bg: '#e8f5e9', text: '#1b5e20' },
    [ShipmentStatus.Cancelled]: { bg: '#ffebee', text: '#c62828' },
};

type StatusOption = {
    value: ShipmentStatus | '';
    label: string;
    icon?: React.ReactNode;
};

const ShipmentDetailsPage = () => {
    const router = useRouter();
    const params = useParams();
    const shipmentId = params.id as string;
    const [newStatus, setNewStatus] = useState<ShipmentStatus | ''>('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    const { data: shipmentsData, isLoading: isShipmentLoading, error: shipmentError } = useGetShipmentsQuery(
        { page: 1, limit: 1, search: shipmentId },
        { skip: !isAuthChecked }
    );
    const shipment = shipmentsData?.data?.find(s => s.id === parseInt(shipmentId));
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

    useEffect(() => {
        if (shipment) {
            setNewStatus(shipment.status);
        }
    }, [shipment]);

    const handleStatusUpdate = async () => {
        if (!shipment || !newStatus) {
            setErrorMessage('Please select a valid status');
            return;
        }
        try {
            await updateShipmentStatus({
                id: shipment.id,
                status: newStatus as ShipmentStatus,
            }).unwrap();
            setSuccessMessage('Shipment status updated successfully');
        } catch (error) {
            console.error(`[${time()}] Error updating shipment status:`, error);
            setErrorMessage((error as any).data?.message || 'Failed to update shipment status');
        }
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage(null);
        setErrorMessage(null);
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

    if (!isAuthChecked || isShipmentLoading) {
        return (
            <ThemeProvider theme={theme}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    bgcolor: 'background.default'
                }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <LinearProgress sx={{ width: '100%', maxWidth: 360, mb: 2 }} />
                        <Typography variant="body1">Loading shipment details...</Typography>
                    </Box>
                </Box>
            </ThemeProvider>
        );
    }

    if (shipmentError || !shipment) {
        return (
            <ThemeProvider theme={theme}>
                <Box sx={{
                    p: { xs: 2, md: 4 },
                    maxWidth: 1400,
                    mx: 'auto',
                    bgcolor: 'background.default',
                    minHeight: '100vh'
                }}>
                    <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
                        Error: {(shipmentError as any)?.data?.message || 'Failed to fetch shipment details'}
                    </Alert>
                    <Button
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/dashboard/admin/reports')}
                        sx={{ mt: 2 }}
                    >
                        Back to Reports
                    </Button>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                p: { xs: 2, md: 4 },
                maxWidth: 1400,
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
                            Shipment Details - {shipment.shipmark}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {shipment.consignee}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.push('/dashboard/admin/reports')}
                        >
                            Back to Reports
                        </Button>
                    </Box>
                </Box>

                <Box sx={{
                    p: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        pb: 2,
                        mb: 3
                    }}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {shipment.consignee}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ShippingIcon fontSize="small" />
                                        Vessel: {shipment.vessel || 'N/A'}
                                    </Box>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarTodayIcon fontSize="small" />
                                        {format(new Date(shipment.shipmentDate), 'PP')}
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

                    <Box
                        display="grid"
                        gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                        gap={3}
                    >
                        {/* Client Info Card */}
                        <Box>
                            <Card variant="outlined">
                                <CardHeader
                                    title="Client Information"
                                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><PersonIcon /></Avatar>}
                                />
                                <Divider />
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                                            {shipment.user?.name?.charAt(0) || shipment.user?.email?.charAt(0) || '?'}
                                        </Avatar>
                                        <Box>
                                            <Typography fontWeight={500}>{shipment.user?.name || 'N/A'}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {shipment.user?.email || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DescriptionIcon fontSize="small" />
                                            Client ID: {shipment.userCognitoId}
                                        </Box>
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Shipment Details Card */}
                        <Box>
                            <Card variant="outlined">
                                <CardHeader
                                    title="Shipment Details"
                                    avatar={<Avatar sx={{ bgcolor: 'info.main' }}><DescriptionIcon /></Avatar>}
                                />
                                <Divider />
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">Packaging Instructions</Typography>
                                        <Typography>{shipment.packagingInstructions || 'N/A'}</Typography>
                                    </Box>
                                    {shipment.additionalInstructions && (
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">Additional Instructions</Typography>
                                            <Typography>{shipment.additionalInstructions}</Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>

                        {/* Items Table (Full width) */}
                        <Box gridColumn="span 2">
                            <Card variant="outlined">
                                <CardHeader
                                    title="Items"
                                    avatar={<Avatar sx={{ bgcolor: 'success.main' }}><InventoryIcon /></Avatar>}
                                    action={<Chip label={`${shipment.items?.length || 0} items`} color="primary" size="small" />}
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
                                                {Array.isArray(shipment.items) && shipment.items.length > 0 ? (
                                                    shipment.items.map((item) => (
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
                                                        <TableCell colSpan={7} align="center">No items available</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>


                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => router.push('/dashboard/admin/reports')}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleStatusUpdate}
                            disabled={isUpdatingStatus || !newStatus || newStatus === shipment.status}
                            startIcon={isUpdatingStatus ? null : <CheckCircleIcon />}
                        >
                            {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default ShipmentDetailsPage;