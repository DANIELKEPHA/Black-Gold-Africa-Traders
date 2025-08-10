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
} from '@mui/material';
import { Add, CloudUpload, ExpandMore } from '@mui/icons-material';
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
    const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 9 });
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

    const { data: reportsData, isLoading, error } = useGetReportsQuery({
        ...filters,
        search: search || undefined,
    });
    const { data: filterOptions } = useGetReportFilterOptionsQuery();
    const [createReport, { isLoading: isCreating }] = useCreateReportMutation();
    const [deleteReports, { isLoading: isDeleting }] = useDeleteReportsMutation();
    const [getPresignedUrl, { isLoading: isGeneratingUrl }] = useGetPresignedUrlMutation();
    const [getDownloadPresignedUrl, { isLoading: isGeneratingDownloadUrl }] = useGetDownloadPresignedUrlMutation();

    const mimeToExtension: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/plain': 'txt',
        'text/csv': 'csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
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
                    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] File uploaded successfully to S3:`, {
                        fileName: file.name,
                        fileType: file.type,
                        url,
                    });
                    resolve();
                } else {
                    const errorMsg = `Upload failed with status ${xhr.status}: ${xhr.statusText || 'Unknown error'}`;
                    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ${errorMsg}`, {
                        fileName: file.name,
                        fileType: file.type,
                        url,
                        response: xhr.responseText,
                        headers: xhr.getAllResponseHeaders(),
                    });
                    reject(new Error(errorMsg));
                }
            };
            xhr.onerror = () => {
                const errorMsg = 'Network error during upload. This may be due to a CORS misconfiguration, invalid presigned URL, or network issue.';
                console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ${errorMsg}`, {
                    fileName: file.name,
                    fileType: file.type,
                    url,
                    response: xhr.responseText,
                    headers: xhr.getAllResponseHeaders(),
                });
                reject(new Error(errorMsg));
            };
            xhr.ontimeout = () => {
                const errorMsg = 'Upload timed out. Please check your network connection.';
                console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ${errorMsg}`, {
                    fileName: file.name,
                    fileType: file.type,
                    url,
                });
                reject(new Error(errorMsg));
            };
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
            setUploadError('File size exceeds 10MB limit. Please select a smaller file.');
            return;
        }
        try {
            setUploadError(null);
            setUploadProgress(0);
            const fileName = file.name;
            const fileType = file.type;
            const validMimeTypes = Object.keys(mimeToExtension);
            if (!fileType || !validMimeTypes.includes(fileType)) {
                setUploadError(`Invalid file type. Supported types: ${Object.values(mimeToExtension).join(', ')}`);
                return;
            }
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Initiating file upload:`, {
                fileName,
                fileType,
                fileSize: file.size,
            });
            const { url, key } = await getPresignedUrl({
                fileName: file.name,
                fileType: file.type,
            }).unwrap();
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Generated presigned URL:`, { url, key });
            await uploadFile(url, file, fileType);
            const fileUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
    setNewReport((prev) => ({
        ...prev,
        fileUrl,
        fileType: mimeToExtension[fileType] || fileType.split('/')[1] || 'unknown',
    }));
setUploadError(null);
setUploadProgress(0);
} catch (err: any) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] File upload failed:`, {
        message: err.message,
        fileName: file?.name,
        fileType: file?.type,
    });
    setUploadError(
        err.message.includes('CORS')
            ? 'Failed to upload file due to a CORS error. Please verify the S3 bucket CORS configuration or contact support.'
            : err.message || 'Failed to upload file. Please try again or contact support.'
    );
    setUploadProgress(0);
}
};

const handleCreateReport = async () => {
    try {
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Creating report:`, newReport);
        await createReport(newReport).unwrap();
        setOpenCreateModal(false);
        setNewReport({ title: '', description: '', fileUrl: '', fileType: '' });
        setUploadError(null);
        setUploadProgress(0);
    } catch (err: any) {
        console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Create report failed:`, {
            message: err.message,
            data: err.data,
        });
        setUploadError(err.message || 'Failed to create report. Please try again or contact support.');
    }
};

const downloadFile = (url: string, fileName: string, reportId: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.timeout = 60000; // Increase timeout to 60 seconds

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setDownloadProgress((prev) => ({ ...prev, [reportId]: percent }));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] File downloaded successfully:`, { fileName, url });
                    const blob = xhr.response;
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(link.href);
                    resolve();
                } else {
                    const errorMsg = `Download failed with status ${xhr.status}: ${xhr.statusText || 'Unknown error'}`;
                    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ${errorMsg}`, {
                        fileName,
                        url,
                        status: xhr.status,
                        response: xhr.responseText,
                        headers: xhr.getAllResponseHeaders(),
                    });
                    reject(new Error(errorMsg));
                }
            };

            xhr.onerror = () => {
                const errorMsg = 'Network error during download. This may be due to a CORS misconfiguration, invalid presigned URL, or network issue.';
                console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ${errorMsg}`, {
                    fileName,
                    url,
                    response: xhr.responseText,
                    status: xhr.status,
                    headers: xhr.getAllResponseHeaders(),
                });
                reject(new Error(errorMsg));
            };

            xhr.ontimeout = () => {
                const errorMsg = 'Download timed out. Please check your network connection.';
                console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] ${errorMsg}`, {
                    fileName,
                    url,
                    timeout: xhr.timeout,
                });
                reject(new Error(errorMsg));
            };

            xhr.send();
        });
    };

const handleDownload = async (report: Report) => {
        try {
            const url = new URL(report.fileUrl);
            const key = url.pathname.slice(1); // e.g., reports/44382498-3081-7097-27fc-f170dd46ea5a/1754731986236-sayin company profile RAW.pdf
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Downloading report:`, {
                fileUrl: report.fileUrl,
                key,
                reportId: report.id,
            });
            const fileName = key.split('/').pop() || `report-${report.id}.${report.fileType}`;
            const { url: downloadUrl } = await getDownloadPresignedUrl({ key }).unwrap(); // Ensure key is sent
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Generated download presigned URL:`, { downloadUrl });

            if (report.fileType === 'pdf') {
                window.open(downloadUrl, '_blank');
            } else {
                await downloadFile(downloadUrl, fileName, report.id);
            }
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
            setUploadError(null);
        } catch (err: any) {
            const errorMessage = err?.error?.data?.message || err.message || 'Failed to download/preview file';
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Failed to download/preview file:`, {
                message: errorMessage,
                reportId: report.id,
                fileUrl: report.fileUrl,
                error: JSON.stringify(err, null, 2),
            });
            setUploadError(errorMessage);
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
        }
    };

const handleDelete = (ids: number[]) => {
    setReportsToDelete(ids);
    setOpenDeleteDialog(true);
};

const confirmDelete = async () => {
    try {
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Deleting reports:`, { ids: reportsToDelete });
        await deleteReports({ ids: reportsToDelete }).unwrap();
        setOpenDeleteDialog(false);
        setReportsToDelete([]);
    } catch (err: any) {
        console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Delete reports failed:`, {
            message: err.message,
            data: err.data,
        });
        setUploadError('Failed to delete reports. Please try again or contact support.');
    }
};

const handlePageChange = (_: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
};

return (
    <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
            General Reports
        </Typography>

        <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: 2,
            mb: 3
        }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                    fullWidth
                    label="Search by Title"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                />
            </Box>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setOpenCreateModal(true)}
                    disabled={isCreating || isGeneratingUrl}
                >
                    Create Report
                </Button>
            </motion.div>
        </Stack>

        {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        ) : error ? (
            <Typography color="error">
                Error loading reports: {(error as any).message || 'Unknown error. Please check the server.'}
            </Typography>
        ) : Object.keys(reportsByWeek).length === 0 ? (
            <Typography>No reports available.</Typography>
        ) : (
            <>
                {Object.entries(reportsByWeek)
                    .sort(([a], [b]) => new Date(b.split(' - ')[0]).getTime() - new Date(a.split(' - ')[0]).getTime())
                    .map(([weekRange, weekReports]) => (
                        <Accordion key={weekRange} defaultExpanded sx={{ mb: 3 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    Week of {weekRange}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 3,
                                    justifyContent: { xs: 'center', sm: 'flex-start' }
                                }}>
                                    <AnimatePresence>
                                        {weekReports.map((report) => (
                                            <ReportCard
                                                key={report.id}
                                                report={report}
                                                handleDownload={handleDownload}
                                                handleDelete={handleDelete}
                                                downloadProgress={downloadProgress}
                                                isGeneratingDownloadUrl={isGeneratingDownloadUrl}
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
                        count={Math.ceil((reportsData?.meta?.total ?? 0) / (filters.limit ?? 9))}
                        page={filters.page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                    />
                </Box>
            </>
        )}

        <Dialog
            open={openCreateModal}
            onClose={() => setOpenCreateModal(false)}
            maxWidth="sm"
            fullWidth
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
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
                        {uploadProgress > 0 ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Upload File'}
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
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
                            File selected: {newReport.fileUrl.split('/').pop() || 'Unknown file'}
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
                        disabled={isCreating || isGeneratingUrl || !newReport.title || !newReport.fileUrl || !newReport.fileType}
                    >
                        {isCreating || isGeneratingUrl ? <CircularProgress size={24} /> : 'Create'}
                    </Button>
                </DialogActions>
            </motion.div>
        </Dialog>

        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {reportsToDelete.length} report(s)? This will also remove the associated files from storage.
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
            </motion.div>
        </Dialog>
    </Box>
);
};

export default GeneralReportsPage;