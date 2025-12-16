// import { DeliveryOrder } from "@prisma/client";

import { Order } from "@prisma/client";

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
    // Receiver Details
    receiversAddress1: string | null;
    receiversAddress2: string | null;
    receiversCity: string | null;
    receiversSubCity?: string | null;
    receiversCountry: string | null;
    receiversCompany?: string | null;
    receiversContactPerson: string;
    receiversEmail: string;
    receiversGeoLocation?: string;
    receiversMobile: string | null;
    receiversPhone: string | null;
    receiversPinCode?: string;
    // Sender Details
    sendersAddress1: string;
    sendersAddress2: string;
    sendersCity: string;
    sendersCountry: string;
    sendersCompany: string;
    sendersContactPerson: string;
    sendersEmail: string;
    sendersMobile: string;
    sendersPhone: string;
    sendersPinCode?: string;
    // Shipment Details
    shipmentDimension?: string;
    shipmentInvoiceCurrency: string;
    shipmentInvoiceValue: number;
    shipperReference: string;
    shipperVatAccount?: string;
    specialInstruction?: string;
    codAmount?: number;
    codCurrency?: string;
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
            CODAmount: data.codAmount || 0,
            CODCurrency: data.codCurrency || "",
            Destination: data.destination,
            DutyConsigneePay: "0",
            GoodsDescription: data.goodsDescription,
            NumberofPeices: data.numberOfPieces,
            Origin: data.origin,
            ProductType: data.productType,
            ReceiversAddress1: data.receiversAddress1,
            ReceiversAddress2: data.receiversAddress2,
            ReceiversCity: data.receiversCity,
            ReceiversSubCity: data.receiversSubCity || "",
            ReceiversCountry: data.receiversCountry,
            ReceiversCompany: data.receiversCompany || "",
            ReceiversContactPerson: data.receiversContactPerson,
            ReceiversEmail: data.receiversEmail,
            ReceiversGeoLocation: data.receiversGeoLocation || "",
            ReceiversMobile: data.receiversMobile,
            ReceiversPhone: data.receiversPhone,
            ReceiversPinCode: data.receiversPinCode || "",
            SendersAddress1: data.sendersAddress1,
            SendersAddress2: data.sendersAddress2,
            SendersCity: data.sendersCity,
            SendersCountry: data.sendersCountry,
            SendersCompany: data.sendersCompany,
            SendersContactPerson: data.sendersContactPerson,
            SendersEmail: data.sendersEmail,
            SendersMobile: data.sendersMobile,
            SendersPhone: data.sendersPhone,
            SendersPinCode: data.sendersPinCode || "",
            ServiceType: "NOR",
            ShipmentDimension: data.shipmentDimension || "15X20X25",
            ShipmentInvoiceCurrency: data.shipmentInvoiceCurrency,
            ShipmentInvoiceValue: data.shipmentInvoiceValue,
            ShipperReference: data.shipperReference,
            ShipperVatAccount: data.shipperVatAccount || "",
            SpecialInstruction: data.specialInstruction || "",
            Weight: data.weight,
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

export async function createDeliveryForOrder(order: Order) {
    // Map order to delivery input
    const input: CreateAirwayBillInput = {
        destination: order.shippingCity || "Dubai",
        goodsDescription: `Order #${order.orderNumber}`,
        numberOfPieces: 1,
        origin: "DXB",
        productType: "XPS",
        weight: 1, // Default weight

        // Receiver Details
        receiversAddress1: order.shippingAddress1,
        receiversAddress2: order.shippingAddress2,
        receiversCity: order.shippingCity,
        receiversCountry: order.shippingCountry,
        receiversCompany: order.shippingName,
        receiversContactPerson: order.shippingName,
        receiversEmail: order.shippingEmail,
        receiversMobile: order.shippingPhone,
        receiversPhone: order.shippingPhone,
        receiversPinCode: order.shippingZip,

        // Sender Details - Using defaults/sample values as we don't have these in config yet
        sendersAddress1: "Ho. Al Musallah",
        sendersAddress2: "",
        sendersCity: "Sharjah",
        sendersCountry: "AE",
        sendersCompany: "Azizia International FZE",
        sendersContactPerson: "Anshid",
        sendersEmail: "admin@fleurdorparfums.com",
        sendersMobile: "971569298916",
        sendersPhone: "971569298916",

        // Shipment Details
        shipmentInvoiceCurrency: "AED",
        shipmentInvoiceValue: order.totalAmount || 0,
        shipperReference: order.orderNumber || Date.now().toString(),
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
