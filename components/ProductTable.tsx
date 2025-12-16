"use client";

import Link from "next/link";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface Product {
  id: string;
  friendlyId: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  isActive: boolean;
  availableStock: number;
  orderNumber: number;
  images: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProductTableProps {
  products: Product[];
}

export default function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderValue, setEditingOrderValue] = useState<number>(0);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditingOrder = (productId: string, currentOrder: number) => {
    setEditingOrderId(productId);
    setEditingOrderValue(currentOrder);
  };

  const cancelEditingOrder = () => {
    setEditingOrderId(null);
    setEditingOrderValue(0);
  };

  const saveOrderNumber = async (productId: string) => {
    setSavingOrderId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderNumber: editingOrderValue }),
      });

      if (response.ok) {
        router.refresh();
        setEditingOrderId(null);
        setEditingOrderValue(0);
      } else {
        alert("Failed to update order number");
      }
    } catch (error) {
      alert("An error occurred while updating order number");
    } finally {
      setSavingOrderId(null);
    }
  };

  const startEditingStock = (productId: string, currentStock: number) => {
    setEditingStockId(productId);
    setEditingStockValue(currentStock);
  };

  const cancelEditingStock = () => {
    setEditingStockId(null);
    setEditingStockValue(0);
  };

  const saveStock = async (productId: string) => {
    setSavingStockId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ availableStock: editingStockValue }),
      });

      if (response.ok) {
        router.refresh();
        setEditingStockId(null);
        setEditingStockValue(0);
      } else {
        alert("Failed to update stock");
      }
    } catch (error) {
      alert("An error occurred while updating stock");
    } finally {
      setSavingStockId(null);
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
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Images
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Stock
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Order
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Status
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
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-8 text-center text-sm text-gray-500"
                    >
                      No products found. Create your first product to get
                      started.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500 mt-1">/{product.friendlyId}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.images && product.images.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                            {product.images.length > 1 && (
                              <span className="text-xs text-gray-400">
                                +{product.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No images</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              min="0"
                            />
                            <button
                              onClick={() => saveStock(product.id)}
                              disabled={savingStockId === product.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingStock}
                              className="text-red-600 hover:text-red-900"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingStock(product.id, product.availableStock)}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline"
                          >
                            {product.availableStock}
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {editingOrderId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingOrderValue}
                              onChange={(e) => setEditingOrderValue(parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              min="0"
                            />
                            <button
                              onClick={() => saveOrderNumber(product.id)}
                              disabled={savingOrderId === product.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingOrder}
                              className="text-red-600 hover:text-red-900"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingOrder(product.id, product.orderNumber)}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline"
                          >
                            {product.orderNumber}
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.category || "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilIcon className="inline-block h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
  );
}
