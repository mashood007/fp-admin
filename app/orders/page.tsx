import { prisma } from "@/lib/prisma";
import OrderTable from "@/components/OrderTable";

async function getOrders() {
    try {
        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                customer: true,
                checkout: true,
            },
        });
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

export default async function OrdersPage() {
    const orders = await getOrders();

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all customer orders including their status and total amount.
                    </p>
                </div>
            </div>
            <OrderTable orders={orders} />
        </div>
    );
}
