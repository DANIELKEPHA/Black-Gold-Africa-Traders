"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Toaster, toast } from "sonner";
import { useGetAuthUserQuery, useUploadSellingPricesCsvMutation } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {Broker, TeaCategory, TeaGrade} from "@/state/enums";

const SellingPricesUpload: React.FC = () => {
    const { t } = useTranslation(["catalog", "general"]);
    const router = useRouter();
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const [uploadSellingPricesCsv, { isLoading: isUploading }] = useUploadSellingPricesCsvMutation();
    const [file, setFile] = useState<File | null>(null);
    const [duplicateAction, setDuplicateAction] = useState<"skip" | "replace">("skip");
    const [errors, setErrors] = useState<string[]>([]);
    const isAdmin = authUser?.userRole === "admin";

    const requiredHeaders = [
        "Broker",
        "Lot No",
        "Selling Mark",
        "Grade",
        "Invoice No",
        "Sale Code",
        "Category",
        "RP",
        "Bags",
        "Net Weight",
        "Total Weight",
        "Asking Price",
        "Purchase Price",
        "Producer Country",
        "Manufactured Date",
    ];

    const validBrokers = Object.values(Broker) as string[];
    const validGrades = Object.values(TeaGrade) as string[];
    const validCategories = Object.values(TeaCategory) as string[];


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
            // console.log(`[${time}] Raw CSV content:`, text); // Log full content for debugging
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
                console.error(`[${time}] CSV validation failed: File has fewer than 2 lines`, {
                    lines,
                });
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
                        headers: missingHeaders.join(", "),
                    })
                );
                console.error(`[${time}] CSV validation failed: Missing headers`, {
                    missingHeaders,
                });
                setErrors(newErrors);
                return false;
            }

            const dateRegex = /^(?:\d{4}\/(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])|(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/\d{4}|([1-9]|1[0-2])\/([1-9]|[12]\d|3[01])\/\d{4})$/;

            for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
                const row = lines[rowIndex].split(",").map((v) => v.trim());
                if (row.length < headers.length || !row.some((v) => v)) {
                    // console.log(`[${time}] Skipping row ${rowIndex}: Insufficient or empty values`);
                    continue; // Skip empty or incomplete rows
                }

                const rowData: Record<string, string> = headers.reduce(
                    (acc, h, i) => ({ ...acc, [h]: row[i] || "" }),
                    {}
                );
                // console.log(`[${time}] Row ${rowIndex} data:`, rowData);

                // Validate required fields
                if (!rowData["Broker"]) {
                    newErrors.push(
                        t("catalog:errors.missingBroker", {
                            defaultValue: `Row ${rowIndex + 1}: Broker is required`,
                            row: rowIndex + 1,
                        })
                    );
                } else if (!validBrokers.includes(rowData["Broker"])) {
                    newErrors.push(
                        t("catalog:errors.invalidBroker", {
                            defaultValue: `Row ${rowIndex + 1}: Invalid Broker: must be one of ${validBrokers.join(", ")}`,
                            row: rowIndex + 1,
                            validBrokers: validBrokers.join(", "),
                        })
                    );
                }
                if (!rowData["Lot No"]) {
                    newErrors.push(
                        t("catalog:errors.missingLotNo", {
                            defaultValue: `Row ${rowIndex + 1}: Lot No is required`,
                            row: rowIndex + 1,
                        })
                    );
                }
                if (!rowData["Selling Mark"]) {
                    newErrors.push(
                        t("catalog:errors.missingSellingMark", {
                            defaultValue: `Row ${rowIndex + 1}: Selling Mark is required`,
                            row: rowIndex + 1,
                        })
                    );
                }
                if (!rowData["Grade"]) {
                    newErrors.push(
                        t("catalog:errors.missingGrade", {
                            defaultValue: `Row ${rowIndex + 1}: Grade is required`,
                            row: rowIndex + 1,
                        })
                    );
                } else if (!validGrades.includes(rowData["Grade"])) {
                    newErrors.push(
                        t("catalog:errors.invalidGrade", {
                            defaultValue: `Row ${rowIndex + 1}: Invalid Grade: must be one of ${validGrades.join(", ")}`,
                            row: rowIndex + 1,
                            validGrades: validGrades.join(", "),
                        })
                    );
                }
                if (!rowData["Invoice No"]) {
                    newErrors.push(
                        t("catalog:errors.missingInvoiceNo", {
                            defaultValue: `Row ${rowIndex + 1}: Invoice No is required`,
                            row: rowIndex + 1,
                        })
                    );
                }
                if (!rowData["Sale Code"]) {
                    newErrors.push(
                        t("catalog:errors.missingSaleCode", {
                            defaultValue: `Row ${rowIndex + 1}: Sale Code is required`,
                            row: rowIndex + 1,
                        })
                    );
                }
                if (!rowData["Category"]) {
                    newErrors.push(
                        t("catalog:errors.missingCategory", {
                            defaultValue: `Row ${rowIndex + 1}: Category is required`,
                            row: rowIndex + 1,
                        })
                    );
                } else if (!validCategories.includes(rowData["Category"])) {
                    newErrors.push(
                        t("catalog:errors.invalidCategory", {
                            defaultValue: `Row ${rowIndex + 1}: Invalid Category: must be one of ${validCategories.join(", ")}`,
                            row: rowIndex + 1,
                            validCategories: validCategories.join(", "),
                        })
                    );
                }

                // Validate numeric fields (excluding RP)
                const numericFields = [
                    { key: "Bags", label: "Bags" },
                    { key: "Net Weight", label: "Net Weight" },
                    { key: "Total Weight", label: "Total Weight" },
                    { key: "Asking Price", label: "Asking Price" },
                    { key: "Purchase Price", label: "Purchase Price" },
                ];
                for (const { key, label } of numericFields) {
                    if (!rowData[key] || isNaN(Number(rowData[key])) || Number(rowData[key]) <= 0) {
                        newErrors.push(
                            t("catalog:errors.invalidNumber", {
                                defaultValue: `Row ${rowIndex + 1}: Invalid or negative ${label}`,
                                row: rowIndex + 1,
                                label,
                            })
                        );
                    }
                }

                // Validate reprint (RP) specifically
                const reprint = rowData["RP"];
                if (reprint && reprint.toLowerCase() !== "no" && (isNaN(Number(reprint)) || Number(reprint) <= 0)) {
                    newErrors.push(
                        t("catalog:errors.invalidReprint", {
                            defaultValue: `Row ${rowIndex + 1}: Invalid or negative RP, must be 'No' or a positive integer (got '${reprint}')`,
                            row: rowIndex + 1,
                            value: reprint,
                        })
                    );
                }

                // Validate date format
                const dateStr = rowData["Manufactured Date"];
                if (!dateStr) {
                    newErrors.push(
                        t("catalog:errors.missingDate", {
                            defaultValue: `Row ${rowIndex + 1}: Manufactured Date is required`,
                            row: rowIndex + 1,
                        })
                    );
                    console.error(`[${time}] CSV validation failed: Missing Manufactured Date`, {
                        rowData,
                        rowIndex,
                    });
                } else if (!dateRegex.test(dateStr)) {
                    newErrors.push(
                        t("catalog:errors.invalidDate", {
                            defaultValue: `Row ${rowIndex + 1}: Invalid Manufactured Date format (expected YYYY/MM/DD, DD/MM/YYYY, or M/D/YYYY, got '${dateStr}')`,
                            row: rowIndex + 1,
                            value: dateStr,
                        })
                    );
                    console.error(`[${time}] CSV validation failed: Invalid date format`, {
                        manufacturedDate: dateStr,
                        rowData,
                        rowIndex,
                    });
                } else {
                    let year: number, month: number, day: number;
                    if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
                        [year, month, day] = dateStr.split('/').map(Number);
                    } else if (dateStr.match(/^([1-9]|[12]\d|3[01])\/([1-9]|1[0-2])\/\d{4}$/)) {
                        [day, month, year] = dateStr.split('/').map(Number);
                    } else {
                        [month, day, year] = dateStr.split('/').map(Number);
                    }
                    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const date = new Date(formattedDate);
                    if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
                        newErrors.push(
                            t("catalog:errors.invalidDateValue", {
                                defaultValue: `Row ${rowIndex + 1}: Manufactured Date is not a valid date (got '${dateStr}')`,
                                row: rowIndex + 1,
                                value: dateStr,
                            })
                        );
                        console.error(`[${time}] CSV validation failed: Invalid date value`, {
                            manufacturedDate: dateStr,
                            formattedDate,
                            rowData,
                            rowIndex,
                        });
                    }
                }

                if (newErrors.length >= 10) {
                    newErrors.push(
                        t("catalog:errors.tooManyErrors", {
                            defaultValue: "Too many errors detected, please fix the CSV and try again",
                        })
                    );
                    break;
                }
            }

            if (newErrors.length > 0) {
                console.error(`[${time}] CSV validation failed:`, {
                    errors: newErrors,
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
            setErrors([
                t("catalog:errors.unauthorized", { defaultValue: "Unauthorized" }),
            ]);
            return;
        }
        if (!file) {
            setErrors([
                t("catalog:errors.noFileSelected", { defaultValue: "No file selected" }),
            ]);
            return;
        }
        if (!(await validateCsv(file))) {
            return;
        }

        try {
            const response = await uploadSellingPricesCsv({ file, duplicateAction }).unwrap();
            if (response.success.created === 0 && response.errors.length > 0) {
                setErrors(
                    response.errors.map((e: { row: number; message: string }) => `Row ${e.row}: ${e.message}`)
                );
                toast.error(
                    t("catalog:errors.csvUploadFailed", {
                        defaultValue: "Failed to upload CSV",
                    })
                );
                return;
            }
            toast.success(
                t("catalog:success.csvUploaded", {
                    defaultValue: `Successfully uploaded ${response.success.created} selling price(s), skipped ${response.success.skipped}, replaced ${response.success.replaced}`,
                })
            );
            setErrors([]);
            router.push("/admin/sellingPrices");
        } catch (error: any) {
            console.error(
                `[${new Date().toLocaleString("en-US", {
                    timeZone: "Africa/Nairobi",
                })}] uploadSellingPricesCsv error:`,
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
            toast.error(
                t("catalog:errors.csvUploadFailed", {
                    defaultValue: "Failed to upload CSV",
                })
            );
        }
    };

    if (isAuthLoading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster />
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-sm shadow-xl p-8">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-6">
                    {t("catalog:uploadSellingPrices", {
                        defaultValue: "Upload Selling Prices CSV",
                    })}
                </h2>
                <div className="space-y-4">
                    <div>
                        <Label
                            htmlFor="csvFile"
                            className="text-gray-900 dark:text-gray-100 font-medium"
                        >
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
                            href="/sample_selling_prices.csv"
                            download
                            className="text-blue-600 dark:text-blue-400 text-sm mt-1 inline-flex items-center"
                        >
                            <Download className="w-4 h-4 mr-1" />
                            {t("catalog:downloadTemplate", {
                                defaultValue: "Download CSV Template",
                            })}
                        </a>
                    </div>
                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>
                                {t("catalog:errors.title", { defaultValue: "Errors Detected" })}
                            </AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-4">
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div>
                        <Label
                            htmlFor="duplicateAction"
                            className="text-gray-900 dark:text-gray-100 font-medium"
                        >
                            {t("catalog:duplicateAction", {
                                defaultValue: "Duplicate Action",
                            })}
                        </Label>
                        <Select
                            value={duplicateAction}
                            onValueChange={(value: "skip" | "replace") =>
                                setDuplicateAction(value)
                            }
                            disabled={isUploading || !isAdmin}
                        >
                            <SelectTrigger
                                id="duplicateAction"
                                className="mt-1 rounded-sm border-gray-300 dark:border-gray-600"
                            >
                                <SelectValue
                                    placeholder={t("catalog:selectDuplicateAction", {
                                        defaultValue: "Select action",
                                    })}
                                />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800">
                                <SelectItem value="skip">
                                    {t("catalog:skipDuplicates", {
                                        defaultValue: "Skip Duplicates",
                                    })}
                                </SelectItem>
                                <SelectItem value="replace">
                                    {t("catalog:replaceDuplicates", {
                                        defaultValue: "Replace Duplicates",
                                    })}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setErrors([]);
                                router.push("/admin/sellingPrices");
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
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            {t("catalog:actions.upload", { defaultValue: "Upload" })}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellingPricesUpload;