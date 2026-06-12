import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/medicines?search=para
// Returns matching medicines from govt-approved list (all roles)
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search");

    const medicines = await prisma.medicine.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: medicines });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch medicines",
      },
      { status: 500 }
    );
  }
}

// POST /api/medicines { name, unit, maxDosePerDay, maxDurationDays }
// REGULATOR only - adds new approved medicine and logs audit
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    if (user.role !== "REGULATOR") {
      return NextResponse.json(
        { success: false, error: "Forbidden: REGULATOR role required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, unit, maxDosePerDay, maxDurationDays } = body;

    if (!name || maxDosePerDay === undefined) {
      return NextResponse.json(
        { success: false, error: "name and maxDosePerDay are required" },
        { status: 400 }
      );
    }

    const medicine = await prisma.medicine.create({
      data: {
        name,
        unit: unit || "mg",
        maxDosePerDay: Number(maxDosePerDay),
        maxDurationDays: maxDurationDays !== undefined ? Number(maxDurationDays) : 30,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: "MEDICINE_ADDED",
        entityId: medicine.id,
      },
    });

    return NextResponse.json({ success: true, data: medicine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.code === "P2002" ? "Medicine with this name already exists" : (error instanceof Error ? error.message : "Failed to add medicine"),
      },
      { status: 500 }
    );
  }
}
