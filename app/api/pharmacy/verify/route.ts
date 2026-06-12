import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/pharmacy/verify { prescriptionId }
// PHARMACY only - verifies existence, checks validity/expiry, and dispenses medicine
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    if (user.role !== "PHARMACY") {
      return NextResponse.json(
        { success: false, error: "Forbidden: PHARMACY role required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { prescriptionId } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: "prescriptionId is required" },
        { status: 400 }
      );
    }

    // Fetch prescription
    const prescription = await prisma.prescription.findUnique({
      where: { prescriptionId },
      include: { items: true },
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Check status
    if (prescription.status !== "CREATED") {
      return NextResponse.json(
        {
          success: false,
          error: `Prescription cannot be dispensed. Status is ${prescription.status}. Expected CREATED.`,
        },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(prescription.expiryDate)) {
      return NextResponse.json(
        { success: false, error: "Prescription has expired" },
        { status: 400 }
      );
    }

    // Update prescription
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescription.id },
      data: {
        status: "DISPENSED",
        pharmacyId: user.id,
        dispensedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        role: user.role,
        action: "PRESCRIPTION_DISPENSED",
        entityId: prescription.id,
      },
    });

    return NextResponse.json({ success: true, data: updatedPrescription });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify prescription",
      },
      { status: 500 }
    );
  }
}
