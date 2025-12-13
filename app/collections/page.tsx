import Link from "next/link";
import { PlusIcon } from "@heroicons/react/20/solid";
import { prisma } from "@/lib/prisma";
import CollectionCard from "@/components/CollectionCard";
export const dynamic = 'force-dynamic';

async function getCollections() {
    try {
        const collections = await prisma.collection.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        return collections;
    } catch (error) {
        console.error("Error fetching collections:", error);
        return [];
    }
}

export default async function CollectionsPage() {
    const collections = await getCollections();

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Collections</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Organize your products into collections for better browsing and
                        discovery.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <Link
                        href="/collections/new"
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="inline-block h-5 w-5 mr-1" />
                        Add collection
                    </Link>
                </div>
            </div>

            {collections.length === 0 ? (
                <div className="mt-8 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        No collections
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new collection.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/collections/new"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            New Collection
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {collections.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={{
                                ...collection,
                                productCount: collection.products.length,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
