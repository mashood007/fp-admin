import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banners = await prisma.banner.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    // Message is optional, so no validation required

    const banner = await prisma.banner.create({
      data: {
        message: message || null,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
