"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetAuthUserQuery, useGetStocksQuery, useGetShipmentsQuery, useCreateShipmentMutation, useUpdateShipmentMutation } from "@/state/api";
import { createTheme, ThemeProvider, Box, Skeleton, Snackbar, Alert } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { skipToken } from "@reduxjs/toolkit/query";
import { Shipment, ShipmentFormData } from "@/state/shipment";
import { Stock } from "@/state/stock";
import { PackagingInstructions, Vessel } from "@/state/enums";
import Stocks from "./Stocks";
import NewShipment from "./NewShipment";
import ExistingShipments from "./ExistingShipments";


const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#757575" },
    background: { default: "#f5f7fa", paper: "#ffffff" },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 8, textTransform: "none", padding: "8px 16px" } },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 600, color: "#424242" } },
    },
  },
});

const ShipmentController: React.FC = () => {
  const router = useRouter();
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [stocks, setStocks] = useState<Array<Stock & { selected: boolean; quantity: number }>>([]);
  const [form, setForm] = useState<ShipmentFormData>({
    items: [],
    consignee: "",
    vessel: Vessel.first,
    shipmark: "",
    packagingInstructions: PackagingInstructions.oneJutetwoPolly,
    additionalInstructions: "",
  });
  const [editingShipmentId, setEditingShipmentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const { data: stocksResponse, isLoading: stocksLoading } = useGetStocksQuery({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });

  const { data: shipmentsResponse, isLoading: shipmentsLoading } = useGetShipmentsQuery(
      authUser?.cognitoInfo?.userId ? { userCognitoId: authUser.cognitoInfo.userId, page: 1, limit: 100 } : skipToken
  );

  const [createShipment, { isLoading: creatingShipment }] = useCreateShipmentMutation();
  const [updateShipment, { isLoading: updatingShipment }] = useUpdateShipmentMutation();

  useEffect(() => {
    if (stocksResponse?.data) {
      setStocks(
          stocksResponse.data.map((stock: Stock) => ({
            ...stock,
            selected: false,
            quantity: 0,
          }))
      );
    }
  }, [stocksResponse]);

  const validateForm = () => {
    if (!form.consignee) return "Consignee is required.";
    if (!form.shipmark) return "Shipmark is required.";
    const selectedStocks = stocks.filter((s) => s.selected);
    if (selectedStocks.length === 0) return "At least one stock must be selected.";
    for (const stock of selectedStocks) {
      if (stock.quantity <= 0) return `Quantity must be positive for stock ${stock.lotNo}.`;
      if (stock.quantity > stock.weight) return `Quantity for ${stock.lotNo} exceeds available ${stock.weight} kg.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    if (!authUser?.cognitoInfo?.userId) {
      setError("Missing user ID.");
      return;
    }

    const items = stocks
        .filter((s) => s.selected)
        .map((s) => ({
          stocksId: s.id,
          totalWeight: s.quantity,
        }));

    const payload = {
      items,
      shipmentDate: new Date().toISOString(),
      status: form.status ?? "Pending",
      consignee: form.consignee,
      vessel: form.vessel.toString(),
      shipmark: form.shipmark,
      packagingInstructions: form.packagingInstructions.toString(),
      additionalInstructions: form.additionalInstructions || undefined,
      userCognitoId: authUser.cognitoInfo.userId,
    };

    try {
      if (editingShipmentId) {
        await updateShipment({
          userCognitoId: authUser.cognitoInfo.userId,
          shipmentId: editingShipmentId,
          shipment: payload,
        }).unwrap();
        setSuccessMessage("Shipment updated successfully!");
      } else {
        await createShipment(payload).unwrap();
        setSuccessMessage("Shipment created successfully!");
      }
      resetForm();
    } catch (err: any) {
      console.error("Shipment submission failed:", err);
      setError(err?.data?.message || "Failed to save shipment.");
    }
  };

  const handleEditShipment = (shipment: Shipment) => {
    setEditingShipmentId(shipment.id);
    setForm({
      items: shipment.items.map((item) => ({
        stocksId: item.stocksId,
        quantity: item.quantity,
      })),
      consignee: shipment.consignee,
      vessel: shipment.vessel as Vessel,
      shipmark: shipment.shipmark,
      packagingInstructions: shipment.packagingInstructions as PackagingInstructions,
      additionalInstructions: shipment.additionalInstructions || "",
    });

    setStocks((prev) =>
        prev.map((stock) => ({
          ...stock,
          selected: shipment.items.some((item) => item.stocksId === stock.id),
          quantity: shipment.items.find((item) => item.stocksId === stock.id)?.quantity || stock.quantity,
        }))
    );
  };

  const resetForm = () => {
    setForm({
      items: [],
      consignee: "",
      vessel: Vessel.first,
      shipmark: "",
      packagingInstructions: PackagingInstructions.oneJutetwoPolly,
      additionalInstructions: "",
    });
    setStocks((prev) =>
        prev.map((s) => ({
          ...s,
          selected: false,
          quantity: 0,
        }))
    );
    setEditingShipmentId(null);
    setError(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  if (authLoading || !authUser) {
    return (
        <Box sx={{ p: 3, maxWidth: 1300, mx: "auto" }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
    );
  }

  const tabs = [
    {
      label: "Select Stocks",
      component: (
          <Stocks
              stocks={stocks}
              setStocks={setStocks}
              search={search}
              setSearch={setSearch}
              stocksLoading={stocksLoading}
          />
      ),
    },
    {
      label: "New Shipment",
      component: (
          <NewShipment
              form={form}
              setForm={setForm}
              editingShipmentId={editingShipmentId}
              error={error}
              setError={setError}
              creatingShipment={creatingShipment}
              updatingShipment={updatingShipment}
              handleSubmit={handleSubmit}
              resetForm={resetForm}
          />
      ),
    },
    {
      label: "Existing Shipments",
      component: (
          <ExistingShipments
              shipments={shipmentsResponse?.data || []}
              shipmentsLoading={shipmentsLoading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalShipments={shipmentsResponse?.meta.total || 0}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
          />
      ),
    },
  ];

  return (
      <ThemeProvider theme={theme}>
        <div className="h-screen w-screen flex flex-col bg-gray-100">
          <div className="flex-1 flex flex-col w-full max-w-[1920px] mx-auto bg-white rounded-none md:rounded-2xl shadow-2xl overflow-hidden">
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
                {successMessage}
              </Alert>
            </Snackbar>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-600 to-blue-800 p-6"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Manage Shipments
              </h1>
            </motion.div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-2 p-4" aria-label="Shipment navigation tabs">
                {tabs.map((tab, index) => (
                    <motion.button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
                            activeTab === index
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                      {tab.label}
                    </motion.button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 flex-1 overflow-auto"
              >
                {tabs[activeTab].component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </ThemeProvider>
  );
};

export default ShipmentController;