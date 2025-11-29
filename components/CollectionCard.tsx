"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface Collection {
    id: string;
    title: string;
    imageUrl: string | null;
    description: string | null;
    productCount: number;
}

interface CollectionCardProps {
    collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this collection?")) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/collections/${collection.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                router.refresh();
            } else {
                alert("Failed to delete collection");
            }
        } catch (error) {
            alert("An error occurred while deleting the collection");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            {collection.imageUrl ? (
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-200">
                    <img
                        src={collection.imageUrl}
                        alt={collection.title}
                        className="h-full w-full object-cover object-center"
                    />
                </div>
            ) : (
                <div className="aspect-[4/3] w-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <svg
                        className="h-16 w-16 text-indigo-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </div>
            )}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {collection.title}
                </h3>
                {collection.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {collection.description}
                    </p>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>
                        {collection.productCount}{" "}
                        {collection.productCount === 1 ? "product" : "products"}
                    </span>
                </div>
                <div className="mt-4 flex gap-2">
                    <Link
                        href={`/collections/${collection.id}`}
                        className="flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 text-center"
                    >
                        <PencilIcon className="inline-block h-4 w-4 mr-1" />
                        Edit
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrashIcon className="inline-block h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
