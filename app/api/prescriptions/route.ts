import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { validatePrescriptionItems } from "@/lib/validators/prescription";

// GET /api/prescriptions
// Returns prescriptions filtered by role:
// DOCTOR   → prescriptions they created
// CITIZEN  → their own prescriptions
// REGULATOR / PHARMACY → all prescriptions
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    let whereClause = {};

    if (user.role === "DOCTOR") {
      whereClause = { doctorId: user.id };
    } else if (user.role === "CITIZEN") {
      whereClause = { patientId: user.id };
    } else if (user.role === "REGULATOR" || user.role === "PHARMACY") {
      whereClause = {}; // see all
    } else {
      return NextResponse.json(
        { success: false, error: "Forbidden: Invalid role" },
        { status: 403 }
      );
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
        User_Prescription_doctorIdToUser: {
          select: { id: true, name: true, email: true, walletAddress: true },
        },
        User_Prescription_patientIdToUser: {
          select: { id: true, name: true, email: true, walletAddress: true },
        },
        User_Prescription_pharmacyIdToUser: {
          select: { id: true, name: true, email: true, walletAddress: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: prescriptions });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch prescriptions",
      },
      { status: 500 }
    );
  }
}

// POST /api/prescriptions { prescriptionId, patientId, ipfsHash, txHash, expiryDate, items }
// DOCTOR only - validates safe dosage limits and creates prescription
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    if (user.role !== "DOCTOR") {
      return NextResponse.json(
        { success: false, error: "Forbidden: DOCTOR role required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { prescriptionId, patientId, ipfsHash, txHash, expiryDate, items } = body;

    if (!prescriptionId || !patientId || !ipfsHash || !expiryDate || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or invalid items format" },
        { status: 400 }
      );
    }

    // Validate dosage and duration limits
    const validation = await validatePrescriptionItems(items);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Create the Prescription and nested PrescriptionItems
    const prescription = await prisma.prescription.create({
      data: {
        prescriptionId,
        doctorId: user.id,
        patientId,
        ipfsHash,
        txHash: txHash || null,
        status: "CREATED",
        expiryDate: new Date(expiryDate),
        items: {
          create: items.map((item: any) => ({
            medicineId: item.medicineId,
            dosageAmount: Number(item.dosageAmount),
            frequencyPerDay: Number(item.frequencyPerDay),
            durationDays: Number(item.durationDays),
            instructions: item.instructions || null,
          })),
        },
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
        action: "PRESCRIPTION_CREATED",
        entityId: prescription.id,
      },
    });

    return NextResponse.json({ success: true, data: prescription }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.code === "P2002" ? "Prescription with this prescriptionId already exists" : (error instanceof Error ? error.message : "Failed to create prescription"),
      },
      { status: 500 }
    );
  }
}
