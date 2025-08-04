"use client";

import React from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Select,
    MenuItem,
    Fade,
    SelectChangeEvent,
    InputAdornment,
    Divider,
    IconButton,
    Tooltip,
    CircularProgress,
    useTheme
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon, Info as InfoIcon } from "@mui/icons-material";
import { ShipmentFormData } from "@/state/shipment";

interface NewShipmentProps {
    form: ShipmentFormData;
    setForm: React.Dispatch<React.SetStateAction<ShipmentFormData>>;
    editingShipmentId: number | null;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    creatingShipment: boolean;
    updatingShipment: boolean;
    handleSubmit: () => Promise<void>;
    resetForm: () => void;
}

const NewShipment: React.FC<NewShipmentProps> = ({
                                                     form,
                                                     setForm,
                                                     editingShipmentId,
                                                     error,
                                                     setError,
                                                     creatingShipment,
                                                     updatingShipment,
                                                     handleSubmit,
                                                     resetForm,
                                                 }) => {
    const theme = useTheme();

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        setForm((prev) => ({ ...prev, [e.target.name!]: e.target.value }));
    };

    return (
        <Fade in timeout={400}>
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Paper
                    sx={{
                        p: 3,
                        width: { xs: "100%", md: "600px" },
                        boxShadow: theme.shadows[4],
                        borderRadius: "12px",
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                            boxShadow: theme.shadows[6],
                        },
                    }}
                    className="max-w-lg mx-auto"
                >
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: theme.palette.text.primary,
                                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                                }}
                                className="text-gray-800"
                            >
                                {editingShipmentId ? "Edit Shipment" : "Create New Shipment"}
                            </Typography>
                            {editingShipmentId && (
                                <Tooltip title="Cancel editing">
                                    <IconButton
                                        onClick={resetForm}
                                        size="small"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            "&:hover": { backgroundColor: theme.palette.action.hover },
                                        }}
                                        className="hover:bg-gray-100"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2, borderRadius: "8px", alignItems: "center" }}
                            onClose={() => setError(null)}
                            className="bg-red-50 text-red-700"
                        >
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                gap: 2,
                            }}
                        >
                            {/* Consignee Section */}
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
                                    className="text-gray-600"
                                >
                                    Consignee
                                </Typography>
                                <TextField
                                    label="Consignee"
                                    name="consignee"
                                    value={form.consignee}
                                    onChange={handleFormChange}
                                    size="small"
                                    fullWidth
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        sx: {
                                            borderRadius: "8px",
                                            backgroundColor: theme.palette.background.default,
                                        },
                                        className: "bg-white",
                                    }}
                                    className="transition-all duration-200 hover:shadow-sm"
                                />
                            </Box>

                            {/* Vessel Section */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: theme.palette.text.secondary }}
                                        className="text-gray-600"
                                    >
                                        Vessel
                                    </Typography>
                                    <Tooltip title="Select the vessel for this shipment">
                                        <InfoIcon
                                            fontSize="small"
                                            sx={{
                                                ml: 0.5,
                                                color: theme.palette.text.disabled,
                                                cursor: "pointer",
                                            }}
                                            className="text-gray-400"
                                        />
                                    </Tooltip>
                                </Box>
                                <Select
                                    name="vessel"
                                    value={form.vessel}
                                    onChange={handleSelectChange}
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        borderRadius: "8px",
                                        backgroundColor: theme.palette.background.default,
                                    }}
                                    className="bg-white transition-all duration-200 hover:shadow-sm"
                                >
                                    <MenuItem value="icon_voyager">Icon Voyager</MenuItem>
                                    <MenuItem value="ocean_star">Ocean Star</MenuItem>
                                    <MenuItem value="maritime_pearl">Maritime Pearl</MenuItem>
                                    <MenuItem value="horizon_explorer">Horizon Explorer</MenuItem>
                                </Select>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                gap: 2,
                            }}
                        >
                            {/* Shipmark Section */}
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary, mb: 0.5 }}
                                    className="text-gray-600"
                                >
                                    Shipmark
                                </Typography>
                                <TextField
                                    label="Shipmark"
                                    name="shipmark"
                                    value={form.shipmark}
                                    onChange={handleFormChange}
                                    size="small"
                                    fullWidth
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Tooltip title="Unique identifier for your shipment">
                                                    <InfoIcon
                                                        fontSize="small"
                                                        sx={{ color: theme.palette.text.disabled }}
                                                        className="text-gray-400"
                                                    />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: "8px",
                                            backgroundColor: theme.palette.background.default,
                                        },
                                        className: "bg-white",
                                    }}
                                    className="transition-all duration-200 hover:shadow-sm"
                                />
                            </Box>

                            {/* Packaging Instructions Section */}
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: theme.palette.text.secondary }}
                                        className="text-gray-600"
                                    >
                                        Packaging Instructions
                                    </Typography>
                                    <Tooltip title="How items should be packaged for shipping">
                                        <InfoIcon
                                            fontSize="small"
                                            sx={{
                                                ml: 0.5,
                                                color: theme.palette.text.disabled,
                                                cursor: "pointer",
                                            }}
                                            className="text-gray-400"
                                        />
                                    </Tooltip>
                                </Box>
                                <Select
                                    name="packagingInstructions"
                                    value={form.packagingInstructions}
                                    onChange={handleSelectChange}
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        borderRadius: "8px",
                                        backgroundColor: theme.palette.background.default,
                                    }}
                                    className="bg-white transition-all duration-200 hover:shadow-sm"
                                >
                                    <MenuItem value="jute_2_poly">1 Jute Bag + 2 Poly Bags</MenuItem>
                                    <MenuItem value="jute_1_poly">1 Jute Bag + 1 Poly Bag</MenuItem>
                                    <MenuItem value="carton">Carton Box</MenuItem>
                                    <MenuItem value="pallet">Pallet with Shrink Wrap</MenuItem>
                                </Select>
                            </Box>
                        </Box>

                        {/* Additional Instructions Section */}
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: theme.palette.text.secondary }}
                                    className="text-gray-600"
                                >
                                    Additional Instructions
                                </Typography>
                                <Tooltip title="Any special instructions for this shipment">
                                    <InfoIcon
                                        fontSize="small"
                                        sx={{
                                            ml: 0.5,
                                            color: theme.palette.text.disabled,
                                            cursor: "pointer",
                                        }}
                                        className="text-gray-400"
                                    />
                                </Tooltip>
                            </Box>
                            <TextField
                                placeholder="Enter any special instructions..."
                                name="additionalInstructions"
                                value={form.additionalInstructions}
                                onChange={handleFormChange}
                                multiline
                                rows={3}
                                size="small"
                                fullWidth
                                variant="outlined"
                                InputProps={{
                                    sx: {
                                        borderRadius: "8px",
                                        backgroundColor: theme.palette.background.default,
                                    },
                                    className: "bg-white",
                                }}
                                className="transition-all duration-200 hover:shadow-sm"
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: theme.palette.divider }} className="border-gray-200" />

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                        {editingShipmentId && (
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={resetForm}
                                size="medium"
                                sx={{
                                    px: 3,
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    color: theme.palette.text.secondary,
                                    borderColor: theme.palette.divider,
                                    "&:hover": {
                                        borderColor: theme.palette.action.hover,
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                                className="hover:bg-gray-100"
                            >
                                Cancel
                            </Button>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={
                                creatingShipment || updatingShipment ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    <AddIcon />
                                )
                            }
                            onClick={handleSubmit}
                            disabled={creatingShipment || updatingShipment}
                            size="medium"
                            sx={{
                                px: 3,
                                borderRadius: "8px",
                                textTransform: "none",
                                boxShadow: "none",
                                "&:hover": {
                                    boxShadow: "none",
                                    backgroundColor: theme.palette.primary.dark,
                                },
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {creatingShipment || updatingShipment
                                ? "Processing..."
                                : editingShipmentId
                                    ? "Update Shipment"
                                    : "Create Shipment"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Fade>
    );
};

export default NewShipment;