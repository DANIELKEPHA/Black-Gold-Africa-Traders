import React, { JSX } from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    LinearProgress,
    Tooltip,
} from '@mui/material';
import { Delete, Download, Preview } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Report } from '@/state/report';

interface ReportCardProps {
    report: Report;
    handleDownload: (report: Report) => void;
    handleDelete: (ids: number[]) => void;
    downloadProgress: { [key: number]: number };
    isGeneratingDownloadUrl: boolean;
    isDeleting: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
    report,
    handleDownload,
    handleDelete,
    downloadProgress,
    isGeneratingDownloadUrl,
    isDeleting,
}) => {
    const fileTypeIcons: Record<string, JSX.Element> = {
        pdf: <Preview />,
        doc: <Preview />,
        docx: <Preview />,
        txt: <Preview />,
        csv: <Preview />,
        xlsx: <Preview />,
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        hover: { y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },
    };

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent download if clicking on buttons or during download/delete
        if (
            (e.target as HTMLElement).closest('button') ||
            isGeneratingDownloadUrl ||
            isDeleting ||
            downloadProgress[report.id] > 0
        ) {
            return;
        }
        handleDownload(report);
    };

    return (
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
                minWidth: 200,
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
                        cursor: 'pointer',
                    },
                }}
                onClick={handleCardClick}
                aria-label={`Download ${report.title}`}
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
                            aria-label={report.fileType === 'pdf' ? 'Preview PDF' : 'Download report'}
                        >
                            {report.fileType === 'pdf' ? <Preview /> : <Download />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Report">
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete([report.id]);
                            }}
                            disabled={isDeleting}
                            color="error"
                            aria-label="Delete report"
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
    );
};

export default ReportCard;