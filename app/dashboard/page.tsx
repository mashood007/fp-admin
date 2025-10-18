import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShoppingBagIcon, CubeIcon } from "@heroicons/react/24/outline";

async function getStats() {
  const totalProducts = await prisma.product.count();
  const activeProducts = await prisma.product.count({
    where: { isActive: true },
  });

  return {
    totalProducts,
    activeProducts,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome back, {session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBagIcon
                className="h-8 w-8 text-indigo-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Total Products
                </dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                  {stats.totalProducts}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon
                className="h-8 w-8 text-green-600"
                aria-hidden="true"
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500">
                  Active Products
                </dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                  {stats.activeProducts}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

