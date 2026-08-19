/*
  Warnings:

  - You are about to drop the column `DeviceID` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `ExistingDeviceDesc` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `IssueDate` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `Required` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `SchoolID` on the `Beneficiary` table. All the data in the column will be lost.
  - You are about to drop the column `StudentID` on the `Beneficiary` table. All the data in the column will be lost.
  - Added the required column `deviceId` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDate` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `required` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Beneficiary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Beneficiary" DROP COLUMN "DeviceID",
DROP COLUMN "ExistingDeviceDesc",
DROP COLUMN "IssueDate",
DROP COLUMN "Required",
DROP COLUMN "SchoolID",
DROP COLUMN "StudentID",
ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "required" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL;
