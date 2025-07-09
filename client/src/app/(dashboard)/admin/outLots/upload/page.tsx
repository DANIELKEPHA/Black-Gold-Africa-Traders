"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useUploadOutlotsCsvMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {Broker, TeaGrade} from "@/state/enums";

const OutLotsUpload: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const [uploadOutlotsCsv, { isLoading: isUploading }] = useUploadOutlotsCsvMutation();
    const [file, setFile] = useState<File | null>(null);
    const [duplicateAction, setDuplicateAction] = useState<"skip" | "replace">("skip");
    const [errors, setErrors] = useState<string[]>([]);
    const isAdmin = authUser?.userRole === "admin";

    const requiredHeaders = [
        "Auction",
        "Lot No",
        "Broker",
        "Selling Mark",
        "Grade",
        "Invoice No",
        "Bags",
        "Net Weight",
        "Total Weight",
        "Baseline Price",
        "Manufacture Date",
    ];

    const validBrokers = Object.values(Broker) as string[];
    const validGrades = Object.values(TeaGrade) as string[];

    const validateCsv = async (file: File): Promise<boolean> => {
        const time = new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" });
        // console.log(`[${time}] Starting validateCsv:`, {
        //     filename: file.name,
        //     size: file.size,
        //     type: file.type,
        // });

        setErrors([]);
        const newErrors: string[] = [];

        try {
            // console.log(`[${time}] Reading CSV file: ${file.name}`);
            const text = await file.text();
            const lines = text.split("\n").filter((line) => line.trim());
            // console.log(`[${time}] CSV lines parsed:`, {
            //     totalLines: lines.length,
            //     firstFewLines: lines.slice(0, 3),
            // });

            if (lines.length < 2) {
                newErrors.push(
                    t("catalog:errors.invalidCsv", {
                        defaultValue: "CSV file is empty or missing data rows",
                    })
                );
                console.error(`[${time}] CSV validation failed: File has fewer than 2 lines`, { lines });
                setErrors(newErrors);
                return false;
            }

            const headers = lines[0].split(",").map((h) => h.trim());
            // console.log(`[${time}] CSV headers:`, headers);

            const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
            if (missingHeaders.length > 0) {
                newErrors.push(
                    t("catalog:errors.missingHeaders", {
                        defaultValue: `Missing required CSV headers: ${missingHeaders.join(", ")}`,
                    })
                );
                console.error(`[${time}] CSV validation failed: Missing headers`, { missingHeaders });
                setErrors(newErrors);
                return false;
            }

            let firstRow: string[] | undefined;
            let rowIndex = 1;
            // console.log(`[${time}] Searching for first valid data row`);
            while (rowIndex < lines.length && !firstRow) {
                const row = lines[rowIndex].split(",").map((v) => v.trim());
                // console.log(`[${time}] Row ${rowIndex}:`, { rawRow: row });

                if (row.length >= headers.length && row.some((v) => v)) {
                    firstRow = row;
                    // console.log(`[${time}] Found first valid data row at index ${rowIndex}:`, firstRow);
                } else {
                    // console.log(`[${time}] Skipping row ${rowIndex}: Insufficient or empty values`);
                }
                rowIndex++;
            }

            if (!firstRow) {
                newErrors.push(
                    t("catalog:errors.noValidData", {
                        defaultValue: "No valid data rows found in CSV",
                    })
                );
                console.error(`[${time}] CSV validation failed: No valid data rows found`, { lines });
                setErrors(newErrors);
                return false;
            }

            if (firstRow.length < headers.length) {
                newErrors.push(
                    t("catalog:errors.invalidRow", {
                        defaultValue: "First data row does not match header count",
                    })
                );
                console.error(`[${time}] CSV validation failed: First data row length mismatch`, {
                    rowLength: firstRow.length,
                    headerLength: headers.length,
                    firstRow,
                });
                setErrors(newErrors);
                return false;
            }

            const rowData: Record<string, string> = headers.reduce(
                (acc, h, i) => ({ ...acc, [h]: firstRow![i] || "" }),
                {}
            );
            // console.log(`[${time}] First valid data row parsed:`, rowData);

            if (!rowData["Auction"]) {
                newErrors.push(
                    t("catalog:errors.missingAuction", {
                        defaultValue: "Auction is required in first row",
                    })
                );
            }
            if (!rowData["Lot No"]) {
                newErrors.push(
                    t("catalog:errors.missingLotNo", {
                        defaultValue: "Lot No is required in first row",
                    })
                );
            }
            if (!rowData["Broker"]) {
                newErrors.push(
                    t("catalog:errors.missingBroker", {
                        defaultValue: "Broker is required in first row",
                    })
                );
            } else if (!validBrokers.includes(rowData["Broker"])) {
                newErrors.push(
                    t("catalog:errors.invalidBroker", {
                        value: rowData["Broker"],
                        valid: validBrokers.join(", "),
                        defaultValue: `Invalid broker: ${rowData["Broker"]}. Valid options: ${validBrokers.join(", ")}`,
                    })
                );
            }

            if (!rowData["Selling Mark"]) {
                newErrors.push(
                    t("catalog:errors.missingSellingMark", {
                        defaultValue: "Selling Mark is required in first row",
                    })
                );
            }
            if (!rowData["Grade"]) {
                newErrors.push(
                    t("catalog:errors.missingGrade", {
                        defaultValue: "Grade is required in first row",
                    })
                );
            } else if (!validGrades.includes(rowData["Grade"])) {
                newErrors.push(
                    t("catalog:errors.invalidGrade", {
                        defaultValue: `Invalid Grade in first row: must be one of ${validGrades.join(", ")}`,
                    })
                );
            }
            if (!rowData["Invoice No"]) {
                newErrors.push(
                    t("catalog:errors.missingInvoiceNo", {
                        defaultValue: "Invoice No is required in first row",
                    })
                );
            }

            const numericFields = [
                { key: "Bags", label: "Bags" },
                { key: "Net Weight", label: "Net Weight" },
                { key: "Total Weight", label: "Total Weight" },
                { key: "Baseline Price", label: "Baseline Price" },
            ];
            for (const { key, label } of numericFields) {
                if (!rowData[key] || isNaN(Number(rowData[key])) || Number(rowData[key]) <= 0) {
                    newErrors.push(
                        t("catalog:errors.invalidNumber", {
                            defaultValue: `Invalid or negative ${label} in first row`,
                        })
                    );
                }
            }

            // Removed Manufacture Date validation, relying on server schema
            if (newErrors.length > 0) {
                console.error(`[${time}] CSV validation failed:`, {
                    errors: newErrors,
                    rowData,
                    rowIndex: rowIndex - 1,
                });
                setErrors(newErrors);
                return false;
            }

            // console.log(`[${time}] CSV validation successful for file: ${file.name}`);
            return true;
        } catch (error) {
            newErrors.push(
                t("catalog:errors.csvReadFailed", {
                    defaultValue: "Failed to read CSV file",
                })
            );
            console.error(`[${time}] Error reading CSV file:`, {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            setErrors(newErrors);
            return false;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrors([]);
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        setErrors([]);
        if (!isAdmin) {
            setErrors([t("catalog:errors.unauthorized", { defaultValue: "Unauthorized" })]);
            return;
        }
        if (!file) {
            setErrors([t("catalog:errors.noFileSelected", { defaultValue: "No file selected" })]);
            return;
        }
        if (!(await validateCsv(file))) {
            return;
        }

        try {
            const response = await uploadOutlotsCsv({ file, duplicateAction }).unwrap();
            if (response.success.created === 0 && response.errors.length > 0) {
                setErrors(response.errors.map((e) => `Row ${e.row}: ${e.message}`));
                toast.error(t("catalog:errors.csvUploadFailed", { defaultValue: "Failed to upload CSV" }));
                return;
            }
            toast.success(
                t("catalog:success.csvUploaded", {
                    defaultValue: `Successfully uploaded ${response.success.created} outlot(s), skipped ${response.success.skipped}, replaced ${response.success.replaced}`,
                })
            );
            setErrors([]);
            router.push("/admin/outLots");
        } catch (error: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}] uploadOutlotsCsv error:`,
                {
                    status: error.status,
                    message: error?.data?.message,
                    details: error?.data?.details,
                    fileName: file.name,
                }
            );
            const errorMessage =
                error?.data?.message ||
                t("catalog:errors.csvUploadFailedDesc", {
                    defaultValue: "An error occurred while uploading the CSV",
                });
            setErrors([errorMessage]);
            toast.error(t("catalog:errors.csvUploadFailed", { defaultValue: "Failed to upload CSV" }));
        }
    };

    if (isAuthLoading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster />
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                    {t("catalog:uploadOutLots", { defaultValue: "Upload OutLots CSV" })}
                </h2>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="csvFile" className="text-gray-900 dark:text-gray-100 font-medium">
                            {t("catalog:selectCsv", { defaultValue: "Select CSV File" })}
                        </Label>
                        <Input
                            id="csvFile"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="mt-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-sm"
                            disabled={isUploading || !isAdmin}
                        />
                        <a
                            href="/sample_outlots.csv"
                            download
                            className="text-blue-600 dark:text-blue-400 text-sm mt-1 inline-flex items-center"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            {t("catalog:downloadTemplate", { defaultValue: "Download CSV Template" })}
                        </a>
                    </div>
                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("catalog:errors.title", { defaultValue: "Errors Detected" })}</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4">
                                    {errors.map((error, index) => <li key={index}>{error}</li>)}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div>
                        <Label htmlFor="duplicateAction" className="text-gray-900 dark:text-gray-100 font-medium">
                            {t("catalog:duplicateAction", { defaultValue: "Duplicate Action" })}
                        </Label>
                        <Select
                            value={duplicateAction}
                            onValueChange={(value: "skip" | "replace") => setDuplicateAction(value)}
                            disabled={isUploading || !isAdmin}
                        >
                            <SelectTrigger id="duplicateAction" className="mt-1 rounded-sm border-gray-300 dark:border-gray-600">
                                <SelectValue placeholder={t("catalog:selectDuplicateAction", { defaultValue: "Select action" })} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800">
                                <SelectItem value="skip">{t("catalog:skipDuplicates", { defaultValue: "Skip Duplicates" })}</SelectItem>
                                <SelectItem value="replace">{t("catalog:replaceDuplicates", { defaultValue: "Replace Duplicates" })}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setErrors([]);
                                router.push("/admin/outLots");
                            }}
                            className="rounded-sm px-6 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            disabled={isUploading}
                        >
                            {t("general:actions.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button
                            onClick={handleUpload}
                            className="rounded-sm px-6 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isUploading || !file || !isAdmin}
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            {t("catalog:actions.upload", { defaultValue: "Upload" })}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutLotsUpload;