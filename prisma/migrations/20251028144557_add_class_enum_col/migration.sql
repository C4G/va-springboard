-- CreateEnum
CREATE TYPE "public"."StudentClass" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH', 'ELEVENTH', 'TWELFTH', 'BCOM', 'BA', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "studentClass" "public"."StudentClass" NOT NULL DEFAULT 'OTHER';
