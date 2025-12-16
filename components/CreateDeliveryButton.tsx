"use client";

import { useState } from "react";
import { createDeliveryAction } from "@/app/actions/delivery";

export default function CreateDeliveryButton({ orderId }: { orderId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreateDelivery = async () => {
        setIsLoading(true);
        setError("");

        try {
            const result = await createDeliveryAction(orderId);
            if (!result.success) {
                setError(result.error || "Failed to create delivery");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-2">
            <button
                onClick={handleCreateDelivery}
                disabled={isLoading}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Creating..." : "Create Delivery"}
            </button>
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
