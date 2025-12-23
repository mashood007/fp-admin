"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Switch } from "@headlessui/react";
export const dynamic = 'force-dynamic';

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discountPercent: number;
    expiresAt: Date;
    isActive: boolean;
    isExpired: boolean;
    _count: {
        orders: number;
    };
    createdAt: Date;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await fetch("/api/coupons");
            if (!response.ok) throw new Error("Failed to fetch coupons");
            const data = await response.json();
            setCoupons(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/coupons/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete coupon");
            }

            // Refresh coupon list
            fetchCoupons();
        } catch (err) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        try {
            const response = await fetch(`/api/coupons/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isActive: !currentActive }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update coupon");
            }

            // Refresh coupon list
            fetchCoupons();
        } catch (err) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    if (loading) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage discount coupons for your store.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Link
                        href="/coupons/new"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Create Coupon
                    </Link>
                </div>
            </div>
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
                                            Code
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                            Description
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                            Discount
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                            Expires
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
                                            Active
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                        >
                                            Uses
                                        </th>
                                        <th
                                            scope="col"
                                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                                        >
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {coupons.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-3 py-8 text-center text-sm text-gray-500"
                                            >
                                                No coupons found. Create your first coupon to get started!
                                            </td>
                                        </tr>
                                    ) : (
                                        coupons.map((coupon) => (
                                            <tr
                                                key={coupon.id}
                                                className={coupon.isExpired || !coupon.isActive ? "opacity-50" : ""}
                                            >
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    <span className={coupon.isExpired || !coupon.isActive ? "line-through" : ""}>
                                                        {coupon.code}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    {coupon.description || "-"}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {coupon.discountPercent}%
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {format(new Date(coupon.expiresAt), "MMM d, yyyy HH:mm")}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${coupon.isExpired
                                                            ? "bg-red-100 text-red-800"
                                                            : !coupon.isActive
                                                                ? "bg-gray-100 text-gray-800"
                                                                : "bg-green-100 text-green-800"
                                                            }`}
                                                    >
                                                        {coupon.isExpired ? "Expired" : !coupon.isActive ? "Inactive" : "Active"}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <Switch
                                                        checked={coupon.isActive}
                                                        onChange={() => handleToggle(coupon.id, coupon.isActive)}
                                                        disabled={coupon.isExpired}
                                                        className={`${
                                                            coupon.isActive && !coupon.isExpired ? "bg-indigo-600" : "bg-gray-200"
                                                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        <span
                                                            className={`${
                                                                coupon.isActive && !coupon.isExpired ? "translate-x-6" : "translate-x-1"
                                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                        />
                                                    </Switch>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {coupon._count.orders}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleDelete(coupon.id, coupon.code)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <TrashIcon className="inline-block h-5 w-5" />
                                                        <span className="sr-only">Delete</span>
                                                    </button>
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
        </div>
    );
}
