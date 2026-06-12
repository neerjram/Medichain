/*
  Warnings:

  - You are about to drop the column `txHash` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Prescription` table. All the data in the column will be lost.
  - You are about to drop the column `dosage` on the `PrescriptionItem` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `PrescriptionItem` table. All the data in the column will be lost.
  - You are about to drop the column `medicineName` on the `PrescriptionItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `PrescriptionItem` table. All the data in the column will be lost.
  - You are about to drop the column `abhaId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `digilockerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BlockchainTxn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DispenseRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicineBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dosageAmount` to the `PrescriptionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationDays` to the `PrescriptionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequencyPerDay` to the `PrescriptionItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicineId` to the `PrescriptionItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BlockchainTxn" DROP CONSTRAINT "BlockchainTxn_dispenseRecordId_fkey";

-- DropForeignKey
ALTER TABLE "DispenseRecord" DROP CONSTRAINT "DispenseRecord_pharmacyId_fkey";

-- DropForeignKey
ALTER TABLE "DispenseRecord" DROP CONSTRAINT "DispenseRecord_prescriptionId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropIndex
DROP INDEX "User_digilockerId_key";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "txHash";

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "updatedAt",
ADD COLUMN     "dispensedAt" TIMESTAMP(3),
ADD COLUMN     "pharmacyId" TEXT,
ADD COLUMN     "txHash" TEXT;

-- AlterTable
ALTER TABLE "PrescriptionItem" DROP COLUMN "dosage",
DROP COLUMN "duration",
DROP COLUMN "medicineName",
DROP COLUMN "quantity",
ADD COLUMN     "dosageAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "durationDays" INTEGER NOT NULL,
ADD COLUMN     "frequencyPerDay" INTEGER NOT NULL,
ADD COLUMN     "medicineId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "abhaId",
DROP COLUMN "digilockerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "passwordHash" TEXT;

-- DropTable
DROP TABLE "BlockchainTxn";

-- DropTable
DROP TABLE "DispenseRecord";

-- DropTable
DROP TABLE "MedicineBatch";

-- DropTable
DROP TABLE "Notification";

-- DropEnum
DROP TYPE "BlockchainAction";

-- DropEnum
DROP TYPE "DispenseStatus";

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mg',
    "maxDosePerDay" DOUBLE PRECISION NOT NULL,
    "maxDurationDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_name_key" ON "Medicine"("name");

-- CreateIndex
CREATE INDEX "Prescription_pharmacyId_idx" ON "Prescription"("pharmacyId");

-- CreateIndex
CREATE INDEX "PrescriptionItem_medicineId_idx" ON "PrescriptionItem"("medicineId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
