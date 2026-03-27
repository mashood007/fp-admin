import { NextResponse } from "next/server";
import { getDeliverySettingsConfig } from "@/lib/delivery-settings";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// GET /api/store/delivery-settings - Store-facing delivery configuration
export async function GET() {
  try {
    const settings = await getDeliverySettingsConfig();
    return NextResponse.json(settings, { headers: corsHeaders() });
  } catch (error) {
    console.error("Error fetching store delivery settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery settings" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
