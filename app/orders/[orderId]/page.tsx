import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import GenerateInvoiceButton from "@/components/GenerateInvoiceButton";
import CreateDeliveryButton from "@/components/CreateDeliveryButton";
import DeliveryTracking from "@/components/DeliveryTracking";
import DownloadAirwayBillButton from "@/components/DownloadAirwayBillButton";
import { getTracking } from "@/lib/delivery";

export const dynamic = 'force-dynamic';

async function getOrder(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                checkout: true,
                orderProducts: {
                    include: {
                        product: {
                            include: {
                                images: true,
                            },
                        },
                    },
                },
                deliveryOrder: true,
            },
        });
        return order;
    } catch (error) {
        console.error("Error fetching order:", error);
        return null;
    }
}

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
    const order = await getOrder(params.orderId);

    if (!order) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <Link href="/orders" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to Orders
                </Link>
            </div>

            <div className="lg:flex lg:items-center lg:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Order #{order.orderNumber}
                    </h2>
                    <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            Status:
                            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${order.status === "DELIVERED" ? "bg-green-100 text-green-800" :
                                order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                                    order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                        "bg-gray-100 text-gray-800"
                                }`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            Payment:
                            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${order.checkout?.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-800" :
                                order.checkout?.paymentStatus === "REFUNDED" ? "bg-yellow-100 text-yellow-800" :
                                    order.checkout?.paymentStatus === "FAILED" ? "bg-red-100 text-red-800" :
                                        "bg-gray-100 text-gray-800"
                                }`}>
                                {order.checkout?.paymentStatus || "PENDING"}
                            </span>
                        </div>
                    </div>
                </div>
                {order.invoiceUrl ? (
                    <div className="mt-5 flex lg:ml-4 lg:mt-0">
                        <span className="hidden sm:block">
                            <a
                                href={order.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Download Invoice
                            </a>
                        </span>
                    </div>
                ) : (
                    <div className="mt-5 flex lg:ml-4 lg:mt-0">
                        <GenerateInvoiceButton orderId={order.id} />
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column: Order Items and Summary */}
                <div className="space-y-6">
                    {/* Order Items */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Items</h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <ul role="list" className="divide-y divide-gray-200">
                                {order.orderProducts.map((item) => (
                                    <li key={item.id} className="flex p-4">
                                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                            {item.product.images[0] ? (
                                                <img
                                                    src={item.product.images[0].url}
                                                    alt={item.product.images[0].alt || item.productName}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-gray-900">
                                                    <h3>
                                                        <a href={`/products/${item.product.id}`}>{item.productName}</a>
                                                    </h3>
                                                    <p className="ml-4">AED {item.subtotal.toFixed(2)}</p>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <p className="text-gray-500">Qty {item.quantity} x AED {item.unitPrice.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Order Summary</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <dl className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">Subtotal</dt>
                                    <dd className="text-sm font-medium text-gray-900">AED {order.subtotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">Shipping</dt>
                                    <dd className="text-sm font-medium text-gray-900">AED {order.shippingCost.toFixed(2)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">Tax</dt>
                                    <dd className="text-sm font-medium text-gray-900">AED {order.taxAmount.toFixed(2)}</dd>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-gray-600">Discount</dt>
                                        <dd className="text-sm font-medium text-green-600">-AED {order.discountAmount.toFixed(2)}</dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                    <dt className="text-base font-medium text-gray-900">Total</dt>
                                    <dd className="text-base font-medium text-gray-900">AED {order.totalAmount.toFixed(2)}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer and Shipping Details */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Customer</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{order.customer.name}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{order.customer.email}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{order.customer.phone || "N/A"}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Shipping Address</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <address className="not-italic text-sm text-gray-900">
                                <span className="block font-medium">{order.shippingName}</span>
                                <span className="block">{order.shippingAddress1}</span>
                                {order.shippingAddress2 && <span className="block">{order.shippingAddress2}</span>}
                                <span className="block">{order.shippingCity}, {order.shippingState} {order.shippingZip}</span>
                                <span className="block">{order.shippingCountry}</span>
                            </address>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900">Billing Address</h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            {order.checkout ? (
                                <address className="not-italic text-sm text-gray-900">
                                    <span className="block font-medium">{order.checkout.billingName}</span>
                                    <span className="block">{order.checkout.billingAddress1}</span>
                                    {order.checkout.billingAddress2 && <span className="block">{order.checkout.billingAddress2}</span>}
                                    <span className="block">{order.checkout.billingCity}, {order.checkout.billingState} {order.checkout.billingZip}</span>
                                    <span className="block">{order.checkout.billingCountry}</span>
                                </address>
                            ) : (
                                <p className="text-sm text-gray-500">Same as shipping address</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-base font-semibold leading-6 text-gray-900">Notes</h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                                <p className="text-sm text-gray-900">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delivery Status Section */}
            <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-2">Delivery Status</h3>
                    {order.deliveryOrder ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <DownloadAirwayBillButton awb={order.deliveryOrder.airwayBillNumber} />
                                <span className="text-sm font-medium text-gray-900 ml-2">
                                    AWB: {order.deliveryOrder.airwayBillNumber}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-500">No delivery information available for this order.</p>
                            <CreateDeliveryButton orderId={order.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


