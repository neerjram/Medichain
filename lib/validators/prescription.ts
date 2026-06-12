import { prisma } from "@/lib/prisma";

export interface PrescriptionItemInput {
  medicineId: string;
  dosageAmount: number;
  frequencyPerDay: number;
  durationDays: number;
}

export async function validatePrescriptionItems(items: PrescriptionItemInput[]) {
  const errors: string[] = [];

  for (const item of items) {
    const medicine = await prisma.medicine.findUnique({
      where: { id: item.medicineId }
    });

    if (!medicine) {
      errors.push(`Medicine not found: ${item.medicineId}`);
      continue;
    }

    const dailyDose = Number(item.dosageAmount) * Number(item.frequencyPerDay);
    if (dailyDose > medicine.maxDosePerDay) {
      errors.push(
        `${medicine.name}: ${dailyDose}${medicine.unit}/day exceeds limit ${medicine.maxDosePerDay}${medicine.unit}/day`
      );
    }

    if (Number(item.durationDays) > medicine.maxDurationDays) {
      errors.push(
        `${medicine.name}: ${item.durationDays} days exceeds limit ${medicine.maxDurationDays} days`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
