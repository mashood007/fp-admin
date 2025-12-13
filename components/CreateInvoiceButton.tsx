"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateInvoiceButtonProps {
    orderId: string;
}

export default function CreateInvoiceButton({ orderId }: CreateInvoiceButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCreateInvoice = async () => {
        if (!confirm("Are you sure you want to create an invoice for this order?")) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${orderId}/invoice`, {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create invoice");
            }

            // Refresh the page to show the new invoice button
            router.refresh();
        } catch (error) {
            console.error("Error creating invoice:", error);
            alert("Failed to create invoice. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCreateInvoice}
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                </>
            ) : (
                "Create Invoice"
            )}
        </button>
    );
}
