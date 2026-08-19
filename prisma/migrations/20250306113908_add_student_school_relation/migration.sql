/*
  Warnings:

  - You are about to drop the column `email` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `School` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `School` table. All the data in the column will be lost.
  - Added the required column `Email` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Location` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Name` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Phone` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Tier` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "School" DROP COLUMN "email",
DROP COLUMN "location",
DROP COLUMN "name",
DROP COLUMN "notes",
DROP COLUMN "phone",
DROP COLUMN "tier",
ADD COLUMN     "Email" TEXT NOT NULL,
ADD COLUMN     "Location" TEXT NOT NULL,
ADD COLUMN     "Name" TEXT NOT NULL,
ADD COLUMN     "Notes" TEXT,
ADD COLUMN     "Phone" TEXT NOT NULL,
ADD COLUMN     "Tier" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "govDisabilityCert" SET DATA TYPE TEXT,
ALTER COLUMN "schoolId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
