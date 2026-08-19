-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "visualAcuity" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "aadharNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "govDisabilityCert" BOOLEAN NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "schId" TEXT NOT NULL,
    "tpId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "sessions" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "techParam1" TEXT NOT NULL,
    "techParam2" TEXT NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);
