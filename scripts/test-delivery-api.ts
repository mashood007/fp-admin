import { createAirwayBill } from "../lib/delivery";

async function testDelivery() {
    console.log("Testing C3X Delivery API...");

    const testInput = {
        destination: "Abu Dhabi",
        goodsDescription: "Test Shipment",
        numberOfPieces: 1,
        origin: "DXB",
        productType: "XPS",
        weight: 0.5,
        // Receiver Details
        receiversAddress1: "Test Address 1",
        receiversAddress2: "Test Address 2",
        receiversCity: "Abu Dhabi",
        receiversCountry: "UNITED ARAB EMIRATES",
        receiversCompany: "Test Company",
        receiversContactPerson: "Test Customer",
        receiversEmail: "test@example.com",
        receiversMobile: "971500000000",
        receiversPhone: "971500000000",
        // Sender Details
        sendersAddress1: "Sender Address 1",
        sendersAddress2: "Sender Address 2",
        sendersCity: "DUBAI",
        sendersCountry: "AE",
        sendersCompany: "Sender Company",
        sendersContactPerson: "Sender Name",
        sendersEmail: "sender@example.com",
        sendersMobile: "971500000000",
        sendersPhone: "971400000000",
        // Shipment Details
        shipmentInvoiceCurrency: "AED",
        shipmentInvoiceValue: 100,
        shipperReference: "TEST-REF-001",
    };

    try {
        const result = await createAirwayBill(testInput);
        console.log("Success:", result);
    } catch (error) {
        console.error("Error:", error);
    }
}

testDelivery();
