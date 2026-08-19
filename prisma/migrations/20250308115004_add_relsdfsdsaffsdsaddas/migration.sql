/*
  Warnings:

  - You are about to drop the column `tpId` on the `Enrollment` table. All the data in the column will be lost.
  - Added the required column `trainingprogramId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "tpId",
ADD COLUMN     "trainingprogramId" TEXT NOT NULL;
