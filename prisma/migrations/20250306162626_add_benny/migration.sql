-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "SchoolID" INTEGER NOT NULL,
    "StudentID" INTEGER NOT NULL,
    "DEViceID" INTEGER NOT NULL,
    "IssueDate" TIMESTAMP(3) NOT NULL,
    "Required" TEXT NOT NULL,
    "ExistingDeviceDesc" TEXT NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);
