import React from 'react';
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    LinearProgress,
    Tooltip,
    Box,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Report } from '@/state/report';

interface ReportCardProps {
    report: Report;
    handleDownload: (report: Report) => void;
    downloadProgress: { [key: number]: number };
}

const fileTypeColors: Record<string, string> = {
    pdf: '#FF5252',
    doc: '#2196F3',
    docx: '#2196F3',
    xls: '#4CAF50',
    xlsx: '#4CAF50',
    csv: '#FFC107',
    txt: '#9E9E9E',
};

const ReportCard: React.FC<ReportCardProps> = ({ report, handleDownload, downloadProgress }) => {
    const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        hover: { y: -2, boxShadow: '0 6px 12px rgba(0,0,0,0.1)' },
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
        >
            <Card sx={{
                width: 160,
                height: 160,
                '@media (max-width: 600px)': {
                    width: 140,
                    height: 140,
                },
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* File type indicator */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 0,
                    height: 0,
                    borderStyle: 'solid',
                    borderWidth: '0 40px 40px 0',
                    borderColor: `transparent ${fileTypeColors[report.fileType] || '#607D8B'} transparent transparent`,
                }} />

                <Box sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    transform: 'rotate(45deg)',
                    transformOrigin: '0 0',
                    width: 60,
                    textAlign: 'center',
                }}>
                    {report.fileType.toUpperCase()}
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {format(new Date(report.uploadedAt), 'MMM d')}
                    </Typography>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.2',
                            mb: 0.5,
                        }}
                    >
                        {report.title}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.3',
                        }}
                    >
                        {report.description || 'No description'}
                    </Typography>
                </CardContent>

                <CardActions sx={{ p: 0, justifyContent: 'flex-end' }}>
                    <Tooltip title="Download">
                        <IconButton
                            onClick={() => handleDownload(report)}
                            disabled={downloadProgress[report.id] > 0}
                            size="small"
                            sx={{ mr: 1 }}
                        >
                            <Download fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </CardActions>

                {downloadProgress[report.id] > 0 && (
                    <Box sx={{ width: '100%', position: 'absolute', bottom: 0 }}>
                        <LinearProgress
                            variant={downloadProgress[report.id] === 100 ? 'indeterminate' : 'determinate'}
                            value={downloadProgress[report.id]}
                            sx={{
                                height: '3px',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: fileTypeColors[report.fileType] || '#607D8B',
                                },
                            }}
                        />
                    </Box>
                )}
            </Card>
        </motion.div>
    );
};

export default ReportCard;