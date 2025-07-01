"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useGetAuthUserQuery } from "@/state/api";
import { toast } from "sonner";
import { CatalogResponse } from "@/state";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createCatalogSchema, CatalogFormData } from "@/lib/schemas";
import { TeaCategory, TeaGrade, Broker } from "@/state/enums";
import { format } from 'date-fns';

interface CatalogActionsProps {
    catalogData: CatalogResponse[];
    selectedItems: number[];
    handleSelectAll: () => void;
}

const CatalogActions: React.FC<CatalogActionsProps> = ({
                                                           catalogData,
                                                           selectedItems,
                                                           handleSelectAll,
                                                       }) => {
    const { t } = useTranslation("catalog");
    const { data: authData } = useGetAuthUserQuery();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState<Partial<CatalogFormData>>({});

    const isAdmin = authData?.userRole?.toLowerCase() === "admin";
    const userCognitoId = authData?.cognitoInfo?.userId;

    const handleFormChange = (key: keyof CatalogFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex items-center gap-3 mb-4">
            <Checkbox
                checked={catalogData?.length === selectedItems.length && catalogData?.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label={t("actions.selectAll")}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
        {t("select", { count: selectedItems.length })}
      </span>
            {isAdmin && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="text-sm border-indigo-400 hover:bg-indigo-600 hover:text-white dark:border-indigo-600 dark:hover:bg-indigo-700"
                            aria-label={t("actions.createCatalog")}
                        >
                            {t("actions.createCatalog")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle>{t("actions.createCatalog")}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>{t("catalog:lotNoPlaceholder")}</Label>
                                <Input
                                    value={formData.lotNo ?? ""}
                                    onChange={(e) => handleFormChange("lotNo", e.target.value)}
                                    placeholder={t("catalog:lotNoPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:sellingMarkPlaceholder")}</Label>
                                <Input
                                    value={formData.sellingMark ?? ""}
                                    onChange={(e) => handleFormChange("sellingMark", e.target.value)}
                                    placeholder={t("catalog:sellingMarkPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:gradePlaceholder")}</Label>
                                <Select
                                    value={formData.grade ?? ""}
                                    onValueChange={(value) => handleFormChange("grade", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("catalog:gradePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TeaGrade).map((grade) => (
                                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t("catalog:invoiceNoPlaceholder")}</Label>
                                <Input
                                    value={formData.invoiceNo ?? ""}
                                    onChange={(e) => handleFormChange("invoiceNo", e.target.value)}
                                    placeholder={t("catalog:invoiceNoPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:saleCodePlaceholder")}</Label>
                                <Input
                                    value={formData.saleCode ?? ""}
                                    onChange={(e) => handleFormChange("saleCode", e.target.value)}
                                    placeholder={t("catalog:saleCodePlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:categoryPlaceholder")}</Label>
                                <Select
                                    value={formData.category ?? ""}
                                    onValueChange={(value) => handleFormChange("category", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("catalog:categoryPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TeaCategory).map((category) => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t("catalog:brokerPlaceholder")}</Label>
                                <Select
                                    value={formData.broker ?? ""}
                                    onValueChange={(value) => handleFormChange("broker", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("catalog:brokerPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Broker).map((broker) => (
                                            <SelectItem key={broker} value={broker}>{broker}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t("catalog:bagsPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.bags ?? ""}
                                    onChange={(e) => handleFormChange("bags", Number(e.target.value))}
                                    placeholder={t("catalog:bagsPlaceholder")}
                                    min={1}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:netWeightPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.netWeight ?? ""}
                                    onChange={(e) => handleFormChange("netWeight", Number(e.target.value))}
                                    placeholder={t("catalog:netWeightPlaceholder")}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:totalWeightPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.totalWeight ?? ""}
                                    onChange={(e) => handleFormChange("totalWeight", Number(e.target.value))}
                                    placeholder={t("catalog:totalWeightPlaceholder")}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:askingPricePlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.askingPrice ?? ""}
                                    onChange={(e) => handleFormChange("askingPrice", Number(e.target.value))}
                                    placeholder={t("catalog:askingPricePlaceholder")}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:countryPlaceholder")}</Label>
                                <Input
                                    value={formData.producerCountry ?? ""}
                                    onChange={(e) => handleFormChange("producerCountry", e.target.value)}
                                    placeholder={t("catalog:countryPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:manufactureDatePlaceholder")}</Label>
                                <Input
                                    type="date"
                                    value={formData.manufactureDate ? format(new Date(formData.manufactureDate), 'yyyy-MM-dd') : ""}
                                    onChange={(e) => handleFormChange("manufactureDate", e.target.value)}
                                    placeholder={t("catalog:manufactureDatePlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("catalog:reprintPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.reprint ?? ""}
                                    onChange={(e) => handleFormChange("reprint", Number(e.target.value))}
                                    placeholder={t("catalog:reprintPlaceholder")}
                                    min={0}
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default CatalogActions;