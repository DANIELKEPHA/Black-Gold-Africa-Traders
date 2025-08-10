'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    LinearProgress,
    Stack,
    Pagination,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Snackbar,
    Alert,
    IconButton
} from '@mui/material';
import { Add, CloudUpload, ExpandMore, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetReportsQuery,
    useGetReportFilterOptionsQuery,
    useCreateReportMutation,
    useDeleteReportsMutation,
    useGetPresignedUrlMutation,
    useGetDownloadPresignedUrlMutation,
} from '@/state/api';
import { Report, ReportFilters, CreateReportInput } from '@/state/report';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import ReportCard from "@/app/(dashboard)/admin/reports/general-reports/ReportCard";

const GeneralReportsPage: React.FC = () => {
    const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 12 });
    const [search, setSearch] = useState('');
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [newReport, setNewReport] = useState<CreateReportInput>({
        title: '',
        description: '',
        fileUrl: '',
        fileType: '',
    });
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [reportsToDelete, setReportsToDelete] = useState<number[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);

    const { data: reportsData, isLoading, error } = useGetReportsQuery({
        ...filters,
        search: search || undefined,
    });
    const { data: filterOptions } = useGetReportFilterOptionsQuery();
    const [createReport, { isLoading: isCreating }] = useCreateReportMutation();
    const [deleteReports, { isLoading: isDeleting }] = useDeleteReportsMutation();
    const [getPresignedUrl, { isLoading: isGeneratingUrl }] = useGetPresignedUrlMutation();
    const [getDownloadPresignedUrl] = useGetDownloadPresignedUrlMutation();

    const mimeToExtension: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
        'text/csv': 'csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };

    const fileTypeColors: Record<string, string> = {
        pdf: '#FF5252',
        doc: '#2196F3',
        docx: '#2196F3',
        xls: '#4CAF50',
        xlsx: '#4CAF50',
        csv: '#FFC107',
        txt: '#9E9E9E',
    };

    const groupReportsByWeek = (reports: Report[]) => {
        if (!reports || reports.length === 0) return {};

        return reports.reduce((acc: Record<string, Report[]>, report) => {
            const date = parseISO(report.uploadedAt);
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            const weekKey = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;

            if (!acc[weekKey]) {
                acc[weekKey] = [];
            }
            acc[weekKey].push(report);
            acc[weekKey].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            return acc;
        }, {});
    };

    const reportsByWeek = reportsData?.data ? groupReportsByWeek(reportsData.data) : {};

    const handleFilterChange = (key: keyof ReportFilters, value: string | number) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const uploadFile = (url: string, file: File, fileType: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', url, true);
            xhr.timeout = 30000;
            xhr.setRequestHeader('Content-Type', fileType);
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.ontimeout = () => reject(new Error('Upload timed out'));
            xhr.send(file);
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setUploadError('No file selected');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setUploadError('File size exceeds 10MB limit');
            return;
        }

        try {
            setUploadError(null);
            setUploadProgress(0);
            const fileType = file.type;
            const validMimeTypes = Object.keys(mimeToExtension);

            if (!fileType || !validMimeTypes.includes(fileType)) {
                setUploadError(`Invalid file type. Supported types: ${Object.values(mimeToExtension).join(', ')}`);
                return;
            }

            const { url, key } = await getPresignedUrl({
                fileName: file.name,
                fileType: file.type,
            }).unwrap();

            await uploadFile(url, file, fileType);
            const fileUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;

            setNewReport((prev) => ({
                ...prev,
                fileUrl,
                fileType: mimeToExtension[fileType] || fileType.split('/')[1] || 'unknown',
            }));

            setSnackbar({ open: true, message: 'File uploaded successfully', severity: 'success' });
        } catch (err: any) {
            setUploadError(err.message || 'Failed to upload file');
            setSnackbar({ open: true, message: 'File upload failed', severity: 'error' });
        } finally {
            setUploadProgress(0);
        }
    };

    const downloadFile = (url: string, fileName: string, reportId: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.timeout = 60000;

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setDownloadProgress((prev) => ({ ...prev, [reportId]: percent }));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const blob = xhr.response;
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = fileName;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(link.href);
                        resolve();
                    }, 100);
                } else {
                    reject(new Error(`Download failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error during download'));
            xhr.ontimeout = () => reject(new Error('Download timed out'));
            xhr.send();
        });
    };

    const handleDownload = async (report: Report) => {
        try {
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 1 }));
            const url = new URL(report.fileUrl);
            const key = url.pathname.slice(1);
            const fileName = key.split('/').pop() || `report-${report.id}.${report.fileType}`;

            const { url: downloadUrl } = await getDownloadPresignedUrl({ key }).unwrap();
            await downloadFile(downloadUrl, fileName, report.id);

            setSnackbar({ open: true, message: `${report.title} downloaded successfully`, severity: 'success' });
        } catch (err: any) {
            const errorMessage = err?.error?.data?.message || err.message || 'Failed to download file';
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setTimeout(() => {
                setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
            }, 1000);
        }
    };

    const handleCreateReport = async () => {
        try {
            await createReport(newReport).unwrap();
            setOpenCreateModal(false);
            setNewReport({ title: '', description: '', fileUrl: '', fileType: '' });
            setSnackbar({ open: true, message: 'Report created successfully', severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Failed to create report', severity: 'error' });
        }
    };

    const handleDelete = (ids: number[]) => {
        setReportsToDelete(ids);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteReports({ ids: reportsToDelete }).unwrap();
            setOpenDeleteDialog(false);
            setReportsToDelete([]);
            setSnackbar({ open: true, message: 'Reports deleted successfully', severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Failed to delete reports', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(null);
    };

    const handlePageChange = (_: unknown, newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
                General Reports
            </Typography>

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 3,
                alignItems: { xs: 'stretch', md: 'center' }
            }}>
                <Box sx={{ flex: 1, maxWidth: 400 }}>
                    <TextField
                        fullWidth
                        label="Search reports"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            endAdornment: search && (
                                <IconButton size="small" onClick={() => setSearch('')}>
                                    <Close fontSize="small" />
                                </IconButton>
                            ),
                        }}
                    />
                </Box>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => setOpenCreateModal(true)}
                        sx={{ height: '56px' }}
                    >
                        Create Report
                    </Button>
                </motion.div>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">
                    Error loading reports: {(error as any).message || 'Unknown error'}
                </Typography>
            ) : Object.keys(reportsByWeek).length === 0 ? (
                <Typography>No reports found</Typography>
            ) : (
                <>
                    {Object.entries(reportsByWeek)
                        .sort(([a], [b]) => new Date(b.split(' - ')[0]).getTime() - new Date(a.split(' - ')[0]).getTime())
                        .map(([weekRange, weekReports]) => (
                            <Accordion key={weekRange} defaultExpanded sx={{ mb: 3, boxShadow: 'none', border: '1px solid #eee' }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        Week of {weekRange}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0 }}>
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                        gap: 2,
                                        p: 2,
                                        '@media (max-width: 600px)': {
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                            gap: 1.5,
                                        },
                                    }}>
                                        <AnimatePresence>
                                            {weekReports.map((report) => (
                                                <ReportCard
                                                    key={report.id}
                                                    report={report}
                                                    handleDownload={handleDownload}
                                                    handleDelete={handleDelete}
                                                    downloadProgress={downloadProgress}
                                                    isDeleting={isDeleting}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={Math.ceil((reportsData?.meta?.total ?? 0) / (filters.limit ?? 12))}
                            page={filters.page}
                            onChange={handlePageChange}
                            color="primary"
                            shape="rounded"
                        />
                    </Box>
                </>
            )}

            {/* Create Report Dialog */}
            <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Title"
                        value={newReport.title}
                        onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={newReport.description || ''}
                        onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={3}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>File Type</InputLabel>
                        <Select
                            value={newReport.fileType}
                            onChange={(e) => setNewReport({ ...newReport, fileType: e.target.value })}
                            label="File Type"
                            required
                        >
                            {Object.values(mimeToExtension).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        sx={{ mt: 2 }}
                        disabled={isGeneratingUrl || uploadProgress > 0}
                    >
                        {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload File'}
                        <input
                            type="file"
                            hidden
                            accept={Object.keys(mimeToExtension).join(',')}
                            onChange={handleFileUpload}
                        />
                    </Button>
                    {uploadProgress > 0 && (
                        <LinearProgress
                            variant="determinate"
                            value={uploadProgress}
                            sx={{ mt: 1 }}
                        />
                    )}
                    {newReport.fileUrl && (
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            File: {newReport.fileUrl.split('/').pop()}
                        </Typography>
                    )}
                    {uploadError && (
                        <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
                            {uploadError}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateModal(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateReport}
                        variant="contained"
                        disabled={isCreating || !newReport.title || !newReport.fileUrl}
                    >
                        {isCreating ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {reportsToDelete.length} selected report(s)?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={confirmDelete}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                    >
                        {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Notifications */}
            <Snackbar
                open={!!snackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar?.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default GeneralReportsPage;