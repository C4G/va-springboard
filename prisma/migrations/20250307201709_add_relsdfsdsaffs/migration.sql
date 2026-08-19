/*
  Warnings:

  - You are about to drop the column `schId` on the `Enrollment` table. All the data in the column will be lost.
  - Added the required column `schoolId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "schId",
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL;
