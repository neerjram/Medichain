import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding MediChain demo data...\n");

  // ─── USERS ────────────────────────────────────────────

  const citizen = await prisma.user.upsert({
    where: { email: "patient@medichain.demo" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "patient@medichain.demo",
      role: "CITIZEN",
      walletAddress: "0x1111111111111111111111111111111111111111",
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: "doctor@medichain.demo" },
    update: {},
    create: {
      name: "Dr. Priya Mehta",
      email: "doctor@medichain.demo",
      role: "DOCTOR",
      walletAddress: "0x2222222222222222222222222222222222222222",
    },
  });

  const pharmacy = await prisma.user.upsert({
    where: { email: "pharmacy@medichain.demo" },
    update: {},
    create: {
      name: "Apollo Pharmacy — Koramangala",
      email: "pharmacy@medichain.demo",
      role: "PHARMACY",
      walletAddress: "0x3333333333333333333333333333333333333333",
    },
  });

  const regulator = await prisma.user.upsert({
    where: { email: "regulator@medichain.demo" },
    update: {},
    create: {
      name: "Gov. Health Audit Officer",
      email: "regulator@medichain.demo",
      role: "REGULATOR",
    },
  });

  // ─── MEDICINES ─────────────────────────────────────────

  console.log("Seeding government-approved medicines...");
  const paracetamol = await prisma.medicine.upsert({
    where: { name: "Paracetamol" },
    update: {},
    create: { name: "Paracetamol", unit: "mg", maxDosePerDay: 4000, maxDurationDays: 7 },
  });

  const amoxicillin = await prisma.medicine.upsert({
    where: { name: "Amoxicillin" },
    update: {},
    create: { name: "Amoxicillin", unit: "mg", maxDosePerDay: 1500, maxDurationDays: 14 },
  });

  const azithromycin = await prisma.medicine.upsert({
    where: { name: "Azithromycin" },
    update: {},
    create: { name: "Azithromycin", unit: "mg", maxDosePerDay: 500, maxDurationDays: 5 },
  });

  const cetirizine = await prisma.medicine.upsert({
    where: { name: "Cetirizine" },
    update: {},
    create: { name: "Cetirizine", unit: "mg", maxDosePerDay: 10, maxDurationDays: 30 },
  });

  const ibuprofen = await prisma.medicine.upsert({
    where: { name: "Ibuprofen" },
    update: {},
    create: { name: "Ibuprofen", unit: "mg", maxDosePerDay: 1200, maxDurationDays: 7 },
  });

  const metformin = await prisma.medicine.upsert({
    where: { name: "Metformin" },
    update: {},
    create: { name: "Metformin", unit: "mg", maxDosePerDay: 2500, maxDurationDays: 365 },
  });

  const omeprazole = await prisma.medicine.upsert({
    where: { name: "Omeprazole" },
    update: {},
    create: { name: "Omeprazole", unit: "mg", maxDosePerDay: 40, maxDurationDays: 14 },
  });

  const ciprofloxacin = await prisma.medicine.upsert({
    where: { name: "Ciprofloxacin" },
    update: {},
    create: { name: "Ciprofloxacin", unit: "mg", maxDosePerDay: 1500, maxDurationDays: 14 },
  });

  // ─── PRESCRIPTION ────────────────────────────────────

  const prescription = await prisma.prescription.upsert({
    where: { prescriptionId: "0xabc123demo00000000000000000000000000001" },
    update: {},
    create: {
      prescriptionId: "0xabc123demo00000000000000000000000000001",
      doctorId: doctor.id,
      patientId: citizen.id,
      ipfsHash: "QmDemoPrescriptionHash123456789abcdef",
      txHash: "0xdemo_tx_hash_prescription_created",
      status: "CREATED",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            medicineId: paracetamol.id,
            dosageAmount: 500,
            frequencyPerDay: 2,
            durationDays: 5,
            instructions: "Take after meals, twice daily",
          },
          {
            medicineId: amoxicillin.id,
            dosageAmount: 250,
            frequencyPerDay: 3,
            durationDays: 7,
            instructions: "Take one capsule every 8 hours",
          },
        ],
      },
    },
    include: { items: true },
  });

  // ─── AUDIT LOG ───────────────────────────────────────

  await prisma.auditLog.create({
    data: {
      userId: doctor.id,
      role: "DOCTOR",
      action: "PRESCRIPTION_CREATED",
      entityId: prescription.id,
    },
  });

  // ─── SUMMARY ─────────────────────────────────────────

  console.log("Users:");
  console.log(`  Citizen   → ${citizen.email}`);
  console.log(`  Doctor    → ${doctor.email}`);
  console.log(`  Pharmacy  → ${pharmacy.email}`);
  console.log(`  Regulator → ${regulator.email}`);
  console.log(`\nPrescription: ${prescription.prescriptionId}`);
  console.log(`  Items: ${prescription.items.length}`);
  console.log(`  txHash: ${prescription.txHash ?? "N/A"}`);
  console.log("\nSeed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
