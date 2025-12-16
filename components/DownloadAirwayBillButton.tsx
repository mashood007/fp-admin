"use client";

import { useState } from "react";
import { getAirwayBillLabelAction } from "@/app/actions/delivery";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface DownloadAirwayBillButtonProps {
    awb: string;
}

export default function DownloadAirwayBillButton({ awb }: DownloadAirwayBillButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        setIsLoading(true);
        try {
            const result = await getAirwayBillLabelAction(awb);

            if (!result.success || !result.data) {
                alert("Failed to fetch airway bill label");
                return;
            }

            // The API logic returns the JSON response. 
            // We need to determine if the PDF data is a direct string or in a property.
            // Based on C3X documentation style, it usually returns JSON.
            // If the docs say "Output is returned as Base64 encoded PDF", it might be a raw string or a property.
            // We'll inspect the data structure.

            let base64Data = "";

            if (typeof result.data === 'string') {
                base64Data = result.data;
            } else if (typeof result.data === 'object') {
                // If it's an object, try to find a property that looks like a PDF or base64
                // Common C3X patterns or standard keys
                // If the response IS the PDF, inspecting keys might help.
                // Assuming it might be in a property like 'Image' or 'PDF' or 'FileContent' if not direct.
                // However, often these XML-to-JSON services return the string directly or in a wrapper.
                // Let's assume it might be the only value or check known keys.
                // Since we don't know the exact key, we'll try to guess or use the whole thing if it's single valued.

                // If the documentation is vague, we might need to debug.
                // For now, let's look for common keys or just log it if we were debugging.
                // But for the implementation, I will assume it might be 'AirwayBillPDF' or similar if not a string.
                // Actually, let's try to verify if it's just the object itself if needed.
                // But let's log it to console for the user to see if it fails.
                console.log("PDF Response Data:", result.data);

                // Simple heuristic: look for a long string value
                const values = Object.values(result.data);
                const longString = values.find(v => typeof v === 'string' && v.length > 100);
                if (longString) {
                    base64Data = longString as string;
                }
            }

            if (!base64Data) {
                alert("Could not find PDF data in response");
                return;
            }

            // Convert Base64 to Blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `AWB-${awb}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Error downloading label:", error);
            alert("An error occurred while downloading the label");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
            <ArrowDownTrayIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            {isLoading ? "Downloading..." : "Download Label"}
        </button>
    );
}
