"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";

interface CouponFormData {
    code: string;
    description: string;
    discountPercent: number;
    expiresAt: string;
    isActive: boolean;
}

export default function NewCouponPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CouponFormData>({
        defaultValues: {
            isActive: true,
        },
    });

    const onSubmit = async (data: CouponFormData) => {
        setSubmitting(true);
        try {
            const response = await fetch("/api/coupons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create coupon");
            }

            router.push("/coupons");
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "An error occurred");
            setSubmitting(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Create Coupon
                    </h2>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="space-y-6">
                            {/* Code */}
                            <div>
                                <label
                                    htmlFor="code"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Coupon Code *
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    {...register("code", {
                                        required: "Coupon code is required",
                                        minLength: {
                                            value: 3,
                                            message: "Code must be at least 3 characters",
                                        },
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm uppercase"
                                    placeholder="SAVE20"
                                    style={{ textTransform: "uppercase" }}
                                />
                                {errors.code && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.code.message}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    {...register("description")}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="20% off all items"
                                />
                            </div>

                            {/* Discount Percent */}
                            <div>
                                <label
                                    htmlFor="discountPercent"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Discount Percentage *
                                </label>
                                <input
                                    type="number"
                                    id="discountPercent"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    {...register("discountPercent", {
                                        required: "Discount percentage is required",
                                        min: {
                                            value: 0,
                                            message: "Discount must be at least 0%",
                                        },
                                        max: {
                                            value: 100,
                                            message: "Discount cannot exceed 100%",
                                        },
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="20"
                                />
                                {errors.discountPercent && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.discountPercent.message}
                                    </p>
                                )}
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label
                                    htmlFor="expiresAt"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Expiry Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="expiresAt"
                                    {...register("expiresAt", {
                                        required: "Expiry date is required",
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                                {errors.expiresAt && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.expiresAt.message}
                                    </p>
                                )}
                            </div>

                            {/* Active Status */}
                            <div className="flex items-start">
                                <div className="flex h-5 items-center">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        {...register("isActive")}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="isActive" className="font-medium text-gray-700">
                                        Active
                                    </label>
                                    <p className="text-gray-500">
                                        Coupon is available for use immediately
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <Link
                        href="/coupons"
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
                    >
                        {submitting ? "Creating..." : "Create Coupon"}
                    </button>
                </div>
            </form>
        </div>
    );
}
