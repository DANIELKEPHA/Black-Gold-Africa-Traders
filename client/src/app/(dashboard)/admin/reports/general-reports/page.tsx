'use client';

import React, { JSX, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
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
    Card,
    CardContent,
    CardActions,
    Pagination,
    Tooltip,
} from '@mui/material';
import { Delete, Download, Preview, CloudUpload, Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetReportsQuery,
    useGetReportFilterOptionsQuery,
    useCreateReportMutation,
    useDeleteReportsMutation,
    useGetPresignedUrlMutation,
    useGetDownloadPresignedUrlMutation,
} from '@/state/api';
import { Report, ReportFilterOptions, ReportFilters, CreateReportInput } from '@/state/report';
import { format } from 'date-fns';

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

    const fileTypeIcons: Record<string, JSX.Element> = {
        pdf: <Preview />,
        doc: <Preview />,
        docx: <Preview />,
        txt: <Preview />,
        csv: <Preview />,
        xlsx: <Preview />,
    };

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
            xhr.timeout = 30000;

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
                    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Download failed:`, {
                        fileName,
                        url,
                        status: xhr.status,
                        statusText: xhr.statusText,
                        response: xhr.responseText,
                    });
                    reject(new Error(`Download failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Network error during download:`, { fileName, url });
                reject(new Error('Network error during download. Please try again.'));
            };

            xhr.ontimeout = () => {
                console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Download timed out:`, { fileName, url });
                reject(new Error('Download timed out. Please check your network connection.'));
            };

            xhr.send();
        });
    };

    const handleDownload = async (report: Report) => {
        try {
            const url = new URL(report.fileUrl);
            const key = url.pathname.slice(1);
            const fileName = key.split('/').pop() || `report-${report.id}.${report.fileType}`;
            const { url: downloadUrl } = await getDownloadPresignedUrl({ key }).unwrap();
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Generated download presigned URL:`, { downloadUrl, key });

            if (report.fileType === 'pdf') {
                window.open(downloadUrl, '_blank');
            } else {
                await downloadFile(downloadUrl, fileName, report.id);
            }
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}] Failed to download/preview file:`, {
                message: err.message,
                reportId: report.id,
            });
            setUploadError(err.message || 'Failed to download/preview file. Please try again or contact support.');
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

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        hover: { y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },
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
            ) : !reportsData?.data ? (
                <Typography>No reports available.</Typography>
            ) : (
                <>
                    <Box sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        justifyContent: { xs: 'center', sm: 'flex-start' }
                    }}>
                        <AnimatePresence>
                            {reportsData.data.map((report) => (
                                <motion.div
                                    key={report.id}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        flex: '0 0 auto',
                                        minWidth: 200
                                    }}
                                >
                                    <Card
                                        sx={{
                                            height: '200px',
                                            width: '200px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: 3,
                                            borderRadius: 2,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                boxShadow: 6,
                                            },

                                        }}
                                    >

                                    <CardContent sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {format(new Date(report.uploadedAt), 'PP')}
                                            </Typography>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    mb: 1,
                                                    fontWeight: 'bold',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={report.title}
                                            >
                                                {report.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 2,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                }}
                                            >
                                                {report.description || 'No description provided'}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                                            <Tooltip title={report.fileType === 'pdf' ? 'Preview PDF' : 'Download Report'}>
                                                <IconButton
                                                    onClick={() => handleDownload(report)}
                                                    disabled={isGeneratingDownloadUrl || !!downloadProgress[report.id]}
                                                    color="primary"
                                                >
                                                    {report.fileType === 'pdf' ? <Preview /> : <Download />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Report">
                                                <IconButton
                                                    onClick={() => handleDelete([report.id])}
                                                    disabled={isDeleting}
                                                    color="error"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </CardActions>
                                        {downloadProgress[report.id] > 0 && (
                                            <LinearProgress
                                                variant="determinate"
                                                value={downloadProgress[report.id]}
                                            />
                                        )}
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Box>
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