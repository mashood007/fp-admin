"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface CollectionFormData {
    title: string;
    imageUrl: string;
    description: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    images: { url: string }[];
}

interface CollectionProduct {
    id: string;
    productId: string;
    product: Product;
}

interface Collection {
    id: string;
    title: string;
    imageUrl: string | null;
    description: string | null;
    products: CollectionProduct[];
}

export default function EditCollectionPage({
    params,
}: {
    params: { id: string };
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [collection, setCollection] = useState<Collection | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CollectionFormData>();

    useEffect(() => {
        fetchCollection();
        fetchProducts();
    }, []);

    const fetchCollection = async () => {
        try {
            const response = await fetch(`/api/collections/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setCollection(data);
                setValue("title", data.title);
                setValue("description", data.description || "");
                setImageUrl(data.imageUrl || "");
                setSelectedProducts(data.products.map((p: CollectionProduct) => p.productId));
            }
        } catch (error) {
            console.error("Failed to fetch collection:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/products");
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setImageUrl(data.url);
                setValue("imageUrl", data.url);
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Failed to upload image");
            }
        } catch (error) {
            setError("An error occurred while uploading the image");
        } finally {
            setUploading(false);
        }
    };

    const toggleProduct = async (productId: string) => {
        const isCurrentlySelected = selectedProducts.includes(productId);

        if (isCurrentlySelected) {
            // Remove product
            try {
                const response = await fetch(
                    `/api/collections/${params.id}/products/${productId}`,
                    {
                        method: "DELETE",
                    }
                );

                if (response.ok) {
                    setSelectedProducts((prev) => prev.filter((id) => id !== productId));
                } else {
                    setError("Failed to remove product");
                }
            } catch (error) {
                setError("An error occurred while removing product");
            }
        } else {
            // Add product
            try {
                const response = await fetch(`/api/collections/${params.id}/products`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        productIds: [productId],
                    }),
                });

                if (response.ok) {
                    setSelectedProducts((prev) => [...prev, productId]);
                } else {
                    setError("Failed to add product");
                }
            } catch (error) {
                setError("An error occurred while adding product");
            }
        }
    };

    const onSubmit = async (data: CollectionFormData) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/collections/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    imageUrl: imageUrl || null,
                }),
            });

            if (response.ok) {
                router.push("/collections");
                router.refresh();
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Failed to update collection");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!collection) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Edit Collection
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                    Update collection details and manage products.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-8 divide-y divide-gray-200"
            >
                <div className="space-y-8 divide-y divide-gray-200">
                    <div>
                        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Collection Title *
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        {...register("title", { required: "Title is required" })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                    {errors.title && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.title.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">
                                    Collection Image
                                </label>
                                <div className="mt-2">
                                    {imageUrl ? (
                                        <div className="relative w-full max-w-md">
                                            <img
                                                src={imageUrl}
                                                alt="Collection"
                                                className="w-full rounded-lg border-2 border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageUrl("");
                                                    setValue("imageUrl", "");
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="block cursor-pointer max-w-md">
                                            <div className="aspect-video flex items-center justify-center border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition bg-gray-50">
                                                {uploading ? (
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                                        <span className="text-xs text-gray-500 mt-2 block">
                                                            Uploading...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        <span className="mt-2 block text-sm text-gray-600">
                                                            Upload Collection Image
                                                        </span>
                                                        <span className="mt-1 block text-xs text-gray-400">
                                                            PNG, JPG, GIF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                disabled={uploading}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(file);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        {...register("description")}
                                        rows={3}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Manage Products
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                                    {products.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => toggleProduct(product.id)}
                                            className={`relative cursor-pointer rounded-lg border-2 p-2 transition ${selectedProducts.includes(product.id)
                                                    ? "border-indigo-500 bg-indigo-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                                }`}
                                        >
                                            {product.images[0] ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    className="w-full aspect-square object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                                                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                            <p className="mt-2 text-xs font-medium text-gray-900 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                ${product.price.toFixed(2)}
                                            </p>
                                            {selectedProducts.includes(product.id) && (
                                                <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-1">
                                                    <svg
                                                        className="h-3 w-3"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    {selectedProducts.length} product(s) in this collection
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-5">
                    <div className="flex justify-end gap-x-3">
                        <Link
                            href="/collections"
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Updating..." : "Update Collection"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
