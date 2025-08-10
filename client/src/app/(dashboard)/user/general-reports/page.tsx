'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Pagination,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    IconButton,
    Snackbar,
    Alert,
} from '@mui/material';
import { ExpandMore, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetDownloadPresignedUrlMutation, useGetReportsQuery } from '@/state/api';
import { Report, ReportFilters } from '@/state/report';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import ReportCard from "@/app/(dashboard)/user/general-reports/ReportCard";

const GeneralReportsPage: React.FC = () => {
    const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 12 });
    const [search, setSearch] = useState('');
    const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' } | null>(null);

    const { data: reportsData, isLoading, error } = useGetReportsQuery({
        ...filters,
        search: search || undefined,
    });
    const [getDownloadPresignedUrl] = useGetDownloadPresignedUrlMutation();

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

    const handlePageChange = (_: unknown, newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
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
            if (!report.fileUrl) {
                throw new Error('Invalid fileUrl');
            }

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

    const handleCloseSnackbar = () => {
        setSnackbar(null);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
                General Reports
            </Typography>

            <Box sx={{ mb: 3, maxWidth: 400 }}>
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
                                                    downloadProgress={downloadProgress}
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