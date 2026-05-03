import { Resend } from "resend";
import { Order, OrderProduct } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY || "re_9DHvHUyd_KaiZ57B11k6RTQjtnpQoVijy");

export async function sendOrderConfirmationEmail(order: Order & { orderProducts: OrderProduct[] }) {
    try {
        const orderItemsHtml = (order.orderProducts || []).map(item => `
        <tr>
            <td width="70%" style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 500;">${item.productName}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">Qty: ${item.quantity}</p>
            </td>
            <td width="30%" style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; text-align: right; vertical-align: top;">
                <p style="margin: 0; font-size: 15px; color: #374151; font-weight: 600;">AED ${item.subtotal.toFixed(2)}</p>
            </td>
        </tr>
        `).join('');

        const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #333333; -webkit-font-smoothing: antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin: 0 auto;">
                    
                    <!-- Header / Logo -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #111827;">
                            <!-- Replace with your actual absolute URL logo image -->
                            <img src="https://kvrayugaswnnzrlb.public.blob.vercel-storage.com/logo1.png" alt="Company Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto; border: 0;">
                        </td>
                    </tr>
                    
                    <!-- Welcome / Order Confirm Text -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <h1 style="margin: 0 0 15px 0; font-size: 24px; color: #111827; text-align: center;">Thank You for Your Order!</h1>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                                Hi ${order.shippingName || 'there'},<br>
                                We've received your order <strong>#${order.orderNumber}</strong> and are getting it ready for shipment. We will send you an update when it has shipped.
                            </p>
                        </td>
                    </tr>

                    <!-- Order Details Header -->
                    <tr>
                        <td style="padding: 10px 30px;">
                            <h2 style="margin: 0; font-size: 18px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h2>
                        </td>
                    </tr>

                    <!-- Order Items -->
                    <tr>
                        <td style="padding: 10px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                ${orderItemsHtml}
                            </table>
                        </td>
                    </tr>

                    <!-- Totals -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="60%" style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;">Subtotal:</td>
                                    <td width="40%" style="padding: 5px 0; text-align: right; font-size: 14px; color: #374151;">AED ${order.subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td width="60%" style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;">Shipping:</td>
                                    <td width="40%" style="padding: 5px 0; text-align: right; font-size: 14px; color: #374151;">AED ${order.shippingCost.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td width="60%" style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;">Tax:</td>
                                    <td width="40%" style="padding: 5px 0; text-align: right; font-size: 14px; color: #374151;">AED ${order.taxAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td width="60%" style="padding: 15px 0 5px 0; text-align: right; font-size: 18px; color: #111827; font-weight: bold;">Total:</td>
                                    <td width="40%" style="padding: 15px 0 5px 0; text-align: right; font-size: 18px; color: #111827; font-weight: bold;">AED ${order.totalAmount.toFixed(2)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Shipping Address & Info -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="50%" style="vertical-align: top;">
                                        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</h3>
                                        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                                            ${order.shippingName}<br>
                                            ${order.shippingAddress1} ${order.shippingAddress2 ? '<br>' + order.shippingAddress2 : ''}<br>
                                            ${order.shippingCity}, ${order.shippingState} ${order.shippingZip || ''}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #111827; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #9ca3af;">
                                Need help? Reply to this email or contact us at <a href="mailto:support@fleurdorparfums.com" style="color: #60a5fa; text-decoration: none;">support@fleurdorparfums.com</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">
                                &copy; ${new Date().getFullYear()} Fleur d'or Parfums. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        await resend.emails.send({
            from: 'Admin <admin@fleurdorparfums.com>',
            to: order.shippingEmail,
            subject: `Order Confirmation #${order.orderNumber}`,
            html: emailHtml,
        });
        
        console.log(`Order confirmation email sent successfully to ${order.shippingEmail}`);
    } catch (emailError) {
        console.error("Error sending order confirmation email:", emailError);
    }
}
