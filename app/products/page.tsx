import Link from "next/link";
import { PlusIcon } from "@heroicons/react/20/solid";
import { prisma } from "@/lib/prisma";
import ProductTable from "@/components/ProductTable";

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    // Return empty array instead of throwing
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all products in your store including their name, price,
            stock, and status.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/products/new"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="inline-block h-5 w-5 mr-1" />
            Add product
          </Link>
        </div>
      </div>
      <ProductTable products={products} />
    </div>
  );
}

