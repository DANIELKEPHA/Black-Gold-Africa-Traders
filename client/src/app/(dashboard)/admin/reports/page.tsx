'use client';

import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    ThemeProvider,
    createTheme
} from '@mui/material';

import ReportsPage from '@/app/(dashboard)/admin/reports/shipment-reports/page';
import UsersPage from "@/app/(dashboard)/admin/reports/users/page";
import ContactSubmissions from "@/app/(dashboard)/admin/reports/contact-forms/pages";


const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#757575' },
        background: { default: '#f5f7fa', paper: '#ffffff' },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h4: { fontWeight: 700 },
    },
    components: {
        MuiTabs: {
            styleOverrides: {
                root: { borderBottom: '1px solid #e0e0e0' },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '1rem',
                    padding: '12px 16px',
                },
            },
        },
    },
});

const ReportsDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<number>(0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    maxWidth: 1400,
                    mx: 'auto',
                    p: { xs: 2, md: 3 },
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ mb: 4, color: 'primary.main', fontWeight: 'bold' }}
                >
                    Reports Dashboard
                </Typography>

                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="Reports navigation tabs"
                >
                    <Tab label="Shipment Reports" />
                    <Tab label="Contact Submissions" />
                    <Tab label="Users Management" />
                </Tabs>

                <Box sx={{ mt: 3 }}>
                    {activeTab === 0 && <ReportsPage />}
                    {activeTab === 1 && <ContactSubmissions />}
                    {activeTab === 2 && <UsersPage />}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default ReportsDashboardPage;
