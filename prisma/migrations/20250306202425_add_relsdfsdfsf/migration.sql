/*
  Warnings:

  - Made the column `schoolId` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `schoolId` to the `TrainingProgram` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "schoolId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TrainingProgram" ADD COLUMN     "schoolId" TEXT NOT NULL;
