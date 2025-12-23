"use client";

import { useState, useEffect, Fragment } from "react";
import { format } from "date-fns";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
export const dynamic = 'force-dynamic';

interface Banner {
    id: string;
    message: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface BannerFormData {
    message: string;
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const response = await fetch("/api/banners");
            if (!response.ok) throw new Error("Failed to fetch banners");
            const data = await response.json();
            setBanners(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) {
            return;
        }

        try {
            const response = await fetch(`/api/banners/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete banner");
            }

            // Refresh banner list
            fetchBanners();
        } catch (err) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const openUpdateModal = (banner: Banner) => {
        setEditingBanner(banner);
        setIsUpdateModalOpen(true);
    };

    const closeUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setEditingBanner(null);
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
        <>
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-gray-900">Banners</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            Manage promotional banners for your store.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Create Banner
                        </button>
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
                                                Message
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            >
                                                Created
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                            >
                                                Updated
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
                                        {banners.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-3 py-8 text-center text-sm text-gray-500"
                                                >
                                                    No banners found. Create your first banner to get started!
                                                </td>
                                            </tr>
                                        ) : (
                                            banners.map((banner) => (
                                                <tr key={banner.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                        <div className="max-w-xs truncate">
                                                            {banner.message || "No message"}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {format(new Date(banner.createdAt), "MMM d, yyyy HH:mm")}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {format(new Date(banner.updatedAt), "MMM d, yyyy HH:mm")}
                                                    </td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                        <button
                                                            onClick={() => openUpdateModal(banner)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            <PencilIcon className="inline-block h-5 w-5" />
                                                            <span className="sr-only">Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(banner.id)}
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

            {/* Create Banner Modal */}
            <CreateBannerModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                onSuccess={fetchBanners}
            />

            {/* Update Banner Modal */}
            <UpdateBannerModal
                isOpen={isUpdateModalOpen}
                onClose={closeUpdateModal}
                banner={editingBanner}
                onSuccess={fetchBanners}
            />
        </>
    );
}

// Create Banner Modal Component
function CreateBannerModal({ isOpen, onClose, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BannerFormData>();

    const onSubmit = async (data: BannerFormData) => {
        setSubmitting(true);
        try {
            const response = await fetch("/api/banners", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create banner");
            }

            reset();
            onClose();
            onSuccess();
        } catch (error) {
            alert(error instanceof Error ? error.message : "An error occurred");
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Create New Banner
                                </Dialog.Title>
                                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label
                                                htmlFor="create-message"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Message
                                            </label>
                                            <textarea
                                                id="create-message"
                                                rows={4}
                                                {...register("message")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Enter banner message..."
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
                                        >
                                            {submitting ? "Creating..." : "Create Banner"}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

// Update Banner Modal Component
function UpdateBannerModal({ isOpen, onClose, banner, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    banner: Banner | null;
    onSuccess: () => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<BannerFormData>();

    useEffect(() => {
        if (banner) {
            reset({
                message: banner.message || "",
            });
        }
    }, [banner, reset]);

    const onSubmit = async (data: BannerFormData) => {
        if (!banner) return;

        setSubmitting(true);
        try {
            const response = await fetch(`/api/banners/${banner.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update banner");
            }

            reset();
            onClose();
            onSuccess();
        } catch (error) {
            alert(error instanceof Error ? error.message : "An error occurred");
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900"
                                >
                                    Update Banner
                                </Dialog.Title>
                                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label
                                                htmlFor="update-message"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Message
                                            </label>
                                            <textarea
                                                id="update-message"
                                                rows={4}
                                                {...register("message")}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Enter banner message..."
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            onClick={handleClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
                                        >
                                            {submitting ? "Updating..." : "Update Banner"}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
