// import { DeliveryOrder } from "@prisma/client";

interface C3XConfig {
    baseUrl: string;
    userName: string;
    password: string;
    accountNo: string;
    country: string;
}

const config: C3XConfig = {
    baseUrl: process.env.C3X_API_URL || "https://c3xapi.c3xpress.com/C3XService.svc",
    userName: process.env.C3X_USERNAME || "testuser",
    password: process.env.C3X_PASSWORD || "21c3xpress#",
    accountNo: process.env.C3X_ACCOUNT_NO || "99999",
    country: process.env.C3X_COUNTRY || "AE",
};

interface CreateAirwayBillInput {
    destination: string;
    goodsDescription: string;
    numberOfPieces: number;
    origin: string;
    productType: string;
    weight: number;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
}

interface CreateAirwayBillResponse {
    AirwayBillNumber: string;
    Code: number;
    Description: string;
    DestinationCode: string;
}

export async function createAirwayBill(data: CreateAirwayBillInput): Promise<CreateAirwayBillResponse> {
    const payload = {
        AirwayBillData: {
            Destination: data.destination,
            GoodsDescription: data.goodsDescription,
            NumberofPeices: data.numberOfPieces,
            Origin: data.origin,
            ProductType: data.productType,
            ServiceType: "NOR", // Added based on error and RateCalculator example
            Weight: data.weight,
            // Add extra fields if API supports them for delivery details, 
            // based on doc it seems we only have these in AirwayBillData
            // But usually we need receiver details. 
            // The doc example shows limited fields. 
            // Let's assume for now we stick to the doc example.
        },
        UserName: config.userName,
        Password: config.password,
        AccountNo: config.accountNo,
        Country: config.country,
    };

    try {
        const response = await fetch(`${config.baseUrl}/CreateAirwayBill`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`C3X API Error: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.Code !== 1) {
            throw new Error(`C3X API Failed: ${result.Description}`);
        }

        return result;
    } catch (error) {
        console.error("Failed to create airway bill:", error);
        throw error;
    }
}

export async function createDeliveryForOrder(order: any) {
    // Map order to delivery input
    // This is a simplified mapping. Adjust based on actual business logic.
    const input: CreateAirwayBillInput = {
        destination: order.shippingCity || "Unknown",
        goodsDescription: `Order #${order.orderNumber}`,
        numberOfPieces: 1, // Logic to calculate pieces
        origin: "DXB", // Default origin
        productType: "XPS",
        weight: 1, // Default weight
        customerName: order.shippingName,
        customerPhone: order.shippingPhone,
        customerAddress: `${order.shippingAddress1} ${order.shippingAddress2 || ""}`,
    };

    return createAirwayBill(input);
}

export async function getTracking(awb: string) {
    const payload = {
        TrackingAWB: awb,
        UserName: config.userName,
        Password: config.password,
        AccountNo: config.accountNo,
        Country: config.country,
    };

    try {
        const response = await fetch(`${config.baseUrl}/Tracking`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            cache: 'no-store' // Ensure we get fresh data
        });

        if (!response.ok) {
            throw new Error(`C3X API Error: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Failed to get tracking:", error);
        return null;
    }
}
