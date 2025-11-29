"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
}

interface ImageInput {
  url: string;
  alt: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImageInput[]>([{ url: "", alt: "" }]);
  const [uploading, setUploading] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      isActive: true,
    },
  });

  const addImageField = () => {
    setImages([...images, { url: "", alt: "" }]);
  };

  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, field: "url" | "alt", value: string) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    setUploading(index);
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
        updateImage(index, "url", data.url);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to upload image");
      }
    } catch (error) {
      setError("An error occurred while uploading the image");
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    setError("");

    try {
      // Filter out empty image URLs
      const validImages = images.filter((img) => img.url.trim() !== "");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          images: validImages,
        }),
      });

      if (response.ok) {
        router.push("/products");
        router.refresh();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create product");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Product
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Add a new product to your perfume store.
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
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register("name", { required: "Name is required" })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
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

              <div className="sm:col-span-2">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  Price *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", {
                      required: "Price is required",
                      min: { value: 0, message: "Price must be positive" },
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category
                </label>
                <div className="mt-1">
                  <select
                    {...register("category")}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a category</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Images
                  </label>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    + Add Image
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index}>
                      {image.url ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition">
                          <img
                            src={image.url}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => updateImage(index, "url", "")}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <div className="aspect-square flex items-center justify-center border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition bg-gray-50">
                            {uploading === index ? (
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                <span className="text-xs text-gray-500 mt-2 block">
                                  Uploading...
                                </span>
                              </div>
                            ) : (
                              <div className="text-center p-4">
                                <PhotoIcon className="mx-auto h-10 w-10 text-gray-400" />
                                <span className="mt-2 block text-xs text-gray-600">
                                  Upload Image
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
                            disabled={uploading === index}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(index, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="isActive"
                      className="font-medium text-gray-700"
                    >
                      Active
                    </label>
                    <p className="text-gray-500">
                      Make this product visible to customers
                    </p>
                  </div>
                </div>
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
              href="/products"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

