"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAuthUserQuery, useCreateSellingPriceMutation } from "@/state/api";
import { toast } from "sonner";
import { SellingPriceResponse } from "@/state";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createSellingPriceSchema, SellingPriceFormData } from "@/lib/schemas";
import { TeaCategory, TeaGrade, Broker } from "@/state/enums";
import { format } from "date-fns";

interface SellingPricesActionsProps {
    sellingPricesData: SellingPriceResponse[];
    selectedItems: number[];
    handleSelectAll: () => void;
}

const SellingPricesActions: React.FC<SellingPricesActionsProps> = ({
                                                                       sellingPricesData,
                                                                       selectedItems,
                                                                       handleSelectAll,
                                                                   }) => {
    const { t } = useTranslation("sellingPrices");
    const { data: authData } = useGetAuthUserQuery();
    const [createSellingPrice] = useCreateSellingPriceMutation();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<SellingPriceFormData>>({});
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof SellingPriceFormData, string>>>({});

    const isAdmin = authData?.userRole?.toLowerCase() === "admin";
    const userCognitoId = authData?.cognitoInfo?.userId;

    const handleCreateSellingPrice = async () => {
        try {
            setFormErrors({});
            const validatedData = createSellingPriceSchema.parse({
                ...formData,
                adminCognitoId: userCognitoId,
            });
            await createSellingPrice(validatedData).unwrap();
            toast.success(t("success.sellingPriceCreated"));
            setIsCreateDialogOpen(false);
            setFormData({});
        } catch (error: any) {
            if (error.name === "ZodError") {
                const fieldErrors: Partial<Record<keyof SellingPriceFormData, string>> = {};
                error.errors.forEach((err: any) => {
                    fieldErrors[err.path[0] as keyof SellingPriceFormData] = err.message;
                });
                setFormErrors(fieldErrors);
            } else {
                toast.error(t("errors.sellingPriceCreateFailed"), {
                    description: error?.data?.message || error?.message || t("errors.sellingPriceCreateFailedDesc"),
                });
            }
        }
    };

    const handleFormChange = (key: keyof SellingPriceFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (formErrors[key]) {
            setFormErrors((prev) => ({ ...prev, [key]: undefined }));
        }
    };

    return (
        <div className="flex items-center gap-3 mb-4">
            <Checkbox
                checked={sellingPricesData.length === selectedItems.length && sellingPricesData.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label={t("actions.selectAll")}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
        {t("selectedCount", { count: selectedItems.length })}
      </span>
            {isAdmin && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="text-sm border-indigo-400 hover:bg-indigo-600 hover:text-white dark:border-indigo-600 dark:hover:bg-indigo-700"
                            aria-label={t("actions.createSellingPrice")}
                        >
                            {t("actions.createSellingPrice")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t("actions.createSellingPrice")}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.lotNo")}</Label>
                                <Input
                                    value={formData.lotNo ?? ""}
                                    onChange={(e) => handleFormChange("lotNo", e.target.value)}
                                    placeholder={t("placeholders.lotNo")}
                                    className={formErrors.lotNo ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.lotNo && <p className="text-xs text-red-500 mt-1">{formErrors.lotNo}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.sellingMark")}</Label>
                                <Input
                                    value={formData.sellingMark ?? ""}
                                    onChange={(e) => handleFormChange("sellingMark", e.target.value)}
                                    placeholder={t("placeholders.sellingMark")}
                                    className={formErrors.sellingMark ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.sellingMark && <p className="text-xs text-red-500 mt-1">{formErrors.sellingMark}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.grade")}</Label>
                                <Select value={formData.grade ?? ""} onValueChange={(value) => handleFormChange("grade", value)}>
                                    <SelectTrigger className={formErrors.grade ? "border-red-500" : ""}>
                                        <SelectValue placeholder={t("placeholders.grade")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TeaGrade).map((grade) => (
                                            <SelectItem key={grade} value={grade}>
                                                {grade}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.grade && <p className="text-xs text-red-500 mt-1">{formErrors.grade}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.invoiceNo")}</Label>
                                <Input
                                    value={formData.invoiceNo ?? ""}
                                    onChange={(e) => handleFormChange("invoiceNo", e.target.value)}
                                    placeholder={t("placeholders.invoiceNo")}
                                    className={formErrors.invoiceNo ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.invoiceNo && <p className="text-xs text-red-500 mt-1">{formErrors.invoiceNo}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.saleCode")}</Label>
                                <Input
                                    value={formData.saleCode ?? ""}
                                    onChange={(e) => handleFormChange("saleCode", e.target.value)}
                                    placeholder={t("placeholders.saleCode")}
                                    className={formErrors.saleCode ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.saleCode && <p className="text-xs text-red-500 mt-1">{formErrors.saleCode}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.category")}</Label>
                                <Select value={formData.category ?? ""} onValueChange={(value) => handleFormChange("category", value)}>
                                    <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                                        <SelectValue placeholder={t("placeholders.category")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TeaCategory).map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.broker")}</Label>
                                <Select value={formData.broker ?? ""} onValueChange={(value) => handleFormChange("broker", value)}>
                                    <SelectTrigger className={formErrors.broker ? "border-red-500" : ""}>
                                        <SelectValue placeholder={t("placeholders.broker")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Broker).map((broker) => (
                                            <SelectItem key={broker} value={broker}>
                                                {broker}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.broker && <p className="text-xs text-red-500 mt-1">{formErrors.broker}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.bags")}</Label>
                                <Input
                                    type="number"
                                    value={formData.bags ?? ""}
                                    onChange={(e) => handleFormChange("bags", Number(e.target.value))}
                                    placeholder={t("placeholders.bags")}
                                    min={1}
                                    className={formErrors.bags ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.bags && <p className="text-xs text-red-500 mt-1">{formErrors.bags}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.netWeight")}</Label>
                                <Input
                                    type="number"
                                    value={formData.netWeight ?? ""}
                                    onChange={(e) => handleFormChange("netWeight", Number(e.target.value))}
                                    placeholder={t("placeholders.netWeight")}
                                    min={0}
                                    step="0.01"
                                    className={formErrors.netWeight ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.netWeight && <p className="text-xs text-red-500 mt-1">{formErrors.netWeight}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.totalWeight")}</Label>
                                <Input
                                    type="number"
                                    value={formData.totalWeight ?? ""}
                                    onChange={(e) => handleFormChange("totalWeight", Number(e.target.value))}
                                    placeholder={t("placeholders.totalWeight")}
                                    min={0}
                                    step="0.01"
                                    className={formErrors.totalWeight ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.totalWeight && <p className="text-xs text-red-500 mt-1">{formErrors.totalWeight}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.askingPrice")}</Label>
                                <Input
                                    type="number"
                                    value={formData.askingPrice ?? ""}
                                    onChange={(e) => handleFormChange("askingPrice", Number(e.target.value))}
                                    placeholder={t("placeholders.askingPrice")}
                                    min={0}
                                    step="0.01"
                                    className={formErrors.askingPrice ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.askingPrice && <p className="text-xs text-red-500 mt-1">{formErrors.askingPrice}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.purchasePrice")}</Label>
                                <Input
                                    type="number"
                                    value={formData.purchasePrice ?? ""}
                                    onChange={(e) => handleFormChange("purchasePrice", Number(e.target.value))}
                                    placeholder={t("placeholders.purchasePrice")}
                                    min={0}
                                    step="0.01"
                                    className={formErrors.purchasePrice ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.purchasePrice && <p className="text-xs text-red-500 mt-1">{formErrors.purchasePrice}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.producerCountry")}</Label>
                                <Input
                                    value={formData.producerCountry ?? ""}
                                    onChange={(e) => handleFormChange("producerCountry", e.target.value || undefined)}
                                    placeholder={t("placeholders.producerCountry")}
                                    className={formErrors.producerCountry ? "border-red-500" : ""}
                                />
                                {formErrors.producerCountry && <p className="text-xs text-red-500 mt-1">{formErrors.producerCountry}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.manufactureDate")}</Label>
                                <Input
                                    type="date"
                                    value={formData.manufactureDate ? format(new Date(formData.manufactureDate), "yyyy-MM-dd") : ""}
                                    onChange={(e) => handleFormChange("manufactureDate", e.target.value)}
                                    placeholder={t("placeholders.manufactureDate")}
                                    className={formErrors.manufactureDate ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.manufactureDate && <p className="text-xs text-red-500 mt-1">{formErrors.manufactureDate}</p>}
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("placeholders.reprint")}</Label>
                                <Input
                                    type="number"
                                    value={formData.reprint ?? ""}
                                    onChange={(e) => handleFormChange("reprint", Number(e.target.value))}
                                    placeholder={t("placeholders.reprint")}
                                    min={0}
                                    className={formErrors.reprint ? "border-red-500" : ""}
                                    required
                                />
                                {formErrors.reprint && <p className="text-xs text-red-500 mt-1">{formErrors.reprint}</p>}
                            </div>
                        </div>
                        <Button
                            onClick={handleCreateSellingPrice}
                            className="mt-6 w-full bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
                        >
                            {t("actions.submit")}
                        </Button>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default SellingPricesActions;