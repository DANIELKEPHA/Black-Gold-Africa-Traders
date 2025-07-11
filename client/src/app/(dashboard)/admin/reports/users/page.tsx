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
    IconButton,
    LinearProgress,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterAlt as FilterIcon,
    Refresh as RefreshIcon,
    ArrowDropDown as ArrowDropDownIcon,
    Email as EmailIcon,
    Add as AddIcon,
    Edit as EditIcon,
    History as HistoryIcon,
    MoreVert as MoreIcon,
} from '@mui/icons-material';
import {
    useGetLoggedInUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
} from '@/state/api';
import { UserResponse } from '@/state/user';

interface UserDialogData {
    id: number;
    userCognitoId: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: 'user' | 'admin';
    createdAt: string;
    // Don't include complex nested types if not needed in dialog
}

// Define theme consistent with previous styling
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

const roleColors = {
    admin: { bg: '#e3f2fd', text: '#1565c0' },
    user: { bg: '#e8f5e9', text: '#2e7d32' },
};

const UsersPage = () => {
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
    const [newUser, setNewUser] = useState<Partial<UserResponse>>({
        userCognitoId: '',
        name: null,
        email: null,
        phoneNumber: null,
        role: 'user',
    });

    const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();

    const queryParams = useMemo(
        () => ({
            page: page + 1,
            limit,
            search: searchTerm || undefined,
            includeShipments: false,
            includeFavoritedStocks: false,
            includeAssignedStocks: false,
        }),
        [page, limit, searchTerm]
    );

    const { data: usersData, isLoading: isUsersLoading, error: usersError, refetch: refetchUsers } = useGetLoggedInUsersQuery(
        queryParams,
        { skip: !isAuthChecked }
    );

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
        if (usersData) console.log(`[${time()}] getLoggedInUsers Response:`, JSON.stringify(usersData, null, 2));
        if (usersError) console.error(`[${time()}] getLoggedInUsers Error:`, usersError);
    }, [usersData, usersError]);

    const filteredUsers = useMemo(() => {
        if (!usersData?.data?.data) return [];
        return usersData.data.data.filter(user =>
            !roleFilter || user.role.toLowerCase() === roleFilter.toLowerCase()
        );
    }, [usersData, roleFilter]);

    const totalUsers = filteredUsers.length;
    const paginatedUsers = useMemo(() => {
        const start = page * limit;
        const end = start + limit;
        return filteredUsers.slice(start, end);
    }, [filteredUsers, page, limit]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const handleRoleFilter = (e: SelectChangeEvent<string>) => {
        setRoleFilter(e.target.value);
        setPage(0);
    };

    const handleLimitChange = (e: SelectChangeEvent<number>) => {
        setLimit(Number(e.target.value));
        setPage(0);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setLimit(parseInt(e.target.value, 10));
        setPage(0);
    };

    const handleCreateUser = async () => {
        try {
            if (!newUser.userCognitoId || !newUser.email) {
                throw new Error('Cognito ID and Email are required');
            }
            await createUser(newUser as Partial<UserResponse>).unwrap();
            setSuccessMessage('User created successfully');
            setOpenCreateDialog(false);
            setNewUser({ userCognitoId: '', name: null, email: null, phoneNumber: null, role: 'user' });
            refetchUsers();
        } catch (error) {
            console.error(`[${time()}] Error creating user:`, error);
            setErrorMessage((error as any).data?.message || 'Failed to create user');
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser || !newUser.userCognitoId) return;
        try {
            await updateUser(newUser as { userCognitoId: string } & Partial<UserResponse>).unwrap();
            setSuccessMessage('User updated successfully');
            setOpenUpdateDialog(false);
            setSelectedUser(null);
            setNewUser({ userCognitoId: '', name: null, email: null, phoneNumber: null, role: 'user' });
            refetchUsers();
        } catch (error) {
            console.error(`[${time()}] Error updating user:`, error);
            setErrorMessage((error as any).data?.message || 'Failed to update user');
        }
    };

    const handleCloseSnackbar = () => {
        setSuccessMessage(null);
        setErrorMessage(null);
    };

    const openUpdateDialogWithUser = (user: UserResponse) => {
        setSelectedUser(user);
        setNewUser({
            userCognitoId: user.userCognitoId,
            name: user.name ?? null,
            email: user.email ?? null,
            phoneNumber: user.phoneNumber ?? null,
            role: user.role,
        });
        setOpenUpdateDialog(true);
    };


    if (!isAuthChecked) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <LinearProgress sx={{ width: '100%', maxWidth: 360 }} />
            </Box>
        );
    }

    if (isUsersLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <LinearProgress sx={{ width: '100%', maxWidth: 360, mb: 2 }} />
                    <Typography variant="body1">Loading users...</Typography>
                </Box>
            </Box>
        );
    }

    if (usersError) {
        if ((usersError as any).status === 401 || (usersError as any).data?.message?.includes('Unauthorized')) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default', flexDirection: 'column', gap: 2 }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <Alert severity="error" sx={{ width: '100%', maxWidth: 500 }}>
                    Error: {(usersError as any).data?.message || 'Failed to fetch users'}
                </Alert>
            </Box>
        );
    }

    if (!filteredUsers.length) {
        return (
            <ThemeProvider theme={theme}>
                <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', bgcolor: 'background.default', minHeight: '100vh' }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" gutterBottom>
                            Users
                        </Typography>
                        <Typography color="text.secondary">
                            No users found matching your criteria
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
                        Add New User
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetchUsers()} sx={{ ml: 2 }}>
                        Refresh Data
                    </Button>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', minHeight: '100vh' }}>
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
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Users Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {totalUsers} total users
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
                            Add New User
                        </Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetchUsers()}>
                            Refresh
                        </Button>
                        <Button
                            variant={isFilterOpen ? 'contained' : 'outlined'}
                            startIcon={<FilterIcon />}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            Filters
                        </Button>
                    </Box>
                </Box>

                {/* Filter Section */}
                <Fade in={isFilterOpen}>
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Filter Users
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Search"
                                placeholder="Name, email..."
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
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select value={roleFilter} onChange={handleRoleFilter} label="Role">
                                    <MenuItem value="">All Roles</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="user">User</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Show</InputLabel>
                                <Select value={limit} onChange={handleLimitChange} label="Show">
                                    <MenuItem value={10}>10 per page</MenuItem>
                                    <MenuItem value={20}>20 per page</MenuItem>
                                    <MenuItem value={50}>50 per page</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Fade>

                {/* Main Table */}
                <Box
                    sx={{
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 1, // optional: mimics Card elevation
                    }}
                >
                    <TableContainer component={Paper} elevation={0}>
                        <Table aria-label="Users table" sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedUsers.map((user) => (
                                    <TableRow
                                        key={user.userCognitoId}
                                        hover
                                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        bgcolor: 'primary.main',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                                                </Avatar>
                                                <Typography fontWeight={500}>
                                                    {user.name || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <EmailIcon color="action" fontSize="small" />
                                                {user.email || 'N/A'}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role}
                                                sx={{
                                                    backgroundColor:
                                                        roleColors[user.role.toLowerCase() as keyof typeof roleColors]?.bg || '#f5f5f5',
                                                    color:
                                                        roleColors[user.role.toLowerCase() as keyof typeof roleColors]?.text || '#333',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={() =>
                                                    openUpdateDialogWithUser({
                                                        id: user.id,
                                                        userCognitoId: user.userCognitoId,
                                                        name: user.name ?? null,
                                                        email: user.email ?? null,
                                                        phoneNumber: user.phoneNumber ?? null,
                                                        role: user.role === 'user' || user.role === 'admin' ? user.role : 'user',
                                                        createdAt: user.createdAt
                                                    })
                                                }
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>

                                            <IconButton
                                                onClick={() =>
                                                    router.push(`/admin/users/${user.userCognitoId}/stock-history`)
                                                }
                                            >
                                                <HistoryIcon fontSize="small" />
                                            </IconButton>
                                            {/*<IconButton*/}
                                            {/*    onClick={() =>*/}
                                            {/*        router.push(`/admin/users/${user.userCognitoId}`)*/}
                                            {/*    }*/}
                                            {/*>*/}
                                            {/*    <MoreIcon fontSize="small" />*/}
                                            {/*</IconButton>*/}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50]}
                        component="div"
                        count={totalUsers}
                        rowsPerPage={limit}
                        page={page}
                        onPageChange={(event, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleRowsPerPageChange(e)}
                        sx={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    />
                </Box>


                {/* Create User Dialog */}
<Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} fullWidth maxWidth="sm">
    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        Create New User
    </DialogTitle>
    <DialogContent sx={{ p: 3 }}>
        <TextField
            fullWidth
            label="Cognito ID"
            value={newUser.userCognitoId}
            onChange={(e) => setNewUser({ ...newUser, userCognitoId: e.target.value })}
            margin="normal"
            required
        />
        <TextField
            fullWidth
            label="Name"
            value={newUser.name ?? ''}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value || null })}
            margin="normal"
        />
        <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email ?? ''}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value || null })}
            margin="normal"
            required
        />
        <TextField
            fullWidth
            label="Phone Number"
            value={newUser.phoneNumber ?? ''}
            onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value || null })}
            margin="normal"
        />
        <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
                value={newUser.role || 'user'}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                label="Role"
            >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
            </Select>
        </FormControl>
    </DialogContent>
    <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button variant="outlined" onClick={() => setOpenCreateDialog(false)}>
            Cancel
        </Button>
        <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={isCreatingUser || !newUser.email || !newUser.userCognitoId}
        >
            {isCreatingUser ? 'Creating...' : 'Create User'}
        </Button>
    </DialogActions>
</Dialog>

{/* Update User Dialog */}
<Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} fullWidth maxWidth="sm">
    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        Update User
    </DialogTitle>
    <DialogContent sx={{ p: 3 }}>
        <TextField
            fullWidth
            label="Name"
            value={newUser.name ?? ''}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value || null })}
            margin="normal"
        />
        <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email ?? ''}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value || null })}
            margin="normal"
            required
        />
        <TextField
            fullWidth
            label="Phone Number"
            value={newUser.phoneNumber ?? ''}
            onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value || null })}
            margin="normal"
        />
        <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
                value={newUser.role || 'user'}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                label="Role"
            >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
            </Select>
        </FormControl>
    </DialogContent>
    <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Button variant="outlined" onClick={() => setOpenUpdateDialog(false)}>
            Cancel
        </Button>
        <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={isUpdatingUser || !newUser.email || !newUser.userCognitoId}
        >
            {isUpdatingUser ? 'Updating...' : 'Update User'}
        </Button>
    </DialogActions>
</Dialog>
</Box>
</ThemeProvider>
);
};

export default UsersPage;