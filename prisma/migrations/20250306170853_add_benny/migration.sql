/*
  Warnings:

  - You are about to drop the column `DEViceID` on the `Beneficiary` table. All the data in the column will be lost.
  - Added the required column `DeviceID` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Beneficiary" DROP COLUMN "DEViceID",
ADD COLUMN     "DeviceID" TEXT NOT NULL,
ALTER COLUMN "SchoolID" SET DATA TYPE TEXT,
ALTER COLUMN "StudentID" SET DATA TYPE TEXT;
