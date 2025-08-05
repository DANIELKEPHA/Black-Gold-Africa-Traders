"use client";

import React, {JSX, useState} from "react";
import {
    Box,
    Typography,
    TextField,
    IconButton,
    CircularProgress,
    LinearProgress,
    Pagination,
    Tooltip,
    Card,
    CardContent,
    CardActions,
    Snackbar,
    Alert,
    Skeleton,
} from "@mui/material";
import { Download, Preview } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { styled } from "@mui/material/styles";
import { useGetReportsQuery, useGetDownloadPresignedUrlMutation } from "@/state/api";
import { Report, ReportFilters } from "@/state/report";
import { format } from "date-fns";

const StyledMotionDiv = styled(motion.div)(({ theme }) => ({
    width: `calc(100% - ${theme.spacing(2)})`,
    maxWidth: 200,
    flex: "1 1 auto",
    [theme.breakpoints.up("sm")]: {
        width: `calc(50% - ${theme.spacing(2)})`,
    },
    [theme.breakpoints.up("md")]: {
        width: `calc(33.33% - ${theme.spacing(2)})`,
    },
}));

const UserReportsPage: React.FC = () => {
    const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 9 });
    const [search, setSearch] = useState("");
    const [downloadProgress, setDownloadProgress] = useState<{ [key: number]: number }>({});
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const { data: reportsData, isLoading, error } = useGetReportsQuery({
        ...filters,
        search: search || undefined,
    });
    const [getDownloadPresignedUrl, { isLoading: isGeneratingDownloadUrl }] = useGetDownloadPresignedUrlMutation();

    const fileTypeIcons: Record<string, JSX.Element> = {
        pdf: <Preview />,
        doc: <Preview />,
        docx: <Preview />,
        txt: <Preview />,
        csv: <Preview />,
        xlsx: <Preview />,
    };

    const downloadFile = (url: string, fileName: string, reportId: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "blob";
            xhr.timeout = 30000;

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setDownloadProgress((prev) => ({ ...prev, [reportId]: percent }));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] File downloaded successfully:`, { fileName, url });
                    const blob = xhr.response;
                    const link = document.createElement("a");
                    link.href = window.URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(link.href);
                    resolve();
                } else {
                    console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Download failed:`, {
                        fileName,
                        url,
                        status: xhr.status,
                        statusText: xhr.statusText,
                    });
                    reject(new Error(`Download failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Network error during download:`, { fileName, url });
                reject(new Error("Network error during download. Please try again."));
            };

            xhr.ontimeout = () => {
                console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Download timed out:`, { fileName, url });
                reject(new Error("Download timed out. Please check your network connection."));
            };

            xhr.send();
        });
    };

    const handleDownload = async (report: Report) => {
        try {
            const url = new URL(report.fileUrl);
            const key = url.pathname.slice(1);
            const fileName = key.split("/").pop() || `report-${report.id}.${report.fileType}`;
            const { url: downloadUrl } = await getDownloadPresignedUrl({ key }).unwrap();
            console.log(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Generated download presigned URL:`, { downloadUrl, key });

            if (report.fileType === "pdf") {
                window.open(downloadUrl, "_blank");
            } else {
                await downloadFile(downloadUrl, fileName, report.id);
            }
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
            setDownloadError(null);
        } catch (err: any) {
            console.error(`[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] Failed to download/preview file:`, {
                message: err.message,
                reportId: report.id,
            });
            setDownloadError(err.message || "Failed to download/preview file. Please try again or contact support.");
            setDownloadProgress((prev) => ({ ...prev, [report.id]: 0 }));
        }
    };

    const handlePageChange = (_: unknown, newPage: number) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const handleCloseSnackbar = () => {
        setDownloadError(null);
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        hover: { y: -5, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" },
    };

    return (
        <Box sx={{ mx: { xs: 2, sm: 4 }, my: 2, maxWidth: "100%", boxSizing: "border-box" }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: "primary.main" }}>
                General Reports
            </Typography>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 2 }}>
                <TextField
                    fullWidth
                    label="Search by Title"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ maxWidth: 300 }}
                    aria-label="Search reports by title"
                />
            </Box>

            {isLoading ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "flex-start" }}>
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" width={200} height={180} sx={{ borderRadius: 2 }} />
                    ))}
                </Box>
            ) : error ? (
                <Typography color="error" sx={{ fontSize: "0.875rem", textAlign: "center" }}>
                    Error loading reports: {(error as any).data?.message || "Unable to load reports. Please try again or contact support."}
                </Typography>
            ) : !reportsData?.data || reportsData.data.length === 0 ? (
                <Typography sx={{ fontSize: "0.875rem", textAlign: "center", color: "text.secondary" }}>
                    No reports available. {search ? "Try adjusting your search." : "Please check back later."}
                </Typography>
            ) : (
                <>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "flex-start" }}>
                        <AnimatePresence>
                            {reportsData.data.map((report) => (
                                <StyledMotionDiv
                                    key={report.id}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card
                                        sx={{
                                            height: 180,
                                            display: "flex",
                                            flexDirection: "column",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                            borderRadius: 2,
                                            overflow: "hidden",
                                            bgcolor: "background.paper",
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 0 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                                                {format(new Date(report.uploadedAt), "PP")}
                                            </Typography>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontSize: "1rem",
                                                    fontWeight: 500,
                                                    mb: 0.5,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                                title={report.title}
                                            >
                                                {report.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    fontSize: "0.75rem",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                }}
                                            >
                                                {report.description || "No description provided"}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ p: 1, justifyContent: "flex-end" }}>
                                            <Tooltip title={report.fileType === "pdf" ? "Preview PDF" : "Download Report"}>
                        <span>
                          <IconButton
                              onClick={() => handleDownload(report)}
                              disabled={isGeneratingDownloadUrl || !!downloadProgress[report.id]}
                              color="primary"
                              size="small"
                              aria-label={report.fileType === "pdf" ? `Preview ${report.title}` : `Download ${report.title}`}
                          >
                            {fileTypeIcons[report.fileType] || <Download />}
                          </IconButton>
                        </span>
                                            </Tooltip>
                                        </CardActions>
                                        {downloadProgress[report.id] > 0 && (
                                            <LinearProgress variant="determinate" value={downloadProgress[report.id]} sx={{ height: 3 }} />
                                        )}
                                    </Card>
                                </StyledMotionDiv>
                            ))}
                        </AnimatePresence>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Pagination
                            count={Math.ceil((reportsData?.meta?.total || 0) / (filters.limit || 9))}
                            page={filters.page}
                            onChange={handlePageChange}
                            color="primary"
                            size="small"
                            shape="rounded"
                            sx={{ "& .MuiPaginationItem-root": { fontSize: "0.8rem" } }}
                            aria-label="Report pagination"
                        />
                    </Box>
                </>
            )}

            <Snackbar
                open={!!downloadError}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
                    {downloadError}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserReportsPage;