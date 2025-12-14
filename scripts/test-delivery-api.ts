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
        customerName: "Test Customer",
        customerPhone: "123456789",
        customerAddress: "Test Address",
    };

    try {
        const result = await createAirwayBill(testInput);
        console.log("Success:", result);
    } catch (error) {
        console.error("Error:", error);
    }
}

testDelivery();
