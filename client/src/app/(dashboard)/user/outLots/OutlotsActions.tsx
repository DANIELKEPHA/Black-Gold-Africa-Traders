"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useGetAuthUserQuery, useCreateOutlotMutation } from "@/state/api";
import { toast } from "sonner";
import { OutlotResponse } from "@/state";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createOutlotSchema, OutlotFormData } from "@/lib/schemas";
import { TeaGrade, Broker } from "@/state/enums";
import { format } from "date-fns";

interface OutlotsActionsProps {
    outlotData: OutlotResponse[];
    selectedItems: number[];
    handleSelectAll: () => void;
}

const OutlotsActions: React.FC<OutlotsActionsProps> = ({
                                                           outlotData,
                                                           selectedItems,
                                                           handleSelectAll,
                                                       }) => {
    const { t } = useTranslation("catalog");
    const { data: authData } = useGetAuthUserQuery();
    const [createOutlot] = useCreateOutlotMutation();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [formData, setFormData] = React.useState<Partial<OutlotFormData>>({});

    const isAdmin = authData?.userRole?.toLowerCase() === "admin";
    const userCognitoId = authData?.cognitoInfo?.userId;

    const handleCreateOutlot = async () => {
        try {
            const validatedData = createOutlotSchema.parse({
                ...formData,
                adminCognitoId: userCognitoId,
            });
            await createOutlot(validatedData).unwrap();
            toast.success(t("success.outlotCreated"));
            setIsCreateDialogOpen(false);
            setFormData({});
        } catch (error: any) {
            toast.error(t("errors.outlotCreateFailed"), {
                description: error?.data?.message || error?.message || t("errors.outlotCreateFailedDesc"),
            });
        }
    };

    const handleFormChange = (key: keyof OutlotFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex items-center gap-3 mb-4">
            <Checkbox
                checked={outlotData.length === selectedItems.length && outlotData.length > 0}
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
                            aria-label={t("actions.createOutlot")}
                        >
                            {t("actions.createOutlot")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle>{t("actions.createOutlot")}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>{t("outlot:auctionPlaceholder")}</Label>
                                <Input
                                    value={formData.auction ?? ""}
                                    onChange={(e) => handleFormChange("auction", e.target.value)}
                                    placeholder={t("outlot:auctionPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:lotNoPlaceholder")}</Label>
                                <Input
                                    value={formData.lotNo ?? ""}
                                    onChange={(e) => handleFormChange("lotNo", e.target.value)}
                                    placeholder={t("outlot:lotNoPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:brokerPlaceholder")}</Label>
                                <Select
                                    value={formData.broker ?? ""}
                                    onValueChange={(value) => handleFormChange("broker", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("outlot:brokerPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Broker).map((broker) => (
                                            <SelectItem key={broker} value={broker}>
                                                {broker}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t("outlot:sellingMarkPlaceholder")}</Label>
                                <Input
                                    value={formData.sellingMark ?? ""}
                                    onChange={(e) => handleFormChange("sellingMark", e.target.value)}
                                    placeholder={t("outlot:sellingMarkPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:gradePlaceholder")}</Label>
                                <Select
                                    value={formData.grade ?? ""}
                                    onValueChange={(value) => handleFormChange("grade", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("outlot:gradePlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(TeaGrade).map((grade) => (
                                            <SelectItem key={grade} value={grade}>
                                                {grade}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t("outlot:invoiceNoPlaceholder")}</Label>
                                <Input
                                    value={formData.invoiceNo ?? ""}
                                    onChange={(e) => handleFormChange("invoiceNo", e.target.value)}
                                    placeholder={t("outlot:invoiceNoPlaceholder")}
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:bagsPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.bags ?? ""}
                                    onChange={(e) => handleFormChange("bags", Number(e.target.value))}
                                    placeholder={t("outlot:bagsPlaceholder")}
                                    min={1}
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:netWeightPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.netWeight ?? ""}
                                    onChange={(e) => handleFormChange("netWeight", Number(e.target.value))}
                                    placeholder={t("outlot:netWeightPlaceholder")}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:totalWeightPlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.totalWeight ?? ""}
                                    onChange={(e) => handleFormChange("totalWeight", Number(e.target.value))}
                                    placeholder={t("outlot:totalWeightPlaceholder")}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:baselinePricePlaceholder")}</Label>
                                <Input
                                    type="number"
                                    value={formData.baselinePrice ?? ""}
                                    onChange={(e) => handleFormChange("baselinePrice", Number(e.target.value))}
                                    placeholder={t("outlot:baselinePricePlaceholder")}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label>{t("outlot:manufactureDatePlaceholder")}</Label>
                                <Input
                                    type="date"
                                    value={formData.manufactureDate ? format(new Date(formData.manufactureDate), "yyyy-MM-dd") : ""}
                                    onChange={(e) => handleFormChange("manufactureDate", e.target.value)}
                                    placeholder={t("outlot:manufactureDatePlaceholder")}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleCreateOutlot}
                            className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            {t("actions.submit")}
                        </Button>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default OutlotsActions;