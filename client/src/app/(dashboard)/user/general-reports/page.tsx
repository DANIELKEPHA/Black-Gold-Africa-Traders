'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Pagination,
    Accordion,
    AccordionSummary,
    AccordionDetails, CircularProgress,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {useGetDownloadPresignedUrlMutation, useGetReportsQuery} from '@/state/api';
import { Report, ReportFilters } from '@/state/report';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import ReportCard from "@/app/(dashboard)/user/general-reports/ReportCard";

const GeneralReportsPage: React.FC = () => {
    const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 9 });
    const [search, setSearch] = useState('');
    const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const { data: reportsData, isLoading, error } = useGetReportsQuery({
        ...filters,
        search: search || undefined,
    });
    const [getDownloadPresignedUrl, { isLoading: isGeneratingDownloadUrl }] = useGetDownloadPresignedUrlMutation();

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
            if (!report.fileUrl) {
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Invalid fileUrl for report:`, { reportId: report.id, report });
                throw new Error('Invalid fileUrl');
            }
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Report data:`, { report });
            const url = new URL(report.fileUrl);
            const key = url.pathname.slice(1);
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Downloading report:`, {
                fileUrl: report.fileUrl,
                key,
                reportId: report.id,
            });
            const fileName = key.split('/').pop() || `report-${report.id}.${report.fileType}`;
            const { url: downloadUrl } = await getDownloadPresignedUrl({ key }).unwrap();
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Generated download presigned URL:`, { downloadUrl });

            if (report.fileType === 'pdf') {
                window.open(downloadUrl, '_blank');
            } else {
                await downloadFile(downloadUrl, fileName, report.id);
            }
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
            setDownloadError(null);
        } catch (err: any) {
            const errorMessage = err?.error?.data?.message || err.message || 'Failed to download/preview file';
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Failed to download/preview file:`, {
                message: errorMessage,
                reportId: report.id,
                fileUrl: report.fileUrl,
                error: JSON.stringify(err, null, 2),
            });
            setDownloadError(errorMessage);
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
        }
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
                                                    downloadProgress={downloadProgress}
                                                    isGeneratingDownloadUrl={isGeneratingDownloadUrl}
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

            {downloadError && (
                <Typography variant="body2" sx={{ mt: 2, color: 'error.main' }}>
                    {downloadError}
                </Typography>
            )}
        </Box>
    );
};

export default GeneralReportsPage;