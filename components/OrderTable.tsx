"use client";

import Link from "next/link";
import { EyeIcon } from "@heroicons/react/20/solid";
import { format } from "date-fns";
import { useState } from "react";

interface Order {
    id: string;
    orderNumber: string;
    customer: {
        name: string;
        email: string;
    };
    status: string;
    totalAmount: number;
    createdAt: Date;
    checkout?: {
        paymentStatus: string;
    } | null;
    invoiceUrl?: string | null;
    invoiceNumber?: string | null;
}

interface OrderTableProps {
    orders: Order[];
}

export default function OrderTable({ orders }: OrderTableProps) {
    const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set());

    const handleDownloadInvoice = async (orderId: string, invoiceNumber: string) => {
        setDownloadingInvoices(prev => new Set(prev).add(orderId));
        try {
            const response = await fetch(`/api/orders/${orderId}/generate-invoice`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to download invoice");
            }

            // Create blob from response and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading invoice:", error);
            alert("Failed to download invoice. Please try again.");
        } finally {
            setDownloadingInvoices(prev => {
                const newSet = new Set(prev);
                newSet.delete(orderId);
                return newSet;
            });
        }
    };
    return (
        <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                                    >
                                        Order Number
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Customer
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Date
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Payment
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                    >
                                        Total
                                    </th>
                                    <th
                                        scope="col"
                                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                                    >
                                        <span className="sr-only">Actions</span>
                                    </th>
                                    <th
                                        scope="col"
                                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                                    >
                                        <span className="sr-only">Invoice</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-3 py-8 text-center text-sm text-gray-500"
                                        >
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {order.orderNumber}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div className="font-medium text-gray-900">{order.customer.name}</div>
                                                <div className="text-xs text-gray-500">{order.customer.email}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {format(new Date(order.createdAt), "MMM d, yyyy")}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${order.status === "DELIVERED"
                                                        ? "bg-green-100 text-green-800"
                                                        : order.status === "CANCELLED"
                                                            ? "bg-red-100 text-red-800"
                                                            : order.status === "PENDING"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${order.checkout?.paymentStatus === "COMPLETED"
                                                        ? "bg-green-100 text-green-800"
                                                        : order.checkout?.paymentStatus === "REFUNDED"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : order.checkout?.paymentStatus === "FAILED"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {order.checkout?.paymentStatus || "PENDING"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                ${order.totalAmount.toFixed(2)}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <EyeIcon className="inline-block h-5 w-5" />
                                                    <span className="sr-only">View</span>
                                                </Link>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                {order.invoiceNumber && (
                                                    <button
                                                        onClick={() => handleDownloadInvoice(order.id, order.invoiceNumber!)}
                                                        disabled={downloadingInvoices.has(order.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {downloadingInvoices.has(order.id) ? (
                                                            <span className="flex items-center gap-1">
                                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Downloading...
                                                            </span>
                                                        ) : (
                                                            "Download"
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
