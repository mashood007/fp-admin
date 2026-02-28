import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";

export async function POST(
    request: NextRequest,
    { params }: { params: { orderId: string } }
) {
    try {
        const { orderId } = params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                orderProducts: true,
                checkout: true,
                coupon: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Check if invoice number already exists, otherwise generate and save it
        let invoiceNumber = (order as any).invoiceNumber;
        if (!invoiceNumber) {
            // Find all existing invoice numbers
            const allOrders = await prisma.order.findMany({
                select: {
                    invoiceNumber: true
                } as any
            });

            // Extract numeric values from existing invoice numbers
            const existingInvoiceNumbers = allOrders
                .map(o => (o as any).invoiceNumber)
                .filter((invNum): invNum is string => typeof invNum === 'string')
                .map(invNum => {
                    // Handle both "001" and "2025-001" formats - extract the last numeric part
                    const parts = invNum.split('-');
                    const lastPart = parts[parts.length - 1];
                    return parseInt(lastPart, 10) || 0;
                })
                .filter(n => !isNaN(n) && n > 0);

            // Get the next invoice number
            let nextNumber = 1;
            if (existingInvoiceNumbers.length > 0) {
                const maxNumber = Math.max(...existingInvoiceNumbers);
                nextNumber = maxNumber + 1;
            }

            // Format with at least 3 digits (001, 002, etc.)
            invoiceNumber = nextNumber.toString().padStart(3, '0');

            // Save the invoice number to the database
            await prisma.order.update({
                where: { id: orderId },
                data: { invoiceNumber } as any,
            });
        }

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(order, invoiceNumber);

        // Return PDF directly as download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Error generating invoice:", error);
        return NextResponse.json(
            { error: "Failed to generate invoice" },
            { status: 500 }
        );
    }
}

async function generateInvoicePDF(order: any, invoiceNumber: string): Promise<Buffer> {
    const doc = new jsPDF();

    // Set up margins and positions
    const marginLeft = 20;
    const pageWidth = 210; // A4 width in mm
    const rightAlign = pageWidth - 20; // Right margin
    let yPosition = 20;

    // Add watermark
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logos', 'logo2.png');
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

        // Add watermark in the center with reduced opacity
        const imgWidth = 80; // Width in mm
        const imgHeight = 80; // Height in mm
        const xPos = (pageWidth - imgWidth) / 2;
        const yPos = 120; // Center vertically

        // Set global alpha for transparency (watermark effect)
        // @ts-ignore - Using jsPDF internal API for opacity
        doc.saveGraphicsState();
        // @ts-ignore - Using jsPDF internal API for opacity
        doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
        doc.addImage(logoBase64, 'PNG', xPos, yPos, imgWidth, imgHeight);
        // @ts-ignore - Using jsPDF internal API for opacity
        doc.restoreGraphicsState();
    } catch (error) {
        console.error('Error adding watermark:', error);
        // Continue without watermark if there's an error
    }

    // Header - "Invoice"
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Tax Invoice', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Invoice details (left side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const invoiceLabel = 'Invoice number ';
    doc.text(invoiceLabel, marginLeft, yPosition);
    // Calculate width of the label to position the bold invoice number
    const labelWidth = doc.getTextWidth(invoiceLabel);
    doc.setFont('helvetica', 'bold');
    doc.text(`INV-${invoiceNumber}`, marginLeft + labelWidth, yPosition);
    doc.setFont('helvetica', 'normal'); // Reset to normal for next line
    yPosition += 5;

    const issueDate = order.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Date of issue ${issueDate}`, marginLeft, yPosition);
    yPosition += 10;

    // Company Details (left column)
    doc.setFont('helvetica', 'bold');
    doc.text('Azizia International - F.Z.E', marginLeft, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('B.C. 1305762', marginLeft, yPosition);
    yPosition += 5;
    doc.text('Tax Registration No: 105178904600003', marginLeft, yPosition);
    yPosition += 5;
    doc.text('Ajman freezone C1 building, Ajman freezone', marginLeft, yPosition);
    yPosition += 5;
    doc.text('United Arab Emirates', marginLeft, yPosition);
    yPosition += 5;
    doc.text('971 55 774 4785', marginLeft, yPosition);
    yPosition += 15;

    // Bill to
    doc.setFont('helvetica', 'bold');
    doc.text('Bill to', marginLeft, yPosition);
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(order.checkout?.billingName || order.customer.name, marginLeft, yPosition);
    yPosition += 5;
    doc.text(order.checkout?.billingEmail || order.customer.email, marginLeft, yPosition);
    yPosition += 5;

    // Full billing address
    if (order.checkout?.billingAddress1) {
        doc.text(order.checkout.billingAddress1, marginLeft, yPosition);
        yPosition += 5;
    }
    if (order.checkout?.billingAddress2) {
        doc.text(order.checkout.billingAddress2, marginLeft, yPosition);
        yPosition += 5;
    }

    // City, State, Zip
    const cityStateZip = [
        order.checkout?.billingCity,
        order.checkout?.billingState,
        order.checkout?.billingZip
    ].filter(Boolean).join(', ');

    if (cityStateZip) {
        doc.text(cityStateZip, marginLeft, yPosition);
        yPosition += 5;
    }

    // Country
    if (order.checkout?.billingCountry) {
        doc.text(order.checkout.billingCountry, marginLeft, yPosition);
        yPosition += 5;
    }

    yPosition += 10;

    // Total amount (right side, bold)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const totalAmountText = `AED${order.totalAmount.toFixed(2)}`;
    doc.text(totalAmountText, rightAlign, yPosition, { align: 'right' });
    yPosition += 15;

    // Table Header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const tableY = yPosition;

    // Column positions
    const col1 = marginLeft; // Description (20)
    const col2 = 72;         // Qty
    const col3 = 82;         // Unit price
    const col4 = 102;        // Amount (Subtotal)
    const col5 = 122;        // Discount
    const col6 = 142;        // Taxable
    const col7 = 165;        // Tax
    const col8 = rightAlign; // Total

    doc.setFontSize(8); // Use smaller font to fit more columns
    doc.text('Desc', col1, tableY);
    doc.text('Qty', col2 + 5, tableY, { align: 'right' });
    doc.text('Unit Price', col3 + 18, tableY, { align: 'right' });
    doc.text('Amount', col4 + 18, tableY, { align: 'right' });
    doc.text('Discount', col5 + 18, tableY, { align: 'right' });
    doc.text('Taxable', col6 + 18, tableY, { align: 'right' });
    doc.text('Tax', col7 + 10, tableY, { align: 'right' });
    doc.text('Total', col8, tableY, { align: 'right' });

    // Draw line under header
    doc.setLineWidth(0.5);
    doc.line(marginLeft, tableY + 2, rightAlign, tableY + 2);
    yPosition = tableY + 8;

    // Products
    doc.setFont('helvetica', 'normal');
    const subtotalForProportion = order.subtotal || 1; // Avoid division by zero

    order.orderProducts.forEach((item: any) => {
        const amount = item.unitPrice * item.quantity;
        const proportion = amount / subtotalForProportion;
        const itemDiscount = (proportion * order.discountAmount) || 0;
        const itemTaxableAmount = amount - itemDiscount;
        const itemTax = (proportion * order.taxAmount) || 0;
        const itemTotal = itemTaxableAmount + itemTax;

        // Description
        const descLines = doc.splitTextToSize(item.productName, 48);
        doc.text(descLines, col1, yPosition);

        // Data columns
        doc.text(item.quantity.toString(), col2 + 5, yPosition, { align: 'right' });
        doc.text(`${item.unitPrice.toFixed(2)}`, col3 + 18, yPosition, { align: 'right' });
        doc.text(`${amount.toFixed(2)}`, col4 + 18, yPosition, { align: 'right' });
        doc.text(`${itemDiscount.toFixed(2)}`, col5 + 18, yPosition, { align: 'right' });
        doc.text(`${itemTaxableAmount.toFixed(2)}`, col6 + 18, yPosition, { align: 'right' });
        doc.text(`${itemTax.toFixed(2)}`, col7 + 10, yPosition, { align: 'right' });
        doc.text(`${itemTotal.toFixed(2)}`, col8, yPosition, { align: 'right' });

        yPosition += Math.max(descLines.length * 4, 6);
    });

    // Shipping
    if (order.shippingCost > 0) {
        doc.text('Shipping Cost', col1, yPosition);
        doc.text('1', col2 + 5, yPosition, { align: 'right' });
        doc.text(`${order.shippingCost.toFixed(2)}`, col3 + 18, yPosition, { align: 'right' });
        doc.text(`${order.shippingCost.toFixed(2)}`, col4 + 18, yPosition, { align: 'right' });
        doc.text('0.00', col5 + 18, yPosition, { align: 'right' }); // No discount on shipping usually
        doc.text(`${order.shippingCost.toFixed(2)}`, col6 + 18, yPosition, { align: 'right' });
        doc.text('0.00', col7 + 10, yPosition, { align: 'right' }); // Assuming tax already covered or shown separately
        doc.text(`${order.shippingCost.toFixed(2)}`, col8, yPosition, { align: 'right' });
        yPosition += 6;
    }

    // summary space
    yPosition += 4;
    doc.setLineWidth(0.2);
    doc.line(marginLeft, yPosition, rightAlign, yPosition);
    yPosition += 8;

    // Totals section (right-aligned)
    doc.setFontSize(10);
    const totalLabelX = 135;
    const totalValueX = col8;

    // Subtotal
    doc.text('Subtotal', totalLabelX, yPosition);
    doc.text(`AED ${order.subtotal.toFixed(2)}`, totalValueX, yPosition, { align: 'right' });
    yPosition += 6;

    // Discount
    if (order.discountAmount > 0) {
        doc.text('Discount', totalLabelX, yPosition);
        doc.text(`-AED ${order.discountAmount.toFixed(2)}`, totalValueX, yPosition, { align: 'right' });
        yPosition += 6;
    }

    // Shipping
    if (order.shippingCost > 0) {
        doc.text('Shipping', totalLabelX, yPosition);
        doc.text(`AED ${order.shippingCost.toFixed(2)}`, totalValueX, yPosition, { align: 'right' });
        yPosition += 6;
    }

    // Tax
    if (order.taxAmount > 0) {
        doc.text('Tax', totalLabelX, yPosition);
        doc.text(`AED ${order.taxAmount.toFixed(2)}`, totalValueX, yPosition, { align: 'right' });
        yPosition += 6;
    }

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalLabelX, yPosition);
    doc.text(`AED ${order.totalAmount.toFixed(2)}`, totalValueX, yPosition, { align: 'right' });
    yPosition += 6;

    // Amount paid
    doc.setFont('helvetica', 'normal');
    doc.text('Amount paid', totalLabelX, yPosition);
    doc.text(`AED ${order.totalAmount.toFixed(2)}`, totalValueX, yPosition, { align: 'right' });

    // Return PDF as buffer
    return Buffer.from(doc.output('arraybuffer'));
}